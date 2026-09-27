#!/usr/bin/env python3
"""Mix the soundtrack from audio/mix.json and mux it onto the rendered video.

    python3 render/mix_audio.py            -> out/soundtrack.wav
                                              out/smartedge-reel-sound.mp4
    python3 render/mix_audio.py --no-mux   -> soundtrack only

Two-pass EBU R128 loudness normalisation to the target in mix.json
(Instagram plays back around -14 LUFS). Requires ffmpeg on PATH.
"""
import json, subprocess, sys, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'audio'
OUT = ROOT / 'out'
SR = 48000

mix = json.loads((AUDIO / 'mix.json').read_text())
cues = mix['cues']
DUR = mix['duration']


def auto_expr(points, gain):
    """Piecewise-linear dB envelope -> ffmpeg volume expression (linear)."""
    if not points:
        return f"{10 ** (gain / 20):.6f}"
    expr = f"{points[-1][1]}"
    for (t0, d0), (t1, d1) in reversed(list(zip(points, points[1:]))):
        seg = f"({d0}+({d1}-({d0}))*(t-{t0})/({t1}-{t0}))" if t1 > t0 else f"{d1}"
        expr = f"if(lt(t,{t1}),{seg},{expr})"
    expr = f"if(lt(t,{points[0][0]}),{points[0][1]},{expr})"
    return f"'pow(10,(({expr})+({gain}))/20)'"


inputs, chains, labels = [], [], []
for i, c in enumerate(cues):
    inputs += ['-i', str(AUDIO / c['file'])]
    rate = c.get('rate', 1.0)
    src = c['dur'] * rate
    f = [f"aresample={SR}", "aformat=sample_fmts=fltp:channel_layouts=stereo",
         f"atrim=start={c.get('from', 0)}:duration={src:.4f}", "asetpts=PTS-STARTPTS"]
    if c.get('reverse'):
        f.append('areverse')
    if rate != 1.0:
        f += [f"asetrate={SR * rate:.2f}", f"aresample={SR}"]
    if c.get('lowpass'):
        f.append(f"lowpass=f={c['lowpass']}")
    if c.get('fadeIn'):
        f.append(f"afade=t=in:st=0:d={c['fadeIn']}")
    if c.get('fadeOut'):
        f.append(f"afade=t=out:st={max(0, c['dur'] - c['fadeOut']):.4f}:d={c['fadeOut']}")
    f.append(f"volume={auto_expr(c.get('auto'), c.get('gain', 0))}:eval=frame")
    ms = int(round(c['at'] * 1000))
    f.append(f"adelay={ms}|{ms}")
    chains.append(f"[{i}:a]" + ','.join(f) + f"[a{i}]")
    labels.append(f"[a{i}]")

graph = ';'.join(chains) + ';' + ''.join(labels) + \
    f"amix=inputs={len(cues)}:normalize=0:duration=longest,atrim=0:{DUR},apad=whole_dur={DUR}[mix]"

OUT.mkdir(exist_ok=True)
raw = OUT / 'soundtrack-raw.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', graph, '-map', '[mix]',
                '-ar', str(SR), '-c:a', 'pcm_s24le', str(raw)], check=True)

L = mix['loudness']
meas = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(raw), '-af',
                       f"loudnorm=I={L['lufs']}:TP={L['truePeak']}:LRA=11:print_format=json", '-f', 'null', '-'],
                      capture_output=True, text=True).stderr
m = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', meas, re.S).group(0))
final = OUT / 'soundtrack.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af',
                f"loudnorm=I={L['lufs']}:TP={L['truePeak']}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
                f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true",
                '-ar', str(SR), '-c:a', 'pcm_s24le', str(final)], check=True)
raw.unlink()
print(f"soundtrack.wav  (input {m['input_i']} LUFS -> target {L['lufs']} LUFS, TP {L['truePeak']} dB)")

if '--no-mux' not in sys.argv:
    out = OUT / 'smartedge-reel-sound.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(OUT / 'smartedge-reel.mp4'), '-i', str(final),
                    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', str(SR),
                    '-movflags', '+faststart', '-shortest', str(out)], check=True)
    print(f"{out.relative_to(ROOT)}")
