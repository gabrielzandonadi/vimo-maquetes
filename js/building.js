// Maquete procedural do Apogeo Residences.
// Sistema local do edifício: x aponta para o mar (frente, Av. Antônio Gil Veloso), z aponta para SSO,
// origem no centro da testada. O lote vai de x = 0 (frente) até x = -84 (Rua Lúcio Bacelar).
// Volumetria interpretada a partir das imagens e da tabela de unidades: embasamento escalonado
// (1º ao 7º pavimento), lazer no 8º (praia suspensa) e torre do 9º ao 15º.
import * as THREE from 'three';
import { PROJECT } from './projects/apogeo.js';
import { facadeTextures, meterUV } from './facade.js';
const PLAN_901 = PROJECT.tower.plan; // planta-tipo da torre

export const G = PROJECT.heights.ground;   // pé-direito do térreo
export const FH = PROJECT.heights.floor;   // pé-direito dos pavimentos
const SLAB = PROJECT.heights.slab;
const BAL = PROJECT.balcony;              // profundidade das varandas
const BACK = PROJECT.podium.back;          // fachada de fundos
const HALF_W = PROJECT.podium.halfWidth;   // meia-largura do embasamento
export const floorY = f => (f <= 0 ? 0 : G + (f - 1) * FH);

// frente (borda da laje) de cada pavimento do embasamento – escalonamento em direção ao mar
const PODIUM_FRONT = PROJECT.podium.front;
const PODIUM_TOP = Math.max(...Object.keys(PODIUM_FRONT).map(Number));
const LEISURE = PROJECT.leisureFloor, TW = PROJECT.tower;
// torre: trapézio com a face larga a oeste, alinhado ao lado SSO do lote (planta-chave do material)
const TOWER = { x0: -80, x1: -52, zW: [-4, 13], zE: [-2, 12] };
// pavimento-tipo da torre vem da planta oficial (unidade 901): px → sistema local
const PS = PLAN_901.scale, [PAX, PAY] = PLAN_901.anchor.px, [PLX, PLZ] = PLAN_901.anchor.local;
const pX = px => PLX + (px - PAX) * PS, pZ = py => PLZ + (py - PAY) * PS;
const TOWER_OUTLINE = PLAN_901.outline.map(([x, y]) => [pX(x), pZ(y)]);
const TOWER_INTERIOR = [[300, 318], [520, 318], [737, 352], [1085, 445], [1085, 561], [1105, 561], [1105, 668], [1179, 668], [1179, 745], [945, 745], [945, 703], [835, 703], [835, 768], [441, 768], [380, 764], [342, 748], [318, 722], [300, 690]].map(([x, y]) => [pX(x), pZ(y)]);
const TOWER_CORE = { x0: pX(532), x1: pX(737), z0: pZ(287), z1: pZ(583) };
const towerTopZ = x => pZ(222 + 0.262 * ((x - PLX) / PS + PAX - 314)); // borda norte (inclinada) da laje
export { TOWER_OUTLINE };

const ORIENT = {
  '+x': { label: 'Leste-Sudeste · vista mar', short: 'ESE (mar)', bearing: 101 },
  '-x': { label: 'Oeste-Noroeste · Rua Lúcio Bacelar', short: 'ONO (fundos)', bearing: 281 },
  '-z': { label: 'Norte-Nordeste · lateral', short: 'NNE (lateral)', bearing: 11 },
  '+z': { label: 'Sul-Sudoeste · lateral', short: 'SSO (lateral)', bearing: 191 },
};
export { ORIENT };

const areaNum = s => parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0;

// ---------- geometria utilitária ----------
function roundedPoly(pts, r) {
  // pts: [[x,z],...] em sentido qualquer; r: raio único ou array por vértice
  const shape = new THREE.Shape();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i], prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
    const rr = Array.isArray(r) ? r[i] : r;
    const d1 = Math.hypot(prev[0] - p[0], prev[1] - p[1]), d2 = Math.hypot(next[0] - p[0], next[1] - p[1]);
    const k = Math.min(rr, d1 / 2.05, d2 / 2.05);
    const a = [p[0] + (prev[0] - p[0]) / d1 * k, p[1] + (prev[1] - p[1]) / d1 * k];
    const b = [p[0] + (next[0] - p[0]) / d2 * k, p[1] + (next[1] - p[1]) / d2 * k];
    if (i === 0) shape.moveTo(a[0], a[1]); else shape.lineTo(a[0], a[1]);
    shape.quadraticCurveTo(p[0], p[1], b[0], b[1]);
  }
  shape.closePath();
  return shape;
}
function extrude(shape, y0, h, curveSegments = 10) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments });
  g.rotateX(Math.PI / 2);
  g.translate(0, y0 + h, 0);
  return g;
}
function rectPts(x0, x1, z0, z1) { return [[x1, z0], [x1, z1], [x0, z1], [x0, z0]]; }
function inset(pts, d) {
  // recuo simples para quadriláteros convexos (desloca cada aresta para dentro)
  const n = pts.length, cx = pts.reduce((s, p) => s + p[0], 0) / n, cz = pts.reduce((s, p) => s + p[1], 0) / n;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    let nx = -(b[1] - a[1]), nz = b[0] - a[0]; const l = Math.hypot(nx, nz); nx /= l; nz /= l;
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if ((cx - mx) * nx + (cz - mz) * nz < 0) { nx = -nx; nz = -nz; }
    lines.push({ p: [a[0] + nx * d, a[1] + nz * d], d: [b[0] - a[0], b[1] - a[1]] });
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const L1 = lines[(i - 1 + n) % n], L2 = lines[i];
    const den = L1.d[0] * L2.d[1] - L1.d[1] * L2.d[0];
    const t = ((L2.p[0] - L1.p[0]) * L2.d[1] - (L2.p[1] - L1.p[1]) * L2.d[0]) / den;
    out.push([L1.p[0] + L1.d[0] * t, L1.p[1] + L1.d[1] * t]);
  }
  return out;
}

// ---------- materiais ----------
export function makeMaterials() {
  return {
    slab: new THREE.MeshStandardMaterial({ color: 0xece6dc, roughness: 0.55, metalness: 0.0 }),
    slabEdge: new THREE.MeshStandardMaterial({ color: 0xb8ab97, roughness: 0.5, metalness: 0.25 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xdcd5c9, roughness: 0.8 }),
    core: new THREE.MeshStandardMaterial({ color: 0xf1efea, roughness: 0.6 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x55504a, roughness: 0.7 }),
    rail: new THREE.MeshStandardMaterial({ color: 0xbfd6dc, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
    pool: new THREE.MeshStandardMaterial({ color: 0x3fb7c9, roughness: 0.08, metalness: 0.1, emissive: 0x0a3a44, emissiveIntensity: 0.25 }),
    sand: new THREE.MeshStandardMaterial({ color: 0xe6d3a8, roughness: 1 }),
    deck: new THREE.MeshStandardMaterial({ color: 0x9a7552, roughness: 0.8 }),
    green: new THREE.MeshStandardMaterial({ color: 0x55803f, roughness: 0.9 }),
    paving: new THREE.MeshStandardMaterial({ color: 0xcfc6b6, roughness: 0.9 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x8b7a63, roughness: 0.9 }),
    frond: new THREE.MeshStandardMaterial({ color: 0x4f7a35, roughness: 0.8, side: THREE.DoubleSide }),
    // acabamentos da perspectiva: borda das lajes em bronze champanhe, forro claro, brises e núcleo frisado
    fascia: new THREE.MeshStandardMaterial({ color: 0xbfa37c, roughness: 0.3, metalness: 0.75, envMapIntensity: 1.3 }),
    soffit: new THREE.MeshStandardMaterial({ color: 0xeae2d4, roughness: 0.75 }),
    post: new THREE.MeshStandardMaterial({ color: 0x8f7a5e, roughness: 0.35, metalness: 0.8 }),
    brise: new THREE.MeshStandardMaterial({ map: facadeTextures().brise, alphaTest: 0.5, roughness: 0.55, metalness: 0.4, side: THREE.DoubleSide }),
    coreRibs: new THREE.MeshStandardMaterial({ map: facadeTextures().ribs, roughness: 0.55 }),
    planter: new THREE.MeshStandardMaterial({ color: 0x8c8378, roughness: 0.85 }),
    shrubA: new THREE.MeshStandardMaterial({ color: 0x4e7a35, roughness: 0.85 }),
    shrubB: new THREE.MeshStandardMaterial({ color: 0x6b9346, roughness: 0.85 }),
  };
}
// fachada das unidades: pedra clara com portas de correr e janelas (textura em metros, ver facade.js)
function unitFacade() {
  const t = facadeTextures();
  return new THREE.MeshStandardMaterial({
    map: t.map, emissiveMap: t.emissiveMap, roughnessMap: t.roughnessMap,
    color: 0xffffff, roughness: 1, metalness: 0.05, envMapIntensity: 1.1,
    emissive: 0x000000, emissiveIntensity: 1, transparent: true, opacity: 1,
  });
}
function unitGlass() {
  return new THREE.MeshStandardMaterial({
    color: 0x6f8c96, roughness: 0.08, metalness: 0.55, envMapIntensity: 1.2,
    emissive: 0x000000, emissiveIntensity: 1, transparent: true, opacity: 0.92,
  });
}

// ---------- distribuição das unidades ----------
function floorOf(name) { return Math.floor(parseInt(name, 10) / 100); }

function layoutPodiumFloor(f, units, frontFacade) {
  // devolve células {unit, x0,x1,z0,z1, sides:{...}} ao longo do eixo x, a partir da frente
  const cells = [];
  let x = frontFacade;
  const back = BACK + 0.8;
  const avail = x - back;
  const W = HALF_W * 2 - 2 * BAL;      // largura interna
  const pairing = units.length >= 5;
  const groups = [];
  const small = units.filter(u => pairing && areaNum(u.area) < 240);
  const big = units.filter(u => !small.includes(u));
  big.forEach(u => groups.push([u]));
  for (let i = 0; i < small.length; i += 2) groups.push(small.slice(i, i + 2));
  // comprimento ~ área bruta (área privativa × 1,22) / largura ocupada
  let lens = groups.map(g => g.length === 2 ? Math.max(...g.map(u => areaNum(u.area))) * 1.22 / (W / 2) : areaNum(g[0].area) * 1.22 / W);
  const total = lens.reduce((a, b) => a + b, 0);
  const maxUse = avail - 6; // reserva ~6 m para núcleo/circulação
  if (total > maxUse) lens = lens.map(l => l * maxUse / total);
  groups.forEach((g, gi) => {
    const x1 = x, x0 = x - lens[gi];
    const isFront = gi === 0;
    if (g.length === 1) {
      cells.push({ unit: g[0], x0, x1, z0: -HALF_W + BAL, z1: HALF_W - BAL, sides: { '+x': isFront, '-z': true, '+z': true, '-x': false } });
    } else {
      cells.push({ unit: g[0], x0, x1, z0: -HALF_W + BAL, z1: -0.15, sides: { '+x': isFront, '-z': true, '+z': false, '-x': false } });
      if (g[1]) cells.push({ unit: g[1], x0, x1, z0: 0.15, z1: HALF_W - BAL, sides: { '+x': isFront, '-z': false, '+z': true, '-x': false } });
    }
    x = x0 - 0.3;
  });
  return { cells, coreFrom: x, back };
}

// ---------- palmeiras ----------
function palm(mats, h = 7 + Math.random() * 3) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, h, 7), mats.trunk);
  trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
  const leafGeo = new THREE.PlaneGeometry(0.9, 3.6, 1, 4);
  leafGeo.translate(0, 1.8, 0);
  const pos = leafGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); pos.setZ(i, -0.12 * y * y); }
  leafGeo.computeVertexNormals();
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(leafGeo, mats.frond);
    leaf.position.y = h;
    leaf.rotation.order = 'YXZ';
    leaf.rotation.y = i / 9 * Math.PI * 2 + Math.random() * 0.3;
    leaf.rotation.x = -0.9 - Math.random() * 0.4;
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}
function tree(mats, h = 5) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, h * 0.55, 7), mats.trunk);
  trunk.position.y = h * 0.27; trunk.castShadow = true; g.add(trunk);
  // copa em vários volumes, como uma árvore tropical frondosa
  for (let i = 0; i < 5; i++) {
    const r = h * (0.18 + Math.random() * 0.1);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), i % 2 ? mats.green : mats.frond);
    crown.position.set((Math.random() - 0.5) * h * 0.35, h * (0.55 + Math.random() * 0.25), (Math.random() - 0.5) * h * 0.35);
    crown.scale.y = 0.8; crown.castShadow = true; g.add(crown);
  }
  return g;
}

// ---------- construção ----------
export function buildApogeo(units) {
  const mats = makeMaterials();
  const group = new THREE.Group();
  group.name = 'Apogeo';
  const unitMeshes = [];
  const railMeshes = [];
  const add = (geo, mat, { cast = true, receive = true, occlude = true } = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast; m.receiveShadow = receive;
    m.userData.occluder = occlude;
    group.add(m); return m;
  };
  const byFloor = {};
  units.forEach(u => { (byFloor[floorOf(u.name)] ||= []).push(u); });

  const makeUnit = (u, x0, x1, z0, z1, y0, h, sides, extra = {}) => {
    let geo;
    if (extra.poly) {
      // a extrusão é girada (rotateX +90°), o que espelha o polígono: o contorno precisa estar no
      // sentido horário para as faces externas ficarem voltadas para fora
      let pts = extra.poly.map(([x, z]) => new THREE.Vector2(x, z));
      if (!THREE.ShapeUtils.isClockWise(pts)) pts = pts.reverse();
      geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: h, bevelEnabled: false });
      geo.rotateX(Math.PI / 2); geo.translate(0, y0 + h, 0);
    } else {
      geo = new THREE.BoxGeometry(x1 - x0, h, z1 - z0);
      geo.translate((x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2);
    }
    meterUV(geo, y0);
    const mat = unitFacade();
    const m = add(geo, mat);
    m.userData = { ...m.userData, unit: u, box: { x0, x1, z0, z1, y0, h }, sides, ...extra, lit: Math.random() < 0.72 };
    unitMeshes.push(m);
    // caixilhos verticais
    return m;
  };
  // laje: 0,5 m de espessura visual, topo/forro claros e borda (lateral) em bronze
  const slab = (shape, yTop) => add(extrude(shape, yTop - 0.5, 0.5), [mats.soffit, mats.fascia]);
  const postPts = [];
  const shrubPts = [];
  const addRail = (pts, y0, closedRadius) => {
    // guarda-corpo de vidro acompanhando a borda (forma) da laje
    const shape = roundedPoly(pts, closedRadius);
    const outer = shape.getSpacedPoints(160);
    const geo = new THREE.BufferGeometry();
    const v = [], idx = [];
    outer.forEach((p, i) => { v.push(p.x, y0, p.y, p.x, y0 + 1.1, p.y); });
    for (let i = 0; i < outer.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = add(geo, mats.rail, { cast: false, receive: false, occlude: false });
    railMeshes.push(m);
    // corrimão metálico
    const top = new THREE.BufferGeometry().setFromPoints(outer.map(p => new THREE.Vector3(p.x, y0 + 1.1, p.y)));
    const line = new THREE.Line(top, new THREE.LineBasicMaterial({ color: 0x9a907f }));
    group.add(line);
    // montantes metálicos a cada ~1,5 m
    let acc = 0;
    for (let i = 1; i < outer.length; i++) {
      acc += outer[i].distanceTo(outer[i - 1]);
      if (acc >= 1.5) { acc = 0; postPts.push([outer[i].x, y0, outer[i].y]); }
    }
  };

  // ----- terreno do lote, jardim e térreo -----
  add(extrude(roundedPoly(rectPts(-84, 0, -14, 14), 0.5), -0.3, 0.38), mats.paving, { cast: false });
  add(extrude(roundedPoly(rectPts(-7.5, -0.5, -13.5, 13.5), 1.5), 0.05, 0.25), mats.green, { cast: false });
  // térreo: volumes de lobby (Sereia, Convento, Moreno) recuados e pilotis
  const lobbyGlass = unitGlass(); lobbyGlass.color.set(0x8aa4ab);
  add(extrude(roundedPoly(rectPts(-78, -12, -10, 10), 3), 0.1, G - 0.1), lobbyGlass);
  add(extrude(roundedPoly(rectPts(-79, -66, -12.5, 12.5), 1), 0.1, G - 0.1), mats.dark); // garagem / serviços
  for (let x = -20; x > -78; x -= 9) for (const z of [-11.5, 11.5]) {
    add(new THREE.CylinderGeometry(0.45, 0.45, G, 16).translate(x, G / 2, z), mats.core);
  }
  // marquise do porte-cochère (curva) na lateral NNE
  add(extrude(roundedPoly([[-14, -13], [-14, -19], [-34, -19], [-34, -13]], [0, 4, 4, 0]), G - 0.45, 0.35), mats.slabEdge);
  // jardim e palmeiras na testada
  const deco = new THREE.Group(); group.add(deco);
  [[-3, -11], [-4.5, -6], [-2.5, 7], [-5, 11], [-3.5, 2], [-16, -17.5], [-24, -17.8]].forEach(([x, z]) => {
    const p = palm(mats); p.position.set(x, 0.3, z); deco.add(p);
  });
  [[-6, -1], [-82, -11], [-82, 11], [-82, 0]].forEach(([x, z]) => { const t = tree(mats, 5 + Math.random() * 2); t.position.set(x, 0.3, z); deco.add(t); });
  deco.traverse(o => { if (o.isMesh) o.userData.occluder = true; });

  // ----- embasamento 1º ao 7º -----
  const terraces = [];
  for (let f = 1; f <= PODIUM_TOP; f++) {
    const y = floorY(f);
    const front = PODIUM_FRONT[f];
    const slabPts = rectPts(BACK, front, -HALF_W, HALF_W);
    const radii = [7, 7, 1.5, 1.5];
    // laje de piso (borda curva marcante, como nas perspectivas)
    slab(roundedPoly(slabPts, radii), y);
    addRail(slabPts, y, radii);
    // brises (painéis de lâminas) em parte dos guarda-corpos laterais, alternando por pavimento
    for (let x = BACK + 4, i = 0; x < front - 7; x += 6, i++) {
      if ((i + f) % 3) continue;
      for (const z of [-HALF_W + 0.04, HALF_W - 0.04]) {
        const b = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.05), mats.brise);
        b.position.set(x + 1.3, y + 0.53, z); b.castShadow = true; b.receiveShadow = true; b.userData.occluder = false;
        group.add(b);
      }
    }
    const frontFacade = front - BAL;
    let cells;
    if (f === 1 || f === 2) {
      // 101 e 102: duplex com frente para o mar, ocupando 1º e 2º pavimentos
      const dLen = 19;
      const df = PODIUM_FRONT[2] - BAL;
      if (f === 1) {
        const [gA, gB] = PROJECT.podium.gardenDuplex;
        const u101 = byFloor[1].find(u => u.name === gA), u102 = byFloor[1].find(u => u.name === gB);
        const h = 2 * FH - SLAB;
        makeUnit(u101, df - dLen, df, -HALF_W + BAL, -0.15, y, h, { '+x': true, '-z': true, '+z': false, '-x': false }, { floors: [1, 2] });
        makeUnit(u102, df - dLen, df, 0.15, HALF_W - BAL, y, h, { '+x': true, '-z': false, '+z': true, '-x': false }, { floors: [1, 2] });
        // restante do 1º: áreas comuns / apoio
        add(extrude(roundedPoly(rectPts(BACK + 0.8, df - dLen - 0.3, -HALF_W + BAL, HALF_W - BAL), 0.5), y, FH - SLAB), mats.wall);
        cells = [];
      } else {
        const lay = layoutPodiumFloor(f, byFloor[2], df - dLen - 0.3);
        cells = lay.cells.map(c => ({ ...c, sides: { ...c.sides, '+x': false } }));
        add(extrude(roundedPoly(rectPts(BACK + 0.8, lay.coreFrom, -HALF_W + BAL, HALF_W - BAL), 0.5), y, FH - SLAB), mats.wall);
      }
    } else {
      const lay = layoutPodiumFloor(f, byFloor[f] || [], frontFacade);
      cells = lay.cells;
      add(extrude(roundedPoly(rectPts(BACK + 0.8, lay.coreFrom, -HALF_W + BAL, HALF_W - BAL), 0.5), y, FH - SLAB), mats.wall);
    }
    cells.forEach(c => makeUnit(c.unit, c.x0, c.x1, c.z0, c.z1, y, FH - SLAB, c.sides, { floors: [f] }));
    // terraço descoberto criado pelo recuo do pavimento de cima → piscina privativa
    if (f < PODIUM_TOP) {
      const nextFront = PODIUM_FRONT[f + 1] ?? front;
      const tY = y + FH - SLAB;
      if (front - nextFront > 3) terraces.push({ f, x0: nextFront, x1: front, y: tY });
    }
  }
  // cobertura do 7º = piso do lazer (8º)
  const y8 = floorY(LEISURE);
  slab(roundedPoly(rectPts(BACK, PODIUM_FRONT[PODIUM_TOP], -HALF_W, HALF_W), [7, 7, 1.5, 1.5]), y8);
  addRail(rectPts(BACK, PODIUM_FRONT[PODIUM_TOP], -HALF_W, HALF_W), y8, [7, 7, 1.5, 1.5]);

  // piscinas privativas nos terraços escalonados
  terraces.forEach(t => {
    // jardineira contínua na borda do terraço, com arbustos
    add(new THREE.BoxGeometry(0.6, 0.5, HALF_W * 2 - 3).translate(t.x1 - 0.55, t.y + 0.25, 0), mats.planter);
    for (let z = -HALF_W + 1.8; z < HALF_W - 1.5; z += 0.75) shrubPts.push([t.x1 - 0.55 + (Math.random() - 0.5) * 0.2, t.y + 0.6, z, 0.35 + Math.random() * 0.25]);
    const len = Math.min(5, t.x1 - t.x0 - 1.5);
    for (const z of [-7, 7]) {
      add(new THREE.BoxGeometry(len, 0.25, 3.2).translate(t.x1 - BAL - len / 2 - 0.4, t.y + 0.13, z), mats.pool, { cast: false });
    }
  });

  // ----- 8º pavimento: lazer / praia suspensa -----
  const leisure = new THREE.Group(); group.add(leisure);
  const lx1 = PODIUM_FRONT[PODIUM_TOP] - 1;
  // praia (areia) + piscina panorâmica com borda infinita voltada para o mar
  add(extrude(roundedPoly(rectPts(lx1 - 8, lx1, -HALF_W + 1, HALF_W - 1), [6, 6, 0.5, 0.5]), y8, 0.12), mats.sand, { cast: false });
  add(extrude(roundedPoly(rectPts(lx1 - 7, lx1 - 0.8, -9, 4), [4, 4, 0.5, 0.5]), y8 + 0.05, 0.12), mats.pool, { cast: false });
  add(extrude(roundedPoly(rectPts(-51, lx1 - 8, -HALF_W + 1, HALF_W - 1), 0.5), y8, 0.1), mats.deck, { cast: false });
  // pavilhão envidraçado (spa, sauna, massagem) sob a torre
  const spaGlass = unitGlass(); spaGlass.color.set(0x9fb6bb);
  const spa = add(extrude(roundedPoly(rectPts(-79, -53, -11, 12), 2), y8, FH - SLAB), spaGlass);
  spa.userData.leisure = true;
  // pergolado
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.12, 0.25, 9).translate(-50 + i * 0.9 - 0, y8 + 2.9, -6), mats.deck);
  for (const x of [-50, -43]) for (const z of [-10, -2]) add(new THREE.CylinderGeometry(0.1, 0.1, 2.9, 8).translate(x, y8 + 1.45, z), mats.dark);
  [[lx1 - 2, 8], [lx1 - 3, -11], [-46, 10]].forEach(([x, z]) => { const p = palm(mats, 4.5); p.position.set(x, y8, z); leisure.add(p); });
  leisure.traverse(o => { if (o.isMesh) { o.userData.occluder = true; } });

  // ----- torre 9º ao 15º -----
  const tPts = [[TOWER.x1, TOWER.zE[0]], [TOWER.x1, TOWER.zE[1]], [TOWER.x0, TOWER.zW[1]], [TOWER.x0, TOWER.zW[0]]];
  const tSlab = TOWER_OUTLINE;
  const tR = 0.4;
  for (let f = TW.typical[0]; f <= TW.roofFloor; f++) {
    const y = floorY(f);
    slab(roundedPoly(tSlab, tR), y);
    if (f < TW.roofFloor) addRail(tSlab, y, tR);
  }
  // unidades da torre: 901–1301 (tipo) e 1401 (duplex 14º/15º)
  const tx0 = pX(300), tx1 = pX(1085);
  const towerSides = { '+x': true, '-z': true, '+z': true, '-x': false };
  for (let f = TW.typical[0]; f <= TW.typical[1]; f++) {
    const u = (byFloor[f] || [])[0];
    if (u) makeUnit(u, tx0, tx1, pZ(330), pZ(768), floorY(f), FH - SLAB, towerSides, { floors: [f], tower: true, poly: TOWER_INTERIOR, plan: '901' });
  }
  const u1401 = (byFloor[TW.penthouse[0]] || [])[0];
  if (u1401) makeUnit(u1401, tx0, tx1, pZ(330), pZ(768), floorY(TW.penthouse[0]), (TW.penthouse[1] - TW.penthouse[0] + 1) * FH - SLAB, towerSides, { floors: TW.penthouse, tower: true, poly: TOWER_INTERIOR });
  // núcleo vertical branco com frisos (o "fin" que marca a fachada)
  const coreTop = floorY(TW.roofFloor) + 4.2;
  const C = TOWER_CORE;
  const coreGeo = new THREE.BoxGeometry(C.x1 - C.x0, coreTop - floorY(LEISURE), C.z1 - C.z0).translate((C.x0 + C.x1) / 2, floorY(LEISURE) + (coreTop - floorY(LEISURE)) / 2, (C.z0 + C.z1) / 2);
  meterUV(coreGeo, floorY(LEISURE));
  const ribs = mats.coreRibs.map; ribs.repeat.set(6 / 0.45, 1);
  add(coreGeo, mats.coreRibs);
  for (let i = 0; i < 4; i++) {
    add(new THREE.BoxGeometry(0.18, coreTop - floorY(LEISURE), 0.25).translate(C.x0 + 0.8 + i * 1.3, floorY(LEISURE) + (coreTop - floorY(LEISURE)) / 2, C.z0 - 0.1), mats.wall, { cast: false });
  }
  // casa de máquinas / cobertura
  add(extrude(roundedPoly(rectPts(TOWER_CORE.x0, TOWER_CORE.x1, TOWER_CORE.z0, TOWER_CORE.z1), 0.6), floorY(TW.roofFloor), 2.4), mats.wall);
  // caixilhos verticais das fachadas de vidro (ritmo das esquadrias)
  const mullionMat = mats.slabEdge;
  unitMeshes.forEach(m => {
    if (m.userData.poly) return; // torre: fachada segue o contorno da planta, sem caixilhos de caixa
    const b = m.userData.box;
    const geoms = [];
    const stepX = 2.2;
    for (let x = b.x0 + stepX; x < b.x1 - 0.5; x += stepX) {
      if (m.userData.sides['-z']) geoms.push(new THREE.BoxGeometry(0.08, b.h, 0.08).translate(x, b.y0 + b.h / 2, b.z0 - 0.02));
      if (m.userData.sides['+z']) geoms.push(new THREE.BoxGeometry(0.08, b.h, 0.08).translate(x, b.y0 + b.h / 2, b.z1 + 0.02));
    }
    if (m.userData.sides['+x']) for (let z = b.z0 + stepX; z < b.z1 - 0.5; z += stepX) geoms.push(new THREE.BoxGeometry(0.08, b.h, 0.08).translate(b.x1 + 0.02, b.y0 + b.h / 2, z));
    geoms.forEach(g => add(g, mullionMat, { cast: false, occlude: false }));
  });

  // ----- pontos de amostragem para análise solar (nas varandas) -----
  // amostras na borda externa da varanda (linha do guarda-corpo), 1 m acima do piso:
  // é o que o comprador entende por "a varanda pega sol".
  const E = 0.15;
  const tEdge = pX(1300);
  unitMeshes.forEach(m => {
    const b = m.userData.box, s = m.userData.sides, pts = [], tower = m.userData.tower;
    const floors = m.userData.floors;
    for (const f of floors) {
      const y = floorY(f) + 1.0;
      const frontEdge = tower ? tEdge : (PODIUM_FRONT[f] ?? b.x1 + BAL);
      if (s['+x']) for (const t of [0.2, 0.5, 0.8]) pts.push({ side: '+x', p: [frontEdge + E, y, b.z0 + (b.z1 - b.z0) * t], n: [1, 0, 0] });
      if (s['-x']) for (const t of [0.25, 0.75]) pts.push({ side: '-x', p: [b.x0 - 0.6, y, b.z0 + (b.z1 - b.z0) * t], n: [-1, 0, 0] });
      for (const t of [0.2, 0.5, 0.8]) {
        const x = b.x0 + (b.x1 - b.x0) * t;
        if (s['-z']) pts.push({ side: '-z', p: [x, y, (tower ? towerTopZ(x) : -HALF_W) - E], n: [0, 0, -1] });
        if (s['+z']) pts.push({ side: '+z', p: [x, y, (tower ? pZ(771) : HALF_W) + E], n: [0, 0, 1] });
      }
    }
    m.userData.samples = pts;
    m.userData.center = new THREE.Vector3((b.x0 + b.x1) / 2, b.y0 + b.h / 2, (b.z0 + b.z1) / 2);
    // ponto de vista "de dentro da unidade": varanda principal
    const mainSide = s['+x'] ? '+x' : (s['-z'] ? '-z' : '+z');
    const eye = mainSide === '+x' ? [b.x1 + 0.6, b.y0 + 1.6, (b.z0 + b.z1) / 2]
      : mainSide === '-z' ? [(b.x0 + b.x1) / 2, b.y0 + 1.6, b.z0 - 0.6] : [(b.x0 + b.x1) / 2, b.y0 + 1.6, b.z1 + 0.6];
    m.userData.view = { side: mainSide, eye };
  });

  // ----- vegetação e detalhes instanciados -----
  // arbustos no deck do lazer
  for (let z = -HALF_W + 2; z < HALF_W - 1.5; z += 0.8) shrubPts.push([BACK + 1.2, floorY(LEISURE) + 0.45, z, 0.4 + Math.random() * 0.3]);
  // árvores frondosas no perímetro do lote (como na perspectiva)
  const deco2 = new THREE.Group(); group.add(deco2);
  for (let x = -78; x < -10; x += 6.5) for (const z of [-13.4, 13.4]) {
    if (Math.random() < 0.25) continue;
    const t = tree(mats, 5.5 + Math.random() * 3); t.position.set(x + Math.random() * 2, 0.3, z); deco2.add(t);
  }
  deco2.traverse(o => { if (o.isMesh) o.userData.occluder = true; });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
  if (postPts.length) {
    const pg = new THREE.BoxGeometry(0.045, 1.1, 0.045); pg.translate(0, 0.55, 0);
    const posts = new THREE.InstancedMesh(pg, mats.post, postPts.length);
    postPts.forEach(([x, y, z], i) => { m4.makeTranslation(x, y, z); posts.setMatrixAt(i, m4); });
    posts.castShadow = true; group.add(posts);
  }
  if (shrubPts.length) {
    const sg = new THREE.IcosahedronGeometry(1, 1);
    const halves = [shrubPts.filter((_, i) => i % 2), shrubPts.filter((_, i) => !(i % 2))];
    [mats.shrubA, mats.shrubB].forEach((mat, k) => {
      const list = halves[k]; if (!list.length) return;
      const im = new THREE.InstancedMesh(sg, mat, list.length);
      list.forEach(([x, y, z, r], i) => { q.setFromEuler(new THREE.Euler(0, Math.random() * 6, 0)); m4.compose(pv.set(x, y, z), q, sc.set(r, r * 0.8, r)); im.setMatrixAt(i, m4); });
      im.castShadow = true; im.receiveShadow = true; group.add(im);
    });
  }

  return { group, unitMeshes, railMeshes, mats, height: coreTop, towerCenter: new THREE.Vector3((TOWER_CORE.x0 + TOWER_CORE.x1) / 2, 0, (TOWER_CORE.z0 + TOWER_CORE.z1) / 2) };
}
