import type { MapDef } from './types';

export const salao: MapDef = {
  id: 'salao', name: 'Salão de Beleza', order: 3,
  desc: 'Cadeiras fofinhas, espelhos brilhantes e penteados incríveis.',
  indoor: true, size: [11, 11], color: '#e4d6fa', bg: ['#f3e7ff', '#fde8f3'], unlockCoins: 400,
  wall: 'salao',
  wallObjects: [
    { type: 'espelho', side: 'L', i: 2 }, { type: 'espelho', side: 'L', i: 5 }, { type: 'espelho', side: 'L', i: 8 },
    { type: 'cartaz_moda', side: 'R', i: 2 }, { type: 'janela', side: 'R', i: 5 }, { type: 'prateleira', side: 'R', i: 8 },
  ],
  floor: { base: 'xadrez_rosa', rects: [{ x: 4, y: 4, w: 3, h: 3, t: 'marmore' }] },
  objects: [
    { type: 'cadeira_salao', x: 1, y: 2 }, { type: 'cadeira_salao', x: 1, y: 5 }, { type: 'cadeira_salao', x: 1, y: 8 },
    { type: 'lavatorio', x: 3, y: 0 }, { type: 'lavatorio', x: 5, y: 0 },
    { type: 'prateleira_produtos', x: 7, y: 0 }, { type: 'prateleira_produtos', x: 8, y: 0 },
    { type: 'vaso_planta', x: 0, y: 0 }, { type: 'vaso_planta', x: 10, y: 10 }, { type: 'vaso_planta', x: 0, y: 10 },
    { type: 'poltrona', x: 8, y: 9 }, { type: 'mesa_cafe', x: 9, y: 9 },
  ],
  npcs: [
    {
      id: 'carol_cabeleireira', name: 'Carol Cabeleireira', x: 6, y: 3, dir: 'front',
      look: { skin: 'pele4', hairStyle: 'cab_coques', hairColor: 'cor_rosa', top: 'blusa_manga_lilas', bottom: 'calca_branca', shoes: 'tenis_lilas', necklace: 'colar_estrela' },
      lines: ['Cabelo bonito é cabelo feliz!', 'Já experimentou cabelo azul sereia? Fica lindo!'],
      missions: ['salao_main', 'salao_side'],
    },
    {
      id: 'dona_rosa', name: 'Dona Rosa', x: 3, y: 8, dir: 'side', mirror: true,
      look: { skin: 'pele2', hairStyle: 'cab_chanel', hairColor: 'cor_lilas', full: 'vest_longo_amarelo', shoes: 'boneca_branco', glasses: 'oculos_redondo_rosa' },
      lines: ['Estou esperando minha vez de fazer um penteado!', 'Que vestido lindo, querida!'],
    },
  ],
  portals: [
    { x: 5, y: 10, to: 'shopping', label: 'Shopping Estrela' },
    { x: 10, y: 5, to: 'confeitaria', label: 'Confeitaria Doce Nuvem' },
  ],
  minigame: { id: 'penteado', x: 5, y: 5, obj: 'secador' },
  spawn: [5, 9],
};
