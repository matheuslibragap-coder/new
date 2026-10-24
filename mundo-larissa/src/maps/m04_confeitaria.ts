import type { MapDef } from './types';

export const confeitaria: MapDef = {
  id: 'confeitaria', name: 'Confeitaria Doce Nuvem', order: 4,
  desc: 'Bolos, cupcakes e cheirinho de bolo saindo do forno.',
  indoor: true, size: [12, 11], color: '#ffc29f', bg: ['#fff4e0', '#fde8f3'], unlockCoins: 700,
  wall: 'confeitaria',
  wallObjects: [
    { type: 'cartaz_bolo', side: 'L', i: 2 }, { type: 'janela', side: 'L', i: 5 }, { type: 'relogio', side: 'L', i: 8 },
    { type: 'prateleira', side: 'R', i: 3 }, { type: 'janela', side: 'R', i: 6 }, { type: 'cartaz_bolo', side: 'R', i: 9 },
  ],
  floor: { base: 'ladrilho', rects: [{ x: 0, y: 0, w: 12, h: 3, t: 'madeira' }] },
  objects: [
    { type: 'vitrine_bolos', x: 2, y: 2 }, { type: 'vitrine_bolos', x: 5, y: 2 },
    { type: 'forno', x: 0, y: 0 }, { type: 'forno', x: 1, y: 0 },
    { type: 'mesa_cafe', x: 3, y: 6 }, { type: 'cadeira', x: 2, y: 6 }, { type: 'cadeira', x: 3, y: 7, flip: true },
    { type: 'mesa_cafe', x: 7, y: 7 }, { type: 'cadeira_azul', x: 6, y: 7 }, { type: 'cadeira_azul', x: 7, y: 8, flip: true },
    { type: 'vaso_planta', x: 11, y: 0 }, { type: 'vaso_planta', x: 0, y: 10 },
    { type: 'caixote', x: 10, y: 1 }, { type: 'luzinhas', x: 6, y: 0 },
  ],
  npcs: [
    {
      id: 'chef_lu', name: 'Chef Lu', x: 4, y: 1, dir: 'front',
      look: { skin: 'pele3', hairStyle: 'cab_coque', hairColor: 'cor_preto', top: 'blusa_branca', bottom: 'calca_rosa', shoes: 'sapatilha_rosa', hat: 'chapeu_festa_rosa' },
      lines: ['Hoje o bolo de morango está especial!', 'Um bom bolo começa com carinho.'],
      missions: ['confeitaria_main', 'confeitaria_side'],
    },
    {
      id: 'pedro', name: 'Pedro', x: 8, y: 5, dir: 'side', wander: true,
      look: { skin: 'pele1', hairStyle: 'cab_curtinho', hairColor: 'cor_ruivo', top: 'cam_lua', bottom: 'short_jeans', shoes: 'tenis_menta', hat: 'bone_menta' },
      lines: ['Eu vim comprar cupcake de mirtilo!', 'Hummm, que cheiro bom!'],
    },
  ],
  portals: [
    { x: 6, y: 10, to: 'salao', label: 'Salão de Beleza' },
    { x: 11, y: 6, to: 'parque', label: 'Parque das Flores' },
  ],
  minigame: { id: 'bolo', x: 9, y: 3, obj: 'bolo_gigante' },
  spawn: [6, 9],
};
