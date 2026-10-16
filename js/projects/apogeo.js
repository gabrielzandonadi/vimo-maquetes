// Projeto Apogeo Residences: tudo o que é específico deste empreendimento num só lugar.
// Para um novo empreendimento: copie este arquivo, ajuste as medidas e plantas, e gere data.js/terrain.js
// com os scripts de extração (página da Vimo + OpenStreetMap + relevo). O motor 3D não muda.
import { PLAN_901 } from '../interiors/plan901.js';
import { PLAN_204 } from '../interiors/plan204.js';
import { PLAN_102 } from '../interiors/plan102.js';
import { PLAN_1401 } from '../interiors/plan1401.js';
import { PLAN_501 } from '../interiors/plan501.js';

export const PROJECT = {
  id: 'apogeo',
  // alturas (m)
  heights: { ground: 4.5, floor: 3.4, slab: 0.35 },
  balcony: 2.2,
  // embasamento escalonado: fundos, meia-largura e a frente (borda da laje) de cada pavimento
  podium: {
    back: -80,
    halfWidth: 13,
    front: { 1: -8, 2: -10, 3: -14, 4: -20, 5: -26, 6: -33, 7: -40 },
    gardenDuplex: ['101', '102'], // duplex do 1º/2º com frente para o mar
  },
  leisureFloor: 8,
  // torre: pavimentos-tipo e duplex de cobertura, desenhados a partir da planta oficial
  tower: { plan: PLAN_901, typical: [9, 13], penthouse: [14, 15], roofFloor: 16 },
  // imagem da planta publicada por área privativa (e tipologias similares, com aviso na ficha)
  planImages: { '447,36 m²': 'c2_0', '224,51 m²': 'c3_0', '309,34 m²': 'c4_0', '503,92 m²': 'c5_0' },
  planSimilar: { '224,31 m²': 'c3_0' },
  // tours internos (unidade → planta traçada)
  interiors: { '901': PLAN_901, '204': PLAN_204, '102': PLAN_102, '1401': PLAN_1401, '501': PLAN_501 },
};
