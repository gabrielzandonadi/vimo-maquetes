// Vídeo institucional do Edifício Dr. Homero Tavares (Praia da Costa, Vila Velha/ES) para a tela de abertura
// da maquete. Estilo "vídeo feito em código": tipografia cinética, rótulos de capítulo em mono, órbita de
// pontos, cartão de dados e assinatura final — nas cores do site (marinho, dourado e areia).
// Só usa fatos do repositório (página da Vimo e da construtora): nada de números inventados.
import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';

export const DURATION = 840; // 28 s a 30 fps

const C = { bg: '#0f1d3d', navy: '#192a56', navy2: '#23457c', gold: '#f6c15a', goldL: '#ffe2a0', sand: '#f4eadc', white: '#ffffff', mute: 'rgba(255,255,255,.62)' };
const DISPLAY = 'KoHo, sans-serif';
const BODY = 'Arsenal, sans-serif';
const MONO = '"JetBrains Mono", monospace';

const useLayout = () => {
  const { width, height } = useVideoConfig();
  const v = height > width;
  const u = Math.min(width, height) / 1080;   // 1 u = 1 px em 1080p
  return { width, height, v, u };
};
const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const prog = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });

// ---------------------------------------------------------------- peças
const Grid: React.FC<{ light?: boolean }> = ({ light }) => {
  const { width, height, u } = useLayout();
  const step = 120 * u, col = light ? 'rgba(25,42,86,.08)' : 'rgba(255,255,255,.055)';
  const xs = Array.from({ length: Math.ceil(width / step) + 1 }, (_, i) => i * step);
  const ys = Array.from({ length: Math.ceil(height / step) + 1 }, (_, i) => i * step);
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
      {xs.map(x => <line key={'x' + x} x1={x} y1={0} x2={x} y2={height} stroke={col} strokeWidth={1} />)}
      {ys.map(y => <line key={'y' + y} x1={0} y1={y} x2={width} y2={y} stroke={col} strokeWidth={1} />)}
      {xs.filter((_, i) => i % 3 === 1).flatMap(x => ys.filter((_, j) => j % 3 === 1).map(y => (
        <g key={x + '-' + y} stroke={light ? 'rgba(25,42,86,.35)' : 'rgba(246,193,90,.45)'} strokeWidth={1.5}>
          <line x1={x - 7 * u} y1={y} x2={x + 7 * u} y2={y} /><line x1={x} y1={y - 7 * u} x2={x} y2={y + 7 * u} />
        </g>)))}
    </svg>
  );
};

const Chrome: React.FC<{ light?: boolean }> = ({ light }) => {
  const { u, v } = useLayout();
  const f = useCurrentFrame();
  const col = light ? C.navy : C.white;
  return (
    <>
      <div style={{ position: 'absolute', left: 48 * u, top: 40 * u, display: 'flex', alignItems: 'center', gap: 12 * u, fontFamily: MONO, fontSize: 18 * u, letterSpacing: '.14em', color: col, opacity: .85 }}>
        <span style={{ width: 12 * u, height: 12 * u, borderRadius: '50%', background: C.gold, opacity: f % 30 < 18 ? 1 : .25 }} />
        MAQUETE VIMO
      </div>
      <div style={{ position: 'absolute', right: 48 * u, top: 40 * u, fontFamily: MONO, fontSize: 18 * u, letterSpacing: '.14em', color: col, opacity: .7, textAlign: 'right' }}>
        {v ? 'VILA VELHA/ES' : 'PRAIA DA COSTA · VILA VELHA/ES'}
      </div>
    </>
  );
};

const Label: React.FC<{ children: React.ReactNode; at: number; color?: string; size?: number }> = ({ children, at, color = C.gold, size = 22 }) => {
  const f = useCurrentFrame(); const { u } = useLayout();
  const t = prog(f, at, at + 12);
  const txt = String(children); const n = Math.round(txt.length * prog(f, at, at + 18));
  return <div style={{ fontFamily: MONO, fontSize: size * u, letterSpacing: '.16em', color, opacity: t, whiteSpace: 'nowrap' }}>{txt.slice(0, n)}{n < txt.length ? '▌' : ''}</div>;
};

// palavra que sobe de dentro de uma máscara
const Word: React.FC<{ text: string; at: number; size: number; color?: string; weight?: number }> = ({ text, at, size, color = C.white, weight = 700 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const { u } = useLayout();
  const s = spring({ frame: f - at, fps, config: { damping: 18, stiffness: 160, mass: .7 } });
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: .04 * size * u, marginBottom: -.04 * size * u }}>
      <span style={{ display: 'inline-block', transform: `translateY(${(1 - s) * 110}%)`, fontFamily: DISPLAY, fontWeight: weight, fontSize: size * u, lineHeight: .98, letterSpacing: '-.02em', color, textTransform: 'uppercase' }}>{text}</span>
    </span>
  );
};
const Line: React.FC<{ words: string[]; at: number; size: number; color?: string; gap?: number }> = ({ words, at, size, color, gap = 4 }) => {
  const { u } = useLayout();
  return <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: .26 * size * u }}>{words.map((w, i) => <Word key={i} text={w} at={at + i * gap} size={size} color={color} />)}</div>;
};

// selo dourado inclinado (o "TODO MÊS!" dos exemplos)
const Stamp: React.FC<{ text: string; at: number; size?: number; rot?: number }> = ({ text, at, size = 40, rot = -3 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const { u } = useLayout();
  const s = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 220 } });
  return (
    <div style={{ display: 'inline-block', transform: `rotate(${rot}deg) scale(${s})`, background: C.gold, color: C.navy, fontFamily: DISPLAY, fontWeight: 700, fontSize: size * u, padding: `${.12 * size * u}px ${.38 * size * u}px`, textTransform: 'uppercase', letterSpacing: '-.01em', boxShadow: `0 ${10 * u}px ${30 * u}px rgba(0,0,0,.25)` }}>{text}</div>
  );
};

const Chip: React.FC<{ text: string; at: number; light?: boolean; active?: boolean }> = ({ text, at, light, active }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const { u } = useLayout();
  const s = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 180 } });
  return (
    <div style={{ transform: `scale(${s})`, padding: `${10 * u}px ${22 * u}px`, borderRadius: 999, border: `${2 * u}px solid ${active ? C.gold : light ? C.navy : 'rgba(255,255,255,.75)'}`, background: active ? C.gold : light ? '#fff' : 'rgba(15,29,61,.85)', color: active ? C.navy : light ? C.navy : C.white, fontFamily: MONO, fontWeight: 500, fontSize: 20 * u, letterSpacing: '.08em', whiteSpace: 'nowrap' }}>{text}</div>
  );
};

// barras de transição (varredura marinho/dourado)
const Bars: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame(); const { width, height, u } = useLayout();
  const t = f - at; if (t < -2 || t > 16) return null;
  const rows = [0.12, 0.3, 0.47, 0.63, 0.81];
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {rows.map((r, i) => {
        const p = interpolate(t, [i * .8, 7 + i * .8, 9 + i * .8, 16], [-1.1, 0, 0, 1.1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return <div key={i} style={{ position: 'absolute', left: 0, top: r * height, width, height: (i % 2 ? 46 : 86) * u, background: i % 2 ? C.gold : C.white, transform: `translateX(${p * width}px)` }} />;
      })}
    </AbsoluteFill>
  );
};

const Photo: React.FC<{ src: string; at: number; dur: number; from?: number; to?: number; pos?: string; wipe?: 'left' | 'up' | 'circle' }> = ({ src, at, dur, from = 1.14, to = 1.0, pos = 'center', wipe = 'left' }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [at, at + dur], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const w = prog(f, at, at + 14) * 100;
  const clip = wipe === 'left' ? `inset(0 ${100 - w}% 0 0)` : wipe === 'up' ? `inset(${100 - w}% 0 0 0)` : `circle(${w * .75}% at 50% 50%)`;
  return (
    <AbsoluteFill style={{ clipPath: clip, overflow: 'hidden' }}>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${z})` }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- cenas
const Abertura: React.FC = () => {
  const f = useCurrentFrame(); const { u, v } = useLayout();
  const big = v ? 150 : 190;
  const out = prog(f, 104, 120);
  return (
    <AbsoluteFill style={{ background: C.bg, transform: `scale(${1 + out * .06})`, opacity: 1 - out * .3 }}>
      <Grid />
      <Chrome />
      <AbsoluteFill style={{ justifyContent: 'center', padding: v ? `0 ${70 * u}px` : `0 ${150 * u}px`, gap: 18 * u }}>
        <Label at={6}>// LANÇAMENTO · BARBOSA BARROS</Label>
        <Line words={['Edifício']} at={14} size={big * .62} color={C.goldL} />
        <Line words={v ? ['Dr.', 'Homero'] : ['Dr.', 'Homero', 'Tavares']} at={20} size={big} />
        {v && <Line words={['Tavares']} at={30} size={big} />}
        <div style={{ marginTop: 18 * u }}><Stamp text="Praia da Costa" at={46} size={v ? 54 : 58} /></div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Edificio: React.FC = () => {
  const f = useCurrentFrame(); const { u, v } = useLayout();
  const n72 = Math.round(interpolate(f, [26, 62], [0, 72], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }));
  const n12 = Math.round(interpolate(f, [34, 66], [0, 12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }));
  const card = prog(f, 20, 36);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Photo src="c8_0.jpg" at={0} dur={135} pos={v ? '45% 30%' : '50% 32%'} from={1.18} to={1.04} />
      <AbsoluteFill style={{ background: v ? 'linear-gradient(180deg, rgba(15,29,61,.0) 30%, rgba(15,29,61,.92) 78%)' : 'linear-gradient(90deg, rgba(15,29,61,.92) 0%, rgba(15,29,61,.55) 42%, rgba(15,29,61,0) 70%)' }} />
      <Chrome />
      <AbsoluteFill style={{ justifyContent: v ? 'flex-end' : 'center', padding: v ? `0 ${70 * u}px ${190 * u}px` : `0 ${120 * u}px`, gap: 16 * u }}>
        <Label at={8}>// 01 · O EDIFÍCIO</Label>
        <Line words={['Rua', 'Humberto']} at={12} size={v ? 108 : 132} />
        <Line words={['Serrano.']} at={20} size={v ? 108 : 132} color={C.gold} />
        <div style={{ display: 'flex', gap: 22 * u, marginTop: 26 * u, opacity: card, transform: `translateY(${(1 - card) * 30 * u}px)` }}>
          {[[n72, 'apartamentos'], [n12, 'pavimentos']].map(([n, l]) => (
            <div key={String(l)} style={{ border: `${2 * u}px solid rgba(255,255,255,.35)`, borderRadius: 16 * u, padding: `${16 * u}px ${26 * u}px`, background: 'rgba(15,29,61,.6)', minWidth: 230 * u }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 84 * u, color: C.white, lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: MONO, fontSize: 19 * u, letterSpacing: '.14em', color: C.goldL, textTransform: 'uppercase', marginTop: 6 * u }}>{l}</div>
            </div>))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// órbita de pontos (o "D · Órbita" dos exemplos) com o que fica perto do prédio
const Local: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const { u, v, width, height } = useLayout();
  const cx = v ? width / 2 : width * .3, cy = v ? height * .36 : height / 2, R = (v ? 330 : 300) * u;
  const dots = React.useMemo(() => Array.from({ length: 420 }, (_, i) => { const a = i * 2.39996, r = Math.sqrt(i / 420); return { a, r, g: i % 7 === 0 }; }), []);
  const rot = f * .006;
  const items = ['PRAIA', 'COMÉRCIO', 'TERCEIRA PONTE', 'VILA VELHA'];
  const ring = prog(f, 10, 40);
  const pulse = spring({ frame: f - 18, fps, config: { damping: 8 } });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Grid />
      <Chrome />
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        {dots.map((d, i) => {
          const rr = d.r * R * 1.25 * interpolate(f, [0, 30], [.2, 1], { extrapolateRight: 'clamp', easing: ease });
          const x = cx + Math.cos(d.a + rot * (1.4 - d.r)) * rr, y = cy + Math.sin(d.a + rot * (1.4 - d.r)) * rr;
          return <circle key={i} cx={x} cy={y} r={(d.g ? 6.5 : 4.2) * u} fill={d.g ? C.gold : 'rgba(255,255,255,.38)'} />;
        })}
        <circle cx={cx} cy={cy} r={R * .78} fill="none" stroke={C.gold} strokeWidth={3 * u} strokeDasharray={`${ring * 2 * Math.PI * R * .78} 9999`} transform={`rotate(-90 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={R * 1.14} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth={1.5 * u} />
        <circle cx={cx} cy={cy} r={24 * u * pulse} fill={C.gold} />
        <circle cx={cx} cy={cy} r={24 * u * pulse + 12 * u} fill="none" stroke={C.gold} strokeWidth={2 * u} opacity={.6} />
      </svg>
      {items.map((t, i) => {
        const a = -Math.PI / 2 + i * Math.PI / 2 + rot * .6;
        const x = cx + Math.cos(a) * R * .78, y = cy + Math.sin(a) * R * .78;
        return <div key={t} style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)' }}><Chip text={t} at={26 + i * 7} active={i === 0} /></div>;
      })}
      <div style={{ position: 'absolute', left: cx, top: cy + 40 * u, transform: 'translateX(-50%)', fontFamily: MONO, fontSize: 17 * u, letterSpacing: '.12em', color: C.white, background: C.bg, padding: `${4 * u}px ${10 * u}px`, border: `1px solid rgba(255,255,255,.4)`, borderRadius: 8 * u, opacity: prog(f, 22, 32), whiteSpace: 'nowrap' }}>DR. HOMERO TAVARES</div>
      <AbsoluteFill style={v ? { justifyContent: 'flex-end', padding: `0 ${70 * u}px ${170 * u}px`, gap: 14 * u } : { left: width * .56, right: 100 * u, justifyContent: 'center', gap: 16 * u, width: 'auto' }}>
        <Label at={8}>// 02 · A LOCALIZAÇÃO</Label>
        <Line words={['Perto', 'da', 'praia.']} at={30} size={v ? 104 : 118} />
        <Line words={['Perto', 'de', 'tudo.']} at={44} size={v ? 104 : 118} color={C.gold} />
        <div style={{ fontFamily: BODY, fontSize: 30 * u, color: C.mute, maxWidth: 640 * u, marginTop: 10 * u, opacity: prog(f, 62, 80), lineHeight: 1.35 }}>Próximo à praia, ao comércio local e com fácil acesso à Terceira Ponte.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Apartamento: React.FC = () => {
  const f = useCurrentFrame(); const { u, v, width, height } = useLayout();
  const specs = ['3 quartos, sendo 1 suíte', '2 vagas de garagem', 'Varanda gourmet', 'Preparação para split', 'Aquecimento a gás'];
  const reveal = prog(f, 6, 40);
  const planW = v ? width - 140 * u : width * .5, planH = planW * 730 / 1055;
  return (
    <AbsoluteFill style={{ background: C.sand }}>
      <Grid light />
      <Chrome light />
      <div style={{ position: 'absolute', left: v ? 70 * u : width * .45, top: v ? 150 * u : (height - planH) / 2 - 10 * u, width: planW, height: planH, overflow: 'hidden', borderRadius: 18 * u, background: '#fff', boxShadow: `0 ${24 * u}px ${60 * u}px rgba(25,42,86,.18)`, clipPath: `inset(0 ${100 - reveal * 100}% 0 0 round ${18 * u}px)` }}>
        <Img src={staticFile('c3_0.jpg')} style={{ position: 'absolute', width: planW * 2000 / 1055, maxWidth: 'none', left: -470 / 1055 * planW, top: -320 / 1055 * planW }} />
        <div style={{ position: 'absolute', left: 0, top: `${interpolate(f, [8, 44], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%`, width: '100%', height: 3 * u, background: C.gold, boxShadow: `0 0 ${18 * u}px ${C.gold}`, opacity: f < 46 ? 1 : 0 }} />
      </div>
      <AbsoluteFill style={v ? { justifyContent: 'flex-end', padding: `0 ${70 * u}px ${150 * u}px`, gap: 12 * u } : { width: width * .4, padding: `0 0 0 ${110 * u}px`, justifyContent: 'center', gap: 14 * u }}>
        <Label at={8} color={C.navy2}>// 03 · O APARTAMENTO</Label>
        <Line words={['3', 'quartos.']} at={14} size={v ? 116 : 128} color={C.navy} />
        <Line words={['1', 'suíte.']} at={22} size={v ? 116 : 128} color={C.navy} />
        <div style={{ margin: `${8 * u}px 0 ${8 * u}px` }}><Stamp text="82,59 a 91,89 m²" at={36} size={v ? 46 : 44} rot={-2} /></div>
        <div style={{ display: 'grid', gap: 10 * u, marginTop: 6 * u }}>
          {specs.map((s, i) => {
            const t = prog(f, 48 + i * 7, 60 + i * 7);
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 14 * u, opacity: t, transform: `translateX(${(1 - t) * -24 * u}px)`, fontFamily: MONO, fontSize: 22 * u, color: C.navy, letterSpacing: '.04em' }}>
                <span style={{ width: 26 * u, height: 26 * u, borderRadius: 6 * u, background: C.navy, color: C.gold, display: 'grid', placeItems: 'center', fontSize: 18 * u }}>✓</span>{s}
              </div>);
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const LAZER: [string, string, string][] = [['c7_2.jpg', 'Piscina com prainha', '50% 60%'], ['c7_1.jpg', 'Espaço gourmet', '50% 50%'], ['c7_0.jpg', 'Academia', '50% 50%'], ['c7_5.jpg', 'Salão de festas', '50% 50%'], ['c7_4.jpg', 'Salão de jogos', '50% 50%'], ['c7_3.jpg', 'Playground', '40% 60%']];
const Lazer: React.FC = () => {
  const f = useCurrentFrame(); const { u, v, width } = useLayout();
  const per = 24, start = 18;
  const idx = Math.min(LAZER.length - 1, Math.max(0, Math.floor((f - start) / per)));
  const list = ['Piscina', 'Sauna', 'Área gourmet', 'Churrasqueira', 'Salão de festas', 'Sala de jogos', 'Academia', 'Brinquedoteca', 'Playground', 'Mercado'];
  const tick = list.concat(list).join('  ✦  ');
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {f < start + 4 && (<><Grid /><AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 14 * u }}>
        <Label at={0}>// 04 · O LAZER</Label>
        <Line words={['Lazer', 'completo.']} at={2} size={v ? 130 : 170} />
      </AbsoluteFill></>)}
      {LAZER.map(([src, , pos], i) => {
        const at = start + i * per;
        if (f < at || f > at + per + 8) return null;
        return <Sequence key={src} from={0}><Photo src={src} at={at} dur={per + 8} pos={pos} from={1.12} to={1.0} wipe={i % 2 ? 'up' : 'left'} /></Sequence>;
      })}
      {f >= start && <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(15,29,61,.55) 0%, rgba(15,29,61,0) 30%, rgba(15,29,61,0) 55%, rgba(15,29,61,.88) 100%)' }} />}
      <Chrome />
      {f >= start && (
        <AbsoluteFill style={{ justifyContent: 'flex-end', padding: v ? `0 ${70 * u}px ${230 * u}px` : `0 ${110 * u}px ${150 * u}px`, gap: 10 * u }}>
          <Label at={start}>{`// 04 · O LAZER · ${String(idx + 1).padStart(2, '0')}/06`}</Label>
          <div key={idx}><Line words={LAZER[idx][1].split(' ')} at={start + idx * per + 3} size={v ? 104 : 132} /></div>
        </AbsoluteFill>)}
      {f >= start && (
        <div style={{ position: 'absolute', left: 0, bottom: (v ? 120 : 56) * u, width, overflow: 'hidden', background: C.gold, padding: `${10 * u}px 0` }}>
          <div style={{ whiteSpace: 'nowrap', fontFamily: MONO, fontWeight: 500, fontSize: 22 * u, letterSpacing: '.1em', color: C.navy, textTransform: 'uppercase', transform: `translateX(${-((f * 6 * u) % (width * 1.2))}px)` }}>{tick}  ✦  {tick}</div>
        </div>)}
    </AbsoluteFill>
  );
};

const Final: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const { u, v } = useLayout();
  const logo = spring({ frame: f - 4, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      <Photo src="noite.jpg" at={0} dur={135} pos="50% 40%" from={1.2} to={1.08} wipe="circle" />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(15,29,61,.72) 0%, rgba(15,29,61,.94) 70%)' }} />
      <Grid />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20 * u, padding: `0 ${60 * u}px` }}>
        <Img src={staticFile('vimo-logo-white.png')} style={{ height: 70 * u, opacity: logo, transform: `translateY(${(1 - logo) * 20 * u}px)` }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 * u }}>
          <Line words={v ? ['Dr.', 'Homero'] : ['Dr.', 'Homero', 'Tavares']} at={10} size={v ? 124 : 150} />
          {v && <Line words={['Tavares']} at={16} size={124} />}
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 46 * u, color: C.gold, opacity: prog(f, 30, 44) }}>Explore a maquete 3D.</div>
        <div style={{ fontFamily: BODY, fontSize: 28 * u, color: C.mute, opacity: prog(f, 40, 54) }}>Gire o prédio, veja o sol de cada unidade e entre no apartamento.</div>
        <div style={{ marginTop: 20 * u }}><Label at={56} color={C.goldL} size={19}>PRAIA DA COSTA · VILA VELHA/ES · BARBOSA BARROS CONSTRUTORA</Label></div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 8 * u, width: `${prog(f, 20, 130) * 100}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.goldL})` }} />
    </AbsoluteFill>
  );
};

const CUTS = [0, 120, 255, 390, 540, 705, DURATION];
export const Institucional: React.FC = () => {
  const scenes = [Abertura, Edificio, Local, Apartamento, Lazer, Final];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {scenes.map((S, i) => <Sequence key={i} from={CUTS[i]} durationInFrames={CUTS[i + 1] - CUTS[i]}><S /></Sequence>)}
      {CUTS.slice(1, -1).map(c => <Bars key={c} at={c - 7} />)}
      <Audio src={staticFile('trilha.wav')} volume={0.9} />
    </AbsoluteFill>
  );
};
