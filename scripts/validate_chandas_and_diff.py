#!/usr/bin/env python3
"""
scripts/validate_chandas_and_diff.py
Part of Shrutdhara's Philological Verification Pipeline (Layer 2 & Layer 3).
Performs deterministic mathematical prosody validation (Chandas checksum)
and dual-model cross-diffing between Gemini 4 Argon and Gemini 3.8 Flash extractions.
"""

import json
import difflib
import re
import sys
import os

# Devanagari vowel and virama definitions for Sanskrit prosody
VOWELS = set("अआइईउऊऋॠऌएऐओऔ")
MATRAS = set("ािीुूृॄॢेैोौ")
VIRAMA = "्"
ANUSVARA = "ं"
VISARGA = "ः"
AVAGRAHA = "ऽ"
DANDAS = set("।॥|1234567890१२३४५६७८९०.,:;-–— \t\r")

def split_padas(verse_text):
    """Splits an Anushtubh shloka into its 4 padas based on dandas, commas, and linebreaks."""
    lines = [l.strip() for l in verse_text.split("\n") if l.strip()]
    raw_padas = []
    for line in lines:
        parts = re.split(r'[,।॥]', line)
        for p in parts:
            p_clean = re.sub(r'[\d१२३४५६७८९०॥।\(\)]', '', p).strip()
            if p_clean:
                raw_padas.append(p_clean)
    return raw_padas

def count_anushtubh_syllables(pada):
    """
    Accurate syllable counter for Sanskrit Anushtubh.
    Counts vowel centers: independent vowels + dependent matras + inherent 'a' in consonants lacking virama.
    """
    count = 0
    chars = list(pada)
    i = 0
    while i < len(chars):
        c = chars[i]
        if c in DANDAS or c == AVAGRAHA:
            i += 1
            continue
        if c in VOWELS:
            count += 1
        elif 0x0915 <= ord(c) <= 0x0939: # Consonant
            has_virama = False
            has_matra = False
            j = i + 1
            if j < len(chars):
                if chars[j] == VIRAMA:
                    has_virama = True
                elif chars[j] in MATRAS:
                    has_matra = True
            if has_matra:
                count += 1
                i += 1 # skip matra
            elif not has_virama:
                count += 1 # inherent 'a'
        i += 1
    return count

def validate_pipeline(argon_path, flash_path):
    if not os.path.exists(argon_path) or not os.path.exists(flash_path):
        print(f"Error: Input JSON files not found:\nArgon: {argon_path}\nFlash: {flash_path}")
        return

    with open(argon_path, "r", encoding="utf-8") as f:
        argon_data = json.load(f)
    with open(flash_path, "r", encoding="utf-8") as f:
        flash_data = json.load(f)

    print("=" * 80)
    print(" SHRUТDHARA PHILOLOGICAL VERIFICATION PIPELINE: LAYER 2 & LAYER 3 AUDIT")
    print("=" * 80)

    total_verses = min(len(argon_data), len(flash_data))
    perfect_mula_matches = 0
    prosody_pass = 0

    for i in range(total_verses):
        v_num = argon_data[i].get("verse_number", i + 1)
        a_mula = argon_data[i].get("mula_text", "").strip()
        f_mula = flash_data[i].get("mula_text", "").strip()

        print(f"\n▶ VERSE {v_num} (Book Page {i+1})")
        print("-" * 50)

        # 1. LAYER 2: DUAL-MODEL MULA DIFF
        if a_mula == f_mula:
            print("  ✓ LAYER 2 (Dual-Model Mula Diff): 100% IDENTICAL MATCH")
            perfect_mula_matches += 1
        else:
            print("  ⚠ LAYER 2 (Dual-Model Mula Diff): DISCREPANCY DETECTED!")
            diff = difflib.ndiff([a_mula], [f_mula])
            for d in diff:
                print(f"    {d.strip()}")

        # 2. LAYER 3: CHANDAS (ANUSHTUBH METER) VALIDATION
        a_padas = split_padas(a_mula)
        f_padas = split_padas(f_mula)

        a_counts = [count_anushtubh_syllables(p) for p in a_padas]
        f_counts = [count_anushtubh_syllables(p) for p in f_padas]

        a_total = sum(a_counts)
        f_total = sum(f_counts)

        is_valid_32 = (a_total == 32)
        if is_valid_32:
            prosody_pass += 1

        print(f"  • LAYER 3 (Anushtubh Prosody Check):")
        print(f"    Argon Syllables: {a_counts} (Total: {a_total}/32) -> {'✓ VALID 32-SYLLABLE ANUSHTUBH' if is_valid_32 else '⚠ MISMATCH'}")
        print(f"    Flash Syllables: {f_counts} (Total: {f_total}/32) -> {'✓ VALID 32-SYLLABLE ANUSHTUBH' if f_total == 32 else '⚠ MISMATCH'}")

        # 3. LAYER 4: COMMENTARY COMPARED
        a_arth = len(argon_data[i].get("arth_hindi", ""))
        f_arth = len(flash_data[i].get("arth_hindi", ""))
        print(f"  • LAYER 4 (Hindi Exposition Depth): Argon = {a_arth} chars | Flash = {f_arth} chars (Argon {a_arth/max(1,f_arth):.1f}x)")

    print("\n" + "=" * 80)
    print(" VERIFICATION SUMMARY")
    print("=" * 80)
    print(f" Total Verses Tested:               {total_verses}")
    print(f" Identical Mula Text Matches:       {perfect_mula_matches} / {total_verses} ({perfect_mula_matches/total_verses*100:.1f}%)")
    print(f" 32-Syllable Prosody Checksum Pass: {prosody_pass} / {total_verses} ({prosody_pass/total_verses*100:.1f}%)")
    print("=" * 80)

if __name__ == "__main__":
    argon_f = sys.argv[1] if len(sys.argv) > 1 else "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/argon_10pages_combined.json"
    flash_f = sys.argv[2] if len(sys.argv) > 2 else "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/flash_10pages_combined.json"
    validate_pipeline(argon_f, flash_f)
