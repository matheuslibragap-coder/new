import { TILE_H, TILE_W } from '../config';

export const HW = TILE_W / 2;
export const HH = TILE_H / 2;

/** Centro do tile (x, y) na tela (coordenadas do mundo). */
export function tileToWorld(x: number, y: number): { x: number; y: number } {
  return { x: (x - y) * HW, y: (x + y) * HH };
}

/** Ponto da tela → tile (fracionário). Use Math.round para pegar o tile. */
export function worldToTile(wx: number, wy: number): { x: number; y: number } {
  const a = wx / HW;
  const b = wy / HH;
  return { x: (a + b) / 2, y: (b - a) / 2 };
}

/** Profundidade de desenho: quem está mais "para baixo" na tela aparece na frente. */
export function depthAt(x: number, y: number): number {
  return (x + y) * HH;
}
