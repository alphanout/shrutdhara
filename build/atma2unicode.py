#!/usr/bin/env python3
"""AtmaDharma legacy font → Unicode Devanagari converter.

The AtmaDharma.com PDFs (PageMaker era) use a phonetic glyph encoding.
Rules engine: consonants carry inherent अ; matras follow their consonant
EXCEPT ि (typed before its cluster) ; reph (र्) is typed AFTER its bearer;
composite glyphs bundle reph+matra (È=र्‑ो, Ã=र्‑ों, Å=र्‑ं, ±=र्‑ी, ¯=र्‑ि pre).
Derived and verified against the मोक्षमार्गप्रकाशक PDF page images.

Usage:
  python3 build/atma2unicode.py convert "raw string"
  python3 build/atma2unicode.py file <in.txt> <out.txt>
"""

import re
import sys

# units that output full consonants / conjuncts (inherent अ unless matra follows)
CONS = {
    'k': 'क', 'q': 'ख', 'g': 'ग', 'F': 'घ',
    'c': 'च', 'K': 'छ', 'j': 'ज', 'J': 'झ',
    '!': 'ट', '@': 'ठ', 'D': 'ड', '#': 'ढ',
    't': 'त', '=': 'थ', 'd': 'द', '\\': 'ध', 'n': 'न',
    'p': 'प', 'f': 'फ', 'b': 'ब', 'w': 'भ', 'm': 'म',
    'y': 'य', 'Y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व',
    'x': 'श', 'Ø': 'ष', 's': 'स', 'h': 'ह',
    '`': 'ण', 'Z': 'त्र', 'Ù': 'क्ष', '&': 'ज्ञ', ']': 'श्र',
    'â': 'द्ध', '¿': 'त्त', 'À': 'त्त्व', 'ä': 'द्व', 'æ': 'ह्य', 'ï': 'ह्म',
    'Í': 'द्म', 'Î': 'ट्ट', '‚': 'ट्ठ', 'þ': 'न्न', 'ü': 'श्च',
    'É': 'क्त', '›': 'क्त', 'Ê': 'क्र', 'ã': 'द्र', '>': 'द्य',
    '$': 'रू', 'Ì': 'रु',
}
ABSORB_A = {'Y'}                     # glyph stem extracted as a stray 'a'
HALF = {                              # explicit halant forms
    'G': 'ग्', 'C': 'च्', 'T': 'त्', 'N': 'न्', 'P': 'प्', 'B': 'ब्',
    'M': 'म्', 'V': 'व्', 'S': 'स्', 'L': 'ल्', 'Q': 'ख्', 'X': 'श्',
    '|': 'ध्', '+': 'थ्', 'W': 'भ्', 'ß': 'ज्',
}
# ष has half-form quirks: '*a'→ष (stem 'a' absorbed), '*'+consonant→ष्, else ष
SHA_LIKE = {'*': ('ष', 'ष्'), '~': ('ण', 'ण्'), '"': ('क्ष', 'क्ष्')}
MATRA = {'a': 'ा', 'I': 'ी', 'u': 'ु', '¡': 'ु', 'U': 'ू', 'e': 'े',
         'E': 'ै', 'o': 'ो', 'Ë': 'ृ', '<': 'ृ'}
VOWEL = {'A': 'अ', '[': 'इ', '{': 'ई', '_': 'उ', 'é': 'ऊ', '%': 'ऋ', 'O': 'ए'}
MISC = {'H': 'ं', '¥': 'ँ', '½': 'ऽ', '¸': '।', ';': '‘', "'": '’', 'Ç': 'ों',
        '³': '़', 'Ÿ': '्', '¦': '', '˜': '', '·': '·', ':': ':'}
DIGITS = str.maketrans('0123456789', '०१२३४५६७८९')
REPH_AFTER = {'R': '', 'Å': 'ं', 'È': 'ो', 'Ã': 'ों', '±': 'ी'}


def convert(s: str) -> str:
    s = s.replace('œĢ', '\x01')  # क्र two-byte glyph → sentinel
    s = s.replace('›y', '\x02y')  # क् before य (क्या/क्यों), distinct from क्त
    s = s.replace('a/', '/')      # stem-a before rakar in display fonts
    out = []                     # output units
    cluster = None               # index in out[] where current syllable's base starts
    pend_i = 0                   # pending pre-positioned ि count
    pend_reph = False            # pending र् for NEXT cluster (from ¯)
    pend_i_after = False         # ¯ also adds ि after next cluster

    def start_cluster(unit):
        nonlocal cluster, pend_i, pend_reph, pend_i_after
        cluster = len(out)
        if pend_reph:
            out.append('र्')
            pend_reph = False
        out.append(unit)

    def close_pending():
        nonlocal pend_i, pend_i_after
        if pend_i:
            out.append('ि' * pend_i)
            pend_i = 0
        if pend_i_after:
            out.append('ि')
            pend_i_after = False

    i = 0
    while i < len(s):
        ch = s[i]
        if ch == '\x01':
            start_cluster('क्र')
            close_pending()
            i += 1
            continue
        if ch == '\x02':
            start_cluster('क्')
            i += 1
            continue
        if ch == 'i':
            pend_i += 1
            i += 1
            continue
        if ch == '¯':
            pend_reph = True
            pend_i_after = True
            i += 1
            continue
        if ch == '/':            # rakar: attaches ्र to current cluster
            k = len(out)
            while k > 0 and (set(out[k - 1]) == {'ि'} or out[k - 1] in ('ा', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ृ')):
                k -= 1           # ्र attaches to the consonant, before matras/ि
            out.insert(k, '्र')
            close_pending()
            i += 1
            continue
        if ch in REPH_AFTER:     # reph typed after bearer → र् before cluster base
            if cluster is not None:
                out.insert(cluster, 'र्')
            else:
                out.append('र')
            tail = REPH_AFTER[ch]
            if tail:
                out.append(tail)
            i += 1
            continue
        if ch in SHA_LIKE:
            full, half = SHA_LIKE[ch]
            nxt = s[i + 1] if i + 1 < len(s) else ''
            if nxt == 'a':
                start_cluster(full)
                i += 1           # absorb glyph-stem 'a'
            elif nxt in CONS or nxt in HALF or nxt in SHA_LIKE or nxt == '\x01':
                start_cluster(half)
            else:
                start_cluster(full)
            close_pending()
            i += 1
            continue
        if ch in CONS:
            start_cluster(CONS[ch])
            if ch in ABSORB_A and i + 1 < len(s) and s[i + 1] == 'a':
                i += 1           # absorb glyph-stem 'a'
            close_pending()
            i += 1
            continue
        if ch in HALF:
            # half consonant joins the ongoing cluster (or starts one)
            if cluster is None or pend_i or pend_reph:
                start_cluster(HALF[ch])
            else:
                out.append(HALF[ch])
            i += 1
            continue
        if ch in MATRA:
            m = MATRA[ch]
            if ch == '<' and out and out[-1].endswith('र'):
                m = 'ु'   # श्रु composed as ]<
            out.append(m)
            i += 1
            continue
        if ch in VOWEL:
            cluster = None
            out.append(VOWEL[ch])
            i += 1
            continue
        if ch in MISC:
            out.append(MISC[ch])
            i += 1
            continue
        # passthrough (latin, digits, punctuation, whitespace)
        cluster = None if not ch.isdigit() else cluster
        if ch.isspace() or ch in '-,()?!.':
            cluster = None
        out.append(ch)
        i += 1

    t = ''.join(out)
    # vowel compositions the font builds from pieces
    t = (t.replace('अा', 'आ').replace('आे', 'ओ').replace('आै', 'औ')
          .replace('एे', 'ऐ').replace('एै', 'ऐ').replace('अो', 'ओ').replace('अौ', 'औ')
          .replace('\u093e\u0947', '\u094b').replace('\u093e\u0948', '\u094c')
          .replace('\u093e\u094b', '\u094b').replace('\u093e\u094c', '\u094c'))
    t = t.replace('द्रस्ट', 'दृष्ट').replace('संर्धभ', 'सन्दर्भ').replace('ैे', 'ै')
    t = t.translate(DIGITS)
    return t


def convert_file(inp, outp):
    raw = open(inp, encoding='utf-8').read()
    lines = []
    for ln in raw.split('\n'):
        if 'AtmaDharma.com' in ln or ln.startswith('====='):
            lines.append(ln if ln.startswith('=====') else '')
            continue
        lines.append(convert(ln))
    open(outp, 'w', encoding='utf-8').write('\n'.join(lines))
    print(f'{outp} written')


if __name__ == '__main__':
    if sys.argv[1] == 'convert':
        print(convert(sys.argv[2]))
    elif sys.argv[1] == 'file':
        convert_file(sys.argv[2], sys.argv[3])
