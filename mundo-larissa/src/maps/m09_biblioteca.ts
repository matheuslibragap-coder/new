import type { MapDef } from './types';

export const biblioteca: MapDef = {
  id: 'biblioteca', name: 'Biblioteca Encantada', order: 9,
  desc: 'Livros que brilham e histórias que parecem mágica.',
  indoor: true, size: [12, 12], color: '#c99d77', bg: ['#f3e6d8', '#fff8ee'], unlockCoins: 2800,
  wall: 'biblioteca',
  wallObjects: [{ type: 'janela_redonda', side: 'L', i: 6 }, { type: 'mapa_parede', side: 'R', i: 6 }],
  floor: { base: 'madeira_escura', rects: [{ x: 4, y: 4, w: 4, h: 4, t: 'tapete_real' }] },
  objects: [
    { type: 'estante', x: 0, y: 1 }, { type: 'estante', x: 0, y: 2 }, { type: 'estante', x: 0, y: 9 }, { type: 'estante', x: 0, y: 10 },
    { type: 'estante', x: 2, y: 0 }, { type: 'estante', x: 3, y: 0 }, { type: 'estante', x: 9, y: 0 }, { type: 'estante', x: 10, y: 0 },
    { type: 'mesa_leitura', x: 3, y: 9 }, { type: 'mesa_leitura', x: 8, y: 9 },
    { type: 'globo', x: 11, y: 2 }, { type: 'poltrona', x: 10, y: 4 }, { type: 'poltrona', x: 10, y: 6 },
    { type: 'vaso_planta', x: 11, y: 11 }, { type: 'candelabro', x: 0, y: 6 },
  ],
  npcs: [
    {
      id: 'biblio_iris', name: 'Bibliotecária Íris', x: 7, y: 2, dir: 'front',
      look: { skin: 'pele3', hairStyle: 'cab_chanel', hairColor: 'cor_preto', full: 'vest_babado_lilas', shoes: 'boneca_lilas', glasses: 'oculos_redondo_lilas', necklace: 'colar_perolas' },
      lines: ['Psiu… aqui os livros cochicham histórias.', 'Cada palavra é uma pequena magia.'],
      missions: ['biblioteca_main', 'biblioteca_side'],
    },
    {
      id: 'lia_leitora', name: 'Sofia', x: 4, y: 10, dir: 'back',
      look: { skin: 'pele1', hairStyle: 'cab_chiquinhas', hairColor: 'cor_loiro', top: 'blusa_amarela', bottom: 'saia_pregas_xadrez', shoes: 'sapatilha_azul', hat: 'laco_azul' },
      lines: ['Estou lendo a história de uma fada que perdeu a varinha!', 'Adoro livros com desenhos.'],
    },
  ],
  portals: [
    { x: 6, y: 11, to: 'danca', label: 'Escola de Dança' },
    { x: 11, y: 8, to: 'fazenda', label: 'Fazendinha Feliz' },
  ],
  minigame: { id: 'palavras', x: 5, y: 5, obj: 'livro_magico' },
  hidden: { mission: 'biblioteca_side', kind: 'livro', spots: [[1, 5], [9, 11], [11, 1]] },
  spawn: [6, 10],
};
