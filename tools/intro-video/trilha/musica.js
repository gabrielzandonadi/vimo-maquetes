// Trilha do vídeo institucional do Ed. Dr. Homero Tavares, composta e sintetizada em código (Tone.js, render offline).
// 105 BPM, Lá maior, 14 compassos (32 s). Estrutura casada com os cortes do vídeo (cada cena começa num compasso):
//   c1–2 abertura (piano + pad, sem bateria) · c3–6 edifício/localização (groove leve) · c7–9 tipologias (+ palmas)
//   c10–12 lazer (completo + melodia, virada no c12) · c13 assinatura (acorde final no tempo 1, cauda até 32 s)
// Sem samples: piano FM, pad de serras desafinadas filtrado, baixo, bumbo, chimbal, palma e "riser" de ruído.
/* global Tone */
const BPM = 105, BEAT = 60 / BPM, BAR = 4 * BEAT, LEN = 32;
const n = Tone.Frequency;
// acordes com vozes abertas (baixo, mão esquerda/direita)
const PROG = [
  { bass: 'F#1', v: ['A3', 'C#4', 'E4', 'G#4'], top: ['C#5', 'E5'] },   // F#m9
  { bass: 'D1', v: ['F#3', 'A3', 'C#4', 'E4'], top: ['A4', 'C#5'] },    // Dmaj9
  { bass: 'A1', v: ['C#4', 'E4', 'G#4', 'B4'], top: ['E5', 'G#5'] },    // Amaj9
  { bass: 'E1', v: ['G#3', 'B3', 'C#4', 'F#4'], top: ['B4', 'F#5'] },   // E6/9
];
const FINAL = { bass: 'A1', v: ['E3', 'A3', 'C#4', 'E4', 'G#4', 'B4'], top: ['C#5', 'E5'] };   // Amaj9 aberto

async function compor(V) {
  // ---- master: cola de bus + limitador
  const out = new Tone.Gain(0).toDestination();
  out.gain.setValueAtTime(0, 0); out.gain.linearRampToValueAtTime(1, 0.25);
  out.gain.setValueAtTime(1, LEN - 2.4); out.gain.linearRampToValueAtTime(0, LEN - 0.05);   // fade-out limpo
  const master = new Tone.Compressor({ threshold: -16, ratio: 2.5, attack: 0.02, release: 0.25 });
  const lim = new Tone.Limiter(-1);
  // EQ de master: corta subgrave inútil, dá presença e ar (mix mais aberto, de comercial)
  const hp = new Tone.Filter({ frequency: 38, type: 'highpass', rolloff: -24 });
  const tilt = new Tone.EQ3({ low: -2.5, mid: 0.5, high: 8.5, lowFrequency: 180, highFrequency: 2400 });
  const air = new Tone.Filter({ frequency: 9000, type: 'highshelf', gain: 4 });
  master.connect(hp); hp.connect(tilt); tilt.connect(air); air.connect(lim); lim.connect(out);
  const rev = new Tone.Reverb({ decay: V.reverb, preDelay: 0.03, wet: 1 }); await rev.ready;
  const revRet = new Tone.Gain(0.32).connect(master); rev.connect(revRet);
  const delay = new Tone.FeedbackDelay({ delayTime: BEAT * 0.75, feedback: 0.32, wet: 1 });
  const delRet = new Tone.Gain(0.22).connect(master); delay.connect(delRet);
  const send = (node, r, d = 0) => { const a = new Tone.Gain(r); node.connect(a); a.connect(rev); if (d) { const b = new Tone.Gain(d); node.connect(b); b.connect(delay); } };

  // ---- piano elétrico (FM) + camada de triângulo para o corpo
  const pianoBus = new Tone.Gain(V.piano).connect(master);
  const pianoEq = new Tone.EQ3({ low: -5, mid: 1, high: 5, highFrequency: 2500 }).connect(pianoBus);
  const piano = new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3.01, modulationIndex: 1.6, oscillator: { type: 'sine' }, modulation: { type: 'sine' },
    envelope: { attack: 0.004, decay: 1.6, sustain: 0.12, release: 1.4 }, modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0.05, release: 0.6 } }).connect(pianoEq);
  piano.maxPolyphony = 32;
  const body = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.006, decay: 1.2, sustain: 0.15, release: 1.2 } });
  body.volume.value = -14; body.connect(pianoEq); body.maxPolyphony = 32;
  send(pianoEq, 0.55, V.pianoDelay);
  // camada de brilho: ataque de martelo (FM rápido) que dá definição ao piano
  const tine = new Tone.PolySynth(Tone.FMSynth, { harmonicity: 7.02, modulationIndex: 3, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.3 }, modulationEnvelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 } });
  tine.volume.value = -17; tine.connect(pianoEq); tine.maxPolyphony = 32;
  const key = (notes, t, d, vel) => { piano.triggerAttackRelease(notes, d, t, vel); body.triggerAttackRelease(notes, d, t, vel * 0.8); tine.triggerAttackRelease(notes, Math.min(d, 0.4), t, vel); };

  // ---- pad (serras desafinadas, filtro passa-baixa) com sidechain do bumbo
  const padDuck = new Tone.Gain(1).connect(master);
  const padF = new Tone.Filter({ frequency: V.padCut, type: 'lowpass', rolloff: -24, Q: 0.4 }).connect(padDuck);
  const pad = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'fatsawtooth', count: 3, spread: 28 }, envelope: { attack: 1.4, decay: 0.5, sustain: 0.8, release: 2.6 } }).connect(padF);
  pad.volume.value = V.padVol; pad.maxPolyphony = 24;
  send(padF, 0.8);

  // ---- baixo
  const bass = new Tone.MonoSynth({ oscillator: { type: 'fmsine', modulationType: 'sine', harmonicity: 1, modulationIndex: 0.6 }, filter: { Q: 1, type: 'lowpass', rolloff: -24 },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.25 }, filterEnvelope: { attack: 0.01, decay: 0.25, sustain: 0.4, release: 0.3, baseFrequency: 120, octaves: 2.4 } }).connect(master);
  bass.volume.value = V.bassVol;

  // ---- bateria
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.045, octaves: 6, envelope: { attack: 0.001, decay: 0.42, sustain: 0, release: 0.1 } }).connect(master);
  kick.volume.value = V.kickVol;
  const hatF = new Tone.Filter(7800, 'highpass').connect(master);
  const hat = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.045, sustain: 0 } }).connect(hatF);
  hat.volume.value = V.hatVol; send(hatF, 0.15);
  const clapF = new Tone.Filter({ frequency: 1500, type: 'bandpass', Q: 0.9 }).connect(master);
  const clap = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.002, decay: 0.16, sustain: 0 } }).connect(clapF);
  clap.volume.value = V.clapVol; send(clapF, 0.6);
  const shaker = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.03, sustain: 0 } });
  const shF = new Tone.Filter(9500, 'bandpass').connect(master); shaker.connect(shF); shaker.volume.value = V.hatVol - 6;

  // ---- riser (ruído com filtro subindo) e impacto
  const riseF = new Tone.Filter({ frequency: 300, type: 'bandpass', Q: 2 }).connect(master);
  const riser = new Tone.Noise('pink').connect(riseF); riser.volume.value = -60; send(riseF, 0.7);
  const boom = new Tone.MembraneSynth({ pitchDecay: 0.2, octaves: 4, envelope: { attack: 0.001, decay: 2.2, sustain: 0, release: 0.5 } }).connect(master);
  boom.volume.value = -6;
  const crashF = new Tone.Filter(3000, 'highpass').connect(master);
  const crash = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 2.6, sustain: 0 } }).connect(crashF);
  crash.volume.value = -24; send(crashF, 0.9);
  const rise = (t0, t1, peak) => {
    riser.start(t0); riser.stop(t1 + 0.05);
    riser.volume.setValueAtTime(-48, t0); riser.volume.linearRampToValueAtTime(peak, t1);
    riseF.frequency.setValueAtTime(300, t0); riseF.frequency.exponentialRampToValueAtTime(7000, t1);
  };

  // ---- partitura
  const bar = b => b * BAR;               // compasso b (0 = primeiro)
  for (let b = 0; b < 12; b++) {
    const C = PROG[b % 4], t = bar(b);
    const full = b >= 2, sec = b >= 6, top = b >= 9;
    // pad: acorde inteiro por compasso
    pad.triggerAttackRelease(C.v.map(x => n(x).transpose(V.padOct).toNote()), BAR * 0.98, t, b < 2 ? 0.5 : 0.62);
    // piano: arpejo de colcheias na abertura; depois acordes sincopados + nota de cima
    if (!full) {
      const arp = [C.v[0], C.v[1], C.v[2], C.v[3], C.top[0], C.v[3], C.v[2], C.v[1]];
      arp.forEach((x, i) => key(x, t + i * BEAT / 2, BEAT * 1.4, 0.55 + (i % 4 === 0 ? 0.15 : 0)));
      key(n(C.bass).transpose(24).toNote(), t, BAR, 0.45);
    } else {
      const hits = V.comp; // [tempo em batidas, duração, intensidade]
      hits.forEach(([p, d, v]) => key(C.v, t + p * BEAT, d * BEAT, v));
      if (sec) key(C.top, t + 2.5 * BEAT, BEAT * 1.5, 0.42);
    }
    // melodia (lazer): frase pentatônica com delay
    if (top) {
      const mel = V.melody[(b - 9) % V.melody.length];
      mel.forEach(([p, note, d]) => key(note, t + p * BEAT, d * BEAT, 0.62));
    }
    if (full) {
      // baixo: tônica com respiração e passagem
      const r = n(C.bass).transpose(12).toNote(), r8 = n(r).transpose(12).toNote();
      [[0, r, 1.5], [1.5, r, 0.5], [2, r8, 0.75], [3, r, 0.5], [3.5, n(r).transpose(7).toNote(), 0.5]].forEach(([p, x, d]) => bass.triggerAttackRelease(x, d * BEAT * 0.95, t + p * BEAT, 0.8));
      for (let q = 0; q < 4; q++) {
        const tq = t + q * BEAT;
        kick.triggerAttackRelease('G1', '8n', tq, q === 0 ? 0.95 : 0.8);
        padDuck.gain.setValueAtTime(V.duck, tq); padDuck.gain.linearRampToValueAtTime(1, tq + BEAT * 0.55);
        hat.triggerAttackRelease('32n', tq + BEAT / 2, 0.7);
        if (sec) { shaker.triggerAttackRelease('32n', tq + BEAT / 4, 0.35); shaker.triggerAttackRelease('32n', tq + 3 * BEAT / 4, 0.3); }
        if (sec && (q === 1 || q === 3)) clap.triggerAttackRelease('16n', tq, 0.8);
      }
    }
  }
  // viradas: riser para a entrada do groove (c3) e para a assinatura (c13); repique de palmas no c12
  rise(bar(1) + BEAT, bar(2), -27);
  rise(bar(11), bar(12), -21);
  const roll = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.002, decay: 0.09, sustain: 0 } }).connect(clapF);
  roll.volume.value = V.clapVol - 2;
  for (let i = 0; i < 8; i++) roll.triggerAttackRelease('32n', bar(11) + 2 * BEAT + i * BEAT / 4, 0.3 + i * 0.08);
  // assinatura (c13, 27,43 s): impacto + acorde final longo, cauda até 32 s
  const tf = bar(12);
  boom.triggerAttackRelease('A1', 2, tf, 1); crash.triggerAttackRelease(2.5, tf, 0.9); kick.triggerAttackRelease('G1', '8n', tf, 1);
  key(FINAL.v, tf, BAR * 1.6, 0.85); key(FINAL.top, tf + BEAT * 1.5, BAR, 0.5);
  bass.triggerAttackRelease(n(FINAL.bass).transpose(12).toNote(), BAR * 1.2, tf, 0.9);
  pad.triggerAttackRelease(FINAL.v.map(x => n(x).transpose(V.padOct).toNote()), BAR * 1.7, tf, 0.7);
}

window.VARIANTES = {
  // A — elegante: piano em destaque, groove contido
  elegante: { reverb: 4.5, piano: 0.9, pianoDelay: 0.12, padCut: 2600, padVol: -20, padOct: 0, bassVol: -11, kickVol: -11, hatVol: -24, clapVol: -19, duck: 0.45,
    comp: [[0, 1.4, 0.62], [1.5, 0.9, 0.45], [2.5, 0.4, 0.38], [3, 1, 0.5]],
    melody: [[[0, 'E5', 1], [1, 'C#5', 0.5], [1.5, 'B4', 0.5], [2, 'C#5', 1.5], [3.5, 'E5', 0.5]], [[0, 'F#5', 1], [1, 'E5', 1], [2, 'C#5', 2]], [[0, 'B4', 0.5], [0.5, 'C#5', 0.5], [1, 'E5', 1], [2, 'G#5', 1], [3, 'F#5', 1]]] },
  // B — pulso moderno: mais bateria e sincopa, pad mais aberto
  pulso: { reverb: 3.2, piano: 0.75, pianoDelay: 0.25, padCut: 3600, padVol: -18, padOct: 0, bassVol: -9, kickVol: -8, hatVol: -21, clapVol: -16, duck: 0.3,
    comp: [[0, 0.5, 0.6], [0.75, 0.5, 0.45], [1.5, 0.5, 0.5], [2.5, 0.5, 0.5], [3.25, 0.5, 0.42]],
    melody: [[[0, 'C#6', 0.5], [0.5, 'B5', 0.5], [1, 'A5', 0.5], [1.5, 'E5', 1], [3, 'F#5', 1]], [[0, 'A5', 0.75], [0.75, 'B5', 0.75], [1.5, 'C#6', 1.5], [3, 'E6', 1]], [[0, 'G#5', 0.5], [0.5, 'F#5', 0.5], [1, 'E5', 1], [2, 'C#5', 1], [3, 'B4', 1]]] },
  // C — calmo: quase sem bateria, piano e pad (alternativa para quem prefere discrição)
  calmo: { reverb: 5.5, piano: 1.0, pianoDelay: 0.18, padCut: 2000, padVol: -18, padOct: -12, bassVol: -14, kickVol: -20, hatVol: -34, clapVol: -32, duck: 0.8,
    comp: [[0, 2, 0.55], [2.5, 1.5, 0.42]],
    melody: [[[0, 'E5', 2], [2, 'C#5', 2]], [[0, 'F#5', 2], [2, 'E5', 2]], [[0, 'G#5', 1.5], [1.5, 'F#5', 0.5], [2, 'E5', 2]]] },
};

window.renderizar = async function (nome) {
  const buf = await Tone.Offline(async () => { await compor(window.VARIANTES[nome]); }, LEN, 2, 44100);
  const L = buf.getChannelData(0), R = buf.getChannelData(1), N = L.length;
  const pcm = new Float32Array(N * 2); for (let i = 0; i < N; i++) { pcm[2 * i] = L[i]; pcm[2 * i + 1] = R[i]; }
  const bytes = new Uint8Array(pcm.buffer); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { sr: buf.sampleRate, n: N, b64: btoa(bin) };
};
