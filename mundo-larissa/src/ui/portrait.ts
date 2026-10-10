import { drawDollTo } from '../art/doll/compose';
import { DOLL_H, DOLL_W, type Dir } from '../art/doll/skeleton';
import { getArt } from '../art/registry';
import type { Outfit } from '../core/state';
import { makeCanvas } from '../art/draw';

/** Canvas com a boneca desenhada (retratos, prévias). */
export function dollCanvas(o: Outfit, cssW: number, cssH: number, dir: Dir = 'front', mirror = false, crop?: { y: number; h: number }): HTMLCanvasElement {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cv = makeCanvas(cssW * dpr, cssH * dpr);
  cv.style.width = `${cssW}px`;
  cv.style.height = `${cssH}px`;
  const ctx = cv.getContext('2d')!;
  const cy = crop?.y ?? 0;
  const ch = crop?.h ?? DOLL_H;
  const s = Math.min((cssW * dpr) / DOLL_W, (cssH * dpr) / ch);
  const x = (cssW * dpr - DOLL_W * s) / 2;
  drawDollTo(ctx, o, dir, 0, x, -cy * s + (cssH * dpr - ch * s) / 2, s, mirror);
  return cv;
}

export function artCanvas(key: string, cssW: number, cssH: number): HTMLCanvasElement {
  const a = getArt(key);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cv = makeCanvas(cssW * dpr, cssH * dpr);
  cv.style.width = `${cssW}px`;
  cv.style.height = `${cssH}px`;
  const ctx = cv.getContext('2d')!;
  const s = Math.min((cssW * dpr) / a.source.width, (cssH * dpr) / a.source.height);
  ctx.drawImage(a.source, (cv.width - a.source.width * s) / 2, (cv.height - a.source.height * s) / 2, a.source.width * s, a.source.height * s);
  return cv;
}
