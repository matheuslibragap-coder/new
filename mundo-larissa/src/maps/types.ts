import type { Dir } from '../art/doll/skeleton';
import type { Outfit } from '../core/state';

/**
 * FORMATO DE UM MAPA
 * Coordenadas em tiles: x cresce para baixo-direita, y para baixo-esquerda.
 * (0,0) é o canto de cima. Paredes (mapas internos) ficam nas bordas x=0 e y=0.
 */
export interface ObjPlace {
  type: string; // nome em src/art/objects.ts
  x: number;
  y: number;
  flip?: boolean;
}

export interface WallObjPlace {
  type: string; // nome em src/art/wallArt.ts
  side: 'L' | 'R'; // L = parede da esquerda (x=0), R = parede da direita (y=0)
  i: number; // posição ao longo da parede
}

export interface NpcDef {
  id: string;
  name: string;
  /** Roupa (personagem humano) ou nome de objeto animal (ex.: 'gatinho'). */
  look?: Partial<Outfit>;
  animal?: string;
  x: number;
  y: number;
  dir?: Dir;
  mirror?: boolean;
  /** Falas quando não há missão. */
  lines: string[];
  /** Missões que este personagem oferece, em ordem. */
  missions?: string[];
  wander?: boolean;
  /** Abre uma loja ao conversar. */
  shop?: 'roupas' | 'moveis' | 'casas';
}

export interface PortalDef {
  x: number;
  y: number;
  to: string; // id do mapa de destino ('casa' = casa atual)
  label?: string;
}

export interface FloorRect {
  x: number;
  y: number;
  w: number;
  h: number;
  t: string; // tipo de piso (src/art/tiles.ts)
}

export interface MapDef {
  id: string;
  name: string;
  order: number;
  desc: string;
  indoor: boolean;
  size: [number, number];
  floor: { base: string; rects?: FloorRect[]; holes?: [number, number][] };
  wall?: string;
  wallObjects?: WallObjPlace[];
  objects: ObjPlace[];
  npcs: NpcDef[];
  portals: PortalDef[];
  minigame?: { id: string; x: number; y: number; obj: string };
  spawn: [number, number];
  bg: [string, string];
  /** Total de moedas ganhas que também libera este mapa (alternativa à missão anterior). */
  unlockCoins: number;
  /** Itens escondidos (para missões de "encontrar"). */
  hidden?: { mission: string; spots: [number, number][]; kind: string };
  /** Cor/ícone no Mapa da Cidade */
  color: string;
}
