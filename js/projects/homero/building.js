// Maquete procedural do Edifício Dr. Homero Tavares (Barbosa Barros).
// Sistema local do edifício: x aponta para a Rua Humberto Serrano (leste, frente), z para o sul;
// origem no centro da testada. O lote atravessa a quadra até a Rua Romero Botelho (x ≈ −64).
// Volumetria: térreo envidraçado, 2 pavimentos de garagem com ripado de madeira, lazer envidraçado
// no 3º (piscina e deck ao ar livre ao norte, playground/churrasqueira ao sul) e torre do 4º ao 12º
// com 8 apartamentos por andar (ímpares ao norte, pares ao sul). Medidas das colunas 03–06 vêm das
// plantas traçadas (plans.js); as colunas de ponta (01/02/07/08) seguem a planta-chave.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PLAN_03, PLAN_04, PLAN_05, PLAN_06 } from './plans.js';

export const FLOOR_H = 3.06;
export const floorY = f => (f <= 0 ? 0 : f === 1 ? 4.5 : f === 2 ? 7.5 : f === 3 ? 10.5 : 14.7 + (f - 4) * FLOOR_H);
const SLAB = 0.25;
const TOWER_FLOORS = [4, 12];
const TOP = floorY(13);
// colunas (x) e faixas (z) da torre
const XE = -7.9, XW = -51.84;          // fachadas leste (Humberto) e oeste (Romero) dos apartamentos
const BAL = 1.9;                        // varandas das pontas
const COLX = { 1: [-18.3, XE], 2: [-18.3, XE], 3: [-29.87, -18.3], 4: [-29.87, -18.3], 5: [-41.44, -29.87], 6: [-41.44, -29.87], 7: [XW, -41.44], 8: [XW, -41.44] };
const ZN = -8.6, ZS = 10.6, ZMID = 0.95;  // faces norte/sul das pontas e divisa entre 01|02 e 07|08
const PLAN_OF = { 3: PLAN_03, 4: PLAN_04, 5: PLAN_05, 6: PLAN_06 };
const LOT = { x0: -64, x1: 0, z0: -14.5, z1: 14.5 };

export const ORIENT = {
  '+x': { label: 'Leste · Rua Humberto Serrano', short: 'L (Humberto Serrano)', bearing: 99 },
  '-x': { label: 'Oeste · Rua Romero Botelho', short: 'O (Romero Botelho)', bearing: 279 },
  '-z': { label: 'Norte · fachada lateral', short: 'N (lateral)', bearing: 9 },
  '+z': { label: 'Sul · fachada lateral', short: 'S (lateral)', bearing: 189 },
};

// planta (px) → sistema local
const conv = P => { const s = P.scale, [ax, ay] = P.anchor.px, [lx, lz] = P.anchor.local; return ([x, y]) => [lx + (x - ax) * s, lz + (y - ay) * s]; };

// ---------------------------------------------------------------- texturas procedurais
// Atlas de fachada (UV em metros): metade inferior = fachada lateral (janelas), metade superior =
// fachada das pontas (porta de vidro de piso a teto atrás das varandas). Módulo de 3 m × 1 pavimento.
const MOD_W = 3.0, MOD_H = FLOOR_H - SLAB;
function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }
const rnd = (a, b) => a + Math.random() * (b - a);
let TX = null;
function textures() {
  if (TX) return TX;
  const W = 512, HH = 480, H = HH / 2, px = W / MOD_W, py = H / MOD_H;
  const X = m => m * px, Y = (m, row) => row * H + H - m * py; // row 0 = lateral (embaixo no atlas v), row 1 = pontas
  // no canvas o topo é v = 1: a linha "pontas" (v 0.5–1) fica em cima
  const rowTop = r => (r === 1 ? 0 : H);
  const win = { x0: 0.75, x1: 2.25, y0: 0.95, y1: 2.3 };
  const door = { x0: 0.15, x1: 2.85, y0: 0.0, y1: 2.45 };
  const glass = (g, o, top, curtain) => {
    const x0 = X(o.x0), x1 = X(o.x1), y0 = top + H - o.y1 * py, y1 = top + H - o.y0 * py;
    g.fillStyle = 'rgba(70,62,54,.55)'; g.fillRect(x0 - 5, y0 - 5, x1 - x0 + 10, y1 - y0 + 10);
    const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#7d95a3'); gr.addColorStop(0.5, '#43565f'); gr.addColorStop(1, '#5d7180');
    g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.fillStyle = 'rgba(255,255,255,.13)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * 0.4, y0); g.lineTo(x0 + (x1 - x0) * 0.12, y1); g.lineTo(x0, y1); g.fill();
    if (curtain) for (let x = x0; x < x0 + (x1 - x0) * curtain; x += 5) { g.fillStyle = `rgba(238,230,216,${0.5 + 0.25 * Math.sin(x * 0.7)})`; g.fillRect(x, y0, 5, y1 - y0); }
    g.fillStyle = '#2f2c29';
    const nm = Math.max(1, Math.round((o.x1 - o.x0) / 1.1));
    for (let i = 0; i <= nm; i++) { const x = x0 + (x1 - x0) * i / nm; g.fillRect(x - 2.5, y0, 5, y1 - y0); }
    g.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, 5); g.fillRect(x0 - 2, y1 - 3, x1 - x0 + 4, 5);
  };
  const cladding = (g, top, base, joints) => {
    g.fillStyle = base; g.fillRect(0, top, W, H);
    for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? `rgba(70,60,50,${rnd(0.03, 0.1)})` : `rgba(255,255,255,${rnd(0.04, 0.12)})`; g.fillRect(rnd(0, W), top + rnd(0, H), rnd(1, 2), rnd(1, 2)); }
    g.strokeStyle = joints; g.lineWidth = 1.2;
    for (let m = 0; m <= MOD_W + 0.01; m += 0.75) { g.beginPath(); g.moveTo(X(m), top); g.lineTo(X(m), top + H); g.stroke(); }
    for (let m = 0; m <= MOD_H; m += 0.7) { g.beginPath(); g.moveTo(0, top + H - m * py); g.lineTo(W, top + H - m * py); g.stroke(); }
  };
  const color = canvas(W, HH, g => {
    // lateral: revestimento claro (cinza quente) com janelas de caixilho escuro
    cladding(g, rowTop(0), '#e4e0d8', 'rgba(150,140,128,.35)');
    glass(g, win, rowTop(0), 0.3);
    // pontas: painéis em fendi/taupe e porta de vidro de piso a teto
    cladding(g, rowTop(1), '#ab9a84', 'rgba(90,78,64,.4)');
    glass(g, door, rowTop(1), 0.25);
  });
  // à noite: luz quente mais forte no alto do vão, cortina de linho filtrando parte dela
  const litRect = (g, o, top, curtain) => {
    const x0 = X(o.x0), x1 = X(o.x1), y0 = top + H - o.y1 * py, y1 = top + H - o.y0 * py;
    const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#fff0d2'); gr.addColorStop(0.55, '#ffd49a'); gr.addColorStop(1, '#c98a4a');
    g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let x = x0; x < x0 + (x1 - x0) * curtain; x += 5) { g.fillStyle = `rgba(0,0,0,${0.35 + 0.15 * Math.sin(x * 0.7)})`; g.fillRect(x, y0, 5, y1 - y0); }
    g.fillStyle = '#000'; const nm = Math.max(1, Math.round((o.x1 - o.x0) / 1.1));
    for (let i = 0; i <= nm; i++) { const x = x0 + (x1 - x0) * i / nm; g.fillRect(x - 2.5, y0, 5, y1 - y0); }
  };
  const mask = canvas(W, HH, g => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, HH);
    litRect(g, win, rowTop(0), 0.3); litRect(g, door, rowTop(1), 0.25);
  });
  // relevo: juntas do revestimento levemente fundas, vãos recuados e caixilhos salientes
  const bump = canvas(W, HH, g => {
    g.fillStyle = 'rgb(170,170,170)'; g.fillRect(0, 0, W, HH);
    g.strokeStyle = 'rgb(120,120,120)'; g.lineWidth = 2;
    for (const top of [rowTop(0), rowTop(1)]) {
      for (let m = 0; m <= MOD_W + 0.01; m += 0.75) { g.beginPath(); g.moveTo(X(m), top); g.lineTo(X(m), top + H); g.stroke(); }
      for (let m = 0; m <= MOD_H; m += 0.7) { g.beginPath(); g.moveTo(0, top + H - m * py); g.lineTo(W, top + H - m * py); g.stroke(); }
    }
    for (const [o, top] of [[win, rowTop(0)], [door, rowTop(1)]]) {
      const x0 = X(o.x0), x1 = X(o.x1), y0 = top + H - o.y1 * py, y1 = top + H - o.y0 * py;
      g.fillStyle = 'rgb(205,205,205)'; g.fillRect(x0 - 7, y0 - 7, x1 - x0 + 14, y1 - y0 + 14);
      g.fillStyle = 'rgb(60,60,60)'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.fillStyle = 'rgb(110,110,110)'; const nm = Math.max(1, Math.round((o.x1 - o.x0) / 1.1));
      for (let i = 0; i <= nm; i++) { const x = x0 + (x1 - x0) * i / nm; g.fillRect(x - 2.5, y0, 5, y1 - y0); }
    }
  });
  const rough = canvas(W, HH, g => {
    g.fillStyle = 'rgb(0,215,0)'; g.fillRect(0, 0, W, HH); g.fillStyle = 'rgb(0,30,0)';
    g.fillRect(X(win.x0), rowTop(0) + H - win.y1 * py, X(win.x1) - X(win.x0), (win.y1 - win.y0) * py);
    g.fillRect(X(door.x0), rowTop(1) + H - door.y1 * py, X(door.x1) - X(door.x0), (door.y1 - door.y0) * py);
  });
  // ripado vertical de madeira (garagens), 1 m × 1 m
  const slats = canvas(256, 256, g => {
    g.fillStyle = '#3b2d22'; g.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 16) {
      const v = rnd(-14, 14), gr = g.createLinearGradient(x, 0, x + 11, 0);
      gr.addColorStop(0, `rgb(${150 + v},${110 + v},${74 + v})`); gr.addColorStop(1, `rgb(${118 + v},${84 + v},${54 + v})`);
      g.fillStyle = gr; g.fillRect(x, 0, 11, 256);
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(70,45,25,.15)'; g.fillRect(x + rnd(1, 10), rnd(0, 256), 1, rnd(20, 90)); }
    }
  });
  // pedra do térreo e muros
  const stone = canvas(256, 256, g => {
    g.fillStyle = '#b9b2a6'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) { g.fillStyle = Math.random() < 0.5 ? `rgba(60,55,48,${rnd(0.05, 0.18)})` : `rgba(255,255,255,${rnd(0.05, 0.15)})`; g.fillRect(rnd(0, 256), rnd(0, 256), rnd(1, 3), rnd(1, 3)); }
    g.strokeStyle = 'rgba(90,84,74,.4)'; g.lineWidth = 1.5;
    for (let y = 0; y <= 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    for (let r = 0; r < 4; r++) for (let x = (r % 2) * 64; x <= 256; x += 128) { g.beginPath(); g.moveTo(x, r * 64); g.lineTo(x, r * 64 + 64); g.stroke(); }
  });
  const deck = canvas(256, 256, g => {
    for (let y = 0; y < 256; y += 16) { const v = rnd(-12, 12); g.fillStyle = `rgb(${168 + v},${128 + v},${92 + v})`; g.fillRect(0, y, 256, 14); g.fillStyle = 'rgba(60,40,25,.6)'; g.fillRect(0, y + 14, 256, 2); }
  });
  // venezianas metálicas das áreas técnicas (condensadoras), 1 m × 1 m
  const louver = canvas(128, 128, g => {
    g.clearRect(0, 0, 128, 128);
    for (let y = 2; y < 128; y += 10) { const gr = g.createLinearGradient(0, y, 0, y + 7); gr.addColorStop(0, '#8d7f6d'); gr.addColorStop(1, '#5d5246'); g.fillStyle = gr; g.fillRect(0, y, 128, 7); }
  });
  const white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); white.needsUpdate = true;
  TX = { louver: tex(louver), bump: tex(bump, false), map: tex(color), emissiveMap: tex(mask), roughnessMap: tex(rough, false), slats: tex(slats), stone: tex(stone), deck: tex(deck), white };
  return TX;
}

// UV do atlas: u = metros ao longo da face / módulo; v = altura / pavimento, em metade do atlas por tipo de face
function atlasUV(geo, y0, frontAxis = 'x') {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), nx = nor.getX(i), ny = nor.getY(i), nz = nor.getZ(i);
    let u, row;
    if (Math.abs(ny) > 0.5) { u = x; row = 0; }
    else if (Math.abs(nx) > Math.abs(nz)) { u = nx > 0 ? -z : z; row = frontAxis === 'x' ? 1 : 0; }
    else { u = nz > 0 ? x : -x; row = frontAxis === 'z' ? 1 : 0; }
    const t = Math.min(0.999, Math.max(0.001, (y - y0) / MOD_H));
    uv[i * 2] = u / MOD_W; uv[i * 2 + 1] = row * 0.5 + t * 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function uvMeters(geo, s = 1) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
    if (ny > 0.5) { uv[i * 2] = x / s; uv[i * 2 + 1] = z / s; }
    else if (nx > Math.abs(nor.getZ(i))) { uv[i * 2] = z / s; uv[i * 2 + 1] = y / s; }
    else { uv[i * 2] = x / s; uv[i * 2 + 1] = y / s; }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function makeMaterials() {
  const T = textures();
  const M = o => new THREE.MeshStandardMaterial(o);
  return {
    slab: M({ color: 0xf1eee8, roughness: 0.75 }),
    soffit: M({ color: 0xe9e5dd, roughness: 0.85 }),
    fin: M({ color: 0xa49480, roughness: 0.7 }),
    led: M({ color: 0xfff6e8, emissive: 0xfff1da, emissiveIntensity: 0.5, roughness: 0.4 }),
    glassRail: M({ color: 0xc7dbe2, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
    railTop: M({ color: 0x2d2b29, roughness: 0.4, metalness: 0.7 }),
    curtainGlass: M({ color: 0x4f6f80, roughness: 0.04, metalness: 0.85, envMapIntensity: 1.4 }),
    mullion: M({ color: 0x26292c, roughness: 0.45, metalness: 0.6 }),
    slats: M({ map: T.slats, roughness: 0.75 }),
    stone: M({ map: T.stone, roughness: 0.9 }),
    concrete: M({ color: 0xd6d0c6, roughness: 0.9 }),
    core: M({ color: 0xe7e3dc, roughness: 0.85 }),
    roof: M({ color: 0xc9c5bd, roughness: 0.95 }),
    deck: M({ map: T.deck, roughness: 0.8 }),
    paving: M({ map: T.stone, color: 0xd8d2c8, roughness: 0.9 }),
    water: M({ color: 0x48b6c8, roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.9, emissive: 0x0b4652, emissiveIntensity: 0.35 }),
    poolTile: M({ color: 0x6bb7b6, roughness: 0.3 }),
    grass: M({ color: 0x6d9a48, roughness: 1 }),
    trunk: M({ color: 0x6b5241, roughness: 1 }),
    green: M({ color: 0x4d7a35, roughness: 0.9 }),
    frond: M({ color: 0x5f8d3e, roughness: 0.85 }),
    blossom: M({ color: 0xb46aa0, roughness: 0.9 }),
    playground: M({ color: 0x4f9a6a, roughness: 0.95 }),
    louver: M({ map: T.louver, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.35 }),
  };
}
function unitMaterial() {
  const T = textures();
  return new THREE.MeshStandardMaterial({ map: T.map, emissiveMap: T.emissiveMap, roughnessMap: T.roughnessMap, bumpMap: T.bump, bumpScale: 3, roughness: 1, metalness: 0.05, transparent: true });
}

function tree(mats, h, blossom) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, h * 0.55, 7), mats.trunk);
  trunk.position.y = h * 0.27; trunk.castShadow = true; g.add(trunk);
  for (let i = 0; i < 5; i++) {
    const r = h * (0.17 + Math.random() * 0.1);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), blossom && i % 2 ? mats.blossom : (i % 2 ? mats.green : mats.frond));
    crown.position.set((Math.random() - 0.5) * h * 0.35, h * (0.58 + Math.random() * 0.22), (Math.random() - 0.5) * h * 0.35);
    crown.scale.y = 0.8; crown.castShadow = true; g.add(crown);
  }
  return g;
}
function palm(mats, h) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, h, 7), mats.trunk);
  trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
  const lg = new THREE.ConeGeometry(0.35, 2.4, 4); lg.rotateX(Math.PI / 2); lg.translate(0, 0, 1.2); lg.scale(1, 0.25, 1);
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(lg, mats.frond); leaf.position.y = h;
    leaf.rotation.order = 'YXZ'; leaf.rotation.y = i / 9 * Math.PI * 2; leaf.rotation.x = 0.35 + Math.random() * 0.3;
    leaf.castShadow = true; g.add(leaf);
  }
  return g;
}

// laje-tipo: avança 35 cm além das fachadas longas; cantos das pontas arredondados
const SLAB_PTS = [[XE + 0.15, ZN - 0.35], [XE + 0.15, ZS + 0.35], [-18.3, ZS + 0.35], [-18.3, 10.22], [-41.44, 10.22], [-41.44, ZS + 0.35], [XW - 0.15, ZS + 0.35], [XW - 0.15, ZN - 0.35], [-41.44, ZN - 0.35], [-41.44, -8.22], [-18.3, -8.22], [-18.3, ZN - 0.35]];
const SLAB_R = [1.5, 1.5, 0, 0, 0, 0, 1.5, 1.5, 0, 0, 0, 0];

// ---------------------------------------------------------------- construção
export function buildHomero(units) {
  const mats = makeMaterials();
  const group = new THREE.Group(); group.name = 'Homero';
  const unitMeshes = [];
  const add = (geo, mat, { cast = true, receive = true, occlude = true, parent = group } = {}) => {
    const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; m.userData.occluder = occlude; parent.add(m); return m;
  };
  const box = (x0, x1, y0, y1, z0, z1) => { const g = new THREE.BoxGeometry(Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0)); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return g; };
  // contorno → Shape, com raio opcional por vértice (cantos arredondados das pontas da torre)
  const shapeOf = (pts, radii) => {
    let P = pts.map(p => [...p]), Rr = radii ? [...radii] : P.map(() => 0);
    if (!THREE.ShapeUtils.isClockWise(P.map(([x, z]) => new THREE.Vector2(x, z)))) { P = P.reverse(); Rr = Rr.reverse(); }
    const sh = new THREE.Shape(), n = P.length;
    for (let i = 0; i < n; i++) {
      const p = P[i], prev = P[(i - 1 + n) % n], next = P[(i + 1) % n], r = Rr[i] || 0;
      if (!r) { i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]); continue; }
      const d1 = Math.hypot(prev[0] - p[0], prev[1] - p[1]), d2 = Math.hypot(next[0] - p[0], next[1] - p[1]), k = Math.min(r, d1 / 2.05, d2 / 2.05);
      const a = [p[0] + (prev[0] - p[0]) / d1 * k, p[1] + (prev[1] - p[1]) / d1 * k], b = [p[0] + (next[0] - p[0]) / d2 * k, p[1] + (next[1] - p[1]) / d2 * k];
      i ? sh.lineTo(a[0], a[1]) : sh.moveTo(a[0], a[1]);
      sh.quadraticCurveTo(p[0], p[1], b[0], b[1]);
    }
    sh.closePath(); return sh;
  };
  const extrude = (pts, y0, h, radii, hole) => {
    const sh = shapeOf(pts, radii);
    if (hole) sh.holes.push(new THREE.Path(shapeOf(hole.pts, hole.radii).getPoints(6)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 6 });
    g.rotateX(Math.PI / 2); g.translate(0, y0 + h, 0); return g;
  };
  const panel = (a, b, y0, h, t = 0.02) => { // placa vertical entre dois pontos (x,z)
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), g = new THREE.BoxGeometry(L, h, t);
    g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0])); g.translate((a[0] + b[0]) / 2, y0 + h / 2, (a[1] + b[1]) / 2); return g;
  };

  // ======================= embasamento =======================
  const PX0 = -2, PX1 = -62; // térreo e garagens ocupam o lote com recuo de 2 m nas duas ruas
  // térreo: vidro nas duas frentes (lobby/loja), pedra nas divisas
  add(box(PX0 - 0.6, PX1 + 0.6, 0, 4.2, LOT.z0 + 0.3, LOT.z1 - 0.3), mats.stone);
  for (const x of [PX0 - 0.3, PX1 + 0.3]) {
    add(box(x - 0.05, x + 0.05, 0.05, 4.1, LOT.z0 + 1.2, LOT.z1 - 1.2), mats.curtainGlass, { occlude: false });
    for (let z = LOT.z0 + 1.2; z <= LOT.z1 - 1.19; z += 2.6) add(box(x - 0.08, x + 0.08, 0, 4.2, z - 0.05, z + 0.05), mats.mullion, { cast: false, occlude: false });
  }
  // garagens (1º e 2º): ripado de madeira nas frentes, concreto nas divisas
  const garH0 = 4.5, garH1 = 10.5;
  add(box(PX0, PX1, 4.2, garH1, LOT.z0, LOT.z1), mats.concrete);
  for (const [x, dir] of [[PX0, 1], [PX1, -1]]) {
    const g = box(x + dir * 0.02, x + dir * 0.14, garH0 - 0.3, garH1 - 0.1, LOT.z0, LOT.z1); uvMeters(g, 1);
    add(g, mats.slats, { occlude: false });
    // friso luminoso em degrau (como na perspectiva): sobe no centro da fachada
    const yA = garH0 + 0.4, yB = garH1 - 0.9, zs = [LOT.z0, -2.5, 1.5, LOT.z1];
    const ledG = [panel([x + dir * 0.16, zs[0]], [x + dir * 0.16, zs[1]], yA, 0.08, 0.04), panel([x + dir * 0.16, zs[2]], [x + dir * 0.16, zs[3]], yB, 0.08, 0.04)];
    const diag = new THREE.BoxGeometry(0.04, 0.08, Math.hypot(zs[2] - zs[1], yB - yA)); diag.rotateX(Math.atan2(yB - yA, zs[2] - zs[1]) * (dir > 0 ? -1 : -1)); diag.translate(x + dir * 0.16, (yA + yB) / 2 + 0.04, (zs[1] + zs[2]) / 2);
    ledG.push(diag);
    add(mergeGeometries(ledG), mats.led, { cast: false, occlude: false });
  }
  // laje de cobertura das garagens (deck do lazer)
  add(box(PX0 + 0.2, PX1 - 0.2, garH1, garH1 + 0.05, LOT.z0 + 0.1, LOT.z1 - 0.1), mats.paving, { cast: false });
  // lazer (3º): caixa de vidro sob a torre
  const lzY0 = floorY(3) + 0.05, lzY1 = floorY(4) - SLAB;
  const LZ = { x0: -6.2, x1: -53.5, z0: ZN + 0.4, z1: ZS - 0.4 };
  add(box(LZ.x0 - 0.3, LZ.x1 + 0.3, lzY0, lzY0 + 0.1, LZ.z0 - 0.2, LZ.z1 + 0.2), mats.slab);
  const lzGlass = [], lzMull = [];
  for (const [a, b] of [[[LZ.x0, LZ.z0], [LZ.x0, LZ.z1]], [[LZ.x1, LZ.z0], [LZ.x1, LZ.z1]], [[LZ.x0, LZ.z0], [LZ.x1, LZ.z0]], [[LZ.x0, LZ.z1], [LZ.x1, LZ.z1]]]) {
    lzGlass.push(panel(a, b, lzY0, lzY1 - lzY0, 0.04));
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 1.6);
    for (let i = 0; i <= n; i++) { const t = i / n; lzMull.push(box(a[0] + (b[0] - a[0]) * t - 0.04, a[0] + (b[0] - a[0]) * t + 0.04, lzY0, lzY1, a[1] + (b[1] - a[1]) * t - 0.04, a[1] + (b[1] - a[1]) * t + 0.04)); }
    lzMull.push(panel([a[0], a[1]], [b[0], b[1]], lzY0 + 2.1, 0.06, 0.07));
  }
  add(mergeGeometries(lzGlass), mats.curtainGlass, { occlude: true });
  add(mergeGeometries(lzMull), mats.mullion, { cast: false, occlude: false });
  // interior do lazer (núcleo opaco recuado, dá profundidade ao vidro)
  add(box(LZ.x0 - 4, LZ.x1 + 4, lzY0, lzY1, LZ.z0 + 3, LZ.z1 - 3), mats.core, { cast: false });
  // piscina e deck ao norte; playground, gramado e churrasqueira ao sul (planta do lazer)
  add(box(-8.5, -29.5, garH1 + 0.05, garH1 + 0.12, LOT.z0 + 0.4, ZN + 0.2), mats.deck, { cast: false });
  add(box(-10, -24, garH1 + 0.12, garH1 + 0.3, -13.7, -10.3), mats.poolTile, { cast: false });
  add(box(-10.15, -23.85, garH1 + 0.3, garH1 + 0.33, -13.55, -10.45), mats.water, { cast: false, occlude: false });
  add(box(-14, -24, garH1 + 0.05, garH1 + 0.1, ZS - 0.2, LOT.z1 - 0.4), mats.grass, { cast: false });
  add(box(-14, -18, garH1 + 0.1, garH1 + 0.14, ZS + 0.4, LOT.z1 - 0.8), mats.playground, { cast: false });
  // guarda-corpo de vidro em volta do deck do lazer
  {
    const y = garH1 + 0.05, rails = [], tops = [];
    const loop = [[PX0 + 0.3, LOT.z0 + 0.3], [PX0 + 0.3, LOT.z1 - 0.3], [PX1 - 0.3, LOT.z1 - 0.3], [PX1 - 0.3, LOT.z0 + 0.3], [PX0 + 0.3, LOT.z0 + 0.3]];
    for (let i = 1; i < loop.length; i++) { rails.push(panel(loop[i - 1], loop[i], y, 1.1, 0.02)); tops.push(panel(loop[i - 1], loop[i], y + 1.1, 0.04, 0.05)); }
    add(mergeGeometries(rails), mats.glassRail, { cast: false, occlude: false });
    add(mergeGeometries(tops), mats.railTop, { cast: false, occlude: false });
  }
  // árvores e palmeiras do deck e das calçadas (como nas perspectivas)
  const deco = new THREE.Group(); group.add(deco);
  for (const [x, z, h, b] of [[-26.5, -12.6, 5, false], [-28.5, 12.6, 5.2, true], [-6.5, 12.8, 4.6, false], [-57, -12.5, 5, true], [-57, 12.5, 4.8, false]]) { const t = tree(mats, h, b); t.position.set(x, garH1 + 0.1, z); deco.add(t); }
  for (const [x, z] of [[-4.6, -11], [-4.4, 8.8], [-60, -8], [-60, 9]]) { const p = palm(mats, 5 + Math.random() * 2); p.position.set(x, garH1 + 0.1, z); deco.add(p); }
  for (const [x, z, b] of [[2.5, -12, true], [2.8, 0.5, false], [2.4, 12.5, true], [-66.5, -11, false], [-66.5, 4, true], [-66.4, 13, false]]) { const t = tree(mats, 6 + Math.random() * 2, b); t.position.set(x, 0, z); deco.add(t); }
  deco.traverse(o => { if (o.isMesh) o.userData.occluder = true; });

  // ======================= torre =======================
  const byName = new Map(units.map(u => [u.name, u]));
  const ledGeo = [], finGeo = [];
  for (let f = TOWER_FLOORS[0]; f <= TOWER_FLOORS[1] + 1; f++) {
    const y = floorY(f), floorGroup = new THREE.Group(); floorGroup.name = 'pav-' + f; group.add(floorGroup);
    // laje do pavimento (sobressai 15 cm das fachadas laterais) + lajes das varandas das pontas
    add(extrude(SLAB_PTS, y - SLAB, SLAB, SLAB_R), mats.slab, { parent: floorGroup });
    // pilastras em fendi entre as colunas das fachadas longas (ritmo vertical da perspectiva)
    if (f <= TOWER_FLOORS[1]) for (const x of [-18.3, -29.87, -41.44]) for (const [z, d] of [[-7.87, -1], [9.87, 1]]) {
      const zf = (x === -29.87) ? z : (d < 0 ? ZN : ZS);
      add(box(x - 0.32, x + 0.32, y, y + FLOOR_H - SLAB, zf, zf + d * 0.42), mats.fin, { parent: floorGroup });
    }
    if (f > TOWER_FLOORS[1]) break; // laje de cobertura
    for (const dir of [1, -1]) {
      // varanda das pontas em "bumerangue": mais funda no centro, com friso de LED sob a borda
      const xF = dir > 0 ? XE : XW, xO = xF + dir * BAL, xC = xF + dir * (BAL - 0.45);
      const pts = [[xF, ZN - 0.35], [xC, ZN + 0.15], [xO, ZMID], [xC, ZS - 0.15], [xF, ZS + 0.35]];
      add(extrude(pts, y - SLAB - 0.1, SLAB + 0.1), mats.slab, { parent: floorGroup });
      for (let i = 1; i < pts.length; i++) {
        const a = [pts[i - 1][0] - dir * 0.04, pts[i - 1][1]], b = [pts[i][0] - dir * 0.04, pts[i][1]];
        ledGeo.push(panel(a, b, y - SLAB - 0.14, 0.04, 0.05));
      }
      // guarda-corpo de vidro
      const rg = [], tg = [];
      for (let i = 1; i < pts.length; i++) {
        const a = [pts[i - 1][0] - dir * 0.08, pts[i - 1][1]], b = [pts[i][0] - dir * 0.08, pts[i][1]];
        rg.push(panel(a, b, y, 1.05, 0.02)); tg.push(panel(a, b, y + 1.05, 0.04, 0.05));
      }
      add(mergeGeometries(rg), mats.glassRail, { cast: false, occlude: false, parent: floorGroup });
      add(mergeGeometries(tg), mats.railTop, { cast: false, occlude: false, parent: floorGroup });
      // molduras laterais das pontas (painéis fendi que emolduram as varandas)
      for (const z of [ZN - 0.35, ZS + 0.35]) finGeo.push(box(xF, xF + dir * (BAL - 0.25), y - SLAB, y + FLOOR_H - SLAB, z - 0.18, z + 0.18));
    }
    // corredor/núcleo (interno)
    add(box(-41.44, -18.3, y, y + FLOOR_H - SLAB, -0.95, 2.95), mats.core, { cast: false, parent: floorGroup });
    // apartamentos
    for (let c = 1; c <= 8; c++) {
      const name = String(f * 100 + c), u = byName.get(name);
      if (!u) continue;
      const odd = c % 2 === 1, [x0, x1] = COLX[c];
      const plan = PLAN_OF[c];
      let shell, rails = [];
      if (plan) {
        const cv = conv(plan);
        shell = plan.shell.map(cv);
        rails = plan.rails.map(r => r.map(cv));
      } else {
        shell = odd ? [[x0, ZN], [x1, ZN], [x1, ZMID], [x0, ZMID]] : [[x0, ZMID], [x1, ZMID], [x1, ZS], [x0, ZS]];
      }
      const h = FLOOR_H - SLAB;
      // canto externo arredondado nas colunas de ponta (01/02 na Humberto Serrano, 07/08 na Romero Botelho)
      const radii = plan ? null : shell.map(([x, z]) => (Math.abs(z - ZN) < 0.01 || Math.abs(z - ZS) < 0.01) && (Math.abs(x - XE) < 0.01 || Math.abs(x - XW) < 0.01) ? 1.35 : 0);
      const geo = extrude(shell, y, h, radii);
      atlasUV(geo, y, plan ? 'none' : 'x');
      const mesh = new THREE.Mesh(geo, unitMaterial());
      mesh.castShadow = mesh.receiveShadow = true;
      floorGroup.add(mesh);
      // trilhos de vidro das varandas em recuo (colunas 03–06)
      if (rails.length) {
        const rg = [], tg = [];
        const louv = [];
        rails.forEach((r, k) => {
          for (let i = 1; i < r.length; i++) {
            // a 3ª linha de cada planta é a área técnica (split): veneziana de piso a teto, como na perspectiva
            if (k === 2) { const g = panel(r[i - 1], r[i], y, FLOOR_H - SLAB, 0.03); uvMeters(g, 1); louv.push(g); continue; }
            rg.push(panel(r[i - 1], r[i], y, 1.05, 0.02)); tg.push(panel(r[i - 1], r[i], y + 1.05, 0.04, 0.05));
          }
        });
        if (louv.length) add(mergeGeometries(louv), mats.louver, { cast: false, occlude: false, parent: floorGroup });
        add(mergeGeometries(rg), mats.glassRail, { cast: false, occlude: false, parent: floorGroup });
        add(mergeGeometries(tg), mats.railTop, { cast: false, occlude: false, parent: floorGroup });
        // laje das varandas que avançam além da fachada (03 e 06)
        for (const r of rails) if (r.length >= 4) add(extrude(r, y - SLAB, SLAB), mats.slab, { parent: floorGroup });
      }
      const sides = odd ? { '-z': true } : { '+z': true };
      if (c <= 2) sides['+x'] = true; if (c >= 7) sides['-x'] = true;
      const xs = shell.map(p => p[0]), zs = shell.map(p => p[1]);
      const b = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0: y, h };
      mesh.userData = {
        unit: u, floors: [f], sides, box: b, tower: false, occluder: true, poly: true,
        typeShort: `Coluna ${String(c).padStart(2, '0')}`,
        emissiveMap: textures().emissiveMap,
        lit: true, litI: 0.5 + Math.random() * 0.45, litColor: new THREE.Color().setHSL(0.09 + Math.random() * 0.04, 0.85, 0.62 + Math.random() * 0.12),
      };
      unitMeshes.push(mesh);
    }
  }
  // cobertura: platibanda branca alta (como na perspectiva) e casa de máquinas sobre o núcleo
  {
    const y = TOP;
    const outer = [[XE + 0.15, ZN - 0.35], [XE + 0.15, ZS + 0.35], [XW - 0.15, ZS + 0.35], [XW - 0.15, ZN - 0.35]];
    const inner = [[XE - 0.15, ZN - 0.05], [XE - 0.15, ZS + 0.05], [XW + 0.15, ZS + 0.05], [XW + 0.15, ZN - 0.05]];
    add(extrude(outer, y, 1.7, [1.5, 1.5, 1.5, 1.5], { pts: inner, radii: [1.2, 1.2, 1.2, 1.2] }), mats.slab);
    // friso de LED no topo da platibanda (como na perspectiva)
    for (let i = 0; i < 4; i++) { const a = outer[i], b = outer[(i + 1) % 4]; ledGeo.push(panel(a, b, y + 1.25, 0.05, 0.02)); }
    add(box(-21, -38, y, y + 4.2, -1.6, 3.6), mats.core);
    add(box(XE - 0.5, XW + 0.5, y + 0.02, y + 0.06, ZN + 0.3, ZS - 0.3), mats.roof, { cast: false });
  }

  add(mergeGeometries(finGeo), mats.fin);
  const led = add(mergeGeometries(ledGeo), mats.led, { cast: false, occlude: false });
  led.name = 'led';
  // ======================= amostras de insolação e vistas =======================
  // amostras na linha do guarda-corpo das varandas, 1 m acima do piso
  unitMeshes.forEach(m => {
    const { box: b, sides, floors } = m.userData, y = floors[0] ? floorY(floors[0]) + 1.0 : 1;
    const c = Number(m.userData.unit.name.slice(-2)), plan = PLAN_OF[c], pts = [];
    if (plan) {
      const cv = conv(plan);
      for (const r of plan.rails.slice(0, 2)) {
        const a = cv(r[0]), z = r.length >= 4 ? cv(r[1])[1] : a[1];
        const e = cv(r[r.length - 1]);
        const zz = Math.abs(z) > Math.abs(e[1]) ? z : e[1];
        for (const t of [0.2, 0.5, 0.8]) {
          const x = a[0] + (e[0] - a[0]) * t;
          pts.push({ side: sides['-z'] ? '-z' : '+z', p: [x, y, zz + (sides['-z'] ? -0.15 : 0.15)], n: [0, 0, sides['-z'] ? -1 : 1] });
        }
      }
    } else {
      const zEdge = sides['-z'] ? ZN - 0.15 : ZS + 0.15;
      for (const t of [0.25, 0.75]) pts.push({ side: sides['-z'] ? '-z' : '+z', p: [b.x0 + (b.x1 - b.x0) * t, y, zEdge], n: [0, 0, sides['-z'] ? -1 : 1] });
      const front = sides['+x'] ? '+x' : '-x', xEdge = front === '+x' ? XE + BAL + 0.1 : XW - BAL - 0.1;
      for (const t of [0.2, 0.5, 0.8]) pts.push({ side: front, p: [xEdge, y, b.z0 + (b.z1 - b.z0) * t], n: [front === '+x' ? 1 : -1, 0, 0] });
    }
    m.userData.samples = pts;
    m.userData.center = new THREE.Vector3((b.x0 + b.x1) / 2, b.y0 + b.h / 2, (b.z0 + b.z1) / 2);
    // vista "da varanda": pontas olham para a rua; colunas centrais para o lado norte/sul
    const main = sides['+x'] ? '+x' : sides['-x'] ? '-x' : (sides['-z'] ? '-z' : '+z');
    const eye = main === '+x' ? [XE + 1.2, b.y0 + 1.6, (b.z0 + b.z1) / 2] : main === '-x' ? [XW - 1.2, b.y0 + 1.6, (b.z0 + b.z1) / 2]
      : main === '-z' ? [(b.x0 + b.x1) / 2, b.y0 + 1.6, b.z0 - 0.4] : [(b.x0 + b.x1) / 2, b.y0 + 1.6, b.z1 + 0.4];
    m.userData.view = { side: main, eye };
  });

  // menos chamadas de desenho: junta as peças estáticas de cada pavimento (e do embasamento) por material.
  // Os apartamentos continuam separados (destaque, cores e clique por unidade).
  const unitSet = new Set(unitMeshes);
  const mergeByMaterial = (parent, deep = false) => {
    const buckets = new Map();
    parent.updateMatrixWorld(true);
    const inv = parent.matrixWorld.clone().invert();
    const list0 = [];
    if (deep) parent.traverse(o => { if (o !== parent) list0.push(o); }); else list0.push(...parent.children);
    for (const o of list0) {
      if (!o.isMesh || unitSet.has(o) || o.isInstancedMesh) continue;
      const k = o.material.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(o);
    }
    for (const list of buckets.values()) {
      if (list.length < 2) continue;
      const geos = list.map(o => { const mtx = inv.clone().multiply(o.matrixWorld); const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(mtx); g.clearGroups(); for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n); return g; });
      const merged = mergeGeometries(geos);
      if (!merged) continue;
      const m = new THREE.Mesh(merged, list[0].material);
      m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; m.userData.occluder = list.some(o => o.userData.occluder);
      list.forEach(o => { o.parent.remove(o); o.geometry.dispose(); });
      parent.add(m);
    }
  };
  group.children.filter(o => o.isGroup && o.name.startsWith('pav-')).forEach(mergeByMaterial);
  mergeByMaterial(deco, true);
  mergeByMaterial(group);

  return {
    group, unitMeshes, mats, height: TOP + 4.2,
    // LEDs das lajes: discretos de dia, acesos à noite
    onNight(night) { mats.led.emissiveIntensity = 0.35 + 2.6 * night; },
  };
}
