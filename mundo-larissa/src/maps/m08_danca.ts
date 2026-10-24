import type { MapDef } from './types';

export const danca: MapDef = {
  id: 'danca', name: 'Escola de Dança', order: 8,
  desc: 'Espelhos, música e uma pista que acende no ritmo.',
  indoor: true, size: [12, 12], color: '#f7a8c8', bg: ['#fde6f3', '#e6e0fb'], unlockCoins: 2300,
  wall: 'danca',
  wallObjects: [{ type: 'estrelas', side: 'R', i: 10 }, { type: 'coracao_neon', side: 'L', i: 10 }],
  floor: { base: 'palco', rects: [{ x: 3, y: 3, w: 6, h: 6, t: 'danca' }] },
  objects: [
    { type: 'caixa_som', x: 0, y: 0 }, { type: 'caixa_som', x: 11, y: 0 }, { type: 'caixa_som', x: 0, y: 11 },
    { type: 'barra_bale', x: 2, y: 0 }, { type: 'barra_bale', x: 6, y: 0 },
    { type: 'banco', x: 10, y: 10 }, { type: 'vaso_planta', x: 11, y: 11 },
    { type: 'luzinhas', x: 4, y: 0 }, { type: 'luzinhas', x: 0, y: 5 },
  ],
  npcs: [
    {
      id: 'prof_lia', name: 'Professora Lia', x: 2, y: 5, dir: 'front',
      look: { skin: 'pele2', hairStyle: 'cab_coque', hairColor: 'cor_ruivo', top: 'blusa_branca', bottom: 'saia_tutu_rosa', shoes: 'sapatilha_rosa', hat: 'tiara_perola' },
      lines: ['Um, dois, três… e gira!', 'Dançar é sorrir com o corpo todo.'],
      missions: ['danca_main', 'danca_side'],
    },
    {
      id: 'davi', name: 'Davi', x: 9, y: 4, dir: 'side', mirror: true, wander: true,
      look: { skin: 'pele4', hairStyle: 'cab_curtinho', hairColor: 'cor_preto', top: 'cam_arcoiris', bottom: 'calca_jeans', shoes: 'tenis_amarelo' },
      lines: ['Eu treino passinhos todo dia!', 'Quando a seta chegar no círculo, aperta!'],
    },
  ],
  portals: [
    { x: 6, y: 11, to: 'praia', label: 'Praia Coral' },
    { x: 11, y: 6, to: 'biblioteca', label: 'Biblioteca Encantada' },
  ],
  minigame: { id: 'danca', x: 5, y: 5, obj: 'pista_luz' },
  spawn: [6, 10],
};
