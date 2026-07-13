#!/usr/bin/env python3
"""Parse data/transcription.md (page-by-page tables) into the three JSON datasets.
Editorial parentheticals (containing ASCII letters) are stripped from cells;
⚠ marks a row as uncertain. Run: python3 build/parse-transcription.py"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "transcription.md"

poster, acharyas, bhattarak = [], [], []
mode = None          # poster | acharya | bhattarak
section = None       # centurySection for acharya rows


def clean(cell: str):
    """Strip editorial notes; return (text, uncertain)."""
    uncertain = "⚠" in cell
    cell = cell.replace("⚠", "")
    # remove parentheticals that contain ASCII letters (editorial notes only)
    cell = re.sub(r"\([^)]*[A-Za-z][^)]*\)", "", cell)
    # collapse whitespace
    cell = re.sub(r"\s+", " ", cell).strip(" ;,")
    return cell.strip(), uncertain


def parse_row(line: str):
    cells = [c for c in line.split("|")]
    # drop leading/trailing empties from the outer pipes
    if cells and cells[0].strip() == "":
        cells = cells[1:]
    if cells and cells[-1].strip() == "":
        cells = cells[:-1]
    return [c.strip() for c in cells]


for raw in SRC.read_text(encoding="utf-8").splitlines():
    line = raw.strip()
    if line.startswith("<!-- PARSE-STOP"):
        break
    if line.startswith("## POSTER"):
        mode = "poster"
        continue
    if line.startswith("# भट्टारक") or "भट्टारक एवं विद्वान (172)" in line:
        mode = "bhattarak"
        continue
    if re.match(r"^##+\s*p\.\d+", line):
        if mode != "bhattarak":
            mode = "acharya"
        continue
    m = re.match(r"^###\s*Section:\s*(.+)$", line)
    if m:
        head = m.group(1)
        if "पूर्व" in head and "शताब्दी" not in head:
            section = "ई.पू."
        else:
            num = re.search(r"(\d+)", head)
            if num:
                section = num.group(1)
        continue
    if not line.startswith("|"):
        continue
    cells = parse_row(line)
    if not cells or re.match(r"^:?-+:?$", cells[0]) or cells[0] in ("क्रम", "क्रमांक"):
        continue
    if not re.match(r"^\d+$", cells[0]):
        continue
    rid = int(cells[0])

    if mode == "poster" and len(cells) >= 4:
        name, u1 = clean(cells[1])
        author, u2 = clean(cells[2])
        century, u3 = clean(cells[3])
        rec = {"id": rid, "name": name, "author": author, "century": century}
        if u1 or u2 or u3:
            rec["uncertain"] = True
        poster.append(rec)
    elif mode == "acharya" and len(cells) >= 5:
        period, u1 = clean(cells[1])
        name, u2 = clean(cells[2])
        guru, u3 = clean(cells[3])
        works, u4 = clean(cells[4])
        rec = {"id": rid, "period": period, "centurySection": section or "?",
               "name": name, "guru": guru, "works": works}
        if section == "ई.पू.":
            rec["era"] = "ईसवी पूर्व"
        if u1 or u2 or u3 or u4:
            rec["uncertain"] = True
        acharyas.append(rec)
    elif mode == "bhattarak" and len(cells) >= 5:
        period, u1 = clean(cells[1])
        name, u2 = clean(cells[2])
        guru_or_type, u3 = clean(cells[3])
        works, u4 = clean(cells[4])
        rec = {"id": rid, "period": period, "name": name,
               "guruOrType": guru_or_type, "works": works}
        if u1 or u2 or u3 or u4:
            rec["uncertain"] = True
        bhattarak.append(rec)

# ---- validation ----
errors = []
for label, rows, expect in (("granths", poster, 90), ("acharyas", acharyas, 420), ("bhattarak", bhattarak, 172)):
    ids = [r["id"] for r in rows]
    if len(rows) != expect:
        errors.append(f"{label}: {len(rows)} rows, expected {expect}")
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    gaps = sorted(set(range(1, expect + 1)) - set(ids))
    if dupes:
        errors.append(f"{label}: duplicate ids {dupes}")
    if gaps:
        errors.append(f"{label}: missing ids {gaps}")

if errors:
    print("VALIDATION FAILED:\n  " + "\n  ".join(errors))
    sys.exit(1)

(ROOT / "data" / "granths-90.json").write_text(
    json.dumps(poster, ensure_ascii=False, indent=1), encoding="utf-8")
(ROOT / "data" / "acharyas-420.json").write_text(
    json.dumps(acharyas, ensure_ascii=False, indent=1), encoding="utf-8")
(ROOT / "data" / "bhattarak-172.json").write_text(
    json.dumps(bhattarak, ensure_ascii=False, indent=1), encoding="utf-8")

unc = sum(1 for r in poster + acharyas + bhattarak if r.get("uncertain"))
secs = sorted({a["centurySection"] for a in acharyas}, key=lambda s: (s != "ई.पू.", int(s) if s.isdigit() else 99))
print(f"ok: granths={len(poster)} acharyas={len(acharyas)} bhattarak={len(bhattarak)} uncertain={unc}")
print(f"acharya sections: {', '.join(secs)}")
