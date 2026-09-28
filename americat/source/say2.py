import soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
for v in ["am_michael"]:
    s, sr = k.create("Mister President, what is your plan for America?", voice=v, speed=1.1, lang="en-us")
    sf.write(f"q2_{v}.wav", s, sr); print(v, len(s)/sr, sr)
