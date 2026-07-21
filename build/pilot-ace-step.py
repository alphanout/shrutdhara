#!/usr/bin/env python3
"""One-off pilot: test ACE-Step 1.5 (hosted HF Space) on a couple of our own
public-domain shastra verses, to hear whether it can genuinely SING Hindi/
Sanskrit devotional-style vocals. Not part of the site's build pipeline —
throwaway probe, run via .github/workflows/pilot-ace-step.yml.
"""
import re
import sys
from pathlib import Path

from gradio_client import Client

ROOT = Path(__file__).resolve().parent.parent


def first_verses(slug, n=1):
    raw = (ROOT / 'shastra' / f'{slug}.md').read_text(encoding='utf-8')
    fm = re.match(r'^---\n[\s\S]*?\n---\n?', raw)
    body = raw[fm.end():] if fm else raw
    out = []
    for b in body.split('\n\n'):
        b = b.strip()
        if not b or b.startswith('## ') or b.startswith('@'):
            continue
        out.append(re.sub(r'\s+', ' ', b))
        if len(out) >= n:
            break
    return out


def main():
    client = Client("ACE-Step/Ace-Step-v1.5")
    print("=== API schema (so we know the real param names) ===")
    print(client.view_api(print_info=False, return_format='str'))

    verse = first_verses('aaptamimaansaa', 1)[0]
    print(f"\nTest verse (आप्तमीमांसा, public domain): {verse}\n")

    # Try the plain text2music entrypoint with best-guess named kwargs;
    # gradio_client raises a clear error naming the real params if these
    # are wrong, which is exactly what we want to see in the CI log.
    result = client.predict(
        format_type="Verse",
        lyrics_input=verse,
        genre_txt="devotional bhajan, tanpura, harmonium, slow tempo, male vocal, chant",
        audio_duration=20,
        api_name="/generation_wrapper",
    )
    print("RESULT:", result)


if __name__ == '__main__':
    main()
