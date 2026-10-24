import type { MapDef } from './types';

export const castelo: MapDef = {
  id: 'castelo', name: 'Castelo das Estrelas', order: 15,
  desc: 'O salão do Grande Baile, com estrelas douradas por todo lado.',
  indoor: true, size: [13, 13], color: '#ffd45e', bg: ['#d9d0f6', '#fde8f3'], unlockCoins: 7000,
  wall: 'castelo',
  wallObjects: [
    { type: 'vitral', side: 'L', i: 2 }, { type: 'vitral', side: 'L', i: 6 }, { type: 'vitral', side: 'L', i: 10 },
    { type: 'vitral', side: 'R', i: 2 }, { type: 'cortina_palco', side: 'R', i: 6 }, { type: 'vitral', side: 'R', i: 10 },
  ],
  floor: { base: 'marmore', rects: [{ x: 5, y: 0, w: 3, h: 13, t: 'tapete_real' }, { x: 4, y: 4, w: 5, h: 5, t: 'ouro' }] },
  objects: [
    { type: 'pilar', x: 2, y: 2 }, { type: 'pilar', x: 10, y: 2 }, { type: 'pilar', x: 2, y: 10 }, { type: 'pilar', x: 10, y: 10 },
    { type: 'trono', x: 6, y: 0 },
    { type: 'candelabro', x: 3, y: 0 }, { type: 'candelabro', x: 9, y: 0 },
    { type: 'estatua_estrela', x: 0, y: 6 }, { type: 'estatua_estrela', x: 12, y: 6 },
    { type: 'fonte', x: 10, y: 5 }, { type: 'vaso_planta', x: 0, y: 12 }, { type: 'vaso_planta', x: 12, y: 12 },
  ],
  npcs: [
    {
      id: 'rainha_estela', name: 'Rainha Estela', x: 7, y: 2, dir: 'front',
      look: { skin: 'pele4', hairStyle: 'cab_coque', hairColor: 'cor_preto', full: 'vest_longo_amarelo', shoes: 'sapatilha_dourada', hat: 'coroa_dourada', necklace: 'colar_perolas' },
      lines: ['Bem-vinda ao Castelo das Estrelas!', 'O Grande Baile espera pela estrela mais brilhante.'],
      missions: ['castelo_main', 'castelo_side'],
    },
    {
      id: 'principe_leo', name: 'Leo', x: 3, y: 7, dir: 'side', wander: true,
      look: { skin: 'pele2', hairStyle: 'cab_curtinho', hairColor: 'cor_loiro', top: 'blusa_manga_menta', bottom: 'calca_branca', shoes: 'boneca_branco', hat: 'coroa_prata' },
      lines: ['Que música bonita está tocando!', 'Todo mundo da cidade veio para o baile!'],
    },
  ],
  portals: [{ x: 6, y: 12, to: 'floresta', label: 'Floresta dos Cristais' }],
  minigame: { id: 'baile', x: 5, y: 5, obj: 'palco_baile' },
  spawn: [6, 11],
};
