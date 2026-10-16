// Unidade 501 — AMBIENTAÇÃO ILUSTRATIVA. A incorporadora não publicou a planta desta unidade.
// O layout abaixo NÃO é a planta oficial: é uma proposta de 4 suítes desenhada no volume real da
// unidade na maquete (13,8 × 21,6 m + varandas de 2,2 m), para dar noção de luz, vista e escala.
// Grade em "px" de 5 cm: x 0 → 276 (oeste → fachada leste/mar), y 0 → 432 (norte → sul).

export const PLAN_501 = {
  id: '501',
  illustrative: true,
  image: null,
  scale: 0.05,
  anchor: { px: [0, 0], local: [-42.0, -10.8] },
  ceiling: 2.75,
  map: [-10, -54, 330, 486],

  outline: [[0, -44], [320, -44], [320, 476], [0, 476]],

  walls: [
    // perímetro oeste (divisa com a 502)
    [0, 0, 6, 432],
    // suíte 02 (noroeste) e banho
    [80, 0, 85, 120], [0, 120, 85, 125], [55, 125, 60, 170], [0, 170, 60, 175],
    // banho e suíte 01 (nordeste)
    [80, 70, 140, 75], [135, 0, 140, 60], [135, 85, 140, 90], [140, 90, 210, 95], [240, 90, 276, 95],
    // cozinha / serviço
    [60, 110, 140, 114], [60, 175, 64, 250], [60, 250, 100, 254],
    // hall de entrada e lavabo
    [60, 270, 100, 274], [96, 274, 100, 312], [0, 312, 60, 316], [60, 312, 100, 316],
    // suíte 03 (sudoeste)
    [70, 316, 74, 380], [70, 405, 74, 432],
    // closet, banho e suíte master (sudeste)
    [74, 330, 140, 334], [74, 362, 140, 366], [135, 334, 140, 342], [135, 366, 140, 400], [140, 342, 200, 346], [230, 342, 276, 346],
  ],
  doors: [
    [135, 60, 140, 85], [55, 170, 60, 175], [210, 90, 240, 95],
    [70, 380, 74, 405], [200, 342, 230, 346], [135, 400, 140, 432],
  ],
  windows: [[0, 20, 6, 100, 0.9, 2.3], [0, 330, 6, 420, 0.9, 2.3]],
  exterior: [],
  glass: [
    [[276, 0], [276, 432]],
    [[140, 0], [276, 0]], [[0, 0], [80, 0]],
    [[140, 432], [276, 432]], [[0, 432], [70, 432]],
  ],
  floors: [
    { m: 'porcelain', poly: [[140, 95], [276, 95], [276, 342], [140, 342]] },
    { m: 'porcelain', poly: [[60, 114], [140, 114], [140, 342], [100, 342], [100, 270], [60, 270]] },
    { m: 'porcelain', poly: [[6, 175], [60, 175], [60, 312], [6, 312]] },
    { m: 'wood', poly: [[6, 0], [80, 0], [80, 120], [6, 120]] },
    { m: 'wood', poly: [[140, 0], [276, 0], [276, 90], [140, 90]] },
    { m: 'wood', poly: [[6, 316], [70, 316], [70, 432], [6, 432]] },
    { m: 'wood', poly: [[140, 346], [276, 346], [276, 432], [140, 432]] },
    { m: 'wood', poly: [[74, 334], [135, 334], [135, 362], [74, 362]] },
    { m: 'marble', poly: [[6, 125], [55, 125], [55, 170], [6, 170]] },
    { m: 'marble', poly: [[85, 0], [135, 0], [135, 70], [85, 70]] },
    { m: 'marble', poly: [[74, 366], [135, 366], [135, 432], [74, 432]] },
    { m: 'marble', poly: [[64, 274], [96, 274], [96, 312], [64, 312]] },
  ],

  furniture: [
    // living e jantar voltados para o mar
    { t: 'rug', r: [175, 200, 265, 300] },
    { t: 'sofa', r: [175, 280, 260, 305], back: 's' },
    { t: 'armchair', p: [190, 205], color: 'rust' }, { t: 'armchair', p: [245, 205], color: 'rust' },
    { t: 'coffeetable', p: [218, 250], rad: 12 },
    { t: 'tvpanel', r: [140, 200, 148, 300], face: 'e' },
    { t: 'diningtable', c: [215, 140], rx: 34, ry: 15, seats: 8 },
    { t: 'floorlamp', p: [265, 315] }, { t: 'plant', p: [265, 105] }, { t: 'plant', p: [150, 330] },
    // cozinha
    { t: 'counter', r: [64, 114, 82, 245], h: 0.92, cooktop: [73, 160], sink: [73, 210] },
    { t: 'island', r: [100, 150, 125, 220] }, { t: 'stool', p: [132, 165] }, { t: 'stool', p: [132, 185] }, { t: 'stool', p: [132, 205] },
    { t: 'fridge', r: [64, 246, 84, 250] },
    // hall e lavabo
    { t: 'art', p: [8, 245], face: 'e', w: 1.0, h: 0.8, seed: 6 },
    { t: 'vanity', r: [66, 276, 94, 288], basins: 1, along: 'x' }, { t: 'toilet', p: [80, 300], dir: 'n' },
    // suíte 01
    { t: 'bed', r: [180, 10, 250, 75], head: 'n' }, { t: 'nightstand', p: [168, 18], round: true }, { t: 'nightstand', p: [262, 18], round: true },
    { t: 'wardrobe', r: [140, 60, 175, 88] },
    { t: 'vanity', r: [87, 50, 133, 66], basins: 2, along: 'x' }, { t: 'toilet', p: [100, 20], dir: 's' }, { t: 'shower', r: [110, 2, 133, 35] },
    // suíte 02
    { t: 'bed', r: [12, 20, 60, 85], head: 'w', single: true }, { t: 'desk', r: [12, 95, 70, 112] },
    { t: 'vanity', r: [8, 150, 45, 166], basins: 1, along: 'x' }, { t: 'toilet', p: [40, 135], dir: 'w' },
    // suíte 03
    { t: 'bed', r: [12, 340, 62, 410], head: 'w', single: true }, { t: 'wardrobe', r: [8, 318, 66, 332] },
    // suíte master
    { t: 'bed', r: [180, 360, 250, 425], head: 's' }, { t: 'nightstand', p: [168, 420], round: true }, { t: 'nightstand', p: [262, 420], round: true },
    { t: 'rug', c: [215, 380], rad: 40 },
    { t: 'wardrobe', r: [76, 336, 133, 360] },
    { t: 'vanity', r: [76, 370, 92, 425], basins: 2 }, { t: 'toilet', p: [110, 420], dir: 'n' }, { t: 'shower', r: [100, 366, 133, 395] },
    // varandas
    { t: 'roundtable', c: [298, 220], rad: 14, seats: 4 },
    { t: 'lounger', r: [282, 360, 312, 375] }, { t: 'plant', p: [312, -30] }, { t: 'plant', p: [312, 465] },
  ],
  curtains: [[272, 10, 272, 50], [272, 385, 272, 425], [145, 4, 175, 4], [145, 428, 175, 428]],

  nodes: [
    { id: 'estar', name: 'Living', p: [160, 240], look: 90 },
    { id: 'jantar', name: 'Jantar', p: [215, 190], look: 30 },
    { id: 'varanda', name: 'Varanda · vista mar', p: [298, 280], look: 80 },
    { id: 'cozinha', name: 'Cozinha', p: [110, 240], look: 300 },
    { id: 'hall', name: 'Hall', p: [35, 230], look: 90 },
    { id: 's01', name: 'Suíte 01', p: [210, 82], look: 0 },
    { id: 's02', name: 'Suíte 02', p: [65, 60], look: 270 },
    { id: 's03', name: 'Suíte 03', p: [40, 390], look: 270 },
    { id: 'master', name: 'Suíte master', p: [210, 352], look: 180 },
  ],
  start: 'estar',
};
