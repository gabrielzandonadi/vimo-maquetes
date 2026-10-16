// Planta "Tipo · 4 suítes · Unidade 901" (assets/img/c4_0.jpg), traçada em pixels da imagem original 1600×1000.
// Escala: 0,028 m/px — calibrada pela área privativa oficial (309,57 m², descontando escada e poços de elevador)
// e conferida com as áreas dos cômodos indicadas na planta (lavabo, A.S., depósito).
// Orientação: direita da planta = mar (leste, +x local); topo da planta = norte (−z local).
// Coordenadas: [x, y] em px; retângulos: [x0, y0, x1, y1].

export const PLAN_901 = {
  id: '901',
  image: 'c4_0',
  scale: 0.028,
  // pixel (293, 222) ↔ ponto local (x = −80, z = −4) do sistema do edifício
  anchor: { px: [293, 222], local: [-80, -4] },
  ceiling: 2.75,

  // contorno da laje (inclui varandas e terraço)
  outline: [[314, 222], [1252, 468], [1282, 474], [1298, 492], [1300, 520], [1297, 745], [1280, 770], [945, 773], [945, 703], [835, 703], [835, 771], [440, 771], [372, 762], [326, 735], [300, 695], [293, 650], [293, 245], [300, 228]],

  // paredes internas e externas (altura total), retângulos em px
  walls: [
    // banho master
    [298, 312, 382, 317], [298, 317, 303, 497], [377, 317, 382, 422], [298, 417, 348, 422], [373, 417, 382, 422],
    // closet / nicho das cubas
    [331, 421, 334, 495], [331, 492, 484, 497],
    // suíte 01
    [479, 497, 484, 581], [479, 610, 484, 621], [304, 603, 309, 690], [309, 601, 376, 606], [404, 617, 504, 621],
    // banhos 4,00 e 4,13
    [337, 606, 342, 694], [413, 606, 416, 694], [337, 691, 416, 694], [501, 621, 504, 694], [416, 691, 428, 694], [461, 691, 504, 694],
    // circulação íntima
    [484, 618, 505, 623], [533, 618, 627, 623], [657, 618, 733, 623],
    // suíte 02 | suíte 03 | banho 3,24
    [600, 622, 605, 765], [605, 672, 620, 675], [647, 672, 655, 675], [650, 675, 655, 765],
    // núcleo comum: escada (bloco) e poços dos elevadores
    [532, 450, 652, 455], [687, 450, 700, 455], [532, 455, 693, 583],
    [532, 300, 677, 387], [532, 287, 537, 300],
    // lavabo
    [677, 313, 737, 318], [732, 318, 737, 367], [677, 390, 737, 395],
    // parede da TV (sala) e corredor de serviço
    [732, 435, 737, 585],
    // bloco de serviço (B.Serv · Dep · A.S.)
    [732, 579, 945, 585], [732, 585, 737, 668], [783, 585, 787, 600], [783, 625, 787, 668], [857, 585, 861, 620], [857, 650, 861, 668],
    [737, 668, 945, 675], [940, 585, 945, 590], [940, 660, 945, 668],
    // suíte 03 (lado da área técnica)
    [830, 675, 835, 765],
    // cozinha
    [945, 740, 1179, 745], [1179, 668, 1185, 745], [940, 675, 945, 745],
    // coluna estrutural da sala, junto à fachada
    [978, 420, 994, 436],
  ],
  // vergas sobre portas (2,10 m até o teto)
  doors: [
    [348, 417, 373, 422], [376, 601, 404, 621], [428, 691, 461, 694], [505, 618, 533, 623], [627, 618, 657, 623],
    [479, 581, 484, 610], [620, 672, 647, 675], [700, 450, 732, 455], [652, 450, 687, 455],
    [783, 600, 787, 625], [857, 620, 861, 650],
  ],
  // paredes externas com janelas: [x0,y0,x1,y1, peitoril, verga]
  windows: [
    [568, 765, 590, 771, 0.9, 2.2], [618, 765, 638, 771, 1.4, 2.2], [690, 765, 730, 771, 0.6, 2.4],
  ],
  // paredes externas sólidas
  exterior: [
    [441, 765, 568, 771], [590, 765, 618, 771], [638, 765, 690, 771], [730, 765, 835, 771],
  ],
  // fachadas de vidro piso-teto (polilinhas)
  glass: [
    [[382, 318], [520, 318]],
    [[737, 352], [1085, 445], [1085, 561]],
    [[1105, 668], [1179, 668]],
    [[306, 497], [306, 603]],
    [[309, 690], [318, 722], [342, 748], [380, 764], [441, 768]],
  ],

  // pisos por ambiente (o restante da laje recebe o porcelanato externo das varandas)
  floors: [
    { m: 'porcelain', poly: [[537, 387], [732, 387], [732, 450], [537, 450]] },               // hall dos elevadores
    { m: 'porcelain', poly: [[737, 352], [1085, 445], [1085, 561], [1082, 561], [1082, 668], [945, 668], [945, 585], [737, 585]] }, // sala + almoço
    { m: 'porcelain', poly: [[945, 668], [1179, 668], [1179, 740], [945, 740]] },              // cozinha
    { m: 'porcelain', poly: [[484, 424], [532, 424], [532, 583], [693, 583], [693, 455], [732, 455], [732, 618], [484, 618]] }, // circulação
    { m: 'wood', poly: [[382, 318], [520, 318], [532, 318], [532, 424], [484, 424], [484, 492], [334, 492], [334, 422], [382, 422]] }, // suíte master + closet
    { m: 'wood', poly: [[306, 497], [479, 497], [479, 601], [306, 601]] },                       // suíte 01
    { m: 'wood', poly: [[309, 694], [416, 694], [504, 694], [504, 621], [600, 621], [600, 768], [441, 768], [380, 764], [342, 748], [318, 722]] }, // suíte 02
    { m: 'wood', poly: [[605, 621], [733, 621], [733, 675], [830, 675], [830, 765], [655, 765], [655, 672], [605, 672]] }, // suíte 03
    { m: 'marble', poly: [[303, 317], [377, 317], [377, 417], [303, 417]] },                    // banho master
    { m: 'marble', poly: [[303, 422], [331, 422], [331, 495], [303, 495]] },                    // cubas
    { m: 'marble', poly: [[309, 606], [413, 606], [413, 691], [309, 691]] },                    // banho 4,00
    { m: 'marble', poly: [[416, 621], [501, 621], [501, 691], [416, 691]] },                    // banho 4,13
    { m: 'marble', poly: [[605, 675], [650, 675], [650, 765], [605, 765]] },                    // banho 3,24
    { m: 'marble', poly: [[677, 318], [732, 318], [732, 390], [677, 390]] },                    // lavabo
    { m: 'tile', poly: [[737, 585], [940, 585], [940, 668], [737, 668]] },                       // serviço
  ],
  // cortinas recolhidas nas pontas dos vãos de vidro
  curtains: [
    [384, 322, 412, 322], [490, 322, 518, 322],
    [310, 499, 310, 524], [310, 576, 310, 601],
    [742, 359, 784, 370], [1080, 452, 1080, 492], [1080, 520, 1080, 558],
    [322, 724, 340, 742],
  ],
  pool: [326, 261, 394, 307],
  poolDeck: [313, 259, 408, 316],

  // mobiliário conforme a planta humanizada
  furniture: [
    // suíte master
    { t: 'bed', r: [386, 337, 455, 400], head: 'w' }, { t: 'bench', r: [455, 345, 469, 392] },
    { t: 'nightstand', r: [384, 318, 398, 332] }, { t: 'nightstand', r: [384, 404, 398, 418] },
    { t: 'rug', c: [462, 368], rad: 50 },
    { t: 'tvpanel', r: [519, 322, 529, 424], face: 'w' },
    { t: 'wardrobe', r: [383, 424, 484, 444] }, { t: 'wardrobe', r: [336, 471, 484, 492] },
    { t: 'vanity', r: [303, 425, 318, 492], basins: 2 },
    // banho master
    { t: 'vanity', r: [303, 360, 318, 414], basins: 1 }, { t: 'toilet', p: [348, 378], dir: 'e' }, { t: 'shower', r: [303, 317, 377, 348] },
    // terraço da suíte master
    { t: 'plant', p: [312, 270] }, { t: 'plant', p: [312, 300] }, { t: 'plant', p: [345, 238] }, { t: 'plant', p: [515, 290] },
    // suíte 01
    { t: 'bed', r: [382, 499, 431, 565], head: 'n' }, { t: 'bench', r: [384, 565, 429, 579] },
    { t: 'nightstand', p: [366, 506], round: true }, { t: 'nightstand', p: [447, 506], round: true },
    { t: 'rug', c: [405, 540], rad: 46 },
    { t: 'wardrobe', r: [458, 499, 479, 581] }, { t: 'desk', r: [316, 582, 358, 600] }, { t: 'armchair', p: [330, 570] },
    // banho 4,00 e 4,13
    { t: 'shower', r: [342, 606, 376, 640] }, { t: 'toilet', p: [392, 676], dir: 'n' }, { t: 'vanity', r: [398, 630, 413, 668], basins: 1 },
    { t: 'vanity', r: [460, 621, 500, 636], basins: 1, along: 'x' }, { t: 'toilet', p: [432, 674], dir: 'n' }, { t: 'shower', r: [416, 621, 440, 660] },
    // suíte 02
    { t: 'bed', r: [528, 655, 598, 700], head: 'e' }, { t: 'nightstand', p: [590, 640], round: true },
    { t: 'rug', c: [550, 690], rad: 48 },
    { t: 'desk', r: [341, 696, 438, 712] }, { t: 'armchair', p: [376, 728] }, { t: 'wardrobe', r: [444, 745, 551, 764] },
    // suíte 03 e banho 3,24
    { t: 'bed', r: [748, 692, 812, 762], head: 'n' }, { t: 'nightstand', p: [736, 700], round: true },
    { t: 'desk', r: [662, 628, 730, 646] }, { t: 'wardrobe', r: [655, 675, 677, 765] }, { t: 'wardrobe', r: [710, 703, 730, 765] },
    { t: 'vanity', r: [605, 680, 620, 716], basins: 1 }, { t: 'toilet', p: [622, 724], dir: 'e' }, { t: 'shower', r: [605, 740, 650, 765] },
    // lavabo
    { t: 'vanity', r: [700, 320, 730, 333], basins: 1, along: 'x' }, { t: 'toilet', p: [690, 360], dir: 'e' },
    // elevadores (portas)
    { t: 'elevator', r: [553, 383, 583, 387] }, { t: 'elevator', r: [627, 383, 655, 387] },
    // sala de estar
    { t: 'rug', r: [760, 410, 900, 545] },
    { t: 'sofa', r: [866, 425, 896, 538] }, { t: 'sofa', r: [829, 508, 866, 538] },
    { t: 'armchair', p: [793, 428], color: 'rust' }, { t: 'armchair', p: [827, 428], color: 'rust' },
    { t: 'coffeetable', p: [797, 466], rad: 11 }, { t: 'coffeetable', p: [800, 490], rad: 8 },
    { t: 'tvpanel', r: [737, 438, 748, 540] },
    { t: 'floorlamp', p: [852, 424] }, { t: 'plant', p: [752, 560], size: 1.1 },
    { t: 'art', p: [695, 617], face: 'n', w: 1.4, h: 0.9, seed: 1 },
    { t: 'art', p: [602, 700], face: 'w', w: 0.9, h: 1.1, seed: 3 },
    { t: 'art', p: [734, 560], face: 'e', w: 0.6, h: 0.8, seed: 2, y: 1.45 },
    // sala de jantar
    { t: 'diningtable', c: [995, 503], rx: 52, ry: 22, seats: 10 },
    { t: 'plant', p: [1070, 452] },
    // sala almoço / cozinha
    { t: 'counter', r: [980, 567, 1082, 581], h: 0.95, top: 'wood' },
    { t: 'island', r: [982, 601, 1065, 635] }, { t: 'stool', p: [995, 645] }, { t: 'stool', p: [1015, 645] }, { t: 'stool', p: [1035, 645] }, { t: 'stool', p: [1055, 645] },
    { t: 'tallcabinet', r: [1082, 561, 1105, 668] },
    { t: 'counter', r: [945, 675, 1003, 690], h: 0.92 }, { t: 'counter', r: [945, 721, 1179, 740], h: 0.92, cooktop: [1110, 731], sink: [1150, 731], uppers: 's' },
    { t: 'fridge', r: [1005, 704, 1030, 721] }, { t: 'fridge', r: [1032, 704, 1057, 721] },
    { t: 'counter', r: [1105, 648, 1179, 668], h: 0.92, grill: true },
    // serviço
    { t: 'counter', r: [870, 655, 940, 668], h: 0.92 }, { t: 'bed', r: [790, 640, 852, 666], head: 'w', single: true },
    { t: 'toilet', p: [760, 650], dir: 'n' },
    // área técnica (condensadoras)
    { t: 'condenser', p: [850, 690] }, { t: 'condenser', p: [870, 690] }, { t: 'condenser', p: [890, 690] }, { t: 'condenser', p: [915, 690] }, { t: 'condenser', p: [935, 690] },
    // varanda ampliada
    { t: 'roundtable', c: [1185, 535], rad: 33, seats: 8 },
    { t: 'loungeset', c: [1222, 690], rad: 30 },
    { t: 'plant', p: [1270, 470] }, { t: 'plant', p: [1285, 500] }, { t: 'plant', p: [1250, 750] }, { t: 'plant', p: [1275, 740] },
  ],

  // pontos de navegação (estilo Street View): [x, y] px, olhar inicial em graus (0 = norte da planta, 90 = mar)
  nodes: [
    { id: 'hall', name: 'Hall privativo', p: [600, 418], look: 90 },
    { id: 'estar', name: 'Sala de estar', p: [772, 482], look: 75 },
    { id: 'jantar', name: 'Sala de jantar', p: [1010, 468], look: 100 },
    { id: 'varanda', name: 'Varanda gourmet', p: [1150, 600], look: 80 },
    { id: 'mar', name: 'Varanda · vista mar', p: [1250, 560], look: 75 },
    { id: 'almoco', name: 'Sala almoço', p: [1000, 655], look: 20 },
    { id: 'cozinha', name: 'Cozinha', p: [1090, 700], look: 270 },
    { id: 'circ', name: 'Circulação íntima', p: [600, 602], look: 270 },
    { id: 'corredor', name: 'Acesso às suítes', p: [508, 520], look: 0 },
    { id: 'master', name: 'Suíte master', p: [490, 372], look: 290 },
    { id: 'terraco', name: 'Terraço com piscina', p: [440, 292], look: 250 },
    { id: 'closet', name: 'Closet master', p: [420, 458], look: 270 },
    { id: 's01', name: 'Suíte 01', p: [420, 588], look: 330 },
    { id: 's02', name: 'Suíte 02', p: [470, 728], look: 70 },
    { id: 's03', name: 'Suíte 03', p: [700, 690], look: 110 },
  ],
  start: 'estar',
};
