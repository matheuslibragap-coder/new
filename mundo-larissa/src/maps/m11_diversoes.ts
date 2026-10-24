import type { MapDef } from './types';

export const diversoes: MapDef = {
  id: 'diversoes', name: 'Parque de Diversões', order: 11,
  desc: 'Roda-gigante, carrossel, algodão-doce e brincadeiras.',
  indoor: false, size: [15, 15], color: '#ff8f87', bg: ['#d5ecfc', '#fde8f3'], unlockCoins: 4000,
  floor: {
    base: 'pedra',
    rects: [{ x: 0, y: 0, w: 15, h: 2, t: 'grama' }, { x: 0, y: 13, w: 15, h: 2, t: 'grama' }, { x: 6, y: 2, w: 3, h: 11, t: 'caminho' }],
  },
  objects: [
    { type: 'roda_gigante', x: 2, y: 2 }, { type: 'carrossel', x: 10, y: 2 },
    { type: 'barraca_pipoca', x: 2, y: 8 }, { type: 'algodao_doce', x: 12, y: 7 },
    { type: 'baloes', x: 5, y: 4 }, { type: 'baloes', x: 9, y: 11 },
    { type: 'banco', x: 4, y: 11 }, { type: 'banco', x: 11, y: 11 },
    { type: 'poste', x: 5, y: 7 }, { type: 'poste', x: 9, y: 7 },
    { type: 'arvore', x: 0, y: 0 }, { type: 'arvore_rosa', x: 14, y: 0 }, { type: 'arvore', x: 0, y: 14 }, { type: 'arvore_rosa', x: 14, y: 14 },
    { type: 'luzinhas', x: 7, y: 2 },
  ],
  npcs: [
    {
      id: 'palhaca_lola', name: 'Lola Animadora', x: 8, y: 9, dir: 'front',
      look: { skin: 'pele2', hairStyle: 'cab_cacheado', hairColor: 'cor_rosa', full: 'mac_rosa', shoes: 'tenis_brilho', hat: 'chapeu_festa_azul', glasses: 'oculos_estrela_dourado' },
      lines: ['Bem-vinda ao parque mais divertido da cidade!', 'Já andou no carrossel? Ele gira, gira, gira!'],
      missions: ['diversoes_main', 'diversoes_side'],
    },
    {
      id: 'gabi', name: 'Gabi', x: 4, y: 6, dir: 'side', wander: true,
      look: { skin: 'pele5', hairStyle: 'cab_coques', hairColor: 'cor_preto', top: 'cam_coracao', bottom: 'saia_rodada_azul', shoes: 'tenis_rosa', bag: 'mochila_azul' },
      lines: ['Eu quero um algodão-doce lilás!', 'A roda-gigante é tão alta!'],
    },
  ],
  portals: [
    { x: 0, y: 7, to: 'fazenda', label: 'Fazendinha Feliz' },
    { x: 14, y: 10, to: 'gelo', label: 'Pista de Gelo' },
  ],
  minigame: { id: 'argolas', x: 10, y: 5, obj: 'barraca_argolas' },
  spawn: [2, 6],
};
