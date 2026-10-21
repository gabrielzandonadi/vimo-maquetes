# Trilha do vídeo institucional gerada em código (sem samples nem música licenciada): pad por cena,
# pulso a 100 bpm, chimbal e "whoosh" nas transições. Uso: python3 scripts/trilha.py public/trilha.wav
import sys, wave
import numpy as np
sr = 44100; T = 28.0; t = np.arange(int(sr * T)) / sr
cuts = [0, 4, 8.5, 13, 18, 23.5, 28]
chords = [[220, 277.18, 329.63, 415.3], [196, 246.94, 293.66, 369.99], [174.61, 220, 261.63, 329.63],
          [196, 246.94, 293.66, 392], [220, 277.18, 329.63, 440], [174.61, 220, 261.63, 349.23]]
pad = np.zeros_like(t)
for i, (a, b) in enumerate(zip(cuts[:-1], cuts[1:])):
    w = np.clip((t - a + 0.3) / 0.6, 0, 1) * np.clip((b + 0.6 - t) / 0.6, 0, 1)
    for k, f in enumerate(chords[i]):
        pad += w * (np.sin(2 * np.pi * f * t + k) * 0.5 + 0.25 * np.sin(2 * np.pi * f * 2.003 * t)) * (0.9 if k == 0 else 0.55)
pad *= 0.06
beat = 60 / 100; kick = np.zeros_like(t)
for bt in np.arange(4, 26, beat):
    i = int(bt * sr); n = int(0.35 * sr); tt = np.arange(n) / sr
    s = np.sin(2 * np.pi * (55 + 70 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9)
    kick[i:i + n] += s[:len(kick) - i] * 0.22
rng = np.random.default_rng(3); hat = np.zeros_like(t)
for bt in np.arange(4 + beat / 2, 26, beat):
    i = int(bt * sr); n = int(0.06 * sr); s = rng.standard_normal(n) * np.exp(-np.arange(n) / sr * 70)
    s = np.diff(np.concatenate([[0], s])); hat[i:i + n] += s[:len(hat) - i] * 0.05
wh = np.zeros_like(t)
for c in cuts[1:-1]:
    n = int(0.7 * sr); i = int((c - 0.45) * sr); noise = rng.standard_normal(n)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    noise = np.convolve(noise, np.ones(40) / 40, 'same') * 4
    wh[i:i + n] += noise * e * 0.12
mix = (pad + kick + hat + wh) * np.clip(t / 1.0, 0, 1) * np.clip((T - t) / 1.5, 0, 1)
mix = mix / np.max(np.abs(mix)) * 0.8
st = np.stack([mix, np.roll(mix, 200)], 1)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'public/trilha.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((st * 32767).astype(np.int16).tobytes())
