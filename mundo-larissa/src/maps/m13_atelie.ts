import type { MapDef } from './types';

export const atelie: MapDef = {
  id: 'atelie', name: 'Ateliê de Arte', order: 13,
  desc: 'Tintas, pincéis e quadros cheios de cor.',
  indoor: true, size: [12, 12], color: '#ffd59a', bg: ['#fffaf0', '#f3e6d8'], unlockCoins: 5400,
  wall: 'atelie',
  wallObjects: [
    { type: 'quadro_flor', side: 'L', i: 2 }, { type: 'quadro_arcoiris', side: 'L', i: 5 }, { type: 'janela', side: 'L', i: 8 },
    { type: 'quadro_gato', side: 'R', i: 2 }, { type: 'janela', side: 'R', i: 5 }, { type: 'lousa', side: 'R', i: 8 },
  ],
  floor: { base: 'madeira', rects: [{ x: 3, y: 3, w: 5, h: 5, t: 'carpete_lilas' }] },
  objects: [
    { type: 'cavalete', x: 1, y: 1 }, { type: 'cavalete', x: 1, y: 4 }, { type: 'cavalete', x: 4, y: 1 },
    { type: 'mesa_tintas', x: 7, y: 1 }, { type: 'escultura', x: 10, y: 1 }, { type: 'escultura', x: 0, y: 10 },
    { type: 'vaso_planta', x: 11, y: 11 }, { type: 'caixote', x: 0, y: 7 }, { type: 'banco', x: 9, y: 9 },
  ],
  npcs: [
    {
      id: 'artista_nico', name: 'Artista Nico', x: 6, y: 4, dir: 'front',
      look: { skin: 'pele5', hairStyle: 'cab_cacheado', hairColor: 'cor_menta', full: 'mac_short_coral', shoes: 'tenis_menta', hat: 'chapeu_festa_azul' },
      lines: ['Toda cor tem uma emoção!', 'Erros viram arte, sabia?'],
      missions: ['atelie_main', 'atelie_side'],
    },
    {
      id: 'luna', name: 'Luna', x: 3, y: 8, dir: 'side',
      look: { skin: 'pele2', hairStyle: 'cab_longo', hairColor: 'cor_lilas', top: 'cam_lua', bottom: 'legging_estrela', shoes: 'sapatilha_dourada', hat: 'laco_lilas' },
      lines: ['Eu pintei um unicórnio… quer dizer, um cavalinho com chifre de estrela!', 'Amo pintar o céu.'],
    },
  ],
  portals: [
    { x: 6, y: 11, to: 'gelo', label: 'Pista de Gelo' },
    { x: 11, y: 6, to: 'floresta', label: 'Floresta dos Cristais' },
  ],
  minigame: { id: 'pintura', x: 8, y: 6, obj: 'cavalete_grande' },
  spawn: [6, 10],
};
