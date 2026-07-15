#!/usr/bin/env python3
"""IAST → Devanagari converter + GRETIL verse-text ingester.
Usage:
  python3 build/iast2deva.py convert "devāgamanabhoyāna..."   # test a line
  python3 build/iast2deva.py ingest-gretil <in.txt> <out.md> <title> <slug>
"""

import re
import sys

VOWELS = {
    'a': ('अ', ''), 'ā': ('आ', 'ा'), 'i': ('इ', 'ि'), 'ī': ('ई', 'ी'),
    'u': ('उ', 'ु'), 'ū': ('ऊ', 'ू'), 'ṛ': ('ऋ', 'ृ'), 'ṝ': ('ॠ', 'ॄ'),
    'ḷ': ('ऌ', 'ॢ'), 'e': ('ए', 'े'), 'ai': ('ऐ', 'ै'), 'o': ('ओ', 'ो'), 'au': ('औ', 'ौ'),
}
CONS = {
    'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ṅ': 'ङ',
    'c': 'च', 'ch': 'छ', 'j': 'ज', 'jh': 'झ', 'ñ': 'ञ',
    'ṭ': 'ट', 'ṭh': 'ठ', 'ḍ': 'ड', 'ḍh': 'ढ', 'ṇ': 'ण',
    't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
    'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
    'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व',
    'ś': 'श', 'ṣ': 'ष', 's': 'स', 'h': 'ह', 'ḻ': 'ळ',
}
MARKS = {'ṃ': 'ं', 'ṁ': 'ँ', 'ḥ': 'ः'}
VIRAMA = '्'
TOKENS = sorted(list(VOWELS) + list(CONS) + list(MARKS), key=len, reverse=True)


def iast_to_deva(s: str) -> str:
    s = s.replace("'", 'ऽ').replace('|', '।')
    out = []
    i = 0
    after_cons = False
    while i < len(s):
        tok = None
        for t in TOKENS:
            if s.startswith(t, i):
                # 'h' after a stop letter is already consumed by kh/gh/…; lone vowels/cons matched longest-first
                tok = t
                break
        if tok is None:
            if after_cons:
                out.append(VIRAMA)
                after_cons = False
            out.append(s[i])
            i += 1
            continue
        if tok in CONS:
            if after_cons:
                out.append(VIRAMA)
            out.append(CONS[tok])
            after_cons = True
        elif tok in VOWELS:
            if after_cons:
                out.append(VOWELS[tok][1])  # matra ('' for a)
                after_cons = False
            else:
                out.append(VOWELS[tok][0])
        else:  # anusvara/visarga etc.
            if after_cons:
                out.append(VIRAMA)  # cons + ṃ means implicit 'a'? no — cons then mark ⇒ halant cons + mark is wrong
                out.pop()           # undo: marks attach to the syllable, inherent 'a' stays
                after_cons = False
            out.append(MARKS[tok])
        i += len(tok)
    if after_cons:
        out.append(VIRAMA)
    return ''.join(out)


DEVA_DIG = str.maketrans('0123456789', '०१२३४५६७८९')


def ingest_gretil(inp, outp, title, slug):
    raw = open(inp, encoding='utf-8').read()
    # body = after the header block; verses end with // xxx_N //
    body = raw.split('# Text', 1)[-1]
    verses = []
    for block in re.split(r'\n\s*\n', body):
        block = block.strip()
        m = re.search(r'//\s*\w+_(\d+)\s*//\s*$', block)
        if not m:
            continue
        n = m.group(1)
        text = block[:m.start()].strip()
        lines = [ln.strip().rstrip('/').strip() for ln in text.split('/') if ln.strip()]
        deva_lines = [iast_to_deva(ln) for ln in lines]
        deva_lines[-1] += f' ॥{n.translate(DEVA_DIG)}॥'
        if len(deva_lines) > 1:
            deva_lines[0] += ' ।'
        verses.append('\n'.join(deva_lines))
    md = f"""---
title: {title}
slug: {slug}
language: संस्कृतम्
verses: {len(verses)}
source: "GRETIL (input: Diwakar Acharya) — आधार-संस्करण: गजाधरलाल जैन सं., जैन सिद्धान्त प्रकाशिनी संस्था, बनारस, 1914"
sourceUrl: https://gretil.sub.uni-goettingen.de/gretil/corpustei/transformations/plaintext/sa_samantabhadra-AptamImAMsA.txt
license: CC BY-NC-SA 4.0
---

""" + '\n\n'.join(verses) + '\n'
    open(outp, 'w', encoding='utf-8').write(md)
    print(f'{outp}: {len(verses)} verses')


if __name__ == '__main__':
    if sys.argv[1] == 'convert':
        print(iast_to_deva(sys.argv[2]))
    elif sys.argv[1] == 'ingest-gretil':
        ingest_gretil(*sys.argv[2:6])
