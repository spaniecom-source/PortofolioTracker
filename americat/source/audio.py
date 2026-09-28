"""Synthesised trailer soundtrack for the AMERICAT cut. Everything is generated here except the
journalist line (Kokoro TTS). Output: soundtrack.wav, 48 kHz stereo."""
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly, fftconvolve

SR = 48000
T = {  # shared timeline (seconds) — video.py imports this
    "cut2": 1.8, "q": 1.95, "music_out": 4.7, "meow": 5.55, "cut3": 6.35,
    "cut4": 8.0, "black": 10.2, "title": 10.5, "ticker": 11.4, "end": 12.6,
}
N = int(T["end"] * SR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)

def t_(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR); sig = sig[: max(0, N - i)]
    L[i:i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 + pan))
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def saw(f, t): return 2 * ((f * t) % 1.0) - 1
def reverb(x, secs=2.0, mix=0.35):
    ir = rng.standard_normal(int(secs * SR)) * np.exp(-t_(secs) * 6.9 / secs)
    ir = lp(ir, 6000); wet = fftconvolve(x, ir)[: len(x)]
    return x * (1 - mix) + norm(wet) * np.max(np.abs(x)) * mix

# ---- building blocks -------------------------------------------------------
def sub_boom(d=2.2, f0=58, f1=26):
    t = t_(d); f = f1 + (f0 - f1) * np.exp(-t * 3)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)

def transient(d=0.25):
    t = t_(d); return hp(rng.standard_normal(len(t)), 900) * np.exp(-t * 40)

def braam(d=3.0, root=55.0):
    t = t_(d); x = np.zeros_like(t)
    for f in (root, root * 1.5, root * 2, root * 2.4):          # root, fifth, octave, minor-ish colour
        for det in (-0.35, 0, 0.4):
            x += saw(f + det, t + rng.random())
    env = np.minimum(t / 0.02, 1) * np.exp(-t * 1.1)
    cut = 180 + 2600 * np.exp(-t * 2.5)                          # filter snaps open then closes
    y = np.zeros_like(x); blk = 480
    for s in range(0, len(x), blk):
        y[s:s + blk] = lp(x[max(0, s - 4000):s + blk], float(cut[s]))[-len(x[s:s + blk]):]
    return np.tanh(2.2 * norm(y) * env)

def whoosh(d=0.4):
    t = t_(d); n = rng.standard_normal(len(t)); y = np.zeros_like(n); blk = 480
    fc = 300 * (20 ** (t / d))
    for s in range(0, len(n), blk):
        y[s:s + blk] = bp(n[max(0, s - 2000):s + blk], fc[s] * 0.7, min(fc[s] * 1.4, 20000))[-len(n[s:s + blk]):]
    return y * np.sin(np.pi * t / d) ** 2

def hit(size=1.0):
    return norm(braam(3.0) * 0.8 + np.pad(sub_boom(), (0, int(0.8 * SR)))[: int(3.0 * SR)] * 1.1
                + np.pad(transient(), (0, int(2.75 * SR)))[: int(3.0 * SR)] * 0.5) * size

def shutter():
    t = t_(0.09)
    a = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 180)
    b = np.roll(hp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 220), int(0.045 * SR))
    return a + 0.7 * b

def meow():
    """Additive cat vocal: /m-i-a-u/ formant glide over a rising-falling pitch contour."""
    d = 0.78; t = t_(d); u = t / d
    f0 = np.interp(u, [0, .12, .35, .7, 1], [470, 640, 760, 620, 430])
    f0 *= 1 + 0.018 * np.sin(2 * np.pi * 6.3 * t) + 0.006 * lp(rng.standard_normal(len(t)), 30) * 20
    F = [np.interp(u, [0, .2, .5, .8, 1], v) for v in (
        [350, 450, 950, 750, 500],        # F1
        [1900, 2300, 1650, 1200, 900],    # F2
        [3100, 3300, 3000, 2800, 2700])]  # F3
    B = (120, 180, 260)
    ph = 2 * np.pi * np.cumsum(f0) / SR
    x = np.zeros_like(t)
    for k in range(1, 40):
        fk = k * f0
        amp = sum(1 / (1 + ((fk - Fi) / Bi) ** 2) for Fi, Bi in zip(F, B)) * (1 / k ** 0.6)
        amp *= fk < 11000
        x += amp * np.sin(k * ph)
    env = np.interp(u, [0, .06, .18, .45, .8, 1], [0, .35, 1, .85, .35, 0]) ** 1.2
    breath = bp(rng.standard_normal(len(t)), 2000, 8000) * 0.04
    return reverb(norm(x * env + breath * env), 0.5, 0.12)

# ---- MUSIC BED: drone + ticking pulse, rising ------------------------------
def music(d, root=73.42, rise=True):
    t = t_(d); x = np.zeros_like(t)
    for f in (root / 2, root, root * 1.189, root * 1.498):       # D minor
        for det in (-0.25, 0.3): x += saw(f + det, t + rng.random())
    x = lp(x, 900); x = norm(x) * (0.5 + 0.5 * (t / d if rise else 1))
    tick = np.zeros_like(t); step = 60 / 140 / 2
    for i, s in enumerate(np.arange(0, d, step)):
        c = hp(rng.standard_normal(int(0.03 * SR)), 3000) * np.exp(-t_(0.03) * 150) * (1 if i % 2 == 0 else 0.55)
        j = int(s * SR); tick[j:j + len(c)] += c[: len(tick) - j]
    riser = hp(rng.standard_normal(len(t)), 3000) * (t / d) ** 3 * 0.25
    return norm(x * 0.8 + tick * 0.35 + riser)

# Shot 1 — opening impact + rising bed
add(hit(), 0.0, 0.9)
add(music(T["music_out"]), 0.0, 0.32)
add(whoosh(0.35), T["cut2"] - 0.3, 0.25)
add(hit(0.6), T["cut2"], 0.55)

# Shot 2 — journalist, music out, dead air, "Meow."
q, qsr = sf.read("../q2_am_michael.wav")
q = q[np.argmax(np.abs(q) > 0.01):]; q = q[: len(q) - np.argmax(np.abs(q[::-1]) > 0.01)]
q = resample_poly(q, SR, qsr)
q = reverb(bp(q, 150, 6500), 0.35, 0.08)                         # broadcast mic in a real room
add(norm(q), T["q"], 0.55, pan=-0.05)
room = lp(rng.standard_normal(int((T["cut3"] - T["music_out"]) * SR)), 400) * 0.02
add(room, T["music_out"], 1.0)
for s in np.arange(T["music_out"] + 0.1, T["cut3"], 0.5):       # the clock on the wall
    add(hp(rng.standard_normal(int(0.02 * SR)), 2500) * np.exp(-t_(0.02) * 200), s, 0.08, pan=0.4)
add(meow(), T["meow"], 0.6)

# Shot 3 — billionaire: biggest hit, bed returns, coin shimmer
add(hit(1.0), T["cut3"], 1.0)
add(music(T["black"] - T["cut3"], root=73.42 * 1.122), T["cut3"], 0.4)
for k in range(10):
    f = rng.uniform(2500, 6000); tt = t_(0.5)
    add(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9), T["cut3"] + 0.1 + k * 0.13, 0.05, pan=rng.uniform(-.8, .8))

# Shot 4 — arrival: hit, crowd, camera shutters
add(whoosh(0.35), T["cut4"] - 0.3, 0.25)
add(hit(0.8), T["cut4"], 0.8)
crowd = bp(rng.standard_normal(int((T["black"] - T["cut4"]) * SR)), 300, 2500) * (1 + 0.4 * np.sin(np.arange(int((T["black"] - T["cut4"]) * SR)) / SR * 7))
add(norm(crowd), T["cut4"], 0.06)
FLASHES = [8.25, 8.55, 8.7, 9.05, 9.4, 9.5, 9.85, 10.0]            # video.py flashes on the same frames
for s in FLASHES: add(shutter(), s, 0.35, pan=rng.uniform(-.9, .9))

# Black — hard silence (everything after 'black' is muted below), then title hits
i = int(T["black"] * SR); L[i:] = 0; R[i:] = 0
add(sub_boom(1.2) * 0.8, T["title"], 0.5)
add(hit(1.0), T["ticker"], 1.0)

mix = np.stack([L, R], 1)
mix = np.tanh(1.3 * mix / (np.max(np.abs(mix)) + 1e-9)) * 0.89    # glue + ceiling ~ -1 dBFS
fade = int(0.25 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
if __name__ == "__main__":
    sf.write("soundtrack.wav", mix, SR); sf.write("meow_only.wav", meow(), SR)
    print("ok", mix.shape[0] / SR)
