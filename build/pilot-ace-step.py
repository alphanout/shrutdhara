#!/usr/bin/env python3
"""One-off pilot: test ACE-Step 1.5 (hosted HF Space) on our own public-domain
shastra verse, to hear whether it can genuinely SING Sanskrit devotional-style
vocals. Not part of the site's build pipeline — throwaway probe.
"""
import re
import subprocess
from pathlib import Path

from gradio_client import Client, handle_file

ROOT = Path(__file__).resolve().parent.parent


def first_verse(slug):
    raw = (ROOT / 'shastra' / f'{slug}.md').read_text(encoding='utf-8')
    fm = re.match(r'^---\n[\s\S]*?\n---\n?', raw)
    body = raw[fm.end():] if fm else raw
    for b in body.split('\n\n'):
        b = b.strip()
        if b and not b.startswith('## ') and not b.startswith('@'):
            return re.sub(r'\s+', ' ', b)
    return ''


def main():
    verse = first_verse('aaptamimaansaa')
    print(f"Test verse (आप्तमीमांसा, public domain): {verse}\n")

    # dummy 1s silent wav for the required-but-unused Audio slots in text2music mode
    silent = "/tmp/silent.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
                    "-i", "anullsrc=r=44100:cl=mono", "-t", "1", silent], check=True)

    client = Client("ACE-Step/Ace-Step-v1.5")
    result = client.predict(
        selected_model="acestep-v15-xl-turbo",
        generation_mode="custom",
        simple_query_input="",
        simple_vocal_language="sa",
        param_4=verse,                                    # lyrics
        param_5="devotional bhajan, tanpura, harmonium, slow tempo, male vocal, chant, temple",  # tags/style
        param_6=20,                                        # duration seconds (guess)
        param_7="",
        param_8="",
        param_9="sa",
        param_10=8, param_11=7.0, param_12=True, param_13="-1",
        param_14=handle_file(silent),
        param_15=-1, param_16=2,
        param_17=handle_file(silent),
        param_18="",
        param_19=0.0, param_20=-1, param_21="", param_22=1.0,
        param_23="text2music", param_24=False, param_25=0.0, param_26=1.0,
        param_27=3.0, param_28="ode", param_29="", param_30="mp3", param_31=0.85,
        param_32=True, param_33=2.0, param_34=0, param_35=0.9,
        param_36="NO USER INPUT", param_37=True, param_38=True, param_39=True,
        param_41=False, param_42=True, param_43=False, param_44=False,
        param_45=0.5, param_46=8, param_47="vocals", param_48=[], param_49=False,
        api_name="/generation_wrapper",
    )
    print("=== RESULT ===")
    for i, item in enumerate(result):
        print(i, repr(item)[:200])


if __name__ == '__main__':
    main()
