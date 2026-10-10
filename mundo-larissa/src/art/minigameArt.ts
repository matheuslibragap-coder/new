import type { Ctx } from './draw';
import { registerFamily, type ArtSpec } from './registry';

/**
 * Sprites dos mini games. Cada mini game registra os seus com `mgArt(...)`.
 * Chave no jogo: 'mg:<nome>' (pode ser trocada por PNG em overrides.ts).
 */
const MG = new Map<string, ArtSpec>();

export function mgArt(name: string, w: number, h: number, draw: (ctx: Ctx) => void, ox = w / 2, oy = h / 2) {
  MG.set(name, { w, h, ox, oy, draw });
  return `mg:${name}`;
}

registerFamily('mg', ([name]) => MG.get(name) ?? null);
