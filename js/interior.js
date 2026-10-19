// Tour interno das unidades: converte a planta oficial (traçada em px) em 3D e navega estilo Street View.
// Tudo é montado no sistema local do edifício (x → mar, z → SSO), como filho do grupo do Apogeo,
// para que o sol, as sombras e a vista pelas janelas sejam os reais da maquete.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// ---------------------------------------------------------------- texturas procedurais (PBR simples)
function canvasTex(size, draw, repeatMeters, srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / repeatMeters, 1 / repeatMeters);
  t.anisotropy = 16;
  return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);
function noise(g, n, alpha, light) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(${light ? '255,255,255' : '0,0,0'},${Math.random() * alpha})`;
    g.fillRect(Math.random() * g.canvas.width, Math.random() * g.canvas.height, rnd(1, 3), rnd(1, 3));
  }
}
function makeMaterials() {
  // porcelanato 90×90 (social): 4×4 peças por textura
  const porcelain = canvasTex(2048, (g, S) => {
    const n = 4, w = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = rnd(-6, 6);
      g.fillStyle = `rgb(${232 + v},${227 + v},${219 + v})`; g.fillRect(i * w, j * w, w, w);
    }
    noise(g, 9000, 0.05, false); noise(g, 5000, 0.06, true);
    g.strokeStyle = 'rgba(150,140,125,.6)'; g.lineWidth = 3;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * w, 0); g.lineTo(i * w, S); g.stroke(); g.beginPath(); g.moveTo(0, i * w); g.lineTo(S, i * w); g.stroke(); }
  }, 3.6);
  // assoalho de carvalho (suítes): réguas de 20 cm
  const wood = canvasTex(2048, (g, S) => {
    const rows = 8, h = S / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rnd(0, S / 2);
      while (x < S) {
        const L = rnd(S * 0.35, S * 0.7), v = rnd(-14, 14);
        const grd = g.createLinearGradient(0, r * h, 0, r * h + h);
        grd.addColorStop(0, `rgb(${178 + v},${142 + v},${104 + v})`); grd.addColorStop(1, `rgb(${164 + v},${128 + v},${92 + v})`);
        g.fillStyle = grd; g.fillRect(x, r * h, L, h);
        g.strokeStyle = `rgba(90,60,30,.08)`; g.lineWidth = 1;
        for (let k = 0; k < 7; k++) { const yy = r * h + rnd(3, h - 3); g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + L * 0.3, yy + rnd(-4, 4), x + L * 0.7, yy + rnd(-4, 4), x + L, yy); g.stroke(); }
        g.fillStyle = 'rgba(70,45,25,.35)'; g.fillRect(x, r * h, 2, h);
        x += L;
      }
      g.fillStyle = 'rgba(70,45,25,.3)'; g.fillRect(0, r * h, S, 2);
    }
  }, 1.6);
  // mármore claro (banhos e bancadas)
  const marble = canvasTex(2048, (g, S) => {
    g.fillStyle = '#efedea'; g.fillRect(0, 0, S, S);
    noise(g, 6000, 0.04, false);
    for (let k = 0; k < 14; k++) {
      g.strokeStyle = `rgba(120,120,125,${rnd(0.08, 0.28)})`; g.lineWidth = rnd(0.6, 2.2);
      g.beginPath(); let x = rnd(0, S), y = 0; g.moveTo(x, y);
      while (y < S) { x += rnd(-40, 40); y += rnd(20, 60); g.lineTo(x, y); }
      g.stroke();
    }
  }, 1.4);
  const tile = canvasTex(512, (g, S) => {
    g.fillStyle = '#dcd8d2'; g.fillRect(0, 0, S, S); noise(g, 3000, 0.05, false);
    g.strokeStyle = 'rgba(140,135,128,.6)'; g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * S / 4, 0); g.lineTo(i * S / 4, S); g.stroke(); g.beginPath(); g.moveTo(0, i * S / 4); g.lineTo(S, i * S / 4); g.stroke(); }
  }, 2.4);
  const deck = canvasTex(1024, (g, S) => {
    const n = 2, w = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = rnd(-5, 5); g.fillStyle = `rgb(${214 + v},${206 + v},${192 + v})`; g.fillRect(i * w, j * w, w, w); }
    noise(g, 16000, 0.07, false); noise(g, 8000, 0.08, true);
    g.strokeStyle = 'rgba(150,140,120,.6)'; g.lineWidth = 3;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * w, 0); g.lineTo(i * w, S); g.stroke(); g.beginPath(); g.moveTo(0, i * w); g.lineTo(S, i * w); g.stroke(); }
  }, 2.4);
  const linen = canvasTex(512, (g, S) => { g.fillStyle = '#ece6dc'; g.fillRect(0, 0, S, S); noise(g, 4000, 0.06, false); for (let i = 0; i < S; i += 3) { g.fillStyle = 'rgba(0,0,0,.025)'; g.fillRect(i, 0, 1, S); g.fillRect(0, i, S, 1); } }, 0.6);
  const oak = canvasTex(512, (g, S) => {
    g.fillStyle = '#b08960'; g.fillRect(0, 0, S, S);
    for (let k = 0; k < 90; k++) { g.strokeStyle = `rgba(80,52,28,${rnd(0.04, 0.14)})`; g.lineWidth = rnd(0.5, 2); const y = rnd(0, S); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(S * 0.3, y + rnd(-8, 8), S * 0.6, y + rnd(-8, 8), S, y + rnd(-6, 6)); g.stroke(); }
  }, 1.2);
  // massa corrida/tinta acrílica: leve variação de tom, quase imperceptível (tira o aspecto "plástico")
  const plaster = canvasTex(512, (g, S) => {
    g.fillStyle = '#f2eee6'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.025})`; g.beginPath(); g.arc(Math.random() * S, Math.random() * S, rnd(10, 60), 0, 6.3); g.fill(); }
    noise(g, 7000, 0.03, false);
  }, 2.0);
  const jute = canvasTex(256, (g, S) => { g.fillStyle = '#c9b48f'; g.fillRect(0, 0, S, S); for (let i = 0; i < S; i += 4) { g.fillStyle = 'rgba(90,70,40,.18)'; g.fillRect(i, 0, 2, S); g.fillRect(0, i, S, 2); } noise(g, 3000, 0.1, false); }, 0.3);
  // folha com recorte (alpha), nervura central e nervuras laterais
  const leafTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
    g.beginPath(); g.moveTo(128, 506);
    g.bezierCurveTo(10, 400, 6, 120, 128, 6); g.bezierCurveTo(250, 120, 246, 400, 128, 506); g.closePath();
    const grd = g.createLinearGradient(0, 512, 0, 0); grd.addColorStop(0, '#3e6a2a'); grd.addColorStop(0.6, '#4f7f33'); grd.addColorStop(1, '#5d8c3a');
    g.fillStyle = grd; g.fill();
    g.save(); g.clip();
    const side = g.createLinearGradient(0, 0, 256, 0); side.addColorStop(0, 'rgba(0,0,0,.18)'); side.addColorStop(0.5, 'rgba(255,255,255,.06)'); side.addColorStop(1, 'rgba(0,0,0,.18)');
    g.fillStyle = side; g.fillRect(0, 0, 256, 512);
    g.strokeStyle = 'rgba(200,225,160,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(128, 506); g.lineTo(128, 10); g.stroke();
    g.strokeStyle = 'rgba(190,215,150,.28)'; g.lineWidth = 1.6;
    for (let y = 470; y > 40; y -= 26) for (const d of [-1, 1]) { g.beginPath(); g.moveTo(128, y); g.quadraticCurveTo(128 + d * 60, y - 30, 128 + d * 118, y - 70); g.stroke(); }
    g.restore();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  })();
  const M = (o) => new THREE.MeshStandardMaterial(o);
  return {
    leafTexA: M({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 }),
    leafTexB: M({ map: leafTex, color: 0xc9dcae, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 }),
    soil: M({ color: 0x3b2f25, roughness: 1 }),
    plaster,
    fabricDark: M({ map: linen, bumpMap: linen, bumpScale: 2, color: 0x8f8679, roughness: 0.98 }),
    duvet: M({ map: linen, bumpMap: linen, bumpScale: 1.5, color: 0xfbfaf7, roughness: 0.96 }),
    cushion: M({ map: linen, bumpMap: linen, bumpScale: 2, color: 0xd8c7a6, roughness: 0.97 }),
    screen: M({ color: 0x0b0c0e, roughness: 0.15, metalness: 0.2 }),
    cabinet: M({ color: 0x2f3134, roughness: 0.55 }),
    glassBlack: M({ color: 0x050505, roughness: 0.08, metalness: 0.3 }),
    mirror: M({ color: 0xdfe6ea, roughness: 0.02, metalness: 1.0, envMapIntensity: 1.5 }),
    led: new THREE.MeshBasicMaterial({ color: 0xfff1d6 }),
    ceramic: M({ color: 0xd9cdbb, roughness: 0.55 }),
    shade: M({ color: 0xf1e9da, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffd9a0, emissiveIntensity: 0 }),
    jute: M({ map: jute, roughness: 1 }),
    leafLight: M({ color: 0x6b9548, roughness: 0.75, side: THREE.DoubleSide }),
    bookA: M({ color: 0x1f2f57, roughness: 0.8 }), bookB: M({ color: 0xc9a46a, roughness: 0.8 }), bookC: M({ color: 0xe9e2d6, roughness: 0.8 }),
    fruitA: M({ color: 0xd98a2b, roughness: 0.5 }), fruitB: M({ color: 0x7ea33a, roughness: 0.5 }),
    baseboard: M({ color: 0xf7f6f3, roughness: 0.5 }),
    grass: M({ color: 0x5f8f3e, roughness: 1 }),
    sand: M({ map: deck, color: 0xe8d6ad, roughness: 1 }),
    curtain: M({ map: linen, color: 0xf4efe6, roughness: 1, transparent: true, opacity: 0.82, side: THREE.DoubleSide }),
    // porcelanato polido: reflete janelas e móveis (sonda de reflexo do ambiente); rejunte em relevo
    porcelain: M({ map: porcelain, bumpMap: porcelain, bumpScale: 1.6, roughness: 0.16, metalness: 0 }),
    wood: M({ map: wood, bumpMap: wood, bumpScale: 1.2, roughness: 0.38 }),
    marble: M({ map: marble, roughness: 0.1 }),
    tile: M({ map: tile, bumpMap: tile, bumpScale: 1.2, roughness: 0.45 }),
    deck: M({ map: deck, bumpMap: deck, bumpScale: 1.5, roughness: 0.8 }),
    wall: M({ map: plaster, bumpMap: plaster, bumpScale: 0.5, roughness: 0.9 }),
    ceiling: M({ color: 0xf7f5f1, roughness: 0.95, side: THREE.DoubleSide }),
    slabEdge: M({ color: 0xe9e4da, roughness: 0.7 }),
    core: M({ color: 0xd9d4cb, roughness: 0.8 }),
    glass: M({ color: 0xcfe2e8, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.4 }),
    frame: M({ color: 0x2c2d2f, roughness: 0.45, metalness: 0.6 }),
    oak: M({ map: oak, bumpMap: oak, bumpScale: 0.8, roughness: 0.42 }),
    oakDark: M({ map: oak, bumpMap: oak, bumpScale: 0.8, color: 0x8a7766, roughness: 0.42 }),
    linen: M({ map: linen, bumpMap: linen, bumpScale: 1.5, roughness: 0.95 }),
    sheet: M({ color: 0xf6f4f0, roughness: 0.95 }),
    throwBeige: M({ color: 0xc8b597, roughness: 0.95 }),
    fabric: M({ map: linen, bumpMap: linen, bumpScale: 2, color: 0xe5ddcf, roughness: 0.97 }),
    rust: M({ color: 0xa4552f, roughness: 0.8 }),
    rug: M({ map: jute, bumpMap: jute, bumpScale: 3, color: 0xefe6d6, roughness: 1 }),
    stone: M({ map: marble, roughness: 0.12 }),
    black: M({ color: 0x232323, roughness: 0.5, metalness: 0.4 }),
    steel: M({ color: 0xb9bcc0, roughness: 0.25, metalness: 0.9 }),
    porcelainWhite: M({ color: 0xfbfbfa, roughness: 0.12 }),
    water: M({ color: 0x3fb3c4, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x0a3a44, emissiveIntensity: 0.3 }),
    poolTile: M({ color: 0x5fa9a2, roughness: 0.3 }),
    leaf: M({ color: 0x3f6b2c, roughness: 0.75, side: THREE.DoubleSide }),
    pot: M({ color: 0x8e8478, roughness: 0.9 }),
    lightDisc: new THREE.MeshBasicMaterial({ color: 0xfff6e6 }),
    hotspot: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }),
    hotspotRing: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }),
  };
}

// ---------------------------------------------------------------- motor
export class InteriorTour {
  constructor({ plan, parent, level, camera, renderer, dom, ui }) {
    this.plan = plan; this.parent = parent; this.level = level;
    this.camera = camera; this.renderer = renderer; this.dom = dom; this.ui = ui;
    // uma planta pode ter vários pavimentos (duplex); plantas simples viram um pavimento só
    this.levels = plan.levels || [plan];
    if (!plan._normalized) {
      plan.nodes = this.levels.flatMap((L, i) => (L.nodes || []).map(n => ({ ...n, lv: i })));
      this.levels.forEach((L, i) => { L.nodes = plan.nodes.filter(n => n.lv === i); });
      plan._normalized = true;
    }
    this.useLevel(0);
    this.active = false;
    this.yaw = 0; this.pitch = -0.05; this.fov = 72;
    this.node = null; this.anim = null;
    this.ray = new THREE.Raycaster();
    this.lights = [];
  }
  // conversores px → sistema local do edifício para um pavimento
  conv(L) {
    const s = L.scale || this.plan.scale, [px0, py0] = L.anchor.px, [lx0, lz0] = L.anchor.local;
    return { X: px => lx0 + (px - px0) * s, Z: py => lz0 + (py - py0) * s, s, y: L.y || 0 };
  }
  useLevel(i) {
    const L = this.levels[i], c = this.conv(L);
    this.cur = L; this.lvIndex = i;
    this.X = c.X; this.Z = c.Z; this.S = c.s; this.m = px => px * c.s;
    this.H = L.height || this.plan.ceiling;
  }
  mapFor(lv) { const L = this.levels[lv || 0]; return L.map || this.plan.map || [280, 205, 1315, 785]; }

  // ------------------------------------------------ construção
  build() {
    if (this.root) return this.root;
    this.mats = makeMaterials();
    const root = this.root = new THREE.Group();
    root.name = 'interior-' + this.plan.id;
    root.position.y = this.level;
    root.visible = false;
    this.parent.add(root);
    this.hotspotObjs = []; this.nodeMeshes = []; this.walkables = []; this.windowSegs = []; this.windowLs = [];
    this.levels.forEach((L, i) => {
      this.useLevel(i);
      const lg = new THREE.Group(); lg.position.y = L.y || 0; root.add(lg);
      this.group = lg;
      this.buildLevel(L, i);
    });
    // RectAreaLight é cara (entra no shader de toda a cena): só 2 fixas, reposicionadas
    // nas janelas mais próximas do ponto onde o visitante está.
    if (!InteriorTour._ralInit) { RectAreaLightUniformsLib.init(); InteriorTour._ralInit = true; }
    for (let i = 0; i < 2; i++) { const l = new THREE.RectAreaLight(0xeaf2ff, 0, 1, 2.4); root.add(l); this.windowLs.push(l); }
    this.group = root;
    // sonda de reflexo: um cubemap capturado na posição do visitante vira o envMap de todos os materiais
    // do apartamento — o piso polido reflete as janelas e os móveis, e a luz rebatida do próprio ambiente
    // (paredes claras, piso ensolarado) ilumina as sombras como numa foto de interiores.
    this.probeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    this.probe = new THREE.CubeCamera(0.05, 400, this.probeRT);
    root.add(this.probe);
    const gloss = { porcelain: 0.8, marble: 0.8, stone: 0.8, mirror: 1.3, glass: 0.55, steel: 0.9, water: 0.9, screen: 0.35, glassBlack: 1.0, porcelainWhite: 0.8 };
    const nameOf = new Map(Object.entries(this.mats).map(([k, v]) => [v, k]));
    root.traverse(o => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) {
        if (!m.isMeshStandardMaterial || m.userData.probe) continue;
        m.userData.probe = true;
        m.envMap = this.probeRT.texture;
        m.envMapIntensity = gloss[nameOf.get(m)] ?? 0.4;
        m.needsUpdate = true;
      }
    });
    this.probeDirty = true;
    this.useLevel(0);
    // luz noturna proporcional à área: as luminárias foram calibradas nos ambientes amplos do Apogeo
    // (~30 m² por ponto de luz); em apartamentos compactos o mesmo valor estoura a imagem
    let area = 0;
    this.levels.forEach(L => { const sc = (L.scale || this.plan.scale) ** 2; for (const f of L.floors || []) area += Math.abs(polyArea(f.poly)) * sc; });
    this.lightScale = Math.min(1, Math.max(0.22, area / Math.max(1, this.lights.length) / 30));
    return root;
  }

  buildLevel(P, lv) {
    const X = this.X, Z = this.Z, H = this.H, mats = this.mats, g = this.group;
    const add = (geo, mat, cast = true, recv = true) => { const o = new THREE.Mesh(geo, mat); o.castShadow = cast; o.receiveShadow = recv; g.add(o); return o; };
    const box = (r, y0, y1, mat, cast = true) => {
      const [x0, z0, x1, z1] = [X(r[0]), Z(r[1]), X(r[2]), Z(r[3])];
      const geo = new THREE.BoxGeometry(Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0));
      geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      return add(geo, mat, cast);
    };
    const holes = P.holes || [];
    const bb = poly => { const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
    const shapeOf = (poly, withHoles = true) => {
      const sh = new THREE.Shape(poly.map(([px, py]) => new THREE.Vector2(X(px), -Z(py))));
      if (withHoles) {
        const [a0, b0, a1, b1] = bb(poly);
        for (const h of holes) if (h[0] >= a0 - 1 && h[2] <= a1 + 1 && h[1] >= b0 - 1 && h[3] <= b1 + 1 && inPoly((h[0] + h[2]) / 2, (h[1] + h[3]) / 2, poly)) {
          sh.holes.push(new THREE.Path([[h[0], h[1]], [h[0], h[3]], [h[2], h[3]], [h[2], h[1]]].map(([px, py]) => new THREE.Vector2(X(px), -Z(py)))));
        }
      }
      return sh;
    };
    const flat = (poly, y, mat, walkable = true) => {
      const geo = new THREE.ShapeGeometry(shapeOf(poly, walkable), 12);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, y, 0);
      const o = add(geo, mat, false, true);
      o.userData.walkable = walkable; o.userData.lv = lv;
      if (walkable) this.walkables.push(o);
      return o;
    };
    const slab = (poly, y0, t, mat, withHoles = true) => {
      const geo = new THREE.ExtrudeGeometry(shapeOf(poly, withHoles), { depth: t, bevelEnabled: false, curveSegments: 8 });
      geo.rotateX(-Math.PI / 2); geo.translate(0, y0, 0);
      return add(geo, mat);
    };
    this.box = box;

    // lajes: piso (com borda) e laje superior (teto) — o teto pode ser parcial (áreas descobertas)
    slab(P.outline, -0.32, 0.3, mats.slabEdge);
    flat(P.outline, -0.015, mats.deck);
    for (const cp of (P.ceilingPolys || [P.outline])) {
      slab(cp, H, 0.32, mats.slabEdge, false);
      flat(cp, H - 0.002, mats.ceiling, false); // material dupla-face: visto de baixo é o forro
    }
    for (const f of P.floors) flat(f.poly, 0.004, mats[f.m]);
    for (const w of P.walls) box(w, 0, H, mats.wall);
    for (const w of [...P.walls, ...(P.exterior || [])]) {
      const thinX = (w[2] - w[0]) < (w[3] - w[1]);
      const e = 0.012 / this.S;
      const r = thinX ? [w[0] - e, w[1], w[2] + e, w[3]] : [w[0], w[1] - e, w[2], w[3] + e];
      box(r, 0, 0.08, mats.baseboard, false);
    }
    for (const d of (P.doors || [])) box(d, 2.1, H, mats.wall, false);
    for (const f of (P.fences || [])) box(f, 0, 1.9, mats.wall);
    for (const wl of (P.wallLines || [])) this.lineBox(wl.a, wl.b, (wl.t || 7) * this.S, 0, H, mats.wall);
    for (const sp of (P.sand || [])) flat(sp, 0.02, mats.sand);
    for (const w of (P.exterior || [])) box(w, 0, H, mats.wall);
    for (const [x0, y0, x1, y1, sill, head] of (P.windows || [])) {
      box([x0, y0, x1, y1], 0, sill, mats.wall); box([x0, y0, x1, y1], head, H, mats.wall);
      const thinX = (x1 - x0) < (y1 - y0);
      const r = thinX ? [(x0 + x1) / 2 - 0.4, y0, (x0 + x1) / 2 + 0.4, y1] : [x0, (y0 + y1) / 2 - 0.4, x1, (y0 + y1) / 2 + 0.4];
      box(r, sill, head, mats.glass, false);
      box([x0, y0, x1, y1], sill - 0.03, sill, mats.frame, false);
    }
    for (const line of (P.glass || [])) this.glassLine(line);
    this.windowLights(P.glass || [], P, lv);
    for (const c of P.curtains || []) this.curtain(c);
    // guarda-corpo de vidro: no contorno inteiro (varandas do Apogeo) ou só nas linhas indicadas (P.rails)
    if (P.rails) for (const r of P.rails) this.railing(r, true); else this.railing(P.outline);
    if (P.poolDeck) box(P.poolDeck, 0, 0.42, mats.oak);
    if (P.pool) {
      const [x0, y0, x1, y1] = P.pool;
      box([x0, y0, x1, y1], 0.42, 0.44, mats.poolTile, false);
      box([x0 + 2, y0 + 2, x1 - 2, y1 - 2], 0.44, 0.47, mats.water, false);
    }
    for (const gr of (P.grass || [])) flat(gr, 0.02, mats.grass);
    for (const st of (P.stairs || [])) this.stairs(st);
    for (const f of P.furniture) this.furniture(f);
    this.ceilingLights();
    // pontos de navegação
    const disc = new THREE.CircleGeometry(0.32, 40); disc.rotateX(-Math.PI / 2);
    const ring = new THREE.RingGeometry(0.34, 0.42, 48); ring.rotateX(-Math.PI / 2);
    for (const n of P.nodes) {
      const m = new THREE.Group();
      const d = new THREE.Mesh(disc, mats.hotspot.clone()), r = new THREE.Mesh(ring, mats.hotspotRing.clone());
      d.renderOrder = r.renderOrder = 5;
      m.add(d, r);
      if (n.link) { const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 3), mats.hotspotRing.clone()); arrow.rotation.x = -Math.PI / 2; arrow.position.y = 0.02; m.add(arrow); }
      m.position.set(X(n.p[0]), 0.03, Z(n.p[1]));
      m.userData.node = n;
      d.userData.node = r.userData.node = n;
      g.add(m);
      this.nodeMeshes.push(m);
    }
  }

  // caixa orientada ao longo de um segmento (paredes e bancadas em ângulo)
  lineBox(a, b, depth, y0, y1, mat, offset = 0) {
    const A = new THREE.Vector3(this.X(a[0]), 0, this.Z(a[1])), Bv = new THREE.Vector3(this.X(b[0]), 0, this.Z(b[1]));
    const L = A.distanceTo(Bv), ang = Math.atan2(Bv.x - A.x, Bv.z - A.z);
    const o = new THREE.Mesh(new THREE.BoxGeometry(depth, y1 - y0, L), mat);
    const mid = A.clone().add(Bv).multiplyScalar(0.5);
    const nx = Math.cos(ang), nz = -Math.sin(ang); // normal à esquerda do segmento
    o.position.set(mid.x + nx * offset, (y0 + y1) / 2, mid.z + nz * offset); o.rotation.y = ang;
    o.castShadow = o.receiveShadow = true; this.group.add(o); return o;
  }

  // escada: lances com degraus maciços (rise ~17,5 cm) e patamares, em px da planta
  stairs(st) {
    const { X, Z, mats } = this;
    for (const run of st.runs) {
      const [x0, y0, x1, y1] = run.r, n = Math.max(3, Math.round((run.to - run.from) / 0.175)), rise = (run.to - run.from) / n;
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        let r;
        if (run.dir === 'e') r = [x0 + (x1 - x0) * t0, y0, x0 + (x1 - x0) * t1, y1];
        else if (run.dir === 'w') r = [x1 - (x1 - x0) * t1, y0, x1 - (x1 - x0) * t0, y1];
        else if (run.dir === 's') r = [x0, y0 + (y1 - y0) * t0, x1, y0 + (y1 - y0) * t1];
        else r = [x0, y1 - (y1 - y0) * t1, x1, y1 - (y1 - y0) * t0];
        const top = run.from + (k + 1) * rise;
        this.box(r, Math.max(0, top - 0.32), top, mats.stone);
      }
    }
    for (const l of (st.landings || [])) this.box(l.r, Math.max(0, l.y - 0.32), l.y, mats.stone);
  }

  // luz difusa do céu entrando por cada pano de vidro (RectAreaLight voltada para dentro)
  windowLights(lines, P, lv) {
    const { X, Z, H } = this, floors = P.floors.map(f => f.poly), y = P.y || 0;
    for (const pts of lines) for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const Lpx = Math.hypot(bx - ax, by - ay); if (Lpx * this.S < 0.8) continue;
      let nx = -(by - ay) / Lpx, ny = (bx - ax) / Lpx;
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      if (!floors.some(p => inPoly(mx + nx * 30, my + ny * 30, p))) { nx = -nx; ny = -ny; }
      this.windowSegs.push({
        lv, px: [mx, my], width: Lpx * this.S, height: H - 0.3,
        pos: new THREE.Vector3(X(mx + nx * 3), y + H / 2, Z(my + ny * 3)),
        tgt: new THREE.Vector3(X(mx + nx * 60), y + H / 2 - 0.3, Z(my + ny * 60)),
      });
    }
  }
  aimWindowLights(node) {
    if (!this.windowSegs?.length) return;
    const near = this.windowSegs.filter(w => w.lv === (node.lv || 0)).sort((a, b) => Math.hypot(a.px[0] - node.p[0], a.px[1] - node.p[1]) - Math.hypot(b.px[0] - node.p[0], b.px[1] - node.p[1]));
    this.windowLs.forEach((l, i) => {
      const seg = near[i]; if (!seg) { l.width = 0.01; return; }
      l.width = seg.width; l.height = seg.height; l.position.copy(seg.pos);
      l.updateWorldMatrix(true, false);
      l.lookAt(this.root.localToWorld(seg.tgt.clone()));
    });
  }
  // cortinas de linho translúcido, franzidas, recolhidas nas pontas dos vãos
  curtain([x0, y0, x1, y1]) {
    const { X, Z, H, mats } = this;
    const a = new THREE.Vector3(X(x0), 0, Z(y0)), b = new THREE.Vector3(X(x1), 0, Z(y1));
    const L = a.distanceTo(b), mid = a.clone().add(b).multiplyScalar(0.5), ang = Math.atan2(b.x - a.x, b.z - a.z);
    const geo = new THREE.PlaneGeometry(L, H - 0.1, Math.max(12, Math.round(L * 24)), 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, 0.045 * Math.sin(pos.getX(i) / 0.09 * Math.PI));
    geo.computeVertexNormals();
    const c = new THREE.Mesh(geo, mats.curtain);
    c.position.set(mid.x, (H - 0.1) / 2 + 0.02, mid.z); c.rotation.y = ang - Math.PI / 2;
    c.receiveShadow = true;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, L + 0.1), mats.black);
    rail.position.set(mid.x, H - 0.04, mid.z); rail.rotation.y = ang;
    this.group.add(c, rail);
  }

  glassLine(pts) {
    const { X, Z, H, mats } = this;
    for (let i = 1; i < pts.length; i++) {
      const a = new THREE.Vector3(X(pts[i - 1][0]), 0, Z(pts[i - 1][1])), b = new THREE.Vector3(X(pts[i][0]), 0, Z(pts[i][1]));
      const L = a.distanceTo(b), mid = a.clone().add(b).multiplyScalar(0.5), ang = Math.atan2(b.x - a.x, b.z - a.z);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(L, H - 0.06), mats.glass);
      pane.position.set(mid.x, H / 2, mid.z); pane.rotation.y = ang - Math.PI / 2;
      pane.renderOrder = 2; this.group.add(pane);
      // caixilhos verticais a cada ~1,5 m + quadro superior/inferior
      const n = Math.max(1, Math.round(L / 1.5));
      for (let k = 0; k <= n; k++) {
        const p = a.clone().lerp(b, k / n);
        const mul = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.07), mats.frame);
        mul.position.set(p.x, H / 2, p.z); mul.rotation.y = ang; mul.castShadow = true; this.group.add(mul);
      }
      for (const y of [0.02, H - 0.03]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, L), mats.frame);
        bar.position.set(mid.x, y, mid.z); bar.rotation.y = ang; bar.castShadow = true; this.group.add(bar);
      }
    }
  }

  railing(poly, open = false) {
    const { X, Z, mats } = this;
    for (let i = 0; i < poly.length - (open ? 1 : 0); i++) {
      const p0 = poly[i], p1 = poly[(i + 1) % poly.length];
      const a = new THREE.Vector3(X(p0[0]), 0, Z(p0[1])), b = new THREE.Vector3(X(p1[0]), 0, Z(p1[1]));
      const L = a.distanceTo(b); if (L < 0.05) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5), ang = Math.atan2(b.x - a.x, b.z - a.z);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.05), mats.glass);
      pane.position.set(mid.x, 0.55, mid.z); pane.rotation.y = ang - Math.PI / 2; pane.renderOrder = 2;
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, L), mats.steel);
      top.position.set(mid.x, 1.1, mid.z); top.rotation.y = ang;
      this.group.add(pane, top);
    }
  }

  ceilingLights() {
    const { X, Z, H, mats } = this;
    const pts = [];
    for (const f of this.cur.floors) {
      const xs = f.poly.map(p => p[0]), ys = f.poly.map(p => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const step = 1.6 / this.S;
      for (let x = x0 + step / 2; x < x1; x += step) for (let y = y0 + step / 2; y < y1; y += step) {
        if (inPoly(x, y, f.poly) && !this.cur.walls.some(w => x > w[0] - 8 && x < w[2] + 8 && y > w[1] - 8 && y < w[3] + 8)
          && (!this.cur.ceilingPolys || this.cur.ceilingPolys.some(cp => inPoly(x, y, cp)))) pts.push([x, y]); // sem luminária sob o céu
      }
    }
    const geo = new THREE.CircleGeometry(0.045, 16); geo.rotateX(Math.PI / 2);
    const inst = new THREE.InstancedMesh(geo, mats.lightDisc, pts.length);
    const m4 = new THREE.Matrix4();
    pts.forEach(([x, y], i) => { m4.makeTranslation(X(x), H - 0.006, Z(y)); inst.setMatrixAt(i, m4); });
    this.group.add(inst);
    // luzes reais (quentes) para a noite: uma por ambiente principal
    const lit = this.cur.lightNodes || this.plan.lightNodes || ['estar', 'sala', 'jantar', 'cozinha', 'master', 's01', 's02', 's03', 'circ', 'gourmet', 'reversivel'];
    for (const n of this.cur.nodes.filter(n => lit.includes(n.id))) {
      const l = new THREE.PointLight(0xffd6a0, 0, 8, 1.5);
      l.position.set(X(n.p[0]), H - 0.4, Z(n.p[1]));
      this.group.add(l); this.lights.push(l);
    }
  }

  // ------------------------------------------------ mobiliário paramétrico (dimensões da planta)
  // Peças com cantos arredondados (RoundedBoxGeometry) e composição de estofados, para leitura realista à altura dos olhos.
  furniture(f) {
    const { X, Z, m, mats } = this, g = this.group, H = this.H;
    const put = (o, cast = true) => { o.castShadow = cast; o.receiveShadow = true; g.add(o); return o; };
    const B = (x0, z0, x1, z1, y0, y1, mat, cast = true) => {
      const geo = new THREE.BoxGeometry(Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0));
      geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      return put(new THREE.Mesh(geo, mat), cast);
    };
    // caixa arredondada (raio r), centrada no retângulo
    const RB = (x0, z0, x1, z1, y0, y1, mat, r = 0.04, cast = true) => {
      const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0), h = y1 - y0;
      const rr = Math.min(r, w / 2 - 0.001, d / 2 - 0.001, h / 2 - 0.001);
      const o = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(0.002, rr)), mat);
      o.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      return put(o, cast);
    };
    const Cyl = (x, z, r, y0, y1, mat, seg = 24, rTop) => {
      const o = new THREE.Mesh(new THREE.CylinderGeometry(rTop ?? r, r, y1 - y0, seg), mat);
      o.position.set(x, (y0 + y1) / 2, z);
      return put(o);
    };
    const R = f.r && { x0: X(f.r[0]), z0: Z(f.r[1]), x1: X(f.r[2]), z1: Z(f.r[3]) };
    const P = f.p && { x: X(f.p[0]), z: Z(f.p[1]) };
    switch (f.t) {
      case 'bed': {
        const { x0, z0, x1, z1 } = R, h = f.head;
        // base estofada recuada + colchão + edredom que cai nas laterais
        RB(x0 + 0.04, z0 + 0.04, x1 - 0.04, z1 - 0.04, 0.06, 0.34, mats.fabricDark, 0.04);
        RB(x0 + 0.02, z0 + 0.02, x1 - 0.02, z1 - 0.02, 0.32, 0.56, mats.sheet, 0.08);
        const duv = 0.02;
        const foot = { w: [x0 + 0.62, z0 - duv, x1 + duv, z1 + duv], e: [x0 - duv, z0 - duv, x1 - 0.62, z1 + duv], n: [x0 - duv, z0 + 0.62, x1 + duv, z1 + duv], s: [x0 - duv, z0 - duv, x1 + duv, z1 - 0.62] }[h];
        RB(foot[0], foot[1], foot[2], foot[3], 0.36, 0.6, mats.duvet, 0.09);
        // manta dobrada nos pés
        const thr = { w: [x1 - 0.5, z0 - 0.03, x1 - 0.12, z1 + 0.03], e: [x0 + 0.12, z0 - 0.03, x0 + 0.5, z1 + 0.03], n: [x0 - 0.03, z1 - 0.5, x1 + 0.03, z1 - 0.12], s: [x0 - 0.03, z0 + 0.12, x1 + 0.03, z0 + 0.5] }[h];
        RB(thr[0], thr[1], thr[2], thr[3], 0.58, 0.64, mats.throwBeige, 0.03);
        // cabeceira estofada com gomos verticais + travesseiros e almofadas
        const pill = f.single ? 1 : 2;
        if (h === 'w' || h === 'e') {
          const hx = h === 'w' ? x0 : x1, dir = h === 'w' ? 1 : -1, span = z1 - z0 + 0.3, n = Math.round(span / 0.32);
          for (let i = 0; i < n; i++) { const za = z0 - 0.15 + i * span / n; RB(hx - dir * 0.06, za + 0.01, hx + dir * 0.04, za + span / n - 0.01, 0.12, 1.3, mats.fabric, 0.04); }
          const w = (z1 - z0) / pill;
          for (let i = 0; i < pill; i++) {
            // travesseiros em pé, inclinados contra a cabeceira, e almofada decorativa à frente
            RB(hx + dir * 0.1, z0 + i * w + 0.06, hx + dir * 0.28, z0 + (i + 1) * w - 0.06, 0.52, 1.02, mats.linen, 0.07).rotation.z = -dir * 0.28;
            RB(hx + dir * 0.3, z0 + i * w + 0.16, hx + dir * 0.44, z0 + (i + 1) * w - 0.16, 0.55, 0.92, mats.cushion, 0.06).rotation.z = -dir * 0.2;
          }
        } else {
          const hz = h === 's' ? z1 : z0, dz = h === 's' ? -1 : 1;
          const span = x1 - x0 + 0.3, n = Math.round(span / 0.32);
          for (let i = 0; i < n; i++) { const xa = x0 - 0.15 + i * span / n; RB(xa + 0.01, Math.min(hz - dz * 0.06, hz + dz * 0.04), xa + span / n - 0.01, Math.max(hz - dz * 0.06, hz + dz * 0.04), 0.12, 1.3, mats.fabric, 0.04); }
          const w = (x1 - x0) / pill;
          for (let i = 0; i < pill; i++) {
            const a1 = hz + dz * 0.1, a2 = hz + dz * 0.28, b1 = hz + dz * 0.3, b2 = hz + dz * 0.44;
            RB(x0 + i * w + 0.06, Math.min(a1, a2), x0 + (i + 1) * w - 0.06, Math.max(a1, a2), 0.52, 1.02, mats.linen, 0.07).rotation.x = 0.28 * dz;
            RB(x0 + i * w + 0.16, Math.min(b1, b2), x0 + (i + 1) * w - 0.16, Math.max(b1, b2), 0.55, 0.92, mats.cushion, 0.06).rotation.x = 0.2 * dz;
          }
        }
        break;
      }
      case 'treadmill': {
        // esteira: base, lona escura, laterais, colunas e painel na frente (lado norte do retângulo)
        const { x0, z0, x1, z1 } = R, cx = (x0 + x1) / 2;
        RB(x0, z0 + 0.15, x1, z1, 0.02, 0.2, mats.black, 0.03);
        B(x0 + 0.06, z0 + 0.2, x1 - 0.06, z1 - 0.05, 0.2, 0.215, mats.cabinet, false);
        for (const x of [x0 + 0.02, x1 - 0.06]) { B(x, z0 + 0.12, x + 0.04, z0 + 0.2, 0.2, 1.25, mats.steel); B(x, z0 + 0.12, x + 0.04, z0 + 0.55, 1.0, 1.04, mats.steel); }
        RB(cx - 0.3, z0 + 0.06, cx + 0.3, z0 + 0.2, 1.22, 1.42, mats.screen, 0.02);
        break;
      }
      case 'bench': RB(R.x0, R.z0, R.x1, R.z1, 0.08, 0.46, mats.fabricDark, 0.05); B(R.x0 + 0.05, R.z0 + 0.05, R.x1 - 0.05, R.z1 - 0.05, 0, 0.08, mats.black); break;
      case 'nightstand':
        if (f.round || !R) { Cyl(P.x, P.z, 0.23, 0, 0.5, mats.oak, 32); this.lamp(P.x, P.z, 0.5); }
        else { RB(R.x0, R.z0, R.x1, R.z1, 0.1, 0.52, mats.oak, 0.015); B(R.x0 + 0.03, R.z0 + 0.03, R.x1 - 0.03, R.z1 - 0.03, 0, 0.1, mats.black); this.lamp((R.x0 + R.x1) / 2, (R.z0 + R.z1) / 2, 0.52); }
        break;
      case 'rug':
        if (f.c) { const o = Cyl(X(f.c[0]), Z(f.c[1]), m(f.rad), 0.004, 0.018, mats.rug, 64); o.castShadow = false; }
        else RB(R.x0, R.z0, R.x1, R.z1, 0.004, 0.018, mats.rug, 0.006, false);
        break;
      case 'tvpanel': {
        // painel ripado de madeira do piso ao teto + TV + aparador suspenso
        const vert = Math.abs(R.x1 - R.x0) < Math.abs(R.z1 - R.z0);
        B(R.x0, R.z0, R.x1, R.z1, 0, H, mats.oak);
        if (vert) {
          const sx = f.face === 'w' ? R.x0 : R.x1, d = f.face === 'w' ? -1 : 1;
          for (let z = R.z0 + 0.04; z < R.z1 - 0.02; z += 0.07) B(sx, z, sx + d * 0.025, z + 0.035, 0, H, mats.oakDark, false);
          const cz = (R.z0 + R.z1) / 2;
          RB(sx + d * 0.025, cz - 0.82, sx + d * 0.07, cz + 0.82, 1.1, 2.03, mats.screen, 0.01, false);
          RB(sx + d * 0.025, cz - 1.2, sx + d * 0.45, cz + 1.2, 0.35, 0.6, mats.oakDark, 0.015);
        }
        break;
      }
      case 'wardrobe': case 'tallcabinet': {
        const top = f.t === 'wardrobe' ? H - 0.04 : H;
        B(R.x0, R.z0, R.x1, R.z1, 0, top, mats.oak);
        // frisos das portas (a cada ~55 cm) e puxadores cava
        const alongX = Math.abs(R.x1 - R.x0) > Math.abs(R.z1 - R.z0);
        const L = alongX ? R.x1 - R.x0 : R.z1 - R.z0, n = Math.max(1, Math.round(L / 0.55));
        for (let i = 1; i < n; i++) {
          const t = i / n;
          if (alongX) { const x = R.x0 + L * t; B(x - 0.004, R.z0 - 0.003, x + 0.004, R.z1 + 0.003, 0.08, top - 0.02, mats.black, false); }
          else { const z = R.z0 + L * t; B(R.x0 - 0.003, z - 0.004, R.x1 + 0.003, z + 0.004, 0.08, top - 0.02, mats.black, false); }
        }
        B(R.x0 - 0.002, R.z0 - 0.002, R.x1 + 0.002, R.z1 + 0.002, 0, 0.07, mats.black, false);
        break;
      }
      case 'desk':
        RB(R.x0, R.z0, R.x1, R.z1, 0.72, 0.76, mats.oak, 0.01);
        B(R.x0 + 0.03, R.z0 + 0.02, R.x0 + 0.05, R.z1 - 0.02, 0, 0.72, mats.black); B(R.x1 - 0.05, R.z0 + 0.02, R.x1 - 0.03, R.z1 - 0.02, 0, 0.72, mats.black);
        this.decor((R.x0 + R.x1) / 2 + 0.25, (R.z0 + R.z1) / 2, 0.76, 'books');
        break;
      case 'armchair': {
        const mat = f.color === 'rust' ? mats.rust : mats.fabric;
        const shell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
        shell.scale.set(1, 0.95, 1); shell.rotation.x = Math.PI; shell.position.set(P.x, 0.72, P.z); put(shell);
        const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 32), mats.cushion); seat.position.set(P.x, 0.42, P.z); put(seat);
        Cyl(P.x, P.z, 0.03, 0, 0.32, mats.black, 10);
        break;
      }
      case 'sofa': {
        const { x0, z0, x1, z1 } = R;
        const along = Math.abs(z1 - z0) > Math.abs(x1 - x0);
        if (f.back === 'n' && !along) {
          // sofá com encosto voltado para o norte (assento para o sul)
          RB(x0, z0, x1, z1, 0.06, 0.24, mats.fabricDark, 0.04);
          const L2 = x1 - x0, n2 = Math.max(1, Math.round(L2 / 0.8)), sg = L2 / n2;
          for (let i = 0; i < n2; i++) {
            RB(x0 + i * sg + 0.015, z0 + 0.24, x0 + (i + 1) * sg - 0.015, z1 - 0.02, 0.24, 0.44, mats.fabric, 0.07);
            RB(x0 + i * sg + 0.02, z0 + 0.02, x0 + (i + 1) * sg - 0.02, z0 + 0.26, 0.3, 0.8, mats.fabric, 0.09);
          }
          break;
        }
        RB(x0, z0, x1, z1, 0.06, 0.24, mats.fabricDark, 0.04);                    // base
        // almofadas de assento (módulos de ~80 cm) e encosto
        const L = along ? z1 - z0 : x1 - x0, n = Math.max(1, Math.round(L / 0.8)), seg = L / n;
        for (let i = 0; i < n; i++) {
          if (along) {
            RB(x0 + 0.02, z0 + i * seg + 0.015, x1 - 0.24, z0 + (i + 1) * seg - 0.015, 0.24, 0.44, mats.fabric, 0.07);
            RB(x1 - 0.26, z0 + i * seg + 0.02, x1 - 0.02, z0 + (i + 1) * seg - 0.02, 0.3, 0.8, mats.fabric, 0.09);
          } else {
            RB(x0 + i * seg + 0.015, z0 + 0.02, x0 + (i + 1) * seg - 0.015, z1 - 0.24, 0.24, 0.44, mats.fabric, 0.07);
            RB(x0 + i * seg + 0.02, z1 - 0.26, x0 + (i + 1) * seg - 0.02, z1 - 0.02, 0.3, 0.8, mats.fabric, 0.09);
          }
        }
        // almofadas decorativas
        if (along) { RB(x1 - 0.42, z0 + 0.3, x1 - 0.24, z0 + 0.72, 0.42, 0.8, mats.cushion, 0.08).rotation.z = 0.2; RB(x1 - 0.42, z1 - 0.7, x1 - 0.24, z1 - 0.28, 0.42, 0.8, mats.rust, 0.08).rotation.z = 0.2; }
        break;
      }
      case 'coffeetable': {
        const r = m(f.rad);
        Cyl(P.x, P.z, r, 0.33, 0.38, mats.stone, 48); Cyl(P.x, P.z, r * 0.55, 0, 0.33, mats.oakDark, 32, r * 0.45);
        this.decor(P.x + r * 0.2, P.z, 0.38, r > 0.25 ? 'vase' : 'books');
        break;
      }
      case 'diningtable': {
        const cx = X(f.c[0]), cz = Z(f.c[1]), rx = m(f.rx), rz = m(f.ry);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.985, 0.05, 72), mats.stone);
        top.scale.set(rx, 1, rz); top.position.set(cx, 0.745, cz); put(top);
        for (const s of [-1, 1]) { const b = Cyl(cx + s * rx * 0.42, cz, 0.16, 0, 0.72, mats.oakDark, 24, 0.1); b.scale.z = 1.6; }
        this.chairsAround(cx, cz, rx + 0.36, rz + 0.36, f.seats);
        // pendente linear sobre a mesa
        this.pendant(cx, cz, rx * 1.4, 0.06, 2.05);
        this.decor(cx, cz, 0.77, 'bowl');
        break;
      }
      case 'roundtable': {
        const cx = X(f.c[0]), cz = Z(f.c[1]), r = m(f.rad);
        Cyl(cx, cz, r * 0.85, 0.73, 0.77, mats.oak, 48); Cyl(cx, cz, 0.08, 0, 0.73, mats.black, 16); Cyl(cx, cz, 0.3, 0, 0.03, mats.black, 32);
        this.chairsAround(cx, cz, r * 0.85 + 0.36, r * 0.85 + 0.36, f.seats);
        this.decor(cx, cz, 0.77, 'vase');
        break;
      }
      case 'loungeset': {
        const cx = X(f.c[0]), cz = Z(f.c[1]), r = m(f.rad);
        Cyl(cx, cz, r, 0.004, 0.018, mats.jute, 64).castShadow = false;
        const sofa = new THREE.Mesh(new THREE.TorusGeometry(r * 0.78, 0.3, 14, 48, Math.PI * 1.25), mats.fabric);
        sofa.rotation.x = -Math.PI / 2; sofa.rotation.z = 0.7; sofa.scale.z = 0.9; sofa.position.set(cx, 0.32, cz); put(sofa);
        Cyl(cx, cz, 0.32, 0, 0.36, mats.oak, 32);
        break;
      }
      case 'counter': {
        const h = f.h || 0.92;
        const body = f.top === 'wood' ? mats.oak : mats.cabinet;
        B(R.x0 + 0.02, R.z0 + 0.02, R.x1 - 0.02, R.z1 - 0.02, 0, 0.1, mats.black, false);   // rodapé recuado
        B(R.x0, R.z0, R.x1, R.z1, 0.1, h - 0.04, body);
        RB(R.x0 - 0.015, R.z0 - 0.015, R.x1 + 0.015, R.z1 + 0.015, h - 0.04, h, f.top === 'wood' ? mats.oak : mats.stone, 0.008);
        if (f.cooktop) { const cx = X(f.cooktop[0]), cz = Z(f.cooktop[1]); B(cx - 0.38, cz - 0.25, cx + 0.38, cz + 0.25, h, h + 0.008, mats.glassBlack, false); }
        if (f.grill) { B(R.x1 - 0.95, R.z0 + 0.05, R.x1 - 0.15, R.z1 - 0.05, h, h + 0.28, mats.steel); }
        if (f.sink) { const [sx, sz] = [X(f.sink[0]), Z(f.sink[1])]; B(sx - 0.35, sz - 0.2, sx + 0.35, sz + 0.2, h - 0.002, h + 0.002, mats.steel, false); this.faucet(sx, sz + 0.24, h); }
        if (f.uppers) this.upperCabinets(R, f.uppers);
        break;
      }
      case 'island':
        B(R.x0 + 0.06, R.z0 + 0.06, R.x1 - 0.06, R.z1 - 0.06, 0, 0.9, mats.oakDark);
        RB(R.x0, R.z0, R.x1, R.z1, 0.9, 0.94, mats.stone, 0.01);
        this.decor((R.x0 + R.x1) / 2, (R.z0 + R.z1) / 2, 0.94, 'fruit');
        break;
      case 'stool': Cyl(P.x, P.z, 0.19, 0.64, 0.7, mats.fabricDark, 24); Cyl(P.x, P.z, 0.025, 0, 0.64, mats.black, 8); Cyl(P.x, P.z, 0.16, 0.25, 0.27, mats.black, 24); break;
      case 'fridge':
        RB(R.x0, R.z0, R.x1, R.z1, 0, 1.95, mats.steel, 0.015);
        B(R.x0 - 0.005, (R.z0 + R.z1) / 2 - 0.002, R.x1 + 0.005, (R.z0 + R.z1) / 2 + 0.002, 0.05, 1.9, mats.black, false);
        break;
      case 'vanity': {
        const h = 0.86, alongX = f.along === 'x';
        B(R.x0, R.z0, R.x1, R.z1, 0.32, h - 0.03, mats.oak);
        RB(R.x0 - 0.01, R.z0 - 0.01, R.x1 + 0.01, R.z1 + 0.01, h - 0.03, h, mats.stone, 0.006);
        const n = f.basins || 1;
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const cx = alongX ? R.x0 + (R.x1 - R.x0) * t : (R.x0 + R.x1) / 2, cz = alongX ? (R.z0 + R.z1) / 2 : R.z0 + (R.z1 - R.z0) * t;
          const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), mats.porcelainWhite);
          bowl.scale.set(1, 0.55, 0.8); bowl.position.set(cx, h + 0.11, cz); bowl.rotation.x = Math.PI; put(bowl);
          this.faucet(alongX ? cx : (f.wall === 'e' ? R.x1 : R.x0) + (alongX ? 0 : 0.06), alongX ? R.z0 + 0.06 : cz, h);
        }
        // espelho com LED por trás (contorno luminoso)
        const mirror = alongX ? [R.x0 + 0.05, R.z0 - 0.025, R.x1 - 0.05, R.z0 - 0.005] : [R.x0 - 0.025, R.z0 + 0.05, R.x0 - 0.005, R.z1 - 0.05];
        B(mirror[0] - 0.02, mirror[1] - 0.02, mirror[2] + 0.02, mirror[3] + 0.02, 1.08, 2.02, mats.led, false);
        B(mirror[0], mirror[1], mirror[2], mirror[3], 1.1, 2.0, mats.mirror, false);
        break;
      }
      case 'toilet': {
        const dir = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[f.dir || 'n'];
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 14), mats.porcelainWhite);
        bowl.scale.set(dir[0] ? 1.3 : 0.95, 0.9, dir[1] ? 1.3 : 0.95); bowl.position.set(P.x, 0.32, P.z); put(bowl);
        Cyl(P.x, P.z, 0.13, 0, 0.3, mats.porcelainWhite, 24);
        const tx = P.x - dir[0] * 0.3, tz = P.z - dir[1] * 0.3, ax = dir[0] ? 0.08 : 0.19, az = dir[1] ? 0.08 : 0.19;
        RB(tx - ax, tz - az, tx + ax, tz + az, 0.1, 0.78, mats.porcelainWhite, 0.03);
        break;
      }
      case 'shower': {
        B(R.x0, R.z0, R.x1, R.z1, 0, 0.012, mats.marble, false);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(R.x1 - R.x0) - 0.05, 2.05, 0.008), mats.glass);
        glass.position.set((R.x0 + R.x1) / 2, 1.04, R.z1); g.add(glass);
        B(R.x0, R.z1 - 0.01, R.x1, R.z1 + 0.01, 2.06, 2.09, mats.black, false);
        Cyl((R.x0 + R.x1) / 2, (R.z0 + R.z1) / 2, 0.15, 2.35, 2.37, mats.black, 24);
        break;
      }
      case 'elevator': {
        B(R.x0 - 0.1, R.z0 - 0.03, R.x1 + 0.1, R.z1, 0, 2.3, mats.black);
        B(R.x0, R.z1 - 0.005, (R.x0 + R.x1) / 2 - 0.004, R.z1 + 0.005, 0.02, 2.2, mats.steel, false);
        B((R.x0 + R.x1) / 2 + 0.004, R.z1 - 0.005, R.x1, R.z1 + 0.005, 0.02, 2.2, mats.steel, false);
        break;
      }
      case 'plant': this.plant(P.x, P.z, f.size || 1); break;
      case 'condenser': RB(P.x - 0.3, P.z - 0.18, P.x + 0.3, P.z + 0.18, 0, 0.75, mats.cabinet, 0.02); break;
      case 'floorlamp': this.floorLamp(P.x, P.z); break;
      case 'counterLine': {
        const d = (f.d || 22) * this.S, off = (f.side || 1) * d / 2;
        this.lineBox(f.a, f.b, d, 0.1, (f.h || 0.92) - 0.04, mats.cabinet, off);
        this.lineBox(f.a, f.b, d + 0.03, (f.h || 0.92) - 0.04, f.h || 0.92, mats.stone, off);
        break;
      }
      case 'planter': B(R.x0, R.z0, R.x1, R.z1, 0, 0.45, mats.pot); B(R.x0 + 0.03, R.z0 + 0.03, R.x1 - 0.03, R.z1 - 0.03, 0.45, f.h || 1.8, mats.leaf); break;
      case 'lounger': {
        // espreguiçadeira de fibra com almofada, encosto inclinado na ponta oeste
        RB(R.x0, R.z0, R.x1, R.z1, 0.18, 0.3, mats.oakDark, 0.03);
        RB(R.x0 + 0.05, R.z0 + 0.03, R.x1 - 0.05, R.z1 - 0.03, 0.3, 0.38, mats.cushion, 0.04);
        const back = RB(R.x0, R.z0 + 0.02, R.x0 + 0.55, R.z1 - 0.02, 0.38, 0.46, mats.cushion, 0.04); back.rotation.z = -0.6; back.position.y += 0.18;
        break;
      }
      case 'playhouse': {
        B(R.x0, R.z0, R.x1, R.z1, 0.9, 1.0, mats.oak);
        for (const [x, z] of [[R.x0, R.z0], [R.x1, R.z0], [R.x0, R.z1], [R.x1, R.z1]]) Cyl(x, z, 0.05, 0, 2.2, mats.oak, 8);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(R.x1 - R.x0, R.z1 - R.z0) / 2, 0.7, 4), mats.oakDark);
        roof.position.set((R.x0 + R.x1) / 2, 2.55, (R.z0 + R.z1) / 2); roof.rotation.y = Math.PI / 4; put(roof);
        break;
      }
      case 'art': this.art(f); break;
    }
  }

  chairsAround(cx, cz, rx, rz, n) {
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + Math.PI / n;
      this.chair(cx + Math.cos(a) * rx, cz + Math.sin(a) * rz, Math.atan2(cz + Math.sin(a) * rz - cz, cx + Math.cos(a) * rx - cx));
    }
  }
  // cadeira estofada: assento arredondado, encosto curvo de madeira, pés palito
  chair(x, z, outAngle) {
    const { mats } = this, g = new THREE.Group();
    const seat = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.08, 0.46, 3, 0.03), mats.fabric); seat.position.y = 0.46;
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.3, 0.44, 3, 0.02), mats.oak);
    back.position.set(-0.21, 0.74, 0); back.rotation.z = -0.12;
    g.add(seat, back);
    for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.01, 0.44, 8), mats.oakDark);
      leg.position.set(dx, 0.22, dz); g.add(leg);
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // encosto voltado para fora da mesa
    g.position.set(x, 0, z); g.rotation.y = -outAngle + Math.PI;
    this.group.add(g);
  }
  lamp(x, z, y) {
    const { mats } = this;
    const base = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 12), mats.ceramic); base.position.set(x, y + 0.07, z);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.18, 28, 1, true), mats.shade); shade.position.set(x, y + 0.3, z);
    this.group.add(base, shade); // cúpula emissiva à noite (sem luz pontual: custo de shader)
    base.castShadow = shade.castShadow = true;
  }
  floorLamp(x, z) {
    const { mats } = this;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.55, 8), mats.black); pole.position.set(x, 0.78, z);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 24), mats.black); foot.position.set(x, 0.01, z);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.28, 32, 1, true), mats.shade); shade.position.set(x, 1.6, z);
    this.group.add(pole, foot, shade); pole.castShadow = shade.castShadow = true;
  }
  pendant(cx, cz, len, w, y) {
    const { mats } = this;
    const bar = new THREE.Mesh(new RoundedBoxGeometry(len, 0.05, 0.08, 2, 0.02), mats.black); bar.position.set(cx, y, cz);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(len - 0.04, 0.005, 0.05), mats.led); glow.position.set(cx, y - 0.027, cz);
    this.group.add(bar, glow); bar.castShadow = true;
    for (const s of [-0.4, 0.4]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, this.H - y, 4), mats.black); c.position.set(cx + s * len, (this.H + y) / 2, cz); this.group.add(c); }
    const l = new THREE.PointLight(0xffd29a, 0, 5, 1.8); l.position.set(cx, y - 0.2, cz); this.group.add(l); this.lights.push(l);
  }
  faucet(x, z, y) {
    const { mats } = this;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 10), mats.black); p.position.set(x, y + 0.14, z);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 10), mats.black); s.rotation.x = Math.PI / 2; s.position.set(x, y + 0.27, z + 0.06);
    this.group.add(p, s);
  }
  upperCabinets(R, side) {
    const { mats } = this, d = 0.36;
    const r = side === 's' ? [R.x0, R.z1 - d, R.x1, R.z1] : [R.x0, R.z0, R.x1, R.z0 + d];
    const geo = new THREE.BoxGeometry(r[2] - r[0], 0.7, d); geo.translate((r[0] + r[2]) / 2, 1.95, (r[1] + r[3]) / 2);
    const o = new THREE.Mesh(geo, mats.oak); o.castShadow = true; o.receiveShadow = true; this.group.add(o);
    const led = new THREE.Mesh(new THREE.BoxGeometry(r[2] - r[0] - 0.05, 0.004, 0.03), mats.led); led.position.set((r[0] + r[2]) / 2, 1.598, side === 's' ? r[1] + 0.05 : r[3] - 0.05); this.group.add(led);
    // frontão (backsplash) em pedra
    const bs = new THREE.BoxGeometry(r[2] - r[0], 0.68, 0.015); bs.translate((r[0] + r[2]) / 2, 1.26, side === 's' ? R.z1 - 0.008 : R.z0 + 0.008);
    this.group.add(new THREE.Mesh(bs, mats.stone));
  }
  plant(x, z, s = 1) {
    const { mats } = this;
    // vaso cerâmico com borda e terra
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.21 * s, 0.15 * s, 0.44 * s, 32), mats.pot); pot.position.set(x, 0.22 * s, z);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.205 * s, 0.012 * s, 8, 40), mats.pot); rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.44 * s, z);
    const soil = new THREE.Mesh(new THREE.CircleGeometry(0.2 * s, 32), mats.soil); soil.rotation.x = -Math.PI / 2; soil.position.set(x, 0.41 * s, z);
    pot.castShadow = rim.castShadow = true; pot.receiveShadow = true;
    this.group.add(pot, rim, soil);
    // folhas texturizadas (recorte por alpha), arqueadas e torcidas, saindo de hastes
    const L = 0.62 * s, W = 0.24 * s;
    const leafGeo = new THREE.PlaneGeometry(W, L, 4, 10); leafGeo.translate(0, L / 2, 0);
    const pos = leafGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / L, xx = pos.getX(i) / W;
      pos.setZ(i, -0.42 * L * y * y + 0.12 * W * xx * xx * 4); // arqueia para fora e forma a calha da nervura
      pos.setX(i, pos.getX(i) + 0.03 * L * Math.sin(y * 3));
    }
    leafGeo.computeVertexNormals();
    const stemGeo = new THREE.CylinderGeometry(0.006 * s, 0.009 * s, 1, 6); stemGeo.translate(0, 0.5, 0);
    const n = Math.round(18 + 6 * s);
    // instanciado: 3 draw calls por planta (folhas claras, escuras e hastes) em vez de ~50
    const leavesA = new THREE.InstancedMesh(leafGeo, mats.leafTexA, n), leavesB = new THREE.InstancedMesh(leafGeo, mats.leafTexB, n);
    const stems = new THREE.InstancedMesh(stemGeo, mats.leaf, n);
    const o = new THREE.Object3D(); let nA = 0, nB = 0;
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996 + rnd(-0.2, 0.2), tilt = rnd(0.15, 0.75), h = rnd(0.25, 0.7) * s;
      o.position.set(x, 0.4 * s, z); o.rotation.set(-tilt * 0.6, a, 0, 'YXZ'); o.scale.set(1, h, 1); o.updateMatrix();
      stems.setMatrixAt(i, o.matrix);
      const tip = new THREE.Vector3(0, h, 0).applyEuler(o.rotation).add(o.position);
      o.position.copy(tip); o.rotation.set(-(tilt + rnd(0.1, 0.5)), a, rnd(-0.4, 0.4), 'YXZ'); o.scale.setScalar(rnd(0.75, 1.15)); o.updateMatrix();
      if (i % 3) leavesA.setMatrixAt(nA++, o.matrix); else leavesB.setMatrixAt(nB++, o.matrix);
    }
    leavesA.count = nA; leavesB.count = nB;
    for (const m of [leavesA, leavesB]) { m.castShadow = m.receiveShadow = true; m.computeBoundingSphere(); }
    this.group.add(leavesA, leavesB, stems);
  }
  decor(x, z, y, kind) {
    const { mats } = this;
    if (kind === 'vase' || kind === 'bowl') {
      const v = new THREE.Mesh(new THREE.SphereGeometry(kind === 'bowl' ? 0.16 : 0.09, 24, 12, 0, Math.PI * 2, 0, kind === 'bowl' ? Math.PI / 2 : Math.PI), mats.ceramic);
      if (kind === 'bowl') { v.rotation.x = Math.PI; v.scale.y = 0.45; v.position.set(x, y + 0.07, z); } else { v.scale.y = 1.6; v.position.set(x, y + 0.14, z); }
      v.castShadow = true; this.group.add(v);
      if (kind === 'vase') for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.35, 4), mats.oakDark); st.position.set(x + rnd(-0.03, 0.03), y + 0.4, z + rnd(-0.03, 0.03)); st.rotation.z = rnd(-0.3, 0.3); this.group.add(st); }
    } else if (kind === 'books') {
      const cols = [mats.bookA, mats.bookB, mats.bookC];
      for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.24 - i * 0.02, 0.035, 0.17 - i * 0.01), cols[i]); b.position.set(x, y + 0.018 + i * 0.036, z); b.rotation.y = rnd(-0.2, 0.2); b.castShadow = true; this.group.add(b); }
    } else if (kind === 'fruit') {
      this.decor(x, z, y, 'bowl');
      for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), i % 2 ? mats.fruitA : mats.fruitB); f.position.set(x + rnd(-0.06, 0.06), y + 0.06, z + rnd(-0.06, 0.06)); this.group.add(f); }
    }
  }
  art(f) {
    // quadro com moldura fina; pintura abstrata procedural na paleta (areia, dourado, marinho, terracota, sálvia)
    const { X, Z, mats } = this, w = f.w || 1.2, h = f.h || 0.85;
    const tex = canvasTex(512, (g, S) => {
      const c = ['#e9dcc6', '#c9a46a', '#1f2f57', '#b5654a', '#7d8f7a'];
      g.fillStyle = '#f3efe7'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 6; i++) { g.fillStyle = c[(i + (f.seed || 0)) % 5]; g.globalAlpha = rnd(0.55, 0.95); g.beginPath(); g.ellipse(rnd(0, S), rnd(0, S), rnd(50, 210), rnd(40, 170), rnd(0, 3), 0, 6.3); g.fill(); }
      g.globalAlpha = 1; noise(g, 5000, 0.05, false);
    }, 1);
    tex.repeat.set(1, 1);
    const rot = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[f.face];
    const nrm = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[f.face];
    const x = X(f.p[0]), z = Z(f.p[1]), y = f.y || 1.55;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, h + 0.05, 0.03), mats.black);
    frame.position.set(x + nrm[0] * 0.016, y, z + nrm[1] * 0.016); frame.rotation.y = rot;
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    canvas.position.set(x + nrm[0] * 0.033, y, z + nrm[1] * 0.033); canvas.rotation.y = rot;
    frame.castShadow = true;
    this.group.add(frame, canvas);
  }


  // ------------------------------------------------ navegação
  worldOf(node) {
    const c = this.conv(this.levels[node.lv || 0]);
    const v = new THREE.Vector3(c.X(node.p[0]), c.y + 1.6, c.Z(node.p[1]));
    return this.root.localToWorld(v);
  }
  // direção de mundo a partir do yaw (graus na planta: 0 = topo da planta / norte, 90 = mar)
  dirFromYaw(yaw, pitch) {
    const a = yaw * Math.PI / 180;
    const local = new THREE.Vector3(Math.sin(a) * Math.cos(pitch), Math.sin(pitch), -Math.cos(a) * Math.cos(pitch));
    const q = new THREE.Quaternion(); this.parent.getWorldQuaternion(q);
    return local.applyQuaternion(q);
  }
  enter(startId) {
    this.build();
    this.root.visible = true;
    this.active = true;
    const n = this.plan.nodes.find(x => x.id === (startId || this.plan.start));
    this.goTo(n, true);
  }
  exit() { this.active = false; if (this.root) this.root.visible = false; this.anim = null; }
  // recaptura o reflexo (6 renders de 256 px): ao chegar num ponto e quando a luz muda
  invalidateProbe() { this.probeDirty = true; }
  captureProbe() {
    if (!this.probe || this.anim) return;
    const now = performance.now();
    if (!this.probeDirty || now - (this._probeT || 0) < 180) return;
    this.probeDirty = false; this._probeT = now;
    let scene = this.root; while (scene.parent) scene = scene.parent;
    this.root.worldToLocal(this.probe.position.copy(this.camera.position));
    this.nodeMeshes.forEach(m => { m.userData.wasVis = m.visible; m.visible = false; });
    this.probe.update(this.renderer, scene);
    this.nodeMeshes.forEach(m => { m.visible = m.userData.wasVis; });
  }
  goTo(node, instant, turn) {
    const from = this.camera.position.clone(), to = this.worldOf(node);
    if (instant) { this.camera.position.copy(to); this.yaw = node.look; this.pitch = -0.16; }
    else {
      // mantém a direção do olhar, ou vira para o destino se estiver de costas
      this.anim = { from, to, t0: performance.now(), dur: Math.min(1100, 350 + from.distanceTo(to) * 90) };
      // escolhendo o ambiente pela lista, a câmera também gira para a vista sugerida do ambiente
      if (turn) Object.assign(this.anim, { yaw0: this.yaw, dyaw: ((node.look - this.yaw) % 360 + 540) % 360 - 180, pitch0: this.pitch });
    }
    this.node = node; this.probeDirty = true;
    this.aimWindowLights(node);
    this.ui?.onNode?.(node);
    this.nodeMeshes?.forEach(m => { m.visible = m.userData.node !== node; });
  }
  update() {
    if (!this.active) return;
    if (this.anim) {
      const k = Math.min(1, (performance.now() - this.anim.t0) / this.anim.dur), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      this.camera.position.lerpVectors(this.anim.from, this.anim.to, e);
      if (this.anim.dyaw !== undefined) { this.yaw = this.anim.yaw0 + this.anim.dyaw * e; this.pitch = this.anim.pitch0 + (-0.14 - this.anim.pitch0) * e; }
      if (k >= 1) { this.anim = null; this.probeDirty = true; }
    }
    this.captureProbe();
    const asp = this.camera.aspect, fovT = asp < 1 ? Math.min(98, this.fov * (1 + (1 - asp) * 0.6)) : this.fov;
    this.camera.fov += (fovT - this.camera.fov) * 0.25;
    this.camera.updateProjectionMatrix();
    const d = this.dirFromYaw(this.yaw, this.pitch);
    this.camera.lookAt(this.camera.position.clone().add(d));
    // hotspots pulsam levemente
    const s = 1 + 0.06 * Math.sin(performance.now() / 300);
    this.nodeMeshes.forEach(m => m.scale.setScalar(s));
  }
  // clique: hotspot direto ou ponto do piso → nó mais próximo daquele ponto
  pick(ndc) {
    this.ray.setFromCamera(ndc, this.camera);
    const hs = this.ray.intersectObjects(this.nodeMeshes, true).find(h => h.object.parent.visible);
    if (hs) { const n = hs.object.userData.node; return n.link ? this.plan.nodes.find(x => x.id === n.link) : n; }
    const hit = this.ray.intersectObjects(this.walkables, false)[0];
    if (!hit) return null;
    const lv = hit.object.userData.lv || 0, c = this.conv(this.levels[lv]);
    const local = this.root.worldToLocal(hit.point.clone());
    let best = null, bd = Infinity;
    for (const n of this.plan.nodes) {
      if (n === this.node || (n.lv || 0) !== lv) continue;
      const d = Math.hypot(c.X(n.p[0]) - local.x, c.Z(n.p[1]) - local.z);
      if (d < bd) { bd = d; best = n; }
    }
    return bd < 4 ? best : null;
  }
  hover(ndc) {
    this.ray.setFromCamera(ndc, this.camera);
    const hs = this.ray.intersectObjects(this.nodeMeshes, true).find(h => h.object.parent.visible);
    this.nodeMeshes.forEach(m => m.children.forEach(c => { c.material.opacity = (hs && hs.object.parent === m) ? 1 : (c.geometry.type === 'CircleGeometry' ? 0.5 : 0.9); }));
    return hs?.object.userData.node || null;
  }
  setNight(night) {
    this.probeDirty = true;
    const k = this.lightScale ?? 1;
    this.lights.forEach(l => { l.intensity = (l.userData.small ? 1.6 : 5) * night * k; });
    if (this.mats) this.mats.shade.emissiveIntensity = 0.9 * night;
  }
  // luz do céu pelas janelas: forte de dia, quente no fim de tarde, apagada à noite
  setDay(day, warm) {
    (this.windowLs || []).forEach(l => {
      l.intensity = 3.2 * day;
      l.color.setRGB(1, 0.97 - 0.12 * warm, 0.94 - 0.3 * warm);
    });
  }

}

function inPoly(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function polyArea(p) { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return a / 2; }
