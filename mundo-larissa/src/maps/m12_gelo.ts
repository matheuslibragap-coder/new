import type { MapDef } from './types';

export const gelo: MapDef = {
  id: 'gelo', name: 'Pista de Gelo', order: 12,
  desc: 'Uma pista de patinação no meio dos pinheiros nevados.',
  indoor: false, size: [14, 14], color: '#d5ecfc', bg: ['#dceffd', '#f7fbff'], unlockCoins: 4700,
  floor: { base: 'neve', rects: [{ x: 3, y: 3, w: 8, h: 8, t: 'gelo' }] },
  objects: [
    { type: 'pinheiro_neve', x: 0, y: 0 }, { type: 'pinheiro_neve', x: 2, y: 0 }, { type: 'pinheiro_neve', x: 0, y: 2 },
    { type: 'pinheiro_neve', x: 13, y: 0 }, { type: 'pinheiro_neve', x: 13, y: 12 }, { type: 'pinheiro_neve', x: 0, y: 12 },
    { type: 'boneco_neve', x: 11, y: 1 }, { type: 'boneco_neve', x: 1, y: 11 },
    { type: 'barraca_chocolate', x: 5, y: 0 },
    { type: 'cone', x: 4, y: 4 }, { type: 'cone', x: 9, y: 9 }, { type: 'cone', x: 9, y: 4 },
    { type: 'banco', x: 12, y: 5 }, { type: 'banco', x: 12, y: 8 },
    { type: 'poste', x: 2, y: 3 }, { type: 'poste', x: 11, y: 10 },
  ],
  npcs: [
    {
      id: 'patinadora_neve', name: 'Treinadora Neve', x: 6, y: 6, dir: 'front', wander: true,
      look: { skin: 'pele1', hairStyle: 'cab_rabo', hairColor: 'cor_azul', top: 'blusa_manga_lilas', bottom: 'saia_tutu_menta', shoes: 'bota_branca', hat: 'gorro_lilas' },
      lines: ['Patinar é como voar no chão!', 'Dobre os joelhos e deslize!'],
      missions: ['gelo_main', 'gelo_side'],
    },
    {
      id: 'beto', name: 'Beto', x: 6, y: 1, dir: 'front',
      look: { skin: 'pele3', hairStyle: 'cab_curtinho', hairColor: 'cor_castanho', top: 'blusa_manga_xadrez', bottom: 'calca_jeans', shoes: 'bota_marrom', hat: 'gorro_vermelho' },
      lines: ['Chocolate quente para esquentar!', 'Cuidado que o gelo escorrega!'],
    },
  ],
  portals: [
    { x: 0, y: 7, to: 'diversoes', label: 'Parque de Diversões' },
    { x: 13, y: 7, to: 'atelie', label: 'Ateliê de Arte' },
  ],
  minigame: { id: 'patinacao', x: 2, y: 6, obj: 'patins' },
  spawn: [1, 7],
};
