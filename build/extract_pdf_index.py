#!/usr/bin/env python3
"""
Fast text extraction and search indexing across Shastra PDFs.
Extracts entire book in a single pdftotext pass and splits on \x0c.
"""

import os
import sys
import json
import re
import subprocess
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.expanduser('~/Downloads/JainGranthLibrary_PDFs')
CATALOG_PATH = os.path.join(ROOT, 'data', 'shastra-pdfs.json')
OUT_PATH = os.path.join(ROOT, 'data', 'pdf-search-index.json')

def main():
    if not os.path.exists(CATALOG_PATH):
        print(f"Error: {CATALOG_PATH} not found", file=sys.stderr)
        sys.exit(1)

    t0 = time.time()
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    granths_file = os.path.join(ROOT, 'data', 'granths-90.json')
    granths_info = {}
    if os.path.exists(granths_file):
        with open(granths_file, 'r', encoding='utf-8') as f:
            for g in json.load(f):
                granths_info[g.get('slug', '')] = g

    index = []
    text_books = 0
    text_pages_total = 0

    print(f"Indexing {len(catalog)} Shastra PDFs...")
    for slug, item in catalog.items():
        gid = item.get('id', 0)
        name = item.get('name', '')
        name_en = item.get('nameEn', '')
        category = item.get('category', '')
        file_name = item.get('fileName', '')
        url = item.get('url', '')
        size = item.get('size', '')

        g_meta = granths_info.get(slug, {})
        author = g_meta.get('author', '')
        century = g_meta.get('century', '')

        # 1. Base catalog entry for granth (p: 1)
        index.append({
            's': slug,
            'i': gid,
            'n': name,
            'ne': name_en,
            'a': author,
            'c': category,
            'p': 1,
            'sn': f"{name} ({name_en}) — {author} · {category} · {size}",
            't': f"{name} {name_en} {author} {category} {century}".strip()
        })

        pdf_path = os.path.join(PDF_DIR, file_name)
        if not os.path.exists(pdf_path):
            continue

        # Extract all pages in a single fast pass
        try:
            res = subprocess.run(
                ['pdftotext', pdf_path, '-'],
                capture_output=True,
                text=True,
                errors='ignore',
                timeout=15
            )
        except Exception as e:
            print(f"  ! Error running pdftotext on {file_name}: {e}")
            continue

        raw_pages = res.stdout.split('\x0c')
        has_any_text = False
        book_pages = 0

        for p_idx, page_txt in enumerate(raw_pages, start=1):
            clean = re.sub(r'\s+', ' ', page_txt).strip()
            if len(clean) < 30:
                continue
            # Skip pure watermark pages
            if len(clean) < 60 and ('jainelibrary' in clean.lower() or 'atmadharma' in clean.lower()):
                continue

            snippet = clean[:140] + ('…' if len(clean) > 140 else '')
            search_chunk = clean[:800]

            index.append({
                's': slug,
                'i': gid,
                'n': name,
                'ne': name_en,
                'a': author,
                'c': category,
                'p': p_idx,
                'sn': snippet,
                't': search_chunk
            })
            has_any_text = True
            book_pages += 1

        if has_any_text:
            text_books += 1
            text_pages_total += book_pages
            print(f"  ✓ {slug}: {book_pages} pages indexed")

    print(f"\nDone in {time.time()-t0:.1f}s!")
    print(f"Indexed {text_books} text-enabled books ({text_pages_total} pages) + {len(catalog)} granth records.")
    print(f"Total entries: {len(index)}")

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f"Saved {OUT_PATH} ({size_kb:.1f} KB)")

if __name__ == '__main__':
    main()
