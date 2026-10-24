import type { MapDef } from './types';

export const floresta: MapDef = {
  id: 'floresta', name: 'Floresta dos Cristais', order: 14,
  desc: 'Árvores mágicas, cogumelos fofos e cristais que brilham.',
  indoor: false, size: [15, 15], color: '#c7a8f0', bg: ['#cdbdf2', '#eae2fb'], unlockCoins: 6200,
  floor: { base: 'musgo', rects: [{ x: 0, y: 7, w: 15, h: 1, t: 'cristal' }, { x: 7, y: 0, w: 1, h: 15, t: 'cristal' }, { x: 5, y: 5, w: 5, h: 5, t: 'cristal' }] },
  objects: [
    { type: 'arvore_magica', x: 1, y: 1 }, { type: 'arvore_magica', x: 12, y: 1 }, { type: 'arvore_magica', x: 1, y: 12 }, { type: 'arvore_magica', x: 13, y: 13 },
    { type: 'arvore_lilas', x: 4, y: 2 }, { type: 'arvore_lilas', x: 10, y: 12 }, { type: 'arvore_lilas', x: 2, y: 9 },
    { type: 'cristal_rosa', x: 5, y: 3 }, { type: 'cristal_azul', x: 10, y: 4 }, { type: 'cristal_lilas', x: 3, y: 5 },
    { type: 'cristal_verde', x: 11, y: 10 }, { type: 'cristal_rosa', x: 4, y: 11 }, { type: 'cristal_azul', x: 12, y: 6 },
    { type: 'cogumelo', x: 9, y: 2 }, { type: 'cogumelo', x: 2, y: 4 }, { type: 'cogumelo', x: 13, y: 9 },
    { type: 'borboleta', x: 6, y: 1 }, { type: 'borboleta', x: 9, y: 13 }, { type: 'coelho', x: 3, y: 13 },
  ],
  npcs: [
    {
      id: 'fada_lume', name: 'Fada Lume', x: 9, y: 8, dir: 'front',
      look: { skin: 'pele3', hairStyle: 'cab_longo', hairColor: 'cor_menta', full: 'vest_babado_menta', shoes: 'sapatilha_dourada', wings: 'asas_fada_azul', hat: 'tiara_flores_amarela' },
      lines: ['Os cristais guardam a luz das estrelas.', 'Você tem um brilho especial, Larissa!'],
      missions: ['floresta_main', 'floresta_side'],
    },
    {
      id: 'gnomo_pipo', name: 'Pipo', x: 4, y: 7, dir: 'side', wander: true,
      look: { skin: 'pele4', hairStyle: 'cab_curtinho', hairColor: 'cor_ruivo', top: 'cam_flor', bottom: 'short_barra_coral', shoes: 'bota_marrom', hat: 'chapeu_festa_rosa' },
      lines: ['Eu moro debaixo do cogumelo maior!', 'Psiu, a Fada Lume sabe todos os segredos da floresta.'],
    },
  ],
  portals: [
    { x: 0, y: 7, to: 'atelie', label: 'Ateliê de Arte' },
    { x: 14, y: 7, to: 'castelo', label: 'Castelo das Estrelas' },
  ],
  minigame: { id: 'cristais', x: 7, y: 11, obj: 'cristal_lilas' },
  hidden: { mission: 'floresta_side', kind: 'cristal', spots: [[6, 0], [14, 3], [0, 14]] },
  spawn: [1, 7],
};
