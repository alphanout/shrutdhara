#!/usr/bin/env python3
"""
Jain-VLM: End-to-End Vision-Language Model for Ancient Scriptures
=================================================================
Inspired by DeepSeek-VL (Lu et al., DeepSeek-AI) and DeepSeek-OCR.

Architecture:
  1. Vision Encoder: Patch Embedding (16x16) + 2D Spatial Positional Embeddings
     + Multi-Head Vision Transformer blocks.
  2. Multi-Modal Adaptor (DeepSeek-VL Projector): 2-Layer MLP with GELU.
  3. Language Backbone: Causal Devanagari Akṣara Transformer.
  
NO TESSERACT. Input is raw pixels -> Output is Devanagari Akṣaras.
"""

import math
import torch
import torch.nn as nn
from torch.nn import functional as F

class PatchEmbedding(nn.Module):
    """
    Slices raw 2D image into non-overlapping 16x16 patches and projects to vision_dim.
    """
    def __init__(self, in_channels=1, patch_size=(16, 16), img_size=(64, 512), embed_dim=256):
        super().__init__()
        self.patch_size = patch_size
        self.img_size = img_size
        self.grid_size = (img_size[0] // patch_size[0], img_size[1] // patch_size[1])
        self.num_patches = self.grid_size[0] * self.grid_size[1]

        self.proj = nn.Conv2d(
            in_channels, embed_dim,
            kernel_size=patch_size, stride=patch_size
        )
        self.pos_embed = nn.Parameter(torch.zeros(1, self.num_patches, embed_dim))
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

    def forward(self, x):
        # x: [B, C, H, W]
        B, C, H, W = x.shape
        # Conv2d -> [B, embed_dim, grid_H, grid_W]
        x = self.proj(x)
        # Flatten spatial grid -> [B, embed_dim, num_patches] -> transpose to [B, num_patches, embed_dim]
        x = x.flatten(2).transpose(1, 2)
        x = x + self.pos_embed
        return x

class VisionTransformerBlock(nn.Module):
    """Bidirectional self-attention block for visual stroke contextualization."""
    def __init__(self, embed_dim=256, num_heads=4, mlp_ratio=4.0, dropout=0.1):
        super().__init__()
        self.ln1 = nn.LayerNorm(embed_dim)
        self.attn = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout, batch_first=True)
        self.ln2 = nn.LayerNorm(embed_dim)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, int(embed_dim * mlp_ratio)),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(int(embed_dim * mlp_ratio), embed_dim),
            nn.Dropout(dropout)
        )

    def forward(self, x):
        norm_x = self.ln1(x)
        attn_out, _ = self.attn(norm_x, norm_x, norm_x)
        x = x + attn_out
        x = x + self.mlp(self.ln2(x))
        return x

class DeepSeekVLProjector(nn.Module):
    """
    2-Layer MLP Multi-Modal Projector strictly following DeepSeek-VL.
    Projects visual feature tokens into the language model embedding dimension.
    """
    def __init__(self, vision_dim=256, text_dim=256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(vision_dim, text_dim),
            nn.GELU(),
            nn.Linear(text_dim, text_dim)
        )

    def forward(self, visual_tokens):
        return self.net(visual_tokens)

class CausalSelfAttention(nn.Module):
    """Multi-head causal self-attention with KV caching support."""
    def __init__(self, n_embd=256, n_head=8, block_size=256, dropout=0.1):
        super().__init__()
        assert n_embd % n_head == 0
        self.c_attn = nn.Linear(n_embd, 3 * n_embd)
        self.c_proj = nn.Linear(n_embd, n_embd)
        self.attn_dropout = nn.Dropout(dropout)
        self.resid_dropout = nn.Dropout(dropout)
        self.n_head = n_head
        self.n_embd = n_embd
        # Causal mask covering max combined visual prefix + text tokens
        self.register_buffer(
            "bias",
            torch.tril(torch.ones(block_size, block_size)).view(1, 1, block_size, block_size)
        )

    def forward(self, x, is_prefix_visual=True, num_visual_tokens=128):
        B, T, C = x.size()
        q, k, v = self.c_attn(x).split(self.n_embd, dim=2)
        k = k.view(B, T, self.n_head, C // self.n_head).transpose(1, 2)
        q = q.view(B, T, self.n_head, C // self.n_head).transpose(1, 2)
        v = v.view(B, T, self.n_head, C // self.n_head).transpose(1, 2)

        att = (q @ k.transpose(-2, -1)) * (1.0 / math.sqrt(k.size(-1)))

        # Masking:
        # Standard causal mask for text tokens, while visual prefix tokens can attend bidirectionally
        mask = self.bias[:, :, :T, :T].clone()
        if is_prefix_visual and num_visual_tokens > 0:
            # Allow full bidirectional attention among visual prefix tokens
            mask[:, :, :num_visual_tokens, :num_visual_tokens] = 1.0

        att = att.masked_fill(mask == 0, float("-inf"))
        att = F.softmax(att, dim=-1)
        att = self.attn_dropout(att)
        y = att @ v
        y = y.transpose(1, 2).contiguous().view(B, T, C)
        return self.resid_dropout(self.c_proj(y))

class TransformerBlock(nn.Module):
    """Causal Transformer block with pre-LayerNorm."""
    def __init__(self, n_embd=256, n_head=8, block_size=256, dropout=0.1):
        super().__init__()
        self.ln_1 = nn.LayerNorm(n_embd)
        self.attn = CausalSelfAttention(n_embd, n_head, block_size, dropout)
        self.ln_2 = nn.LayerNorm(n_embd)
        self.mlp = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(4 * n_embd, n_embd),
            nn.Dropout(dropout),
        )

    def forward(self, x, num_visual_tokens=128):
        x = x + self.attn(self.ln_1(x), is_prefix_visual=True, num_visual_tokens=num_visual_tokens)
        x = x + self.mlp(self.ln_2(x))
        return x

class JainVLM(nn.Module):
    """
    End-to-End Vision-Language Model for Sacred Jain Facsimiles.
    """
    def __init__(
        self,
        vocab_size=554,
        img_size=(64, 512),
        patch_size=(16, 16),
        in_channels=1,
        vision_dim=256,
        text_dim=256,
        n_head=8,
        n_layer=6,
        block_size=256,
        dropout=0.1
    ):
        super().__init__()
        self.vocab_size = vocab_size
        self.img_size = img_size
        self.block_size = block_size

        # 1. Vision Encoder
        self.patch_embed = PatchEmbedding(
            in_channels=in_channels,
            patch_size=patch_size,
            img_size=img_size,
            embed_dim=vision_dim
        )
        self.num_visual_tokens = self.patch_embed.num_patches
        self.vision_blocks = nn.ModuleList([
            VisionTransformerBlock(embed_dim=vision_dim, num_heads=4, dropout=dropout)
            for _ in range(2)
        ])

        # 2. DeepSeek-VL 2-Layer Projector
        self.projector = DeepSeekVLProjector(vision_dim=vision_dim, text_dim=text_dim)

        # 3. Autoregressive Language Model Backbone
        self.wte = nn.Embedding(vocab_size, text_dim)
        self.wpe = nn.Embedding(block_size, text_dim)
        self.drop = nn.Dropout(dropout)
        self.blocks = nn.ModuleList([
            TransformerBlock(n_embd=text_dim, n_head=n_head, block_size=block_size, dropout=dropout)
            for _ in range(n_layer)
        ])
        self.ln_f = nn.LayerNorm(text_dim)
        self.lm_head = nn.Linear(text_dim, vocab_size, bias=False)

        # Weight tying
        self.wte.weight = self.lm_head.weight

        # Parameter initialization
        self.apply(self._init_weights)

    def _init_weights(self, module):
        if isinstance(module, (nn.Linear, nn.Conv2d)):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def forward(self, images, text_tokens=None, targets=None):
        """
        images: [B, C, H, W]
        text_tokens: [B, T]
        targets: [B, T]
        """
        B = images.size(0)

        # 1. Vision Forward
        v_feats = self.patch_embed(images) # [B, N_v, vision_dim]
        for blk in self.vision_blocks:
            v_feats = blk(v_feats)

        # 2. DeepSeek-VL Projector
        v_proj = self.projector(v_feats) # [B, N_v, text_dim]
        N_v = v_proj.size(1)

        if text_tokens is None:
            return v_proj

        # 3. Text Embeddings
        T = text_tokens.size(1)
        assert N_v + T <= self.block_size, f"Sequence length {N_v + T} exceeds block_size {self.block_size}"

        # Position embeddings for the whole multimodal sequence
        pos_ids = torch.arange(0, N_v + T, dtype=torch.long, device=images.device)
        total_pos_emb = self.wpe(pos_ids) # [N_v + T, text_dim]

        tok_emb = self.wte(text_tokens)   # [B, T, text_dim]

        # Multimodal sequence concatenation: [Visual Prefix, Text Tokens]
        x = torch.cat([v_proj, tok_emb], dim=1) # [B, N_v + T, text_dim]
        x = self.drop(x + total_pos_emb)

        # 4. Transformer Backbone
        for block in self.blocks:
            x = block(x, num_visual_tokens=N_v)
        x = self.ln_f(x)

        # 5. LM Head (Predict only on the text tokens slice)
        logits = self.lm_head(x[:, N_v:, :]) # [B, T, vocab_size]

        loss = None
        if targets is not None:
            loss = F.cross_entropy(logits.reshape(-1, logits.size(-1)), targets.reshape(-1), ignore_index=-100)

        return logits, loss

    @torch.no_grad()
    def generate(self, image, prompt_tokens, max_new_tokens=60, temperature=0.7, top_k=5):
        """
        Autoregressively generate Devanagari Akṣaras directly from a single raw image.
        """
        self.eval()
        device = image.device
        if image.dim() == 3:
            image = image.unsqueeze(0) # [1, C, H, W]

        # Vision Forward + Projector
        v_feats = self.patch_embed(image)
        for blk in self.vision_blocks:
            v_feats = blk(v_feats)
        v_proj = self.projector(v_feats) # [1, N_v, text_dim]
        N_v = v_proj.size(1)

        curr_tokens = torch.tensor([prompt_tokens], dtype=torch.long, device=device)

        for _ in range(max_new_tokens):
            T = curr_tokens.size(1)
            if N_v + T >= self.block_size:
                break

            pos_ids = torch.arange(0, N_v + T, dtype=torch.long, device=device)
            total_pos_emb = self.wpe(pos_ids)

            tok_emb = self.wte(curr_tokens)
            x = torch.cat([v_proj, tok_emb], dim=1) + total_pos_emb

            for block in self.blocks:
                x = block(x, num_visual_tokens=N_v)
            x = self.ln_f(x)

            logits = self.lm_head(x[:, -1, :]) / max(temperature, 1e-5)
            if top_k is not None:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = -float('Inf')

            probs = F.softmax(logits, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1)

            curr_tokens = torch.cat([curr_tokens, next_token], dim=1)
            if next_token.item() == 16: # <EOS> token ID
                break

        return curr_tokens[0].tolist()

if __name__ == "__main__":
    print("Testing Jain-VLM Model Instantiation...")
    model = JainVLM(vocab_size=554, img_size=(64, 512), patch_size=(16, 16), in_channels=1)
    dummy_img = torch.randn(2, 1, 64, 512)
    dummy_txt = torch.randint(0, 554, (2, 32))
    dummy_tgt = torch.randint(0, 554, (2, 32))

    logits, loss = model(dummy_img, dummy_txt, dummy_tgt)
    print(f"Vision tokens per image: {model.num_visual_tokens}")
    print(f"Logits shape: {logits.shape}")
    print(f"Loss: {loss.item():.4f}")
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Total Jain-VLM Parameters: {total_params / 1e6:.2f}M")
