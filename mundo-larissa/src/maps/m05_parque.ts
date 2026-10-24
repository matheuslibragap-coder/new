import type { MapDef } from './types';

export const parque: MapDef = {
  id: 'parque', name: 'Parque das Flores', order: 5,
  desc: 'Um jardim enorme cheio de flores coloridas e borboletas.',
  indoor: false, size: [14, 14], color: '#9fe3c9', bg: ['#c9f0ff', '#effbe6'], unlockCoins: 1000,
  floor: {
    base: 'grama',
    rects: [
      { x: 0, y: 6, w: 14, h: 2, t: 'caminho' }, { x: 6, y: 0, w: 2, h: 14, t: 'caminho' },
      { x: 1, y: 1, w: 4, h: 4, t: 'flores' }, { x: 9, y: 9, w: 4, h: 4, t: 'flores' }, { x: 9, y: 1, w: 4, h: 3, t: 'flores' },
    ],
  },
  objects: [
    { type: 'coreto', x: 9, y: 9 },
    { type: 'canteiro', x: 2, y: 2 }, { type: 'canteiro', x: 3, y: 3 }, { type: 'canteiro', x: 10, y: 2 }, { type: 'canteiro', x: 12, y: 1 },
    { type: 'girassol', x: 0, y: 4 }, { type: 'girassol', x: 4, y: 0 }, { type: 'girassol', x: 13, y: 4 },
    { type: 'arvore_rosa', x: 0, y: 0 }, { type: 'arvore', x: 13, y: 0 }, { type: 'arvore_lilas', x: 0, y: 12 }, { type: 'arvore', x: 4, y: 12 },
    { type: 'arbusto_flor', x: 5, y: 9 }, { type: 'arbusto_flor', x: 8, y: 4 }, { type: 'arbusto', x: 12, y: 8 },
    { type: 'banco', x: 4, y: 5 }, { type: 'banco', x: 9, y: 5 },
    { type: 'borboleta', x: 3, y: 1 }, { type: 'borboleta', x: 10, y: 3 }, { type: 'borboleta', x: 1, y: 9 },
    { type: 'coelho', x: 11, y: 4 },
  ],
  npcs: [
    {
      id: 'jardineira_bia', name: 'Jardineira Bia', x: 3, y: 9, dir: 'front',
      look: { skin: 'pele5', hairStyle: 'cab_trancas', hairColor: 'cor_preto', full: 'mac_short_menta', shoes: 'bota_chuva', hat: 'chapeu_palha' },
      lines: ['Cada flor tem sua cor favorita de água… brincadeira!', 'As borboletas adoram este parque.'],
      missions: ['parque_main', 'parque_side'],
    },
    {
      id: 'vovo_ze', name: 'Vovô Zé', x: 10, y: 6, dir: 'side', mirror: true,
      look: { skin: 'pele3', hairStyle: 'cab_curtinho', hairColor: 'cor_preto', top: 'blusa_manga_xadrez', bottom: 'calca_jeans', shoes: 'boneca_vermelho', glasses: 'oculos_redondo_lilas' },
      lines: ['Eu venho aqui todo dia ver as flores.', 'Sabia que girassol gira para olhar o sol?'],
    },
  ],
  portals: [
    { x: 0, y: 7, to: 'confeitaria', label: 'Confeitaria Doce Nuvem' },
    { x: 13, y: 6, to: 'clinica', label: 'Clínica dos Bichinhos' },
  ],
  minigame: { id: 'jardim', x: 2, y: 10, obj: 'horta' },
  hidden: { mission: 'parque_side', kind: 'flor', spots: [[1, 3], [12, 12], [8, 1]] },
  spawn: [2, 7],
};
