import type { MapDef } from './types';

export const praca: MapDef = {
  id: 'praca',
  name: 'Praça Central',
  order: 1,
  desc: 'O coração da cidade, com a fonte de coração e muitos passarinhos.',
  indoor: false,
  size: [14, 14],
  color: '#f7a8c8',
  bg: ['#bfe6ff', '#e9f8ff'],
  unlockCoins: 0,
  floor: {
    base: 'grama',
    rects: [
      { x: 6, y: 0, w: 2, h: 14, t: 'caminho' },
      { x: 0, y: 6, w: 14, h: 2, t: 'caminho' },
      { x: 4, y: 4, w: 6, h: 6, t: 'pedra' },
      { x: 0, y: 0, w: 3, h: 3, t: 'flores' },
      { x: 11, y: 11, w: 3, h: 3, t: 'flores' },
    ],
  },
  objects: [
    { type: 'fonte', x: 6, y: 6 },
    { type: 'arvore', x: 1, y: 4 }, { type: 'arvore_rosa', x: 3, y: 1 }, { type: 'arvore', x: 10, y: 1 },
    { type: 'arvore_rosa', x: 12, y: 3 }, { type: 'arvore', x: 1, y: 12 }, { type: 'arvore_rosa', x: 12, y: 10 },
    { type: 'arvore', x: 4, y: 12 }, { type: 'arvore_lilas', x: 0, y: 9 },
    { type: 'banco', x: 4, y: 3 }, { type: 'banco', x: 9, y: 3 }, { type: 'banco', x: 3, y: 9, flip: true },
    { type: 'poste', x: 5, y: 5 }, { type: 'poste', x: 9, y: 9 }, { type: 'poste', x: 9, y: 5 }, { type: 'poste', x: 5, y: 9 },
    { type: 'canteiro', x: 1, y: 1 }, { type: 'canteiro', x: 12, y: 12 }, { type: 'canteiro', x: 10, y: 10 },
    { type: 'arbusto', x: 13, y: 0 }, { type: 'arbusto_flor', x: 0, y: 13 }, { type: 'arbusto', x: 8, y: 12 },
    { type: 'arbusto_flor', x: 11, y: 8 }, { type: 'arbusto', x: 2, y: 8 },
    { type: 'borboleta', x: 2, y: 2 }, { type: 'borboleta', x: 11, y: 12 },
  ],
  npcs: [
    {
      id: 'vovo_lina', name: 'Vovó Lina', x: 9, y: 11, dir: 'front',
      look: { skin: 'pele2', hairStyle: 'cab_coque', hairColor: 'cor_castanho', full: 'vest_longo_coral', shoes: 'sapatilha_azul', glasses: 'oculos_redondo_lilas', necklace: 'colar_perolas' },
      lines: ['Que dia lindo, Larissa!', 'Os passarinhos adoram quando você vem visitar.', 'Já foi ao Shopping Estrela? Fica logo ali!'],
      missions: ['praca_tutorial', 'praca_main'],
    },
    {
      id: 'theo', name: 'Théo', x: 10, y: 7, dir: 'side', mirror: true, wander: true,
      look: { skin: 'pele5', hairStyle: 'cab_curtinho', hairColor: 'cor_preto', top: 'cam_estrela', bottom: 'short_jeans', shoes: 'tenis_azul', hat: 'bone_azul' },
      lines: ['Oi, Larissa! Vamos brincar mais tarde?', 'Dizem que no Castelo das Estrelas vai ter um Grande Baile!'],
      missions: ['praca_side'],
    },
    {
      id: 'mimi_gata', name: 'Mimi', x: 2, y: 5, animal: 'gatinho_cinza',
      lines: ['Miau! (A Mimi quer carinho.)', 'Purr purr…'],
    },
  ],
  portals: [{ x: 13, y: 7, to: 'shopping', label: 'Shopping Estrela' }],
  minigame: { id: 'passarinhos', x: 3, y: 6, obj: 'comedouro' },
  hidden: { mission: 'praca_side', kind: 'pena', spots: [[1, 7], [12, 1], [8, 13]] },
  spawn: [7, 9],
};
