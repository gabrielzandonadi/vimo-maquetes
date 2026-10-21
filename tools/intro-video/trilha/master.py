# masterização: normaliza a -14 LUFS (integrado) com teto de -1 dBFS (limitador suave por lookahead simples)
import sys, wave, numpy as np, pyloudnorm as pyln
nome = sys.argv[1]; sr = 44100
x = np.frombuffer(open(f'raw_{nome}.f32', 'rb').read(), dtype=np.float32).reshape(-1, 2).astype(np.float64)
meter = pyln.Meter(sr)
l0 = meter.integrated_loudness(x)
y = pyln.normalize.loudness(x, l0, -14.0)
# limitador: ganho = min(1, teto/|pico|) suavizado (ataque 5 ms, release 120 ms)
ceil = 10 ** (-1.2 / 20)
pk = np.max(np.abs(y), axis=1)
need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
la = int(0.005 * sr)
g = np.minimum.reduce([np.roll(need, -k) for k in range(la)])
rel = np.exp(-1 / (0.12 * sr)); out = np.empty_like(g); cur = 1.0
for i, v in enumerate(g):
    cur = v if v < cur else v + (cur - v) * rel
    out[i] = cur
y = y * out[:, None]
l1 = meter.integrated_loudness(y)
print(f'{nome}: {l0:.1f} → {l1:.1f} LUFS · pico {20*np.log10(np.max(np.abs(y))):.2f} dBFS')
with wave.open(f'{nome}.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
