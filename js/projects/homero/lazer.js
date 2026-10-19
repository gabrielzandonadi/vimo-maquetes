// Área de lazer (3º pavimento) do Dr. Homero Tavares, traçada sobre a planta oficial
// (assets/homero/lazer.jpg, 669 × 603 px). Escala 0,0539 m/px — calibrada pelas áreas escritas na
// planta (gourmet + cozinha + circulação = 66,8 m²; salão de festas + cozinha = 78 m²).
// Norte para cima, Rua Humberto Serrano à direita (leste); a placa ocupa a largura do lote (29 m)
// e os 23 m do lado da Humberto Serrano, com a torre por cima da faixa central.

export const PLAN_LAZER = {
  id: 'lazer',
  image: 'lazer',
  scale: 0.0539,
  anchor: { px: [582, 34], local: [-6.0, -14.5] },
  ceiling: 3.0,
  map: [125, 20, 600, 585],
  outline: [[150, 46], [180, 46], [180, 34], [582, 34], [582, 568], [240, 568], [240, 508], [150, 508]],
  // só a faixa sob a torre é coberta; deck da piscina (norte) e churrasqueira/jardim (sul) ficam ao ar livre
  ceilingPolys: [[[150, 140], [582, 140], [582, 470], [150, 470]]],
  rails: [[[150, 46], [180, 46], [180, 34], [582, 34], [582, 140]], [[582, 470], [582, 568], [240, 568], [240, 508], [150, 508], [150, 470]], [[150, 140], [150, 46]]],
  walls: [
    // fitness
    [150, 265, 190, 269], [240, 265, 292, 269], [288, 143, 292, 269],
    // sauna, ducha e banheiros PCD
    [312, 160, 370, 163], [312, 160, 315, 202], [292, 202, 340, 205], [358, 202, 370, 205], [292, 238, 330, 241], [350, 238, 370, 241],
    [366, 150, 370, 241], [392, 150, 395, 241], [366, 195, 395, 198],
    // gourmet: cozinha (oeste) e divisa com o salão
    [418, 142, 422, 268], [436, 298, 470, 302], [560, 298, 582, 302],
    // salão de festas: cozinha de apoio e fechamento sul
    [432, 302, 436, 345], [384, 345, 436, 349], [384, 345, 388, 470], [388, 453, 490, 457], [515, 453, 582, 457],
    // núcleo (escada, elevadores, ar-condicionado) e mini mercado
    [150, 300, 330, 304], [150, 346, 330, 350], [150, 300, 154, 350], [326, 300, 330, 350], [240, 304, 244, 346],
    // jogos e brinquedoteca
    [150, 350, 154, 470], [150, 467, 236, 471], [236, 350, 240, 448], [240, 418, 278, 422], [302, 418, 330, 422], [326, 350, 330, 422],
    // laje técnica (split)
    [150, 471, 154, 508], [234, 471, 238, 508],
  ],
  doors: [[190, 265, 240, 269], [340, 202, 358, 205], [330, 238, 350, 241], [278, 418, 302, 422]],
  windows: [],
  exterior: [],
  glass: [
    [[150, 143], [290, 143]], [[150, 143], [150, 265]],           // fitness (rampa e lado oeste)
    [[422, 142], [582, 142]], [[582, 142], [582, 300]],           // gourmet (deck e Rua Humberto Serrano)
    [[582, 302], [582, 455]], [[470, 300], [560, 300]],           // salão (fachada leste e divisa com o gourmet)
    [[490, 455], [515, 455]],                                      // porta do salão para a churrasqueira
  ],
  floors: [
    { m: 'porcelain', poly: [[150, 140], [582, 140], [582, 470], [150, 470]] },
    { m: 'wood', poly: [[154, 146], [288, 146], [288, 265], [154, 265]] },
    { m: 'wood', poly: [[244, 350], [326, 350], [326, 418], [244, 418]] },
    { m: 'marble', poly: [[315, 163], [366, 163], [366, 202], [315, 202]] },
    { m: 'marble', poly: [[292, 205], [366, 205], [366, 238], [292, 238]] },
    { m: 'marble', poly: [[370, 150], [392, 150], [392, 240], [370, 240]] },
    { m: 'tile', poly: [[422, 146], [442, 146], [442, 268], [422, 268]] },
    { m: 'tile', poly: [[388, 349], [432, 349], [432, 453], [388, 453]] },
    { m: 'deck', poly: [[180, 34], [582, 34], [582, 140], [150, 140], [150, 46], [180, 46]] },
    { m: 'deck', poly: [[240, 470], [582, 470], [582, 545], [240, 545]] },
    { m: 'tile', poly: [[154, 471], [234, 471], [234, 505], [154, 505]] },
  ],
  grass: [[[240, 472], [360, 472], [360, 545], [240, 545]], [[240, 545], [582, 545], [582, 566], [240, 566]]],
  pool: [298, 56, 452, 120],
  poolDeck: [290, 50, 460, 128],
  furniture: [
    // deck da piscina
    { t: 'lounger', r: [470, 60, 525, 76] }, { t: 'lounger', r: [470, 85, 525, 101] }, { t: 'lounger', r: [470, 110, 525, 126] },
    { t: 'roundtable', c: [556, 60], rad: 12, seats: 4 }, { t: 'plant', p: [575, 130] }, { t: 'plant', p: [160, 56] },
    { t: 'lounger', r: [200, 85, 245, 100] },
    // fitness
    { t: 'treadmill', r: [204, 150, 221, 190] }, { t: 'treadmill', r: [234, 150, 251, 190] }, { t: 'treadmill', r: [261, 150, 278, 190] },
    { t: 'stool', p: [165, 160] }, { t: 'stool', p: [165, 180] }, { t: 'tallcabinet', r: [278, 200, 287, 245] },
    // sauna e banheiros
    { t: 'bench', r: [316, 165, 364, 176] }, { t: 'shower', r: [294, 207, 330, 236] },
    { t: 'toilet', p: [380, 165], dir: 's' }, { t: 'toilet', p: [380, 225], dir: 'n' },
    // gourmet
    { t: 'counter', r: [422, 150, 438, 260], h: 0.92, sink: [430, 200], cooktop: [430, 160] },
    { t: 'island', r: [446, 168, 458, 232] }, { t: 'stool', p: [465, 178] }, { t: 'stool', p: [465, 198] }, { t: 'stool', p: [465, 218] },
    { t: 'diningtable', c: [530, 196], rx: 28, ry: 10, seats: 8 },
    { t: 'rug', r: [478, 245, 570, 292] }, { t: 'sofa', r: [490, 280, 560, 296], back: 's' },
    { t: 'armchair', p: [470, 258] }, { t: 'armchair', p: [574, 258] }, { t: 'coffeetable', p: [525, 262], rad: 9 },
    // salão de festas
    { t: 'roundtable', c: [490, 330], rad: 13, seats: 6 }, { t: 'roundtable', c: [550, 330], rad: 13, seats: 6 },
    { t: 'roundtable', c: [490, 378], rad: 13, seats: 6 }, { t: 'roundtable', c: [550, 378], rad: 13, seats: 6 },
    { t: 'roundtable', c: [490, 424], rad: 13, seats: 6 }, { t: 'roundtable', c: [550, 424], rad: 13, seats: 6 },
    { t: 'counter', r: [388, 352, 400, 450], h: 0.92, sink: [394, 400] }, { t: 'island', r: [418, 380, 430, 445] },
    // jogos e brinquedoteca
    { t: 'island', r: [170, 372, 216, 394] }, { t: 'counter', r: [180, 418, 210, 446], h: 0.9 },
    { t: 'rug', r: [246, 356, 282, 386] }, { t: 'roundtable', c: [282, 400], rad: 8, seats: 4 },
    { t: 'armchair', p: [258, 410], color: 'rust' },
    // mini mercado (geladeiras)
    { t: 'tallcabinet', r: [331, 316, 345, 388] },
    // churrasqueira (à direita do playground, conferida na planta): bancada-bar com banquetas,
    // churrasqueira de alvenaria + bancada com pia junto ao jardim, mesas e bancos
    { t: 'counter', r: [392, 500, 454, 511], h: 1.05, top: 'wood' },
    { t: 'stool', p: [401, 494] }, { t: 'stool', p: [414, 494] }, { t: 'stool', p: [427, 494] }, { t: 'stool', p: [440, 494] },
    { t: 'bbq', r: [392, 532, 410, 547] },
    { t: 'counter', r: [410, 532, 454, 546], h: 0.92, sink: [431, 539] },
    { t: 'roundtable', c: [490, 497], rad: 11, seats: 4 }, { t: 'roundtable', c: [535, 497], rad: 11, seats: 4 },
    { t: 'bench', r: [480, 532, 511, 541] }, { t: 'bench', r: [527, 532, 558, 541] }, { t: 'bench', r: [568, 500, 576, 530] },
    { t: 'playhouse', r: [300, 478, 330, 505] },
    { t: 'plant', p: [255, 556] }, { t: 'plant', p: [330, 556] }, { t: 'plant', p: [410, 556] }, { t: 'plant', p: [490, 556] }, { t: 'plant', p: [565, 556] },
  ],
  curtains: [],
  nodes: [
    { id: 'piscina', name: 'Piscina e deck', p: [540, 108], look: 260 },
    { id: 'prainha', name: 'Prainha', p: [230, 80], look: 95 },
    { id: 'gourmet', name: 'Espaço gourmet', p: [500, 235], look: 300 },
    { id: 'festas', name: 'Salão de festas', p: [458, 400], look: 80 },
    { id: 'circ', name: 'Hall do lazer', p: [370, 300], look: 0 },
    { id: 'fitness', name: 'Fitness', p: [225, 235], look: 20 },
    { id: 'jogos', name: 'Jogos', p: [195, 448], look: 0 },
    { id: 'brinq', name: 'Brinquedoteca', p: [300, 438], look: 330 },
    { id: 'churras', name: 'Churrasqueira', p: [470, 520], look: 245 },
    { id: 'playground', name: 'Playground', p: [272, 532], look: 35 },
  ],
  start: 'piscina',
  lightNodes: ['gourmet', 'festas', 'circ', 'fitness', 'jogos', 'brinq', 'churras'],
};
