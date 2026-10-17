#!/usr/bin/env python3
"""
Prepare Dataset for End-to-End Jain-VLM (DeepSeek-VL Style)
============================================================
Crops raw 300-DPI verse bounding boxes directly from the facsimile scans
and pairs them with gold-standard Devanagari Akṣara sequences.

NO TESSERACT. Raw image pixels -> Devanagari Akṣaras.
"""

import os
import json
from PIL import Image

IMG_DIR = "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/pages_png_300dpi"
OUT_DIR = "/Users/atishayjain/Downloads/JainGranthLibrary_PDFs/Extracted_JSON_10Pages_Test/vlm_dataset"
os.makedirs(f"{OUT_DIR}/images", exist_ok=True)

# Exact bounding boxes for the 10 verses across the 10 pages (300 DPI, 2100x2850)
# (x1, y1, x2, y2)
VERSE_CROPS = [
    {
        "id": "v00_mangal",
        "page": 1,
        "pdf_page": 24,
        "box": (300, 1530, 1800, 1690),
        "mula": "इष्टोपदेशमाचष्टे, स्वशक्त्याशाधरः स्फुटम्‌ ।\nसद्बोधवृत्तसंशुद्ध्यै, भव्यपङ्केरुहांगिराः ॥ ० ॥",
        "split": "train"
    },
    {
        "id": "v01",
        "page": 1,
        "pdf_page": 24,
        "box": (320, 2060, 1780, 2240),
        "mula": "यस्य स्वयं स्वभावाप्तिरभावे कृत्स्नकर्मणः ।\nतस्मै संज्ञानरूपाय नमोऽस्तु परमात्मने ॥ १ ॥",
        "split": "train"
    },
    {
        "id": "v02",
        "page": 2,
        "pdf_page": 25,
        "box": (320, 1550, 1780, 1740),
        "mula": "योग्योपादानयोगेन, दृषदः स्वर्णता मता ।\nद्रव्यादिस्वादिसंपत्तावात्मनोऽप्यात्मता मता ॥ २ ॥",
        "split": "train"
    },
    {
        "id": "v03",
        "page": 3,
        "pdf_page": 26,
        "box": (320, 1690, 1780, 1880),
        "mula": "वरं व्रतैः पदं दैवं, नाव्रतैर्बत नारकम्‌ ।\nछायातपस्थयोर्भेदः, प्रतिपालयतोर्महान्‌ ॥ ३ ॥",
        "split": "train"
    },
    {
        "id": "v04",
        "page": 4,
        "pdf_page": 27,
        "box": (320, 2150, 1780, 2350),
        "mula": "यत्र भावः शिवं दत्ते, द्यौः कियद्‌ दूरवर्तिनी ।\nक्रोशार्धे यदि लभ्येत, निष्कः कस्तप्यते गवि ॥ ४ ॥",
        "split": "train"
    },
    {
        "id": "v05",
        "page": 5,
        "pdf_page": 28,
        "box": (320, 2330, 1780, 2530),
        "mula": "हृषीकजमनातङ्कं, दीर्घकालोपलालितम्‌ ।\nनाकोकसां परं सौख्यं, तदप्यन्तवदुच्यते ॥ ५ ॥",
        "split": "train"
    },
    {
        "id": "v06",
        "page": 7,
        "pdf_page": 30,
        "box": (320, 480, 1780, 680),
        "mula": "वासनामात्रमेवेतत्‌ सुखं दुःखं च देहिनाम्‌ ।\nतथाह्युद्वेजयन्त्येते, भोगा रोगा इवापदि ॥ ६ ॥",
        "split": "train"
    },
    {
        "id": "v07",
        "page": 8,
        "pdf_page": 31,
        "box": (320, 2060, 1780, 2270),
        "mula": "मोहेन संवृतं ज्ञानं, स्वभावं लभते नहि ।\nमत्तः पुमान् पदार्थानां, यथा मदनकोद्रवैः ॥ ७ ॥",
        "split": "train"
    },
    {
        "id": "v08",
        "page": 10,
        "pdf_page": 33,
        "box": (320, 480, 1780, 680),
        "mula": "वपुर्गृहं धनं दाराः, पुत्रा मित्राणि शत्रवः ।\nसर्वथान्यस्वभावानि, मूढः स्वानि प्रपद्यते ॥ ८ ॥",
        "split": "test"  # HELD OUT BENCHMARK EVALUATION
    },
    {
        "id": "v09",
        "page": 10,
        "pdf_page": 33,
        "box": (320, 1960, 1780, 2160),
        "mula": "दिग्देशेभ्यः खगा एत्य, संवसन्ति नगे नगे ।\nस्वस्वकार्यवशाद्यान्ति, देशे दिक्षु प्रगे प्रगे ॥ ९ ॥",
        "split": "test"  # HELD OUT BENCHMARK EVALUATION
    }
]

def main():
    print("Preparing Jain-VLM Raw Pixel Dataset...")
    dataset_records = []
    
    for item in VERSE_CROPS:
        p_num = item["page"]
        pdf_p = item["pdf_page"]
        fn = f"{IMG_DIR}/book_page_{p_num:02d}_pdf_page_{pdf_p:02d}.png"
        
        im = Image.open(fn)
        crop = im.crop(item["box"])
        
        # Save high-res crop
        crop_fn = f"{OUT_DIR}/images/{item['id']}.png"
        crop.save(crop_fn)
        
        record = {
            "id": item["id"],
            "image_path": crop_fn,
            "page": p_num,
            "pdf_page": pdf_p,
            "box": item["box"],
            "mula": item["mula"],
            "split": item["split"],
            "image_size": crop.size
        }
        dataset_records.append(record)
        print(f"[{item['split'].upper()}] Extracted {item['id']} from page {p_num} (size: {crop.size})")

    meta_file = f"{OUT_DIR}/vlm_dataset_metadata.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(dataset_records, f, ensure_ascii=False, indent=2)
        
    print(f"\nSaved {len(dataset_records)} visual verse samples to {meta_file}")
    print(f"Train samples: {sum(1 for r in dataset_records if r['split'] == 'train')}")
    print(f"Test samples (held-out benchmark): {sum(1 for r in dataset_records if r['split'] == 'test')}")

if __name__ == "__main__":
    main()
