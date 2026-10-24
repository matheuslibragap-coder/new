import type { MapDef } from './types';

const water: [number, number][] = [];
export const praia: MapDef = {
  id: 'praia', name: 'Praia Coral', order: 7,
  desc: 'Areia fofinha, mar azul e conchinhas por todo lado.',
  indoor: false, size: [14, 14], color: '#8fd3f2', bg: ['#bfe9ff', '#fff6dc'], unlockCoins: 1800,
  floor: {
    base: 'areia',
    rects: [{ x: 0, y: 0, w: 14, h: 3, t: 'agua' }, { x: 0, y: 0, w: 3, h: 14, t: 'agua' }, { x: 3, y: 3, w: 11, h: 1, t: 'areia' }],
    holes: water,
  },
  objects: [
    { type: 'coqueiro', x: 4, y: 12 }, { type: 'coqueiro', x: 13, y: 9 }, { type: 'coqueiro', x: 12, y: 4 },
    { type: 'guarda_sol', x: 6, y: 6 }, { type: 'toalha', x: 7, y: 6 }, { type: 'guarda_sol', x: 10, y: 10 }, { type: 'toalha', x: 11, y: 10 },
    { type: 'castelo_areia', x: 5, y: 9 }, { type: 'pedra', x: 3, y: 7 }, { type: 'pedra', x: 9, y: 3 },
    { type: 'barquinho', x: 1, y: 6 },
    { type: 'arbusto', x: 13, y: 13 },
  ],
  npcs: [
    {
      id: 'surfista_mari', name: 'Mari Surfista', x: 8, y: 8, dir: 'front',
      look: { skin: 'pele3', hairStyle: 'cab_longo', hairColor: 'cor_loiro', top: 'cam_flor', bottom: 'short_listrado', shoes: 'sandalia_azul', glasses: 'oculos_coracao_rosa' },
      lines: ['O mar está calminho hoje!', 'Já viu como as conchas brilham no sol?'],
      missions: ['praia_main', 'praia_side'],
    },
    {
      id: 'kaique', name: 'Kaique', x: 11, y: 7, dir: 'side', wander: true,
      look: { skin: 'pele5', hairStyle: 'cab_curtinho', hairColor: 'cor_preto', top: 'cam_estrela', bottom: 'short_amarelo', shoes: 'sandalia_coral', hat: 'bone_amarelo' },
      lines: ['Vamos fazer um castelo de areia gigante!', 'Cuidado com os caranguejos, eles beliscam!'],
    },
  ],
  portals: [
    { x: 7, y: 13, to: 'clinica', label: 'Clínica dos Bichinhos' },
    { x: 13, y: 6, to: 'danca', label: 'Escola de Dança' },
  ],
  minigame: { id: 'conchas', x: 4, y: 4, obj: 'concha_grande' },
  hidden: { mission: 'praia_side', kind: 'estrela-do-mar', spots: [[3, 12], [13, 3], [9, 12]] },
  spawn: [7, 11],
};
