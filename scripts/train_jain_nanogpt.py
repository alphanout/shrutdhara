#!/usr/bin/env python3
"""
scripts/train_jain_nanogpt.py
Trains Layer 0 (Jain-NanoGPT): A local 6-layer Devanagari Akṣara-level Transformer
accelerated on Apple Silicon Metal GPU (MPS).
Modeled on Andrej Karpathy's nanoGPT for ancient Sanskrit/Prakrit OCR restoration.
"""

import os
import sys
import json
import re
import math
import time
import torch
import torch.nn as nn
from torch.nn import functional as F

# Configuration
VOCAB_PATH = "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/Layer0_Jain_NanoGPT/stage0_akshara_vocab.json"
CORPUS_PATH = "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/Layer0_Jain_NanoGPT/stage0_training_corpus.txt"
SAVE_PATH = "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/Layer0_Jain_NanoGPT/jain_nanogpt_weights.pt"

# Hyperparameters
BATCH_SIZE = 16
BLOCK_SIZE = 128      # Context window of akṣara tokens
MAX_ITERS = 1500      # Training iterations
EVAL_INTERVAL = 250
LEARNING_RATE = 1e-3
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"
EVAL_ITERS = 50
N_EMBD = 256
N_HEAD = 8
N_LAYER = 6
DROPOUT = 0.1

torch.manual_seed(108)

# -----------------------------------------------------------------------------
# 1. Akṣara Tokenizer
# -----------------------------------------------------------------------------
class AksharaTokenizer:
    def __init__(self, vocab_path):
        with open(vocab_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.stoi = data["stoi"]
        self.itos = {int(k) if isinstance(k, int) or k.isdigit() else v: (k if not isinstance(k, int) and not k.isdigit() else v) for k, v in data["itos"].items()}
        # Ensure itos maps int -> str
        self.itos = {i: token for token, i in self.stoi.items()}
        self.vocab_size = len(self.stoi)

        # Regex compiler for tokenization
        tokens_sorted = sorted(self.stoi.keys(), key=lambda x: len(x), reverse=True)
        pattern = "(" + "|".join(re.escape(k) for k in tokens_sorted) + ")"
        self.tokenizer_re = re.compile(pattern)

    def encode(self, text):
        matches = self.tokenizer_re.findall(text)
        return [self.stoi[m] for m in matches if m in self.stoi]

    def decode(self, indices):
        return "".join([self.itos.get(i, "") for i in indices])

# -----------------------------------------------------------------------------
# 2. Transformer Architecture (nanoGPT)
# -----------------------------------------------------------------------------
class Head(nn.Module):
    """One head of causal self-attention"""
    def __init__(self, head_size):
        super().__init__()
        self.key = nn.Linear(N_EMBD, head_size, bias=False)
        self.query = nn.Linear(N_EMBD, head_size, bias=False)
        self.value = nn.Linear(N_EMBD, head_size, bias=False)
        self.register_buffer("tril", torch.tril(torch.ones(BLOCK_SIZE, BLOCK_SIZE)))
        self.dropout = nn.Dropout(DROPOUT)

    def forward(self, x):
        B, T, C = x.shape
        k = self.key(x)
        q = self.query(x)
        # Compute attention scores ("affinities")
        wei = q @ k.transpose(-2, -1) * (k.shape[-1] ** -0.5)
        wei = wei.masked_fill(self.tril[:T, :T] == 0, float("-inf"))
        wei = F.softmax(wei, dim=-1)
        wei = self.dropout(wei)
        v = self.value(x)
        out = wei @ v
        return out

class MultiHeadAttention(nn.Module):
    """Multiple heads of self-attention in parallel"""
    def __init__(self, num_heads, head_size):
        super().__init__()
        self.heads = nn.ModuleList([Head(head_size) for _ in range(num_heads)])
        self.proj = nn.Linear(head_size * num_heads, N_EMBD)
        self.dropout = nn.Dropout(DROPOUT)

    def forward(self, x):
        out = torch.cat([h(x) for h in self.heads], dim=-1)
        out = self.dropout(self.proj(out))
        return out

class FeedForward(nn.Module):
    """Simple linear layer followed by non-linearity"""
    def __init__(self, n_embd):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),
            nn.GELU(),
            nn.Linear(4 * n_embd, n_embd),
            nn.Dropout(DROPOUT),
        )

    def forward(self, x):
        return self.net(x)

class Block(nn.Module):
    """Transformer block: communication followed by computation"""
    def __init__(self, n_embd, n_head):
        super().__init__()
        head_size = n_embd // n_head
        self.sa = MultiHeadAttention(n_head, head_size)
        self.ffwd = FeedForward(n_embd)
        self.ln1 = nn.LayerNorm(n_embd)
        self.ln2 = nn.LayerNorm(n_embd)

    def forward(self, x):
        x = x + self.sa(self.ln1(x))
        x = x + self.ffwd(self.ln2(x))
        return x

class JainNanoGPT(nn.Module):
    def __init__(self, vocab_size):
        super().__init__()
        self.token_embedding_table = nn.Embedding(vocab_size, N_EMBD)
        self.position_embedding_table = nn.Embedding(BLOCK_SIZE, N_EMBD)
        self.blocks = nn.Sequential(*[Block(N_EMBD, n_head=N_HEAD) for _ in range(N_LAYER)])
        self.ln_f = nn.LayerNorm(N_EMBD)
        self.lm_head = nn.Linear(N_EMBD, vocab_size)

        self.apply(self._init_weights)

    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def forward(self, idx, targets=None):
        B, T = idx.shape
        tok_emb = self.token_embedding_table(idx) # (B, T, C)
        pos_emb = self.position_embedding_table(torch.arange(T, device=idx.device)) # (T, C)
        x = tok_emb + pos_emb
        x = self.blocks(x)
        x = self.ln_f(x)
        logits = self.lm_head(x) # (B, T, vocab_size)

        if targets is None:
            loss = None
        else:
            B, T, C = logits.shape
            logits = logits.view(B * T, C)
            targets = targets.view(B * T)
            loss = F.cross_entropy(logits, targets)

        return logits, loss

    def generate(self, idx, max_new_tokens, temperature=0.7):
        for _ in range(max_new_tokens):
            idx_cond = idx[:, -BLOCK_SIZE:]
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :] / max(1e-5, temperature)
            probs = F.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probs, num_samples=1)
            idx = torch.cat((idx, idx_next), dim=1)
        return idx

# -----------------------------------------------------------------------------
# 3. Training Loop
# -----------------------------------------------------------------------------
def get_batch(data, split):
    # 90% train, 10% val
    n = int(0.9 * len(data))
    src = data[:n] if split == "train" else data[n:]
    ix = torch.randint(len(src) - BLOCK_SIZE, (BATCH_SIZE,))
    x = torch.stack([src[i:i+BLOCK_SIZE] for i in ix])
    y = torch.stack([src[i+1:i+BLOCK_SIZE+1] for i in ix])
    return x.to(DEVICE), y.to(DEVICE)

@torch.no_grad()
def estimate_loss(model, data):
    out = {}
    model.eval()
    for split in ["train", "val"]:
        losses = torch.zeros(EVAL_ITERS)
        for k in range(EVAL_ITERS):
            X, Y = get_batch(data, split)
            logits, loss = model(X, Y)
            losses[k] = loss.item()
        out[split] = losses.mean()
    model.train()
    return out

def main():
    print("=" * 75)
    print(" TRAINING LAYER 0 (JAIN-NANOGPT) ON APPLE SILICON GPU (MPS)")
    print("=" * 75)
    print(f" Device: {DEVICE}")

    # Initialize tokenizer and corpus
    tokenizer = AksharaTokenizer(VOCAB_PATH)
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        corpus_text = f.read()

    encoded = tokenizer.encode(corpus_text)
    data = torch.tensor(encoded, dtype=torch.long)
    print(f" Corpus Tokens: {len(data)}")
    print(f" Vocabulary Size: {tokenizer.vocab_size} Devanagari Akṣara clusters")

    # Initialize model
    model = JainNanoGPT(tokenizer.vocab_size).to(DEVICE)
    param_count = sum(p.numel() for p in model.parameters()) / 1e6
    print(f" Model Parameters: {param_count:.2f} Million")

    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-2)

    start_time = time.time()
    for iter_num in range(MAX_ITERS + 1):
        if iter_num % EVAL_INTERVAL == 0 or iter_num == MAX_ITERS:
            losses = estimate_loss(model, data)
            elapsed = time.time() - start_time
            print(f" Step {iter_num:4d}/{MAX_ITERS} | Train Loss: {losses['train']:.4f} | Val Loss: {losses['val']:.4f} | Elapsed: {elapsed:.1f}s")

        xb, yb = get_batch(data, "train")
        logits, loss = model(xb, yb)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()

    total_time = time.time() - start_time
    print("-" * 75)
    print(f"✓ Training finished in {total_time:.1f} seconds! Final Val Loss: {losses['val']:.4f}")

    # Save model weights and metadata
    torch.save({
        "model_state_dict": model.state_dict(),
        "vocab_size": tokenizer.vocab_size,
        "n_embd": N_EMBD,
        "n_head": N_HEAD,
        "n_layer": N_LAYER,
        "block_size": BLOCK_SIZE,
        "train_loss": float(losses["train"]),
        "val_loss": float(losses["val"]),
        "training_time_sec": total_time
    }, SAVE_PATH)
    print(f"✓ Saved model weights to: {SAVE_PATH}")

    # -------------------------------------------------------------------------
    # Test Generation / Restoration on Verse 1
    # -------------------------------------------------------------------------
    print("\n" + "=" * 75)
    print(" INFERENCE RESTORATION TEST (Verse 1: Noisy OCR -> Restored Mula)")
    print("=" * 75)
    test_prompt = "<OCR>\nकृत्स्तकमंभः । तस्मे संज्ञानरूपाय नमो5स्तु परमात्मने ॥ १ ॥\n<MULA>\n"
    prompt_tokens = tokenizer.encode(test_prompt)
    context = torch.tensor(prompt_tokens, dtype=torch.long, device=DEVICE).unsqueeze(0)

    model.eval()
    with torch.no_grad():
        generated_idx = model.generate(context, max_new_tokens=40, temperature=0.3)
        generated_text = tokenizer.decode(generated_idx[0].tolist())

    print("Prompt:\n", test_prompt.strip())
    print("-" * 50)
    print("Model Output:\n", generated_text[:250])
    print("=" * 75)

if __name__ == "__main__":
    main()
