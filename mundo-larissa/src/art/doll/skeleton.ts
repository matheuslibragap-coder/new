/**
 * Esqueleto da boneca: posições de cabeça, tronco, braços e pernas para cada direção e quadro
 * de animação. Todas as camadas (corpo, roupas, cabelo…) usam estes pontos, então tudo fica
 * sempre alinhado em qualquer direção.
 *
 * Canvas lógico: 64 x 104, ponto de apoio nos pés (32, 100).
 * Direções: 'front' (frente), 'back' (costas), 'side' (lado direito; o esquerdo é espelhado).
 * Quadros: 0 = parada, 1 e 2 = passos da caminhada.
 */
export type Dir = 'front' | 'back' | 'side';
export const DIRS: Dir[] = ['front', 'back', 'side'];
export const DOLL_W = 64;
export const DOLL_H = 104;
export const DOLL_OX = 32;
export const DOLL_OY = 100;

export interface Limb {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
}

export interface Skel {
  dir: Dir;
  frame: number;
  hx: number;
  hy: number;
  hr: number;
  neckY: number;
  sh: { l: number; r: number; y: number };
  waist: { l: number; r: number; y: number };
  hip: { l: number; r: number; y: number };
  arms: Limb[];
  legs: Limb[];
  /** pés: posição do calcanhar/centro e para onde apontam (0 frente, 1 direita) */
  feet: { x: number; y: number; face: number }[];
}

const LEG_W = 6.6;
const ARM_W = 4.8;

export function skeleton(dir: Dir, frame: number): Skel {
  const lift = (i: number) => (frame === 1 && i === 0) || (frame === 2 && i === 1) ? 2.5 : 0;
  if (dir === 'side') {
    const swing = frame === 0 ? 0 : frame === 1 ? 1 : -1;
    const legs: Limb[] = [
      { x1: 31, y1: 71, x2: 31 - swing * 5 - 0.5, y2: 93 - (swing ? 1 : 0), w: LEG_W },
      { x1: 33, y1: 71, x2: 33 + swing * 5 + 0.5, y2: 93 - (swing ? 1 : 0), w: LEG_W },
    ];
    return {
      dir, frame,
      hx: 32, hy: 34, hr: 16.5,
      neckY: 50,
      sh: { l: 26, r: 38, y: 52 },
      waist: { l: 27, r: 37, y: 64 },
      hip: { l: 26.5, r: 37.5, y: 71 },
      arms: [{ x1: 32, y1: 54.5, x2: 32 + swing * 4 + 0.5, y2: 69, w: ARM_W }],
      legs,
      feet: legs.map((l) => ({ x: l.x2 + 1, y: l.y2 + 2.5, face: 1 })),
    };
  }
  const legs: Limb[] = [
    { x1: 28.4, y1: 71, x2: 28.4, y2: 93 - lift(0), w: LEG_W },
    { x1: 35.6, y1: 71, x2: 35.6, y2: 93 - lift(1), w: LEG_W },
  ];
  return {
    dir, frame,
    hx: 32, hy: 34, hr: 16.5,
    neckY: 50,
    sh: { l: 22.5, r: 41.5, y: 52 },
    waist: { l: 25, r: 39, y: 64 },
    hip: { l: 24, r: 40, y: 71 },
    arms: [
      { x1: 22.2, y1: 54.5, x2: 19.6, y2: 69, w: ARM_W },
      { x1: 41.8, y1: 54.5, x2: 44.4, y2: 69, w: ARM_W },
    ],
    legs,
    feet: legs.map((l) => ({ x: l.x2, y: l.y2 + 2.5, face: 0 })),
  };
}

/** Ponto ao longo de um membro (t=0 no ombro/quadril, t=1 na mão/tornozelo). */
export function along(l: Limb, t: number): [number, number] {
  return [l.x1 + (l.x2 - l.x1) * t, l.y1 + (l.y2 - l.y1) * t];
}
