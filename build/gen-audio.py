#!/usr/bin/env python3
"""Generate recitation audio for a granth's verses with AI4Bharat Indic Parler-TTS.

Runs in CI (see .github/workflows/gen-audio.yml). For each verse block of
shastra/<slug>.md, synthesizes audio/<slug>/<n>.mp3. The reader plays these
automatically (browser-TTS remains the fallback where files are absent).

Usage: python3 build/gen-audio.py <slug> [start] [end]
"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DESCRIPTION = (
    "An elderly male scholar recites a Sanskrit shloka in a very calm, slow, "
    "clear and devotional tone, with deliberate pauses between the padas. "
    "Very high quality studio recording with no background noise."
)


def verse_blocks(slug: str):
    raw = (ROOT / 'shastra' / f'{slug}.md').read_text(encoding='utf-8')
    fm = re.match(r'^---\n[\s\S]*?\n---\n?', raw)
    body = raw[fm.end():] if fm else raw
    out = []
    for b in body.split('\n\n'):
        b = b.strip()
        if not b or b.startswith('## ') or b.startswith('@'):
            continue
        out.append(b)
    return out


def speech_text(block: str) -> str:
    t = re.sub(r'॥[^॥]*॥', '', block)
    t = t.replace('।', ', ').replace('/', ' ').replace('\n', ', ')
    return re.sub(r'\s+', ' ', t).strip()


def main():
    slug = sys.argv[1]
    blocks = verse_blocks(slug)
    start = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    end = int(sys.argv[3]) if len(sys.argv) > 3 else len(blocks)
    outdir = ROOT / 'audio' / slug
    outdir.mkdir(parents=True, exist_ok=True)
    print(f'{slug}: {len(blocks)} verses; generating {start}..{end}')

    import torch
    import soundfile as sf
    from parler_tts import ParlerTTSForConditionalGeneration
    from transformers import AutoTokenizer

    repo = 'ai4bharat/indic-parler-tts'
    model = ParlerTTSForConditionalGeneration.from_pretrained(repo)
    model.eval()
    tok = AutoTokenizer.from_pretrained(repo)
    desc_tok = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)

    desc = desc_tok(DESCRIPTION, return_tensors='pt')
    for n in range(start, end + 1):
        mp3 = outdir / f'{n}.mp3'
        if mp3.exists():
            continue
        text = speech_text(blocks[n - 1])
        prompt = tok(text, return_tensors='pt')
        with torch.no_grad():
            gen = model.generate(
                input_ids=desc.input_ids, attention_mask=desc.attention_mask,
                prompt_input_ids=prompt.input_ids, prompt_attention_mask=prompt.attention_mask,
            )
        wav = gen.cpu().numpy().squeeze()
        tmp = outdir / f'{n}.wav'
        sf.write(tmp, wav, model.config.sampling_rate)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(tmp),
                        '-ac', '1', '-b:a', '48k', str(mp3)], check=True)
        tmp.unlink()
        print(f'  {n}/{end} ok ({mp3.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
