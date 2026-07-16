#!/usr/bin/env python3
"""Generate recitation audio for a granth's verses with AI4Bharat Indic Parler-TTS.

Runs in CI (see .github/workflows/gen-audio.yml). For each verse block of
shastra/<slug>.md, synthesizes audio/<slug>/<n>.mp3. The reader plays these
automatically (browser-TTS remains the fallback where files are absent).

Engines:
  mms-hin  — facebook/mms-tts-hin (open, no token; Hindi voice)
  parler   — ai4bharat/indic-parler-tts (gated: needs HF_TOKEN env + accepted
             terms at the model page; Sanskrit-aware, promptable prosody)

Usage: ENGINE=mms-hin python3 build/gen-audio.py <slug> [start] [end]
"""

import os

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
    from transformers import AutoTokenizer

    engine = os.environ.get('ENGINE', 'mms-hin')
    token = os.environ.get('HF_TOKEN') or None
    if engine == 'parler':
        from parler_tts import ParlerTTSForConditionalGeneration
        repo = 'ai4bharat/indic-parler-tts'
        model = ParlerTTSForConditionalGeneration.from_pretrained(repo, token=token)
        model.eval()
        tok = AutoTokenizer.from_pretrained(repo, token=token)
        desc_tok = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path, token=token)
        desc = desc_tok(DESCRIPTION, return_tensors='pt')
        def synth(text):
            prompt = tok(text, return_tensors='pt')
            with torch.no_grad():
                gen = model.generate(
                    input_ids=desc.input_ids, attention_mask=desc.attention_mask,
                    prompt_input_ids=prompt.input_ids, prompt_attention_mask=prompt.attention_mask)
            return gen.cpu().numpy().squeeze(), model.config.sampling_rate
    else:
        from transformers import VitsModel
        repo = 'facebook/mms-tts-hin'
        model = VitsModel.from_pretrained(repo)
        model.eval()
        tok = AutoTokenizer.from_pretrained(repo)
        model.speaking_rate = 0.72          # recitation pace
        def synth(text):
            inputs = tok(text, return_tensors='pt')
            with torch.no_grad():
                out = model(**inputs).waveform
            return out.cpu().numpy().squeeze(), model.config.sampling_rate

    print(f'engine: {engine} ({repo})')
    for n in range(start, end + 1):
        mp3 = outdir / f'{n}.mp3'
        if mp3.exists():
            continue
        text = speech_text(blocks[n - 1])
        wav, sr = synth(text)
        tmp = outdir / f'{n}.wav'
        sf.write(tmp, wav, sr)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(tmp),
                        '-ac', '1', '-b:a', '48k', str(mp3)], check=True)
        tmp.unlink()
        print(f'  {n}/{end} ok ({mp3.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
