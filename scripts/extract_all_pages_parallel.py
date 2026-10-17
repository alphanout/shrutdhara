#!/usr/bin/env python3
"""
Parallel OCR and parser for all 52 pages of Ishtopadesha
"""

import os
import subprocess
import json
import concurrent.futures

PAGE_DIR = "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/pages_png_300dpi"
OUTPUT_JSON = "/Users/atishayjain/.gemini/antigravity/scratch/shrutdhara/data/raw_ocr_pages_1_to_52.json"

def ocr_page(bp):
    pdf_p = bp + 23
    fn = f"{PAGE_DIR}/book_page_{bp:02d}_pdf_page_{pdf_p:02d}.png"
    if not os.path.exists(fn):
        return bp, ""
    res = subprocess.run(["tesseract", fn, "stdout", "-l", "san+hin", "--psm", "6"], capture_output=True, text=True)
    return bp, res.stdout

def main():
    pages = list(range(1, 53))
    print(f"Running parallel OCR on {len(pages)} pages using 8 workers...")
    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(ocr_page, bp): bp for bp in pages}
        for future in concurrent.futures.as_completed(futures):
            bp, text = future.result()
            results[bp] = text
            print(f"  ✓ Processed book page {bp:02d} ({len(text)} chars)")
    
    # Save ordered dictionary
    ordered_results = {f"page_{bp:02d}": results[bp] for bp in sorted(results.keys())}
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(ordered_results, f, ensure_ascii=False, indent=2)
    print(f"Saved all OCR texts to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
