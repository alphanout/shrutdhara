#!/usr/bin/env python3
"""Ingest mool gathas from the जैन गाथा डेटाबेस (nikkyjain.github.io) into shastra/.

Takes ONLY <div class=gatha> (the ancient public-domain mool text) and
<div class=adhikaar> section names. Hindi पद्यानुवाद/अन्वयार्थ are someone's
translation work and are never taken. Every output file credits the typing
(टंकण-श्रेय) to the source. A language sniffer skips files whose "gatha"
content is actually modern Hindi. Run: python3 build/ingest-nikky.py
"""

import html
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = "https://raw.githubusercontent.com/nikkyjain/nikkyjain.github.io/master/jainDataBase/gatha/"
LIVE = "https://nikkyjain.github.io/jainDataBase/gatha/"

# source dir → (our granth name for matching, language label)
SOURCES = [
    ("01_द्रव्यानुयोग/01_समयसार--कुन्दकुन्दाचार्य", "समयसार", "प्राकृत"),
    ("01_द्रव्यानुयोग/02_प्रवचनसार--कुन्दकुन्दाचार्य", "प्रवचनसार", "प्राकृत"),
    ("01_द्रव्यानुयोग/05_पञ्चास्तिकाय--कुन्दकुन्दाचार्य", "पंचास्तिकाय", "प्राकृत"),
    ("01_द्रव्यानुयोग/06_द्रव्यसंग्रह--नेमिचंद्र-सिद्धांतचक्रवर्ती", "द्रव्यसंग्रह", "प्राकृत"),
    ("01_द्रव्यानुयोग/07_समाधितन्त्र--आचार्य‌-पूज्यपाद", "समाधितन्त्र", "संस्कृतम्"),
    ("01_द्रव्यानुयोग/09_इष्टोपदेश--आचार्य‌-पूज्यपाद", "इष्टोपदेश", "संस्कृतम्"),
    ("01_द्रव्यानुयोग/13_तत्त्वार्थसूत्र--आचार्य-उमास्वामी", "तत्त्वार्थसूत्र", "संस्कृतम्"),
    ("02_चरणानुयोग/01_नियमसार--कुन्दकुंदाचार्य", "नियमसार", "प्राकृत"),
    ("02_चरणानुयोग/02_श्रीअष्टपाहुड--कुन्दकुंदाचार्य", "अष्टपाहुड", "प्राकृत"),
    ("02_चरणानुयोग/03_मूलाचार--वट्टकेराचार्य", "मूलाचार", "प्राकृत"),
    ("02_चरणानुयोग/06_बारसणुपेक्‍खा--कुन्दकुन्दाचार्य", "बारस अणुवेक्खा", "प्राकृत"),
    ("02_चरणानुयोग/09_रत्नकरण्ड-श्रावकाचार--समन्तभद्राचार्य", "रत्नकरण्ड श्रावकाचार", "संस्कृतम्"),
    ("02_चरणानुयोग/17_भगवती-आराधना--शिवाचार्य", "भगवती आराधना", "प्राकृत"),
    ("03_करणानुयोग/01_लब्धिसार--नेमिचंद्र-आचार्य", "लब्धिसार", "प्राकृत"),
    ("03_करणानुयोग/03_गोम्मटसार-जीवकांड--नेमिचंद्र-आचार्य", "गोम्मटसार जीवकाण्ड", "प्राकृत"),
    ("03_करणानुयोग/04_गोम्मटसार-कर्मकांड--नेमिचंद्र-आचार्य", "गोम्मटसार कर्मकाण्ड", "प्राकृत"),
    ("05_प्रथमानुयोग/03_उत्तरपुराण-संस्कृत--गुणभद्राचार्य", "उत्तरपुराण", "संस्कृतम्"),
    ("05_प्रथमानुयोग/04_पद्मपुराण--रविषेणाचार्य", "पद्मपुराण", "संस्कृतम्"),
    ("05_प्रथमानुयोग/05_आदिपुराण--जिनसेनाचार्य", "आदिपुराण", "संस्कृतम्"),
    ("06_न्याय/01_आप्त-मीमांसा", None, None),  # already have GRETIL edition — skip
    ("06_न्याय/02_लघीयस्त्रय--भट्टाकलंकदेव", "लघीयस्त्रय", "संस्कृतम्"),
    ("06_न्याय/03_परीक्षामुख", "परीक्षामुख", "संस्कृतम्"),
    ("06_न्याय/05_युक्त्यनुशासन--समंतभद्राचार्य", "युक्त्यनुशासन", "संस्कृतम्"),
    ("07_इतिहास/01_श्रुतावतार--इंद्रनंदी-आचार्य", "श्रुतावतार", "संस्कृतम्"),
]

HINDI_MARKERS = re.compile(r'(?:\s|^)(है|हैं|की|का|के|में|से|और|को|पर|वाला|हुआ|नहीं)(?:\s|$|।|,)')
DEVA_DIG = str.maketrans('0123456789', '०१२३४५६७८९')
FRONTMATTER_BLOCK = re.compile(r'श्रीसर्वज्ञवीतराग|बिन्दुसंयुक्तं|^!!')

# canonical verse counts (approx) — to detect partial typings honestly
EXPECTED = {
    'समयसार': 415, 'प्रवचनसार': 306, 'पंचास्तिकाय': 173, 'नियमसार': 187,
    'द्रव्यसंग्रह': 58, 'समाधितन्त्र': 105, 'इष्टोपदेश': 51, 'तत्त्वार्थसूत्र': 357,
    'अष्टपाहुड': 503, 'बारस अणुवेक्खा': 91, 'रत्नकरण्ड श्रावकाचार': 150,
    'भगवती आराधना': 2170, 'लब्धिसार': 649, 'गोम्मटसार जीवकाण्ड': 734,
    'गोम्मटसार कर्मकाण्ड': 972, 'मूलाचार': 1252, 'लघीयस्त्रय': 78,
    'परीक्षामुख': 208, 'युक्त्यनुशासन': 64,
    'उत्तरपुराण': 8000, 'पद्मपुराण': 9000,  # giant texts — source typing is a stub so far
}


def clean(fragment: str) -> str:
    fragment = fragment.replace('﻿', '')
    fragment = re.sub(r'<br\s*/?>', '\n', fragment, flags=re.I)
    fragment = re.sub(r'<[^>]+>', '', fragment)
    fragment = html.unescape(fragment)
    lines = [re.sub(r'[ \t]+', ' ', ln).strip() for ln in fragment.split('\n')]
    return '\n'.join(ln for ln in lines if ln)


def hindi_ratio(gathas):
    sample = ' '.join(gathas[:40])
    words = max(1, len(sample.split()))
    return len(HINDI_MARKERS.findall(sample)) / words


def main():
    granths = json.loads((ROOT / 'dist' / 'data' / 'granths-90.json').read_text(encoding='utf-8'))
    byname = {g['name']: g for g in granths}
    report, done = [], 0

    for dirpath, ourname, langlabel in SOURCES:
        if ourname is None:
            continue
        g = byname.get(ourname)
        if not g:
            report.append(f'✗ {dirpath} — "{ourname}" not found in granths-90')
            continue
        out = ROOT / 'shastra' / f"{g['slug']}.md"
        try:
            if len(sys.argv) > 1:  # local clone base (…/jainDataBase/gatha)
                src = (Path(sys.argv[1]) / dirpath / 'html' / 'index.html').read_text(encoding='utf-8')
            else:
                url = RAW + urllib.parse.quote(dirpath) + '/html/index.html'
                src = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'shrutdhara-ingest'}), timeout=60).read().decode('utf-8')
        except Exception as e:
            report.append(f'✗ {dirpath} — read failed: {e}')
            continue

        # walk document order: adhikaar headings + gatha blocks
        parts = []
        for m in re.finditer(r'<div class=adhikaar><h1>(.*?)</h1>|<div class=gatha>(.*?)</div>', src, re.S):
            if m.group(1) is not None:
                h = clean(m.group(1)).replace('\n', ' ').strip()
                if h:
                    parts.append(('h', h))
            else:
                v = clean(m.group(2))
                if v:
                    parts.append(('v', v))
        parts = [(k, v) for k, v in parts if not (k == 'v' and FRONTMATTER_BLOCK.search(v))]
        gathas = [p[1] for p in parts if p[0] == 'v']
        if len(gathas) < 5:
            report.append(f'✗ {dirpath} — only {len(gathas)} gatha blocks; structure differs, skipped')
            continue
        hr = hindi_ratio(gathas)
        if hr > 0.05:
            report.append(f'✗ {dirpath} — gatha text looks like Hindi translation (marker ratio {hr:.2f}), skipped')
            continue
        exp = EXPECTED.get(ourname)
        coverage = (len(gathas) / exp) if exp else None
        partial = False
        if coverage is not None and coverage < 0.4:
            if out.exists():
                out.unlink()
            report.append(f'✗ {dirpath} — stub: {len(gathas)}/{exp} verses ({coverage:.0%}), skipped')
            continue
        if coverage is not None and coverage < 0.85:
            partial = True

        body, last_h = [], None
        for kind, val in parts:
            if kind == 'h':
                if val != last_h:
                    body.append(f'## {val}')
                    last_h = val
            else:
                body.append(val)
        live = LIVE + urllib.parse.quote(dirpath) + '/html/index.html'
        partial_line = f"\npartial: true\nnote: \"स्रोत-टंकण अभी आंशिक है — लगभग {len(gathas)}/{exp} पद्य उपलब्ध; शेष जुड़ते ही यह पृष्ठ स्वतः पूर्ण होगा\"" if partial else ""
        md = f"""---
title: {g['name']}
slug: {g['slug']}
language: {langlabel}
verses: {len(gathas)}{partial_line}
source: "मूल गाथाएँ जैन गाथा डेटाबेस (टंकण-श्रेय: Nikky Jain, nikkyjain.github.io) से — केवल प्राचीन मूल पाठ लिया गया है; अनुवाद/अन्वयार्थ सम्मिलित नहीं"
sourceUrl: {live}
license: "मूल पाठ प्राचीन एवं public domain; टंकण-श्रेय यथोक्त"
---

""" + '\n\n'.join(body) + '\n'
        out.write_text(md, encoding='utf-8')
        done += 1
        tag = f' [आंशिक {coverage:.0%}]' if partial else ''
        report.append(f'✓ {g["slug"]}.md — {len(gathas)} verses{tag} (hindi-ratio {hr:.3f})')

    print('\n'.join(report))
    print(f'\ningested: {done}')


if __name__ == '__main__':
    sys.exit(main())
