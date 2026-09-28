"""Renders the AMERICAT 9:16 trailer frames and muxes soundtrack.wav. Usage: python3 video.py [--no-captions]"""
import sys, subprocess, numpy as np, imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from crops import CROPS, rect, IMG

W, H, FPS = 1080, 1920, 30
T = {"cut2": 1.8, "q": 1.95, "q_end": 4.65, "meow": 5.55, "cut3": 6.35,
     "cut4": 8.0, "black": 10.2, "title": 10.5, "ticker": 11.4, "end": 12.6}
FLASHES = [8.25, 8.55, 8.7, 9.05, 9.4, 9.5, 9.85, 10.0]
CAPTIONS = "--no-captions" not in sys.argv
OUT = "americat_9x16.mp4" if CAPTIONS else "americat_9x16_clean.mp4"
FD = "../fonts/pkg_fontsource-"
cinzel = lambda w, s: ImageFont.truetype(f"{FD}cinzel/files/cinzel-latin-{w}-normal.woff", s)
inter = lambda w, s: ImageFont.truetype(f"{FD}inter/files/inter-latin-{w}-normal.woff", s)
rng = np.random.default_rng(3)

src = {i: Image.open(f"{IMG}{i}.webp").convert("RGB") for i in CROPS}
def ease(u): u = min(max(u, 0), 1); return u * u * (3 - 2 * u)
def ease_in(u): u = min(max(u, 0), 1); return u ** 2.2
def lerp(a, b, u): return tuple(x + (y - x) * u for x, y in zip(a, b))

def frame_of(i, key, shake=(0, 0)):
    cx, cy, h = key
    r = rect(cx + shake[0], cy + shake[1], h, src[i].size)
    return src[i].resize((W, H), Image.LANCZOS, box=r)

def shake(t, t0, amp=7, decay=9):
    a = amp * np.exp(-(t - t0) * decay)
    return (a * np.sin(t * 91), a * np.cos(t * 77)) if t >= t0 else (0, 0)

# ---- grading / finishing ------------------------------------------------------
yy, xx = np.mgrid[0:H, 0:W]
vign = 1 - 0.38 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.4
vign = np.clip(vign, 0.45, 1)[..., None].astype(np.float32)
def finish(img, exposure=1.0):
    a = np.asarray(img, np.float32) / 255
    a = a * exposure
    a = a / (1 + 0.18 * a)  * 1.18                                # soft highlight roll-off
    a = 0.5 + (a - 0.5) * 1.08                                    # a touch more contrast
    a[..., 2] = a[..., 2] * 0.97 + 0.02 * (1 - a[..., 2])         # warm the mids, lift blacks cool-ish
    a *= vign
    g = rng.standard_normal((H // 2, W // 2)).astype(np.float32)  # 2px film grain, mono
    a += np.repeat(np.repeat(g, 2, 0), 2, 1)[..., None] * 0.022
    return np.clip(a * 255, 0, 255).astype(np.uint8)

def sharpen(img): return img.filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))

# ---- captions / title text ----------------------------------------------------
def draw_caption(img, text, alpha):
    if not CAPTIONS or alpha <= 0: return img
    f = inter(600, 50); d = ImageDraw.Draw(img)
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        test = (cur + " " + w_).strip()
        if d.textlength(test, font=f) > 860 and cur: lines.append(cur); cur = w_
        else: cur = test
    lines.append(cur)
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    y = 1470
    for ln in lines:
        tw = ld.textlength(ln, font=f); x = (W - tw) / 2
        ld.rounded_rectangle((x - 22, y - 8, x + tw + 22, y + 66), 10, fill=(0, 0, 0, int(150 * alpha)))
        ld.text((x, y), ln, font=f, fill=(255, 255, 255, int(255 * alpha)))
        y += 82
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")

def spaced(d, xy_center_y, text, font, tracking, fill):
    widths = [d.textlength(c, font=font) for c in text]
    total = sum(widths) + tracking * (len(text) - 1); x = (W - total) / 2
    for c, cw in zip(text, widths):
        d.text((x, xy_center_y), c, font=font, fill=fill, anchor="lm"); x += cw + tracking

def title_frame(t):
    img = Image.new("RGB", (W, H), (0, 0, 0))
    if t < T["title"]: return img
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    a = ease((t - T["title"]) / 0.35)
    f1 = cinzel(700, 74)
    spaced(d, 800, "AMERICA HAS A", f1, 6, (255, 255, 255, int(255 * a)))
    spaced(d, 895, "NEW PRESIDENT.", f1, 6, (255, 255, 255, int(255 * a)))
    if t >= T["ticker"]:
        k = t - T["ticker"]
        f2 = cinzel(900, int(126 * (1 + 0.06 * np.exp(-k * 8))))   # slams in slightly large, settles
        d.line((300, 985, 780, 985), fill=(214, 178, 94, 255), width=3)
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        spaced(ImageDraw.Draw(glow), 1110, "$AMERICAT", f2, 5, (255, 214, 140, 200))
        layer = Image.alpha_composite(layer, glow.filter(ImageFilter.GaussianBlur(18)))
        d = ImageDraw.Draw(layer)
        spaced(d, 1110, "$AMERICAT", f2, 5, (255, 255, 255, 255))
    img = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")
    exp = 1.0 + (0.8 * np.exp(-(t - T["ticker"]) * 14) if t >= T["ticker"] else 0)
    return Image.fromarray(np.clip(np.asarray(img, np.float32) * exp, 0, 255).astype(np.uint8))

def flash_layer(img, t):
    """Photographer flashes: a hot bloom from the left/right edge for ~2 frames."""
    out = np.asarray(img, np.float32)
    for k, s in enumerate(FLASHES):
        if 0 <= t - s < 0.07:
            side = 80 if k % 2 == 0 else W - 80; cy = 1300 + 300 * ((k * 37) % 5) / 5
            m = np.exp(-(((xx - side) / 520) ** 2 + ((yy - cy) / 700) ** 2))[..., None]
            out = out * 1.12 + m * 255 * 0.9 * (1 - (t - s) / 0.07)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

# ---- per-frame composition -------------------------------------------------------
def render(t):
    exposure = 1.0
    for c in (0.0, T["cut2"], T["cut3"], T["cut4"]):            # 4-frame exposure pop on each hard cut
        if 0 <= t - c < 4 / FPS: exposure = 1 + 0.35 * (1 - (t - c) * FPS / 4)
    if t < T["cut2"]:                                            # SHOT 1 — eagle, fast push
        u = ease_in(t / T["cut2"]); k = lerp(*CROPS[1], u)
        img = frame_of(1, k, shake(t, 0.0, 9, 7))
    elif t < T["cut3"]:                                          # SHOT 2 — Oval Office
        if t < T["meow"] - 0.05:
            k = lerp(CROPS[2][0], CROPS[2][1], ease((t - T["cut2"]) / (T["meow"] - T["cut2"])))
        else:                                                    # deadpan punch-in on "Meow."
            base = CROPS[2][2]; k = (base[0], base[1], base[2] * (1 - 0.03 * (t - T["meow"])))
        img = frame_of(2, k)
        if t >= T["q"]:
            img = draw_caption(img, "“Mr. President, what is your plan for America?”",
                               ease((t - T["q"]) / 0.15) * (1 - ease((t - T["q_end"] - 0.35) / 0.15)))
        if t >= T["meow"] + 0.05:
            img = draw_caption(img, "“Meow.”", ease((t - T["meow"] - 0.05) / 0.08))
    elif t < T["cut4"]:                                          # SHOT 3 — billionaire, rising orbit
        u = ease((t - T["cut3"]) / (T["cut4"] - T["cut3"]))
        img = frame_of(3, lerp(*CROPS[3], u), shake(t, T["cut3"], 10, 8))
    elif t < T["black"]:                                         # SHOT 4 — arrival, slow push
        u = ease((t - T["cut4"]) / (T["black"] - T["cut4"]))
        img = frame_of(4, lerp(*CROPS[4], u), shake(t, T["cut4"], 6, 9))
        img = flash_layer(img, t)
    else:
        return np.asarray(title_frame(t))                        # FINAL — black + type, no grade on pure black
    return finish(sharpen(img), exposure)

if __name__ == "__main__":
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    n = int(round(T["end"] * FPS))
    p = subprocess.Popen([ff, "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", "soundtrack.wav",
        "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", OUT],
        stdin=subprocess.PIPE)
    for f in range(n):
        p.stdin.write(render(f / FPS).tobytes())
        if f % 60 == 0: print(f"{f}/{n}", flush=True)
    p.stdin.close(); p.wait(); print("wrote", OUT)
