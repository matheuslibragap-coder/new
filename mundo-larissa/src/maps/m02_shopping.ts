import type { MapDef } from './types';

export const shopping: MapDef = {
  id: 'shopping',
  name: 'Shopping Estrela',
  order: 2,
  desc: 'Lojas de roupas cheias de brilho e uma passarela de desfile.',
  indoor: true,
  size: [12, 12],
  color: '#c7a8f0',
  bg: ['#f3e6ff', '#fde8f3'],
  unlockCoins: 150,
  wall: 'loja',
  wallObjects: [
    { type: 'cartaz_moda', side: 'L', i: 2 }, { type: 'janela', side: 'L', i: 5 }, { type: 'coracao_neon', side: 'L', i: 8 },
    { type: 'cartaz_moda', side: 'R', i: 3 }, { type: 'janela', side: 'R', i: 6 }, { type: 'estrelas', side: 'R', i: 9 },
  ],
  floor: {
    base: 'marmore',
    rects: [
      { x: 4, y: 4, w: 4, h: 4, t: 'xadrez_rosa' },
      { x: 5, y: 8, w: 2, h: 4, t: 'tapete_real' },
    ],
  },
  objects: [
    { type: 'arara', x: 1, y: 1 }, { type: 'arara', x: 1, y: 4, flip: true },
    { type: 'manequim', x: 4, y: 1 }, { type: 'manequim', x: 6, y: 1 },
    { type: 'prateleira_bolsas', x: 0, y: 8 }, { type: 'prateleira_bolsas', x: 0, y: 9 },
    { type: 'balcao', x: 8, y: 1 },
    { type: 'espelho_pe', x: 10, y: 1 },
    { type: 'vaso_planta', x: 0, y: 11 }, { type: 'vaso_planta', x: 11, y: 0 }, { type: 'vaso_planta', x: 11, y: 11 },
    { type: 'arara', x: 9, y: 9, flip: true },
    { type: 'luzinhas', x: 3, y: 0 },
  ],
  npcs: [
    {
      id: 'mel_lojista', name: 'Mel (Loja)', x: 9, y: 3, dir: 'front', shop: 'roupas',
      look: { skin: 'pele4', hairStyle: 'cab_cacheado', hairColor: 'cor_preto', top: 'blusa_rosa', bottom: 'saia_pregas_lilas', shoes: 'boneca_lilas', necklace: 'colar_coracao' },
      lines: ['Bem-vinda à Loja Estrela! Quer ver roupas novas?'],
    },
    {
      id: 'duda_estilista', name: 'Duda Estilista', x: 7, y: 9, dir: 'front',
      look: { skin: 'pele1', hairStyle: 'cab_chanel', hairColor: 'cor_rosa', full: 'mac_lilas', shoes: 'bota_cano_lilas', glasses: 'oculos_estrela_dourado' },
      lines: ['Moda é se divertir com as cores!', 'A passarela está sempre pronta para você.'],
      missions: ['shopping_main', 'shopping_side'],
    },
    {
      id: 'nina', name: 'Nina', x: 3, y: 7, dir: 'side', wander: true,
      look: { skin: 'pele3', hairStyle: 'cab_trancas', hairColor: 'cor_ruivo', top: 'cam_arcoiris', bottom: 'legging_menta', shoes: 'tenis_amarelo', hat: 'tiara_flores_rosa' },
      lines: ['Eu amo esse shopping!', 'Já viu as asas de fada na loja? São lindas!'],
    },
  ],
  portals: [
    { x: 6, y: 11, to: 'praca', label: 'Praça Central' },
    { x: 11, y: 6, to: 'salao', label: 'Salão de Beleza' },
  ],
  minigame: { id: 'desfile', x: 4, y: 4, obj: 'passarela' },
  spawn: [6, 10],
};
