# SmartEdge AI — "What happens when a hotel misses a call?"

A 24-second, 1080 × 1920, 30 fps Instagram Reel built entirely in code
(HTML / CSS / JS), rendered frame-exact to H.264 through headless Chromium.

| Output | Path |
| --- | --- |
| Final video | `out/smartedge-reel.mp4` |
| Single-file preview player | `out/smartedge-reel-preview.html` |
| **Final video with sound** | `out/smartedge-reel-sound.mp4` |
| Soundtrack only (24-bit WAV, −14 LUFS) | `out/soundtrack.wav` |
| SFX cue sheet (seconds + frame numbers) | `out/audio-cues.json` |

## Preview

Open `index.html` in Chrome. Space plays or pauses, the arrow keys step one
frame, Shift+arrow steps one second, and the chips jump to each scene.
`out/smartedge-reel-preview.html` is the same player with every asset inlined.

## Render

Requirements: Node 18+, `ffmpeg` on PATH, and Playwright's Chromium
(`npm i -D playwright`; a global install also works).

```bash
node render/render.mjs                         # full video → out/smartedge-reel.mp4
node render/render.mjs --stills 1.8,4.5,17     # PNG stills → out/stills/
node render/render.mjs --from 6 --to 9         # partial render
node render/render.mjs --scale 0.5 --stills 3  # fast half-res drafts
node render/build-standalone.mjs               # rebuild the single-file preview
```

A full render takes about 6 minutes on a small cloud VM.

## Sound

`audio/` holds the music and effects, and `audio/mix.json` places them.
Each cue sets when it plays (video seconds), where in the file it starts,
its length and its gain in dB. There are optional fades, `rate` (tape-style
speed-up), `reverse`, `lowpass`, and `auto` volume points. After changing
timing or visuals, re-render the video first, then run:

```bash
python3 render/mix_audio.py      # → out/soundtrack.wav + out/smartedge-reel-sound.mp4
```

The mix is loudness-normalised in two passes to −14 LUFS with −1 dB true
peak. The music (117 BPM) plays its calm intro under the missed call. The
tape stop and a reversed, sped-up copy of that intro make the rewind. The
freeze is silent. The track resumes exactly on its drop (8.06 s into the
file) as the AI answers at 9.53 s.

## What to edit

| Change | Where |
| --- | --- |
| Any on-screen text | `config.js` → `copy` |
| Brand colours | `config.js` → `colors` (these become CSS variables) |
| Fonts | `config.js` → `fonts`, and the `@font-face` blocks in `styles.css` |
| Logo | Replace `assets/brand/mark.png` and `assets/brand/wordmark.png` (transparent PNGs) |
| Overall pace | `config.js` → `speed` (0.8 = 25% slower than the design timings) and `duration` |
| Scene start/end | `config.js` → `scenes` and `rewind` |
| Beats inside a scene | The top of each file's `update()` in `scenes/` |
| Layout and type sizes | `styles.css`, one section per scene |
| Sound mix (timing, levels) | `audio/mix.json`, then `python3 render/mix_audio.py` |

Each scene is a separate file in `scenes/` with a `build()` (creates DOM) and
an `update(ctx)` (sets every animated property from the time `ctx.T`).
Nothing depends on the previous frame, so any frame renders identically in
any order. The shared phone lives in `engine/components.js`. Scenes 1 and 3
both drive it through `ctx.phone.s`.

**Timing units.** Every time in `config.js` and `scenes/` is design time, as
if `speed` were 1.0. The engine multiplies real time by `speed`. At 0.8,
design time 10 s lands at 12.5 s in the video. `out/audio-cues.json` is
written in real video time.

**How the rewind works.** Scenes 1 and 2 read `ctx.S`, a "story clock". It
equals design time until 6.0 s, runs backwards to 1.0 s by 6.95 s, then holds.
The rewind is scenes 1 and 2 actually playing in reverse, not a separate
animation.

## Timeline (video seconds at speed 0.8)

| Time | Scene | Beat |
| --- | --- | --- |
| 0.0–3.25 | Hook | Phone rings, headline, MISSED CALL |
| 2.75–7.5 | Lost booking | €247 → €0 LOST, booking-value chart, 3 / 7 / 12 losses |
| 7.5–9.06 | Rewind | Everything plays back, then freezes on the ringing phone |
| 9.06–11.75 | AI answers | AI RECEPTIONIST · ANSWERING…, two-line conversation |
| 11.5–19.0 | Automation | Five pipeline steps, response time, €247 captured |
| 18.3–24.0 | Result | Reservation confirmed, logo, CTA, aismartedge.com |

## Brand notes

- The palette, fonts (Bricolage Grotesque, Manrope, JetBrains Mono) and logo
  all come from the SmartEdge brand guide. The logo PNGs were extracted from
  that guide and keyed from black to transparent.
- Orange is used only for key numbers, the logo, active states and the
  accented headline words. Success and alert tints are used only for state.
- Keep text between roughly y = 190 and y = 1560. Instagram's UI covers the
  top of the frame and the bottom ~350 px.

Fonts are SIL OFL 1.1 (see `assets/fonts/OFL-LICENSE.txt`). The phone icons
are Material Symbols paths (Apache 2.0).
