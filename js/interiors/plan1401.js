// Planta "Cobertura Duplex · 4 suítes · Unidade 1401" (assets/img/c5_0.jpg) — dois pavimentos na mesma imagem.
// Escala 0,0275 m/px. O pavimento inferior (14º) segue o contorno da torre: os poços dos elevadores
// (px 282×512) coincidem com os da 901, o que fixa a posição. A escada interna dos dois desenhos se
// sobrepõe com deslocamento (+664, −388) px, que alinha o pavimento superior (15º, cobertura com piscina).

const LOWER_ANCHOR = { px: [282, 512], local: [-73.3, -1.8] };
const UPPER_ANCHOR = { px: [946, 124], local: [-73.3, -1.8] };

export const PLAN_1401 = {
  id: '1401',
  image: 'c5_0',
  scale: 0.0275,
  ceiling: 2.75,
  levels: [
    {
      name: 'Pavimento inferior', short: 'Inferior', y: 0, height: 3.05,
      anchor: LOWER_ANCHOR, map: [35, 410, 1080, 965],
      outline: [[50, 435], [62, 420], [300, 474], [560, 540], [1030, 660], [1062, 690], [1070, 715], [1060, 940], [1045, 955], [710, 955], [710, 900], [587, 900], [587, 955], [125, 955], [90, 925], [60, 850], [45, 760], [45, 450]],
      ceilingPolys: [[[50, 435], [62, 420], [300, 474], [560, 540], [867, 618], [867, 955], [710, 955], [710, 900], [587, 900], [587, 955], [125, 955], [90, 925], [60, 850], [45, 760], [45, 450]]],
      walls: [
        // núcleo (elevadores + shafts) e caixa da escada
        [275, 480, 452, 582], [282, 650, 445, 655], [275, 655, 282, 782],
        // hall → cozinha
        [485, 582, 492, 612], [485, 645, 492, 685],
        // suíte master e banhos
        [267, 537, 275, 765], [55, 537, 125, 542], [125, 540, 130, 683], [57, 712, 130, 720],
        [60, 720, 65, 805], [125, 720, 130, 805], [60, 800, 130, 808], [130, 763, 235, 770],
        // suítes 01 e 02
        [235, 815, 242, 955], [242, 825, 400, 832], [430, 825, 460, 832], [460, 790, 465, 955],
        // banho, lavabo, banho, suíte reversível
        [462, 800, 490, 807], [520, 800, 555, 807], [550, 807, 555, 872], [462, 868, 555, 875],
        [555, 800, 565, 807], [590, 800, 602, 807], [597, 807, 602, 872], [555, 868, 602, 875],
        [602, 800, 620, 807], [650, 800, 690, 807], [685, 807, 690, 872], [602, 868, 690, 875],
        [690, 800, 840, 807], [685, 875, 690, 955], [587, 872, 710, 877],
      ],
      doors: [[485, 612, 492, 645], [235, 763, 267, 770], [235, 785, 242, 815], [400, 825, 430, 832], [490, 800, 520, 807], [565, 800, 590, 807], [620, 800, 650, 807], [840, 800, 865, 807], [125, 683, 130, 712]],
      wallLines: [{ a: [450, 508], b: [490, 520] }],
      glass: [
        [[125, 537], [267, 537]], [[125, 815], [125, 950]],
        [[490, 520], [732, 636]], [[732, 636], [867, 668]], [[867, 668], [867, 955]],
      ],
      floors: [
        { m: 'porcelain', poly: [[282, 582], [485, 582], [490, 520], [732, 636], [867, 668], [867, 800], [235, 800], [235, 782], [282, 782]] },
        { m: 'wood', poly: [[130, 540], [267, 540], [267, 763], [130, 763]] },
        { m: 'wood', poly: [[130, 770], [235, 770], [235, 950], [130, 950]] },
        { m: 'wood', poly: [[242, 832], [460, 832], [460, 955], [242, 955]] },
        { m: 'wood', poly: [[690, 807], [867, 807], [867, 955], [690, 955]] },
        { m: 'marble', poly: [[57, 542], [125, 542], [125, 712], [57, 712]] },
        { m: 'marble', poly: [[65, 720], [125, 720], [125, 800], [65, 800]] },
        { m: 'marble', poly: [[462, 807], [550, 807], [550, 868], [462, 868]] },
        { m: 'marble', poly: [[555, 807], [597, 807], [597, 868], [555, 868]] },
        { m: 'marble', poly: [[602, 807], [685, 807], [685, 868], [602, 868]] },
      ],
      pool: [77, 485, 145, 530],
      poolDeck: [57, 482, 155, 540],
      stairs: [{
        runs: [{ r: [300, 700, 420, 740], dir: 'e', from: 0, to: 1.7 }, { r: [290, 742, 420, 782], dir: 'w', from: 1.7, to: 3.4 }],
        landings: [{ r: [420, 690, 437, 782], y: 1.7 }],
      }],
      furniture: [
        // varanda e suíte master
        { t: 'rug', c: [180, 480], rad: 30 }, { t: 'armchair', p: [205, 465], color: 'rust' }, { t: 'plant', p: [60, 445] }, { t: 'plant', p: [225, 505] },
        { t: 'bed', r: [130, 560, 220, 645], head: 'w' }, { t: 'nightstand', p: [138, 550], round: true }, { t: 'nightstand', p: [138, 655], round: true },
        { t: 'rug', c: [200, 600], rad: 50 }, { t: 'wardrobe', r: [130, 660, 235, 683] }, { t: 'bench', r: [175, 705, 215, 718] }, { t: 'wardrobe', r: [130, 742, 235, 763] },
        { t: 'tvpanel', r: [255, 545, 267, 650], face: 'w' },
        { t: 'vanity', r: [57, 600, 72, 680], basins: 2 }, { t: 'toilet', p: [100, 650], dir: 'w' }, { t: 'shower', r: [57, 542, 125, 575] },
        { t: 'vanity', r: [65, 740, 80, 780], basins: 1 }, { t: 'toilet', p: [105, 760], dir: 'w' },
        // suíte 01 e varanda
        { t: 'desk', r: [142, 770, 200, 785] }, { t: 'bed', r: [162, 845, 235, 900], head: 'e' },
        { t: 'nightstand', p: [225, 836], round: true }, { t: 'nightstand', p: [225, 908], round: true },
        { t: 'rug', r: [140, 820, 215, 925] }, { t: 'wardrobe', r: [130, 932, 235, 953] },
        { t: 'armchair', p: [90, 840] }, { t: 'plant', p: [75, 880] },
        // suíte 02
        { t: 'wardrobe', r: [242, 832, 265, 953] }, { t: 'wardrobe', r: [300, 857, 320, 953] },
        { t: 'tvpanel', r: [345, 832, 460, 838] },
        { t: 'bed', r: [360, 870, 410, 953], head: 's' }, { t: 'nightstand', p: [345, 940], round: true }, { t: 'nightstand', p: [425, 940], round: true },
        { t: 'rug', r: [335, 850, 440, 925] },
        // banhos e lavabo
        { t: 'vanity', r: [462, 812, 500, 825], basins: 1, along: 'x' }, { t: 'toilet', p: [500, 855], dir: 'n' }, { t: 'shower', r: [520, 807, 550, 840] },
        { t: 'vanity', r: [557, 812, 575, 835], basins: 1 }, { t: 'toilet', p: [580, 855], dir: 'n' },
        { t: 'vanity', r: [615, 812, 650, 825], basins: 1, along: 'x' }, { t: 'toilet', p: [640, 855], dir: 'n' }, { t: 'shower', r: [655, 807, 685, 840] },
        { t: 'condenser', p: [600, 888] }, { t: 'condenser', p: [622, 888] }, { t: 'condenser', p: [644, 888] }, { t: 'condenser', p: [666, 888] }, { t: 'condenser', p: [690, 888] },
        // varanda da suíte 02
        { t: 'desk', r: [462, 877, 527, 895] }, { t: 'armchair', p: [485, 915] }, { t: 'armchair', p: [550, 920], color: 'rust' }, { t: 'plant', p: [565, 945] },
        // suíte reversível
        { t: 'sofa', r: [725, 812, 820, 848], back: 'n' }, { t: 'coffeetable', p: [800, 860], rad: 10 },
        { t: 'rug', r: [722, 850, 825, 900] }, { t: 'desk', r: [705, 932, 848, 952] }, { t: 'wardrobe', r: [690, 870, 705, 932] },
        // cozinha
        { t: 'counterLine', a: [492, 524], b: [728, 634], d: 22, side: -1, h: 0.92 },
        { t: 'fridge', r: [522, 570, 548, 600] }, { t: 'fridge', r: [549, 572, 575, 600] },
        { t: 'island', r: [525, 655, 667, 678] },
        // sala e jantar
        { t: 'counter', r: [650, 682, 780, 700], h: 0.8, top: 'wood' },
        { t: 'diningtable', c: [557, 737], rx: 55, ry: 20, seats: 12 },
        { t: 'rug', r: [620, 705, 825, 800] },
        { t: 'sofa', r: [637, 772, 810, 805] }, { t: 'sofa', r: [780, 735, 810, 772] },
        { t: 'coffeetable', p: [720, 727], rad: 12 }, { t: 'armchair', p: [745, 735] },
        { t: 'plant', p: [770, 630] }, { t: 'floorlamp', p: [625, 760] },
        // área descoberta
        { t: 'roundtable', c: [945, 715], rad: 25, seats: 5 },
        { t: 'lounger', r: [910, 790, 975, 812] }, { t: 'lounger', r: [910, 835, 975, 857] },
        { t: 'loungeset', c: [950, 905], rad: 32 },
        { t: 'plant', p: [1040, 695] }, { t: 'plant', p: [1045, 730] }, { t: 'plant', p: [1040, 760] },
      ],
      curtains: [[127, 541, 155, 541], [240, 541, 265, 541], [128, 820, 128, 845], [128, 920, 128, 948], [862, 812, 862, 840], [862, 920, 862, 950]],
      nodes: [
        { id: 'sala', name: 'Sala ampliada', p: [700, 690], look: 90 },
        { id: 'jantar', name: 'Jantar', p: [560, 700], look: 160 },
        { id: 'cozinha', name: 'Cozinha', p: [600, 620], look: 250 },
        { id: 'lobby', name: 'Hall privativo', p: [380, 615], look: 90 },
        { id: 'descoberta', name: 'Área descoberta', p: [960, 770], look: 100 },
        { id: 'reversivel', name: 'Suíte reversível', p: [780, 880], look: 90 },
        { id: 'circ', name: 'Circulação', p: [470, 795], look: 270 },
        { id: 'master', name: 'Suíte master', p: [240, 600], look: 270 },
        { id: 'varandaMaster', name: 'Varanda com piscina', p: [200, 505], look: 300 },
        { id: 's01', name: 'Suíte 01', p: [180, 800], look: 160 },
        { id: 's02', name: 'Suíte 02', p: [300, 860], look: 100 },
        { id: 'escadaInf', name: 'Escada (subir)', p: [330, 795], look: 0, link: 'escadaSup' },
      ],
    },
    {
      name: 'Pavimento superior', short: 'Cobertura', y: 3.4,
      anchor: UPPER_ANCHOR, map: [720, 10, 1560, 575],
      outline: [[727, 22], [1155, 122], [1165, 140], [1400, 200], [1530, 235], [1550, 255], [1550, 540], [1535, 562], [755, 562], [735, 545], [727, 520]],
      ceilingPolys: [[[727, 22], [1155, 122], [1165, 140], [1110, 562], [755, 562], [735, 545], [727, 520]]],
      holes: [[954, 305, 1105, 402]],
      walls: [
        [727, 22, 733, 540],
        // serviço: dependências, banho de serviço, A.S., lavabo
        [733, 100, 810, 105], [855, 40, 860, 118], [810, 105, 815, 180], [815, 120, 945, 125], [880, 125, 885, 182], [815, 180, 835, 185], [860, 180, 945, 185], [733, 215, 790, 222],
        // núcleo, lavabo 2, circulação e caixa da escada
        [945, 60, 1100, 190], [1100, 125, 1105, 190], [1105, 185, 1125, 190], [1145, 185, 1155, 190],
        [940, 190, 947, 230], [940, 255, 947, 330], [1100, 190, 1105, 405], [940, 402, 1105, 408],
      ],
      doors: [[835, 180, 860, 185], [940, 230, 947, 255], [1125, 185, 1145, 190]],
      wallLines: [{ a: [733, 24], b: [945, 74] }],
      glass: [[[1160, 145], [1110, 560]]],
      floors: [
        { m: 'porcelain', poly: [[733, 222], [790, 222], [790, 185], [945, 185], [945, 190], [1105, 190], [1160, 145], [1110, 560], [755, 560], [735, 545], [733, 520]] },
        { m: 'tile', poly: [[733, 26], [945, 76], [945, 185], [733, 185]] },
        { m: 'marble', poly: [[885, 125], [945, 125], [945, 180], [885, 180]] },
        { m: 'marble', poly: [[1105, 125], [1155, 125], [1155, 185], [1105, 185]] },
      ],
      sand: [[[1440, 200], [1530, 235], [1550, 255], [1550, 540], [1535, 562], [1440, 562]]],
      pool: [1250, 215, 1372, 497],
      poolDeck: [1230, 212, 1376, 500],
      furniture: [
        // serviço
        { t: 'bed', r: [740, 30, 790, 55], head: 'w', single: true }, { t: 'toilet', p: [905, 100], dir: 'w' }, { t: 'vanity', r: [925, 90, 943, 115], basins: 1 },
        { t: 'counter', r: [733, 105, 748, 210], h: 0.92 }, { t: 'wardrobe', r: [815, 125, 830, 180] },
        { t: 'vanity', r: [910, 128, 943, 140], basins: 1, along: 'x' }, { t: 'toilet', p: [895, 160], dir: 'e' },
        { t: 'vanity', r: [1110, 160, 1125, 182], basins: 1 }, { t: 'toilet', p: [1140, 140], dir: 's' },
        // sala
        { t: 'counter', r: [735, 222, 885, 240], h: 0.75, top: 'wood' },
        { t: 'rug', r: [745, 245, 925, 370] },
        { t: 'sofa', r: [780, 335, 897, 372] }, { t: 'sofa', r: [750, 300, 780, 372] },
        { t: 'coffeetable', p: [835, 272], rad: 17 }, { t: 'armchair', p: [865, 295], color: 'rust' },
        { t: 'floorlamp', p: [905, 360] }, { t: 'art', p: [736, 300], face: 'e', w: 1.3, h: 0.9, seed: 5 },
        // jantar e espaço gourmet
        { t: 'diningtable', c: [820, 470], rx: 22, ry: 62, seats: 10 },
        { t: 'island', r: [890, 445, 1020, 500] },
        { t: 'stool', p: [905, 432] }, { t: 'stool', p: [935, 428] }, { t: 'stool', p: [965, 428] }, { t: 'stool', p: [995, 432] },
        { t: 'counter', r: [890, 537, 1105, 560], h: 0.92, cooktop: [925, 548], sink: [985, 548], grill: true },
        { t: 'counter', r: [795, 545, 885, 560], h: 0.92, top: 'wood' },
        { t: 'plant', p: [760, 545] },
        // área descoberta com piscina
        { t: 'lounger', r: [1137, 262, 1205, 285] }, { t: 'lounger', r: [1137, 302, 1205, 325] }, { t: 'lounger', r: [1137, 342, 1205, 365] },
        { t: 'rug', c: [1205, 320], rad: 38 },
        { t: 'roundtable', c: [1180, 455], rad: 22, seats: 4 },
        { t: 'planter', r: [1390, 200, 1440, 560], h: 1.7 },
        { t: 'condenser', p: [1175, 160] }, { t: 'condenser', p: [1175, 195] },
        { t: 'plant', p: [1220, 165] }, { t: 'plant', p: [1250, 175] }, { t: 'plant', p: [1350, 520] }, { t: 'plant', p: [1325, 540] },
      ],
      curtains: [[1158, 160, 1153, 200], [1118, 500, 1113, 540]],
      nodes: [
        { id: 'salaSup', name: 'Sala da cobertura', p: [840, 255], look: 180 },
        { id: 'gourmet', name: 'Espaço gourmet', p: [960, 420], look: 200 },
        { id: 'jantarSup', name: 'Jantar', p: [860, 500], look: 270 },
        { id: 'piscina', name: 'Piscina', p: [1200, 230], look: 120 },
        { id: 'solarium', name: 'Área descoberta', p: [1210, 520], look: 40 },
        { id: 'circSup', name: 'Hall', p: [1020, 225], look: 270 },
        { id: 'servico', name: 'Área de serviço', p: [770, 160], look: 0 },
        { id: 'escadaSup', name: 'Escada (descer)', p: [925, 375], look: 90, link: 'escadaInf' },
      ],
    },
  ],
  start: 'sala',
};
