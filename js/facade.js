// Texturas procedurais da fachada (sem arquivos externos): pedra clara com portas de correr,
// janelas com caixilho escuro e cortinas; lâminas de brise; frisos verticais do núcleo.
// Tudo em "metros de textura": a fachada usa UVs em metros (módulo de 6 m × 1 pavimento).
import * as THREE from 'three';

const rnd = (a, b) => a + Math.random() * (b - a);
function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function tex(c, { srgb = true, rx = 1, ry = 1 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8;
  return t;
}

// módulo de fachada: 6 m de largura × 3,4 m (um pavimento, incluindo a faixa escondida pela laje)
export const FACADE_MODULE = { w: 6, h: 3.4 };
let cache = null;
export function facadeTextures() {
  if (cache) return cache;
  const W = 768, H = 436, px = W / 6, py = H / 3.4;           // ~128 px/m
  const X = m => m * px, Y = m => H - m * py;                  // y em metros a partir do piso
  // aberturas do módulo (metros): porta de correr grande + janela menor
  const door = { x0: 0.55, x1: 3.75, y0: 0.0, y1: 2.55 };
  const win = { x0: 4.45, x1: 5.55, y0: 0.95, y1: 2.35 };
  const drawStone = (g) => {
    g.fillStyle = '#d9d3c8'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26000; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? `rgba(80,72,64,${rnd(0.04, 0.16)})` : `rgba(255,255,255,${rnd(0.05, 0.18)})`; g.fillRect(rnd(0, W), rnd(0, H), rnd(1, 2.4), rnd(1, 2.4)); }
    // juntas das placas de pedra (1,2 × 0,6 m)
    g.strokeStyle = 'rgba(120,110,98,.35)'; g.lineWidth = 1.2;
    for (let m = 0; m <= 6; m += 1.2) { g.beginPath(); g.moveTo(X(m), 0); g.lineTo(X(m), H); g.stroke(); }
    for (let m = 0; m <= 3.4; m += 0.6) { g.beginPath(); g.moveTo(0, Y(m)); g.lineTo(W, Y(m)); g.stroke(); }
  };
  const drawGlass = (g, o, curtain) => {
    const x0 = X(o.x0), x1 = X(o.x1), y0 = Y(o.y1), y1 = Y(o.y0);
    // requadro escurecido (profundidade do vão)
    g.fillStyle = 'rgba(60,52,44,.55)'; g.fillRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12);
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, '#6f8794'); gr.addColorStop(0.45, '#3f525d'); gr.addColorStop(1, '#55697a');
    g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    // reflexo do céu
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * 0.45, y0); g.lineTo(x0 + (x1 - x0) * 0.15, y1); g.lineTo(x0, y1); g.fill();
    // cortina de linho franzida em parte do vão
    if (curtain) {
      const cw = (x1 - x0) * curtain;
      for (let x = x0; x < x0 + cw; x += 6) { g.fillStyle = `rgba(236,228,214,${0.55 + 0.25 * Math.sin(x * 0.6)})`; g.fillRect(x, y0, 6, y1 - y0); }
    }
    // caixilhos em bronze escuro
    g.fillStyle = '#3a332b';
    const nm = Math.max(1, Math.round((o.x1 - o.x0) / 1.05));
    for (let i = 0; i <= nm; i++) { const x = x0 + (x1 - x0) * i / nm; g.fillRect(x - 3, y0, 6, y1 - y0); }
    g.fillRect(x0 - 3, y0 - 3, x1 - x0 + 6, 6); g.fillRect(x0 - 3, y1 - 3, x1 - x0 + 6, 6);
  };
  const color = canvas(W, H, g => {
    drawStone(g);
    drawGlass(g, door, 0.35);
    drawGlass(g, win, 0);
    // friso sob a laje (sombra)
    const sh = g.createLinearGradient(0, 0, 0, Y(3.05) + 18); sh.addColorStop(0, 'rgba(40,34,28,.6)'); sh.addColorStop(1, 'rgba(40,34,28,0)');
    g.fillStyle = sh; g.fillRect(0, 0, W, Y(3.05) + 18);
  });
  // máscara das janelas (acendem à noite) e rugosidade (vidro liso, pedra áspera)
  const mask = canvas(W, H, g => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffd9a0';
    for (const o of [door, win]) g.fillRect(X(o.x0), Y(o.y1), X(o.x1) - X(o.x0), Y(o.y0) - Y(o.y1));
  });
  const rough = canvas(W, H, g => {
    g.fillStyle = 'rgb(0,220,0)'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgb(0,25,0)';
    for (const o of [door, win]) g.fillRect(X(o.x0), Y(o.y1), X(o.x1) - X(o.x0), Y(o.y0) - Y(o.y1));
  });
  const white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); white.needsUpdate = true;
  const brise = canvas(256, 128, g => {
    g.clearRect(0, 0, 256, 128);
    for (let y = 4; y < 128; y += 12) {
      const gr = g.createLinearGradient(0, y, 0, y + 8); gr.addColorStop(0, '#8b8780'); gr.addColorStop(1, '#5b5853');
      g.fillStyle = gr; g.fillRect(0, y, 256, 8);
    }
    g.fillStyle = '#4a4743'; g.fillRect(0, 0, 256, 4); g.fillRect(0, 124, 256, 4); g.fillRect(0, 0, 4, 128); g.fillRect(252, 0, 4, 128);
  });
  const ribs = canvas(64, 64, g => {
    g.fillStyle = '#f2f0eb'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(150,145,138,.55)'; g.fillRect(0, 0, 3, 64);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(3, 0, 2, 64);
  });
  cache = {
    map: tex(color), emissiveMap: tex(mask), roughnessMap: tex(rough, { srgb: false }), white,
    brise: tex(brise), ribs: tex(ribs),
  };
  return cache;
}

// UVs em metros para paredes verticais: u ao longo da face (x ou z), v = altura a partir do piso / pavimento
export function meterUV(geo, yBase) {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), nx = nor.getX(i), nz = nor.getZ(i), ny = nor.getY(i);
    let u;
    if (Math.abs(ny) > 0.5) u = x;
    else if (Math.abs(nx) > Math.abs(nz)) u = nx > 0 ? -z : z;
    else u = nz > 0 ? x : -x;
    uv[i * 2] = u / FACADE_MODULE.w;
    uv[i * 2 + 1] = (y - yBase) / FACADE_MODULE.h;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
