// Descritor do Apogeo Residences para o motor da maquete (main.js).
// Cada empreendimento exporta um objeto com o mesmo formato: dados da Vimo, entorno, relevo,
// a função que monta o prédio e os parâmetros de câmera/lote no sistema local do edifício.
import { SITE, PROPERTY } from '../../data.js';
import { TERRAIN } from '../../terrain.js';
import { buildApogeo, ORIENT, floorY } from '../../building.js';
import { PROJECT } from '../apogeo.js';

export default {
  id: 'apogeo',
  short: 'Apogeo',
  SITE, PROPERTY, TERRAIN, ORIENT, floorY,
  build: units => buildApogeo(units),
  imgBase: 'assets/img/',
  hero: 'c7_0',
  floors: 15,
  // pontos no sistema local do edifício (x = frente/mar, z = lateral)
  lot: { center: [-42, 0], tower: [-66, 5], calibrate: [8, 0], clip: { min: [-84.5, -14.5], max: [0.5, 14.5] } },
  streetView: { dist: 10, heading: 281 },
  earthHeading: 281,
  camera: { start: { bearing: 125, dist: 420, h: 260, ty: 20 } },
  presets: [
    { id: 'geral', label: 'Vista geral', bearing: 38, dist: 175, h: 70, ty: 24 },
    { id: 'praia', label: 'Da praia', bearing: 101, dist: 125, ground: true, ty: 30 },
    { id: 'fundos', label: 'Rua Lúcio Bacelar', bearing: 281, dist: 60, side: [191, 25], ground: true, ty: 28 },
    { id: 'aerea', label: 'Planta (topo)', top: 380 },
  ],
  labels: {
    roads: [
      { road: 'Avenida Antônio Gil Veloso', seed: [10, 70], text: 'Av. Antônio Gil Veloso' },
      { road: 'Rua Lúcio Bacelar', seed: [-100, 40] },
      { road: 'Rua Gastão Roubach', seed: [-60, -40] },
    ],
    places: [{ text: 'Oceano Atlântico', x: 260, z: 120, y: 2 }, { text: 'Praia da Costa', x: 50, z: 160 }],
    peak: 'Morro do Moreno',
  },
  extracted: '15/10/2026',
  floorNotes: { 15: 'Superior do duplex 1401', 8: 'Lazer · praia suspensa', 0: 'Térreo · lobbies' },
  galleryOrder: ['Principal', 'Fachada', 'Área Comum'],
  planImages: PROJECT.planImages,
  planSimilar: PROJECT.planSimilar,
  interiors: PROJECT.interiors,
  sunBake: 'js/projects/apogeo/sun.json', // insolação pré-calculada com os prédios do Google
};
