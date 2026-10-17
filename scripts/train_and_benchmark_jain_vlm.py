#!/usr/bin/env python3
"""
Train and Benchmark Jain-VLM (End-to-End DeepSeek-VL Architecture)
==================================================================
Trains directly on raw image crops of Sanskrit/Prakrit verses on Apple Silicon MPS.
Evaluates out-of-sample on held-out benchmark test verses.
"""

import os
import sys
import json
import time
import random
import torch
import torch.nn as nn
from torch.nn import functional as F
from PIL import Image, ImageEnhance
import numpy as np

# Import our VLM architecture
from jain_vlm import JainVLM
from train_jain_nanogpt import AksharaTokenizer

VOCAB_PATH = "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/Layer0_Jain_NanoGPT/stage0_akshara_vocab.json"
DATASET_META = "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/vlm_dataset/vlm_dataset_metadata.json"
CHECKPOINT_PATH = "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/Layer0_Jain_NanoGPT/jain_vlm_weights.pt"

IMG_H, IMG_W = 64, 512
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"

def preprocess_image(img_path, augment=False):
    """
    Standardize raw image crop to [1, 1, 64, 512] float tensor in [0, 1].
    """
    img = Image.open(img_path).convert("L")

    if augment:
        # 1. Random contrast jitter
        factor = random.uniform(0.85, 1.15)
        img = ImageEnhance.Contrast(img).enhance(factor)
        # 2. Random brightness jitter
        bfactor = random.uniform(0.9, 1.1)
        img = ImageEnhance.Brightness(img).enhance(bfactor)
        # 3. Small rotation (-1.5 to +1.5 deg)
        angle = random.uniform(-1.5, 1.5)
        img = img.rotate(angle, resample=Image.Resampling.BILINEAR, fillcolor=255)

    # Resize to exact model grid
    img_resized = img.resize((IMG_W, IMG_H), Image.Resampling.LANCZOS)
    arr = np.array(img_resized, dtype=np.float32) / 255.0

    # Invert so ink = 1.0 (signal), paper = 0.0 (background)
    arr = 1.0 - arr

    if augment:
        # Small noise injection
        noise = np.random.normal(0, 0.02, arr.shape).astype(np.float32)
        arr = np.clip(arr + noise, 0.0, 1.0)

    # Tensor: [1, 64, 512]
    t = torch.from_numpy(arr).unsqueeze(0)
    return t

def calculate_cer(pred, gold):
    """Levenshtein distance CER."""
    p_chars = list(pred.replace(" ", "").replace("\n", ""))
    g_chars = list(gold.replace(" ", "").replace("\n", ""))
    
    dp = [[0] * (len(g_chars) + 1) for _ in range(len(p_chars) + 1)]
    for i in range(len(p_chars) + 1):
        dp[i][0] = i
    for j in range(len(g_chars) + 1):
        dp[0][j] = j

    for i in range(1, len(p_chars) + 1):
        for j in range(1, len(g_chars) + 1):
            cost = 0 if p_chars[i-1] == g_chars[j-1] else 1
            dp[i][j] = min(
                dp[i-1][j] + 1,      # deletion
                dp[i][j-1] + 1,      # insertion
                dp[i-1][j-1] + cost  # substitution
            )

    dist = dp[len(p_chars)][len(g_chars)]
    cer = dist / max(len(g_chars), 1)
    return dist, len(g_chars), cer

def count_anushtubh_syllables(text):
    """Count syllables for Anuṣṭubh meter (32 syllables)."""
    import unicodedata
    clean = text.replace("॥", "").replace("।", "").replace(" ", "").replace("\n", "").replace("—", "").replace("–", "")
    clean = "".join(c for c in clean if not c.isdigit() and c not in [":", "-", ",", "'", '"', "(", ")"])
    
    SYLLABLE_VOWELS = set("अआइईउऊऋएऐओऔािीुूृेैोौंः")
    VIRAMA = '्'
    AVAGRAHA = 'ऽ'

    count = 0
    i = 0
    while i < len(clean):
        c = clean[i]
        if c == VIRAMA or c == AVAGRAHA:
            i += 1
            continue
        if c in SYLLABLE_VOWELS:
            count += 1
            i += 1
            continue
        if 'ऄ' <= c <= 'ह': # Devanagari consonant
            if i + 1 < len(clean) and clean[i+1] == VIRAMA:
                i += 2
                continue
            elif i + 1 < len(clean) and clean[i+1] in "ािीुूृेैोौंः":
                count += 1
                i += 2
                continue
            else:
                count += 1
                i += 1
                continue
        i += 1
    return count

def main():
    print("=" * 75)
    print("JAIN-VLM: END-TO-END VISION-LANGUAGE MODEL TRAINING & BENCHMARK")
    print(f"Device: {DEVICE.upper()} (Apple Silicon M3 Pro Metal GPU)")
    print("=" * 75)

    # 1. Load Tokenizer & Metadata
    tokenizer = AksharaTokenizer(VOCAB_PATH)
    with open(DATASET_META, "r", encoding="utf-8") as f:
        meta = json.load(f)

    train_meta = [m for m in meta if m["split"] == "train"]
    test_meta = [m for m in meta if m["split"] == "test"]

    print(f"Loaded {len(train_meta)} Training Verses and {len(test_meta)} Held-Out Benchmark Test Verses.")

    # 2. Prepare Encoded Data
    mula_token_id = tokenizer.stoi.get("<MULA>", 18)
    eos_token_id = tokenizer.stoi.get("<EOS>", 16)

    def encode_sample(item):
        mula_clean = item["mula"].replace("\n", " ").strip()
        tokens = [mula_token_id] + tokenizer.encode(mula_clean) + [eos_token_id]
        return tokens

    train_data = []
    for item in train_meta:
        toks = encode_sample(item)
        train_data.append({"meta": item, "tokens": toks})

    test_data = []
    for item in test_meta:
        toks = encode_sample(item)
        test_data.append({"meta": item, "tokens": toks})

    # 3. Instantiate Jain-VLM Model
    model = JainVLM(
        vocab_size=tokenizer.vocab_size,
        img_size=(IMG_H, IMG_W),
        patch_size=(16, 16),
        in_channels=1,
        vision_dim=256,
        text_dim=256,
        n_head=8,
        n_layer=6,
        block_size=256,
        dropout=0.1
    ).to(DEVICE)

    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=400, eta_min=1e-5)

    # 4. Training Loop with Synthetic Multi-Pass Augmentations
    print("\nStarting Multimodal Pre-Training & Projector Alignment...")
    t0 = time.time()
    EPOCHS = 350
    BATCH_SIZE = 8

    model.train()
    for epoch in range(1, EPOCHS + 1):
        # Sample with augmentation
        batch_items = random.choices(train_data, k=BATCH_SIZE)
        
        # Images
        img_tensors = [preprocess_image(it["meta"]["image_path"], augment=True) for it in batch_items]
        img_batch = torch.stack(img_tensors).to(DEVICE) # [B, 1, 64, 512]

        # Text tokens & targets
        max_len = max(len(it["tokens"]) for it in batch_items)
        input_tokens = torch.full((BATCH_SIZE, max_len - 1), fill_value=0, dtype=torch.long)
        target_tokens = torch.full((BATCH_SIZE, max_len - 1), fill_value=-100, dtype=torch.long)

        for b_idx, it in enumerate(batch_items):
            toks = it["tokens"]
            seq_len = len(toks) - 1
            input_tokens[b_idx, :seq_len] = torch.tensor(toks[:-1], dtype=torch.long)
            target_tokens[b_idx, :seq_len] = torch.tensor(toks[1:], dtype=torch.long)

        input_tokens = input_tokens.to(DEVICE)
        target_tokens = target_tokens.to(DEVICE)

        optimizer.zero_grad()
        logits, loss = model(img_batch, input_tokens, target_tokens)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        scheduler.step()

        if epoch % 50 == 0 or epoch == 1:
            print(f"Epoch [{epoch:03d}/{EPOCHS:03d}] | Loss: {loss.item():.4f} | LR: {scheduler.get_last_lr()[0]:.6f}")

    train_time = time.time() - t0
    print(f"\nTraining completed in {train_time:.2f} seconds on Apple M3 Pro GPU!")

    # 5. Save Model Checkpoint
    torch.save(model.state_dict(), CHECKPOINT_PATH)
    print(f"Checkpoint saved to: {CHECKPOINT_PATH} ({os.path.getsize(CHECKPOINT_PATH) / (1024*1024):.2f} MB)")

    # 6. BENCHMARK TEST EVALUATION ON UNSEEN HELD-OUT TEST IMAGES
    print("\n" + "=" * 75)
    print("RUNNING BENCHMARK TEST ON HELD-OUT OUT-OF-SAMPLE VERSES (v08 & v09)")
    print("=" * 75)

    model.eval()
    test_results = []
    total_dist, total_chars = 0, 0

    for it in test_data:
        meta = it["meta"]
        gold_mula = meta["mula"]
        img_tensor = preprocess_image(meta["image_path"], augment=False).to(DEVICE)

        # Autoregressively generate from raw image with <MULA> prompt
        gen_tokens = model.generate(img_tensor, prompt_tokens=[mula_token_id], max_new_tokens=65, temperature=0.2)
        
        # Decode back to Devanagari Akṣaras
        # Strip control tokens (<MULA>, <EOS>)
        decoded_tokens = [tok for tok in gen_tokens if tok not in [mula_token_id, eos_token_id]]
        pred_text = "".join(tokenizer.itos.get(tok, "") for tok in decoded_tokens).strip()

        dist, n_chars, cer = calculate_cer(pred_text, gold_mula)
        total_dist += dist
        total_chars += n_chars

        syllables = count_anushtubh_syllables(pred_text)
        gold_syllables = count_anushtubh_syllables(gold_mula)
        chandas_pass = (syllables == 32)

        res = {
            "verse_id": meta["id"],
            "page": meta["page"],
            "gold_mula": gold_mula,
            "pred_mula": pred_text,
            "edit_dist": dist,
            "gold_chars": n_chars,
            "cer_percent": round(cer * 100.0, 2),
            "pred_syllables": syllables,
            "gold_syllables": gold_syllables,
            "chandas_pass": chandas_pass
        }
        test_results.append(res)

        print(f"\n--- [TEST SAMPLE: {meta['id'].upper()} (Page {meta['page']})] ---")
        print(f"Gold Sanskrit  : {gold_mula.replace(chr(10), ' ')}")
        print(f"Jain-VLM Output: {pred_text}")
        print(f"CER: {res['cer_percent']}% | Syllables: {syllables}/32 | Chandas Pass: {'PASS' if chandas_pass else 'FAIL'}")

    overall_cer = (total_dist / max(total_chars, 1)) * 100.0
    print("\n" + "-" * 75)
    print(f"OVERALL HELD-OUT BENCHMARK CER: {overall_cer:.2f}%")
    print(f"CHANDAS PROSODY VALIDITY: {sum(1 for r in test_results if r['chandas_pass'])} / {len(test_results)} Passed")
    print("-" * 75)

    # Save benchmark results
    bench_file = "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/Layer0_Jain_NanoGPT/jain_vlm_benchmark_results.json"
    with open(bench_file, "w", encoding="utf-8") as f:
        json.dump({
            "overall_cer_percent": round(overall_cer, 2),
            "training_time_seconds": round(train_time, 2),
            "device": DEVICE,
            "model_parameters": sum(p.numel() for p in model.parameters()),
            "results": test_results
        }, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
