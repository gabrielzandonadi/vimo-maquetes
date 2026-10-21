// Descritor do Edifício Dr. Homero Tavares (Barbosa Barros) — Praia da Costa, Vila Velha/ES.
// Dados: página da Vimo (unidades, preços, imagens) e página da construtora (estágio da obra).
import { SITE, PROPERTY } from './data.js';
import { TERRAIN } from './terrain.js';
import { buildHomero, ORIENT, floorY } from './building.js';
import { PLAN_03, PLAN_04, PLAN_05, PLAN_06 } from './plans.js';
import { PLAN_LAZER } from './lazer.js';

// tours internos: cada unidade disponível usa a planta oficial da sua coluna
const COL_PLAN = { '03': PLAN_03, '04': PLAN_04, '05': PLAN_05, '06': PLAN_06 };
const interiors = {};
for (const u of PROPERTY.units) if (/dispon/i.test(u.status) && COL_PLAN[u.name.slice(-2)]) interiors[u.name] = COL_PLAN[u.name.slice(-2)];

export default {
  id: 'homero',
  short: 'Dr. Homero Tavares',
  SITE, PROPERTY, TERRAIN, ORIENT, floorY,
  build: units => buildHomero(units),
  imgBase: 'assets/homero/',
  hero: 'c8_0',
  floors: 12,
  extracted: '16/10/2026',
  rooms: { word: 'quartos', title: 'Quartos' },
  floorNotes: { 3: 'Área de lazer', 2: 'Garagem', 1: 'Garagem', 0: 'Térreo · portaria' },
  unitType: m => {
    const c = m.userData.unit.name.slice(-2);
    return { '01': 'Frente · Rua Humberto Serrano', '02': 'Frente · Rua Humberto Serrano', '07': 'Frente · Rua Romero Botelho', '08': 'Frente · Rua Romero Botelho' }[c] || `Lateral ${+c % 2 ? 'norte' : 'sul'} · coluna ${c}`;
  },
  // pontos no sistema local do edifício (x = Rua Humberto Serrano, z = sul)
  lot: { center: [-30, 1], tower: [-30, 1], calibrate: [5, 0], clip: { min: [-64.5, -15], max: [0.5, 15] } },
  streetView: { dist: 9, heading: 279 },
  earthHeading: 279,
  camera: { start: { bearing: 64, dist: 330, h: 210, ty: 20 } },
  presets: [
    { id: 'geral', label: 'Vista geral', bearing: 67, dist: 82, h: 34, ty: 22 },
    { id: 'humberto', label: 'Rua Humberto Serrano', bearing: 99, dist: 46, side: [189, 12], ground: true, ty: 26 },
    { id: 'romero', label: 'Rua Romero Botelho', bearing: 279, dist: 48, side: [9, 10], ground: true, ty: 26 },
    { id: 'aerea', label: 'Planta (topo)', top: 300 },
  ],
  labels: {
    roads: [
      { road: 'Rua Humberto Serrano', seed: [0, 60] },
      { road: 'Rua Curitiba', seed: [-84, 40], text: 'Rua Romero Botelho' },
      { road: 'Rua José Pena Medina', seed: [-30, -46] },
      { road: 'Rua Afonso Pena', seed: [70, 60] },
    ],
    places: [{ text: 'Praia da Costa', x: 330, z: 120 }, { text: 'Oceano Atlântico', x: 520, z: 100, y: 2 }],
    peak: 'Morro do Moreno',
  },
  galleryOrder: ['Principal', 'Fachada', 'Área comum'],
  galleryExtra: [{ title: 'Fachada à noite · Rua Romero Botelho', img: 'noite' }, { title: 'Planta do lazer (3º pavimento)', img: 'lazer' }],
  planImages: { '84,35 m²': 'c2_0', '82,88 m²': 'c3_0', '82,59 m²': 'c4_0', '84,43 m²': 'c5_0', '91,89 m²': 'c6_0' },
  planSimilar: {},
  interiors,
  // tours de áreas comuns (abertos pelo painel lateral, pelo mapa de andares ou por #lazer)
  amenities: [{ id: 'lazer', name: 'Área de lazer', sub: '3º pavimento · piscina, gourmet, salão de festas, fitness e mais', floor: 3, plan: PLAN_LAZER }],
  // tours virtuais em vídeo (9:16), por unidade ou área comum — abrem num popup
  videos: {
    '1004': { src: 'assets/homero/video/1004.mp4', poster: 'assets/homero/video/1004.jpg', title: 'Unidade 1004', sub: '82,88 m² · 3 quartos · 1 suíte' },
    lazer: { src: 'assets/homero/video/lazer.mp4', poster: 'assets/homero/video/lazer.jpg', title: 'Área de lazer', sub: '3º pavimento' },
  },
  // vídeo institucional da tela de abertura (feito em código com Remotion: tools/intro-video)
  intro: {
    h: 'assets/homero/intro/homero-16x9.mp4', posterH: 'assets/homero/intro/homero-16x9.jpg',
    v: 'assets/homero/intro/homero-9x16.mp4', posterV: 'assets/homero/intro/homero-9x16.jpg',
  },
  balconyView: false,   // sem o botão "Ver a vista da varanda" nos cards
  sunBake: 'js/projects/homero/sun.json',
  // estágio da obra (página da construtora, atualizada em 28/05/2026)
  obra: {
    updated: '28/05/2026',
    source: 'https://barbosabarros.com.br/imoveis/44/ed-dr-homero-tavares?tab=acompanhe#acompanhe-sua-obra',
    status: [['Fundação', 100], ['Estrutura', 54], ['Alvenaria', 4], ['Reboco interno', 0], ['Reboco externo', 0], ['Cerâmica interna', 0], ['Cerâmica externa', 0], ['Pintura', 0], ['Entrega', 0]],
    photos: ['2026-05-28_1', '2026-05-28_2', '2026-05-28_3', '2026-05-28_4', '2026-03-03_1', '2026-01-13_1', '2025-12-19_1', '2025-05-30_1', '2024-09-11_1'],
  },
};
