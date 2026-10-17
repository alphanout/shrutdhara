#!/usr/bin/env python3
"""
Incremental Vector Indexer for Shrutdhara Scanned Granth Facsimiles
Uses EmbeddingGemma 2 (256d Matryoshka Representation Learning)

Key Architectural Features:
1. Checksum-based incremental processing (SHA256 of PDF and individual page images).
2. Random-access binary vector storage (1024 bytes / page at fixed byte offsets).
3. Zero redundant recomputation (skips unchanged PDFs and unchanged pages).
4. GitHub Actions CI/CD cache-friendly.
"""

import os
import sys
import json
import hashlib
import argparse
import subprocess
from datetime import datetime
from pathlib import Path
import numpy as np
from PIL import Image

VECTOR_DIM = 256  # Matryoshka truncated dimensions
BYTES_PER_VECTOR = VECTOR_DIM * 4  # 1024 bytes per page (float32)

def compute_sha256(file_path):
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def compute_image_sha256(pil_image):
    return hashlib.sha256(pil_image.tobytes()).hexdigest()

class IncrementalVectorIndexer:
    def __init__(self, output_dir="data/vectors", manifest_path="data/vector-manifest.json", model_name="google/embeddinggemma-2"):
        self.output_dir = Path(output_dir)
        self.manifest_path = Path(manifest_path)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        self.manifest = self._load_manifest()
        self.model_name = model_name
        self._model = None

    def _load_manifest(self):
        if self.manifest_path.exists():
            try:
                with open(self.manifest_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[WARN] Error reading manifest ({e}), initializing fresh.")
        return {}

    def _save_manifest(self):
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(self.manifest, f, ensure_ascii=False, indent=2)

    @property
    def model(self):
        if self._model is None:
            print(f"[MODEL] Loading {self.model_name}...")
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def extract_page_image(self, pdf_path, page_num, temp_dir="/tmp/sd_page_extract"):
        os.makedirs(temp_dir, exist_ok=True)
        out_prefix = os.path.join(temp_dir, f"page_{page_num}")
        cmd = [
            "pdftoppm", "-png", "-r", "150",
            "-f", str(page_num), "-l", str(page_num),
            str(pdf_path), out_prefix
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # pdftoppm appends -001.png or -1.png
        matches = list(Path(temp_dir).glob(f"page_{page_num}*.png"))
        if not matches:
            raise FileNotFoundError(f"Failed to render page {page_num} from {pdf_path}")
        img_path = matches[0]
        img = Image.open(img_path).convert("RGB")
        try:
            img_path.unlink()
        except OSError:
            pass
        return img

    def get_pdf_page_count(self, pdf_path):
        res = subprocess.run(["pdfinfo", str(pdf_path)], capture_output=True, text=True, check=True)
        for line in res.stdout.splitlines():
            if line.startswith("Pages:"):
                return int(line.split(":")[1].strip())
        return 0

    def process_pdf(self, slug, pdf_path, dry_run=False):
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            print(f"[ERR] File not found: {pdf_path}")
            return False

        pdf_sha256 = compute_sha256(pdf_path)
        existing_entry = self.manifest.get(slug, {})
        bin_path = self.output_dir / f"{slug}.bin"

        # Check if entire PDF is already processed and unchanged
        if (existing_entry.get("pdf_sha256") == pdf_sha256 and
            existing_entry.get("status") == "complete" and
            bin_path.exists()):
            print(f"[SKIP] '{slug}' unchanged (SHA256: {pdf_sha256[:8]}..., {existing_entry.get('total_pages', 0)} pages indexed).")
            return True

        total_pages = self.get_pdf_page_count(pdf_path)
        print(f"\n[INDEX] Processing '{slug}' ({total_pages} pages, SHA256: {pdf_sha256[:8]}...)")

        page_hashes = existing_entry.get("page_hashes", {})
        pages_to_process = []

        # Find which pages actually changed
        print(f"        Scanning page checksums...")
        for p in range(1, total_pages + 1):
            p_str = str(p)
            try:
                img = self.extract_page_image(pdf_path, p)
                img_hash = compute_image_sha256(img)
                if page_hashes.get(p_str) != img_hash:
                    pages_to_process.append((p, img, img_hash))
            except Exception as e:
                print(f"        [WARN] Could not extract page {p}: {e}")

        if not pages_to_process:
            print(f"        All {total_pages} page hashes matched existing index. Updating manifest.")
            existing_entry["pdf_sha256"] = pdf_sha256
            existing_entry["status"] = "complete"
            existing_entry["last_updated"] = datetime.utcnow().isoformat()
            self.manifest[slug] = existing_entry
            self._save_manifest()
            return True

        print(f"        Found {len(pages_to_process)} / {total_pages} pages needing encoding.")

        if dry_run:
            print(f"        [DRY RUN] Would encode {len(pages_to_process)} pages.")
            return True

        # Open or create binary vector file
        # Vector file pre-allocation for O(1) random offset writes
        expected_size = total_pages * BYTES_PER_VECTOR
        if not bin_path.exists() or bin_path.stat().st_size != expected_size:
            with open(bin_path, "wb") as f:
                f.truncate(expected_size)

        with open(bin_path, "r+b") as f:
            batch_size = 16
            for i in range(0, len(pages_to_process), batch_size):
                batch = pages_to_process[i:i+batch_size]
                batch_imgs = [item[1] for item in batch]
                batch_embs = self.model.encode(
                    batch_imgs,
                    truncate_dim=VECTOR_DIM,
                    normalize_embeddings=True
                ).astype(np.float32)

                for j, (p_num, _, img_hash) in enumerate(batch):
                    emb_bytes = batch_embs[j].tobytes()
                    offset = (p_num - 1) * BYTES_PER_VECTOR
                    f.seek(offset)
                    f.write(emb_bytes)
                    page_hashes[str(p_num)] = img_hash

                print(f"        Encoded pages {i+1}..{min(i+batch_size, len(pages_to_process))} / {len(pages_to_process)}")

        # Save manifest
        self.manifest[slug] = {
            "slug": slug,
            "pdf_name": pdf_path.name,
            "pdf_sha256": pdf_sha256,
            "total_pages": total_pages,
            "vector_file": str(bin_path.name),
            "vector_dim": VECTOR_DIM,
            "bytes_per_page": BYTES_PER_VECTOR,
            "file_size_bytes": bin_path.stat().st_size,
            "status": "complete",
            "last_updated": datetime.utcnow().isoformat(),
            "page_hashes": page_hashes
        }
        self._save_manifest()
        print(f"[DONE] '{slug}' successfully indexed into {bin_path} ({bin_path.stat().st_size / 1024:.1f} KB).")
        return True

def main():
    parser = argparse.ArgumentParser(description="Shrutdhara Incremental Vector Indexer")
    parser.add_argument("--slug", help="Granth slug (e.g. samayasaara)")
    parser.add_argument("--pdf", help="Path to specific PDF file")
    parser.add_argument("--pdf-dir", default="~/Downloads/JainGranthLibrary_PDFs", help="Directory of PDFs")
    parser.add_argument("--output-dir", default="data/vectors", help="Output directory for binary vectors")
    parser.add_argument("--manifest", default="data/vector-manifest.json", help="Path to manifest JSON")
    parser.add_argument("--dry-run", action="store_true", help="Scan and report without encoding")
    args = parser.parse_args()

    indexer = IncrementalVectorIndexer(output_dir=args.output_dir, manifest_path=args.manifest)

    if args.slug and args.pdf:
        indexer.process_pdf(args.slug, args.pdf, dry_run=args.dry_run)
    elif args.pdf_dir:
        pdf_dir = Path(os.path.expanduser(args.pdf_dir))
        if not pdf_dir.exists():
            print(f"[ERR] Directory not found: {pdf_dir}")
            sys.exit(1)
        for pdf in sorted(pdf_dir.glob("*.pdf")):
            name = pdf.stem
            # extract slug prefix e.g. 03_samayasaara_... -> samayasaara
            parts = name.split("_")
            slug = parts[1] if len(parts) > 1 and parts[0].isdigit() else parts[0]
            indexer.process_pdf(slug, pdf, dry_run=args.dry_run)

if __name__ == "__main__":
    main()
