import type { WallObjPlace } from '../maps/types';

/**
 * CASAS
 * floor/wall: piso e parede iniciais (ids de SURFACES em data/furniture.ts; viram seus ao comprar a casa).
 * door: tile da porta (saída). starter: móveis que já vêm na casa.
 */
export interface HouseDef {
  id: string;
  name: string;
  price: number;
  desc: string;
  size: [number, number];
  floor: string;
  wall: string;
  bg: [string, string];
  door: [number, number];
  windows: WallObjPlace[];
  starter: { id: string; x: number; y: number; flip?: boolean }[];
}

export const HOUSES: HouseDef[] = [
  {
    id: 'quartinho', name: 'Quartinho', price: 0, desc: 'Um cantinho simples e aconchegante para começar.',
    size: [6, 6], floor: 'piso_madeira', wall: 'parede_creme', bg: ['#fde8d8', '#fdf3e8'], door: [5, 3],
    windows: [{ type: 'janela', side: 'L', i: 2 }],
    starter: [{ id: 'cama_simples', x: 0, y: 3 }, { id: 'abajur', x: 0, y: 2 }],
  },
  {
    id: 'apto_rosa', name: 'Apartamento Rosa', price: 500, desc: 'Um apartamento cor-de-rosa com vista para a cidade.',
    size: [8, 8], floor: 'piso_xadrez', wall: 'parede_listras', bg: ['#fde3ef', '#fff4f9'], door: [7, 4],
    windows: [{ type: 'janela', side: 'L', i: 2 }, { type: 'janela', side: 'R', i: 4 }],
    starter: [{ id: 'cama_simples', x: 0, y: 5 }, { id: 'vaso_flor', x: 7, y: 0 }],
  },
  {
    id: 'casa_praia', name: 'Casa de Praia', price: 1000, desc: 'Brisa do mar, janelas redondas e chão de ladrilho.',
    size: [9, 9], floor: 'piso_ladrilho', wall: 'parede_bolinhas', bg: ['#cdeeff', '#fff6dc'], door: [8, 4],
    windows: [{ type: 'janela_redonda', side: 'L', i: 2 }, { type: 'janela_redonda', side: 'L', i: 6 }, { type: 'janela_redonda', side: 'R', i: 4 }],
    starter: [{ id: 'sofa_lilas', x: 3, y: 0 }, { id: 'samambaia', x: 0, y: 0 }],
  },
  {
    id: 'chale', name: 'Chalé na Floresta', price: 1600, desc: 'Madeira quentinha no meio das árvores.',
    size: [9, 9], floor: 'piso_madeira_escura', wall: 'parede_madeira', bg: ['#d9f2d4', '#f4fbe9'], door: [8, 4],
    windows: [{ type: 'janela', side: 'L', i: 3 }, { type: 'janela', side: 'R', i: 3 }, { type: 'janela', side: 'R', i: 6 }],
    starter: [{ id: 'poltrona_rosa', x: 0, y: 0 }, { id: 'arvorezinha', x: 8, y: 0 }],
  },
  {
    id: 'casa_arvore', name: 'Casa na Árvore', price: 2400, desc: 'Lá no alto, pertinho dos passarinhos!',
    size: [8, 10], floor: 'piso_madeira', wall: 'parede_flores', bg: ['#c9f0c4', '#eafbe2'], door: [7, 5],
    windows: [{ type: 'janela_redonda', side: 'L', i: 3 }, { type: 'janela_redonda', side: 'L', i: 7 }, { type: 'janela', side: 'R', i: 4 }],
    starter: [{ id: 'pufe', x: 1, y: 1 }, { id: 'girassois', x: 0, y: 9 }],
  },
  {
    id: 'castelo_nuvens', name: 'Castelo das Nuvens', price: 4000, desc: 'Um castelo de verdade, flutuando no céu!',
    size: [12, 12], floor: 'piso_nuvem', wall: 'parede_castelo', bg: ['#d9d0f6', '#fde8f3'], door: [11, 6],
    windows: [{ type: 'vitral', side: 'L', i: 3 }, { type: 'vitral', side: 'L', i: 8 }, { type: 'vitral', side: 'R', i: 3 }, { type: 'vitral', side: 'R', i: 8 }],
    starter: [{ id: 'cama_dossel', x: 0, y: 0 }, { id: 'luminaria_estrela', x: 2, y: 0 }],
  },
];

export const HOUSE_BY_ID: Record<string, HouseDef> = Object.fromEntries(HOUSES.map((h) => [h.id, h]));
