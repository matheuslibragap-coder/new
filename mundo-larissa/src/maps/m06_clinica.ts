import type { MapDef } from './types';

export const clinica: MapDef = {
  id: 'clinica', name: 'Clínica dos Bichinhos', order: 6,
  desc: 'Onde os bichinhos ganham carinho e cuidado.',
  indoor: true, size: [12, 12], color: '#9fd3f7', bg: ['#e5f7f1', '#fdf3e8'], unlockCoins: 1400,
  wall: 'clinica',
  wallObjects: [
    { type: 'cartaz_pet', side: 'L', i: 2 }, { type: 'janela', side: 'L', i: 6 }, { type: 'relogio', side: 'L', i: 9 },
    { type: 'quadro_gato', side: 'R', i: 3 }, { type: 'janela', side: 'R', i: 6 }, { type: 'cartaz_pet', side: 'R', i: 9 },
  ],
  floor: { base: 'ladrilho', rects: [{ x: 3, y: 3, w: 4, h: 4, t: 'carpete_lilas' }] },
  objects: [
    { type: 'maca', x: 1, y: 1 }, { type: 'prateleira_remedios', x: 4, y: 0 }, { type: 'prateleira_remedios', x: 5, y: 0 },
    { type: 'caminha_pet', x: 0, y: 7 }, { type: 'caminha_pet', x: 0, y: 8 },
    { type: 'arranhador', x: 9, y: 1 }, { type: 'vaso_planta', x: 11, y: 0 }, { type: 'vaso_planta', x: 0, y: 11 },
    { type: 'poltrona', x: 9, y: 9 }, { type: 'poltrona', x: 10, y: 9 },
  ],
  npcs: [
    {
      id: 'dra_ana', name: 'Dra. Ana', x: 3, y: 2, dir: 'front',
      look: { skin: 'pele4', hairStyle: 'cab_rabo', hairColor: 'cor_preto', top: 'blusa_manga_menta', bottom: 'calca_branca', shoes: 'tenis_azul', glasses: 'oculos_redondo_rosa' },
      lines: ['Bichinhos felizes têm comida, banho, brincadeira e soneca!', 'A Bolinha adora você!'],
      missions: ['clinica_main', 'clinica_side'],
    },
    { id: 'tob_cao', name: 'Totó', x: 7, y: 8, animal: 'cachorrinho', lines: ['Au au! (O Totó abana o rabinho.)'] },
    { id: 'pipoca_gato', name: 'Pipoca', x: 2, y: 9, animal: 'gatinho', lines: ['Miau! (A Pipoca se espreguiça.)'] },
  ],
  portals: [
    { x: 6, y: 11, to: 'parque', label: 'Parque das Flores' },
    { x: 11, y: 6, to: 'praia', label: 'Praia Coral' },
  ],
  minigame: { id: 'gatinho', x: 8, y: 4, obj: 'casinha_gato' },
  spawn: [6, 10],
};
