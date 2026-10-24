import type { MapDef } from './types';

export const fazenda: MapDef = {
  id: 'fazenda', name: 'Fazendinha Feliz', order: 10,
  desc: 'Bichinhos, pomar cheio de frutas e um celeiro vermelho.',
  indoor: false, size: [15, 14], color: '#ffe08a', bg: ['#cdeeff', '#f4fbe9'], unlockCoins: 3400,
  floor: {
    base: 'grama',
    rects: [{ x: 0, y: 7, w: 15, h: 2, t: 'terra' }, { x: 9, y: 9, w: 5, h: 4, t: 'terra' }],
  },
  objects: [
    { type: 'celeiro', x: 1, y: 1 },
    { type: 'macieira', x: 6, y: 1 }, { type: 'laranjeira', x: 8, y: 1 }, { type: 'macieira', x: 10, y: 1 }, { type: 'laranjeira', x: 12, y: 2 },
    { type: 'feno', x: 5, y: 4 }, { type: 'feno', x: 5, y: 5 },
    { type: 'poco', x: 13, y: 5 },
    { type: 'plantacao', x: 10, y: 10 }, { type: 'plantacao', x: 11, y: 10 }, { type: 'plantacao', x: 12, y: 10 },
    { type: 'plantacao', x: 10, y: 11 }, { type: 'plantacao', x: 11, y: 11 }, { type: 'plantacao', x: 12, y: 11 },
    { type: 'cerca', x: 0, y: 12 }, { type: 'cerca', x: 1, y: 12 }, { type: 'cerca', x: 2, y: 12 }, { type: 'cerca', x: 3, y: 12 }, { type: 'cerca', x: 4, y: 12 },
    { type: 'cerca_v', x: 5, y: 10 }, { type: 'cerca_v', x: 5, y: 11 },
    { type: 'galinha', x: 7, y: 5 }, { type: 'arbusto', x: 14, y: 13 }, { type: 'arvore', x: 0, y: 10 },
  ],
  npcs: [
    {
      id: 'fazendeira_tina', name: 'Fazendeira Tina', x: 8, y: 6, dir: 'front',
      look: { skin: 'pele4', hairStyle: 'cab_trancas', hairColor: 'cor_ruivo', full: 'mac_jeans', shoes: 'bota_marrom', hat: 'chapeu_palha' },
      lines: ['Bom dia! As galinhas já acordaram cantando.', 'As frutas do pomar estão no ponto!'],
      missions: ['fazenda_main', 'fazenda_side'],
    },
    { id: 'mimosa_vaca', name: 'Mimosa', x: 2, y: 10, animal: 'vaquinha', lines: ['Muuu! (A Mimosa pisca para você.)'] },
    { id: 'cocoroco', name: 'Penugem', x: 3, y: 9, animal: 'galinha', lines: ['Có có có! (Ela parece feliz.)'] },
  ],
  portals: [
    { x: 0, y: 7, to: 'biblioteca', label: 'Biblioteca Encantada' },
    { x: 14, y: 8, to: 'diversoes', label: 'Parque de Diversões' },
  ],
  minigame: { id: 'colheita', x: 7, y: 3, obj: 'cesta_frutas' },
  spawn: [2, 8],
};
