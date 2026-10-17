// Plantas das unidades disponíveis do Dr. Homero Tavares, traçadas sobre as plantas oficiais da Vimo
// (imagens de 2000 px em assets/homero/). Escala 0,0114 m/px — calibrada pelos quartos (8,10 m²),
// pela suíte (11,25 m²), pelas camas (0,88 × 1,88 m) e pela área privativa (82,88 m²).
// Orientação: as plantas estão com o norte para cima e a Rua Humberto Serrano à direita (leste),
// igual à planta-chave — o que coincide com o sistema local do edifício (x → leste, z → sul).
//
// Coluna 04 é traçada; a 05 é a 04 girada 180° (planta oficial confirma: mesma unidade, lado oposto
// do corredor). Coluna 06 é traçada; a 03 é a 06 girada 180°.

const S = 0.0114;

// ---------------------------------------------------------------- coluna 04 (82,88 m²)
// fachada sul; entrada pelo corredor ao norte; cozinha e área técnica (split) a leste, junto da 02
export const PLAN_04 = {
  id: '04',
  image: 'c3_0',
  scale: S,
  anchor: { px: [488, 393], local: [-29.87, 2.95] },
  ceiling: 2.6,
  map: [470, 320, 1525, 1050],
  outline: [[488, 393], [1340, 393], [1340, 340], [1505, 340], [1505, 1030], [1340, 1030], [1340, 1000], [488, 1000]],
  // volume fechado da unidade (fachada), com as varandas em recuo — usado pela maquete externa
  shell: [[488, 393], [1340, 393], [1340, 340], [1505, 340], [1505, 1030], [1340, 1030], [1340, 835], [1130, 835], [1130, 1000], [625, 1000], [625, 792], [488, 792]],
  walls: [
    // perímetro: corredor (norte), divisa com a 06 (oeste), divisa com a 02 (leste)
    [488, 393, 1265, 405], [1330, 393, 1352, 405], [1340, 340, 1505, 352], [1340, 340, 1352, 405],
    [488, 393, 505, 1000], [1490, 340, 1505, 1030],
    // cozinha | estar e área técnica
    [1340, 545, 1352, 775], [1340, 790, 1352, 1030],
    // banhos (suíte e social)
    [735, 405, 747, 500], [735, 580, 747, 652], [735, 640, 860, 652], [860, 405, 872, 652],
    [872, 640, 915, 652], [975, 640, 1002, 652], [990, 405, 1002, 652],
    // quartos
    [625, 735, 818, 747], [625, 735, 640, 1000], [855, 735, 870, 1000], [935, 722, 1128, 735], [1115, 722, 1130, 1000],
    // pilar entre suíte e varanda
    [618, 785, 640, 800],
    // fachada sul entre as janelas dos quartos
    [640, 990, 660, 1000], [800, 990, 945, 1000], [1105, 990, 1130, 1000],
  ],
  doors: [
    [1265, 393, 1330, 405],  // entrada
    [735, 500, 747, 580],    // suíte → banho
    [915, 640, 975, 652],    // banho social
    [818, 735, 855, 747],    // quarto II
    [870, 722, 935, 735],    // quarto I
    [1380, 775, 1460, 790],  // área de serviço → área técnica
  ],
  windows: [[660, 990, 800, 1000, 0.95, 2.2], [945, 990, 1105, 1000, 0.95, 2.2]],
  exterior: [],
  glass: [
    [[505, 792], [618, 792]],      // suíte ↔ varanda (porta de correr)
    [[1130, 835], [1340, 835]],    // estar ↔ varanda
  ],
  rails: [[[505, 997], [625, 997]], [[1130, 997], [1340, 997]], [[1352, 1025], [1490, 1025]]],
  floors: [
    { m: 'porcelain', poly: [[735, 652], [1002, 652], [1002, 405], [1340, 405], [1340, 835], [1128, 835], [1128, 735], [735, 735]] },
    { m: 'wood', poly: [[505, 405], [735, 405], [735, 735], [625, 735], [625, 792], [505, 792]] },
    { m: 'wood', poly: [[640, 747], [855, 747], [855, 990], [640, 990]] },
    { m: 'wood', poly: [[870, 735], [1115, 735], [1115, 990], [870, 990]] },
    { m: 'marble', poly: [[747, 405], [860, 405], [860, 640], [747, 640]] },
    { m: 'marble', poly: [[872, 405], [990, 405], [990, 640], [872, 640]] },
    { m: 'tile', poly: [[1352, 352], [1490, 352], [1490, 775], [1352, 775]] },
    { m: 'deck', poly: [[505, 792], [625, 792], [625, 995], [505, 995]] },
    { m: 'deck', poly: [[1130, 835], [1340, 835], [1340, 995], [1130, 995]] },
    { m: 'tile', poly: [[1352, 790], [1490, 790], [1490, 1025], [1352, 1025]] },
  ],
  furniture: [
    // suíte
    { t: 'wardrobe', r: [510, 410, 733, 470] },
    { t: 'bed', r: [512, 548, 690, 680], head: 'w' },
    { t: 'nightstand', p: [530, 515], round: true }, { t: 'nightstand', p: [530, 712], round: true },
    { t: 'rug', r: [575, 505, 730, 712] },
    { t: 'armchair', p: [560, 935], color: 'rust' },
    // banhos
    { t: 'shower', r: [749, 407, 858, 482] }, { t: 'toilet', p: [800, 512], dir: 's' }, { t: 'vanity', r: [790, 548, 858, 615], basins: 1, wall: 'e' },
    { t: 'shower', r: [874, 407, 988, 482] }, { t: 'toilet', p: [915, 512], dir: 's' }, { t: 'vanity', r: [874, 548, 940, 615], basins: 1 },
    // quarto II
    { t: 'desk', r: [645, 750, 800, 790] }, { t: 'bed', r: [650, 830, 718, 986], head: 's', single: true },
    { t: 'nightstand', p: [745, 958] }, { t: 'wardrobe', r: [812, 842, 853, 988] },
    // quarto I
    { t: 'wardrobe', r: [872, 842, 925, 988] }, { t: 'desk', r: [990, 750, 1112, 790] },
    { t: 'bed', r: [1035, 810, 1110, 986], head: 's', single: true }, { t: 'nightstand', p: [1005, 962] },
    // estar / jantar
    { t: 'tallcabinet', r: [1003, 415, 1025, 640] },
    { t: 'diningtable', c: [1145, 488], rx: 75, ry: 36, seats: 6 },
    { t: 'rug', r: [1130, 630, 1300, 832] },
    { t: 'sofa', r: [1238, 648, 1338, 828] },
    { t: 'armchair', p: [1268, 588] },
    { t: 'tvpanel', r: [1132, 722, 1162, 832], face: 'e' },
    { t: 'floorlamp', p: [1320, 618] },
    // cozinha e serviço
    { t: 'fridge', r: [1420, 354, 1488, 420] },
    { t: 'counter', r: [1432, 432, 1488, 692], h: 0.92, sink: [1460, 520], cooktop: [1460, 655], uppers: 'e' },
    { t: 'counter', r: [1432, 705, 1488, 772], h: 0.9 },
    // varandas
    { t: 'roundtable', c: [1268, 920], rad: 42, seats: 4 }, { t: 'plant', p: [1168, 962] },
    { t: 'condenser', p: [1420, 960] },
  ],
  curtains: [[508, 786, 538, 786], [665, 985, 698, 985], [762, 985, 795, 985], [950, 985, 985, 985], [1068, 985, 1100, 985], [1135, 829, 1175, 829], [1295, 829, 1335, 829]],
  nodes: [
    { id: 'estar', name: 'Estar', p: [1290, 560], look: 215 },
    { id: 'jantar', name: 'Jantar', p: [1085, 520], look: 120 },
    { id: 'entrada', name: 'Entrada', p: [1298, 450], look: 200 },
    { id: 'varanda', name: 'Varanda', p: [1220, 930], look: 160 },
    { id: 'cozinha', name: 'Cozinha', p: [1395, 600], look: 170 },
    { id: 'circ', name: 'Circulação', p: [820, 695], look: 270 },
    { id: 'suite', name: 'Suíte', p: [708, 705], look: 285 },
    { id: 'varsuite', name: 'Varanda da suíte', p: [565, 880], look: 180 },
    { id: 'q1', name: 'Quarto I', p: [965, 800], look: 160 },
    { id: 'q2', name: 'Quarto II', p: [757, 805], look: 200 },
    { id: 'banho', name: 'Banho social', p: [930, 580], look: 0 },
  ],
  start: 'estar',
};

// ---------------------------------------------------------------- giro de 180°
// px' = A − px, py' = B − py (A e B alinham o resultado à imagem oficial da coluna girada)
const flipDir = d => ({ n: 's', s: 'n', e: 'w', w: 'e' }[d] || d);
export function rotate180(P, { id, image, A, B, anchorLocal, map }) {
  const pt = ([x, y]) => [A - x, B - y];
  const rect = r => [A - r[2], B - r[3], A - r[0], B - r[1], ...r.slice(4)];
  const F = f => {
    const o = { ...f };
    if (f.r) o.r = rect(f.r);
    if (f.p) o.p = pt(f.p);
    if (f.c) o.c = pt(f.c);
    for (const k of ['head', 'dir', 'face', 'wall', 'back', 'uppers']) if (f[k]) o[k] = flipDir(f[k]);
    if (f.sink) o.sink = pt(f.sink);
    if (f.cooktop) o.cooktop = pt(f.cooktop);
    return o;
  };
  return {
    ...P, id, image,
    anchor: { px: pt(P.anchor.px), local: anchorLocal },
    map: map || [A - P.map[2], B - P.map[3], A - P.map[0], B - P.map[1]],
    outline: P.outline.map(pt), shell: P.shell.map(pt),
    walls: P.walls.map(rect), doors: P.doors.map(rect), windows: P.windows.map(rect), exterior: P.exterior.map(rect),
    glass: P.glass.map(l => l.map(pt)), rails: P.rails.map(l => l.map(pt)),
    floors: P.floors.map(f => ({ ...f, poly: f.poly.map(pt) })),
    furniture: P.furniture.map(F),
    curtains: P.curtains.map(c => [A - c[0], B - c[1], A - c[2], B - c[3]]),
    nodes: P.nodes.map(n => ({ ...n, p: pt(n.p), look: (n.look + 180) % 360 })),
  };
}

// ---------------------------------------------------------------- espelho leste-oeste
// px' = A − px, py' = py + dy (a planta da coluna espelhada está deslocada na imagem oficial)
const mirDir = d => ({ e: 'w', w: 'e' }[d] || d);
export function mirrorX(P, { id, image, A, dy, anchorLocal }) {
  const pt = ([x, y]) => [A - x, y + dy];
  const rect = r => [A - r[2], r[1] + dy, A - r[0], r[3] + dy, ...r.slice(4)];
  const F = f => {
    const o = { ...f };
    if (f.r) o.r = rect(f.r);
    if (f.p) o.p = pt(f.p);
    if (f.c) o.c = pt(f.c);
    for (const k of ['head', 'dir', 'face', 'wall', 'back', 'uppers']) if (f[k]) o[k] = mirDir(f[k]);
    if (f.sink) o.sink = pt(f.sink);
    if (f.cooktop) o.cooktop = pt(f.cooktop);
    return o;
  };
  return {
    ...P, id, image,
    anchor: { px: pt(P.anchor.px), local: anchorLocal },
    map: [A - P.map[2], P.map[1] + dy, A - P.map[0], P.map[3] + dy],
    outline: P.outline.map(pt), shell: P.shell.map(pt),
    walls: P.walls.map(rect), doors: P.doors.map(rect), windows: P.windows.map(rect), exterior: P.exterior.map(rect),
    glass: P.glass.map(l => l.map(pt)), rails: P.rails.map(l => l.map(pt)),
    floors: P.floors.map(f => ({ ...f, poly: f.poly.map(pt) })),
    furniture: P.furniture.map(F),
    curtains: P.curtains.map(c => [A - c[0], c[1] + dy, A - c[2], c[3] + dy]),
    nodes: P.nodes.map(n => ({ ...n, p: pt(n.p), look: (360 - n.look) % 360 })),
  };
}

// ---------------------------------------------------------------- coluna 06 (84,43 m²)
// espelho da 04 (fachada sul), com a varanda do estar avançando 0,5 m além da fachada
// e a área técnica mais curta (conferido na planta oficial da coluna 06)
const P06 = mirrorX(PLAN_04, { id: '06', image: 'c5_0', A: 1998, dy: 67, anchorLocal: [-29.87, 2.95] });
P06.map = [470, 380, 1530, 1130];
P06.outline = [[1510, 460], [658, 460], [658, 407], [493, 407], [493, 1045], [655, 1045], [655, 1110], [890, 1110], [890, 1067], [1510, 1067]];
P06.shell = [[1510, 460], [658, 460], [658, 407], [493, 407], [493, 1045], [658, 1045], [658, 902], [868, 902], [868, 1067], [1373, 1067], [1373, 859], [1510, 859]];
P06.walls = P06.walls.map(w => (w[1] === 857 && w[3] === 1097) || (w[1] === 407 && w[3] === 1097) ? [w[0], w[1], w[2], 1045] : w);
P06.rails = [[[1493, 1064], [1373, 1064]], [[655, 1045], [655, 1110], [885, 1110], [885, 1063]], [[508, 1042], [646, 1042]]];
P06.floors = P06.floors.map(f => {
  const ys = f.poly.map(p => p[1]);
  if (f.m === 'deck' && Math.min(...f.poly.map(p => p[0])) < 700) return { m: 'deck', poly: [[658, 902], [868, 902], [868, 1063], [885, 1063], [885, 1108], [658, 1108]] };
  if (f.m === 'tile' && Math.max(...ys) > 1090) return { m: 'tile', poly: [[508, 857], [646, 857], [646, 1042], [508, 1042]] };
  return f;
});
P06.furniture = P06.furniture.map(f => f.t === 'plant' && f.p[1] > 1000 ? { ...f, p: [842, 1085] } : f);
export const PLAN_06 = P06;

// ---------------------------------------------------------------- colunas 05 e 03 (lado norte)
export const PLAN_05 = rotate180(PLAN_04, { id: '05', image: 'c4_0', A: 1995, B: 1388, anchorLocal: [-29.87, -0.95] });
export const PLAN_03 = rotate180(PLAN_06, { id: '03', image: 'c2_0', A: 1998, B: 1460, anchorLocal: [-29.87, -0.95] });
