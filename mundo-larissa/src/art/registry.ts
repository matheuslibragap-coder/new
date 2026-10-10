import Phaser from 'phaser';
import { ART_SCALE } from '../config';
import { makeCanvas, type Ctx } from './draw';
import { PNG_OVERRIDES } from './overrides';

/** Descrição de um sprite: tamanho lógico, ponto de apoio (origem) e função de desenho. */
export interface ArtSpec {
  w: number;
  h: number;
  /** origem em pixels lógicos (ex.: pés do personagem, canto de baixo do móvel) */
  ox: number;
  oy: number;
  draw: (ctx: Ctx) => void;
}

export interface ArtResult {
  source: HTMLCanvasElement | HTMLImageElement;
  w: number;
  h: number;
  ox: number;
  oy: number;
}

type Family = (args: string[]) => ArtSpec | null;

const families = new Map<string, Family>();
const cache = new Map<string, ArtResult>();
const overrideImages = new Map<string, HTMLImageElement>();
const logKeys = typeof location !== 'undefined' && location.search.includes('chaves');
const seen = new Set<string>();

/** Registra uma família de sprites. A chave 'obj:arvore:2' chama a família 'obj' com ['arvore','2']. */
export function registerFamily(prefix: string, fam: Family) {
  families.set(prefix, fam);
}

export function specFor(key: string): ArtSpec | null {
  const [prefix, ...args] = key.split(':');
  const fam = families.get(prefix);
  if (!fam) return null;
  return fam(args);
}

/** Desenha (ou busca no cache) o sprite de uma chave. */
export function getArt(key: string): ArtResult {
  const c = cache.get(key);
  if (c) return c;
  if (logKeys && !seen.has(key)) {
    seen.add(key);
    console.log('[sprite]', key);
  }
  const spec = specFor(key);
  if (!spec) {
    console.warn('Sprite desconhecido:', key);
    const cv = makeCanvas(8, 8);
    const r = { source: cv, w: 4, h: 4, ox: 2, oy: 2 };
    cache.set(key, r);
    return r;
  }
  const ov = overrideImages.get(key);
  let res: ArtResult;
  if (ov) {
    res = { source: ov, w: spec.w, h: spec.h, ox: spec.ox, oy: spec.oy };
  } else {
    const cv = makeCanvas(spec.w * ART_SCALE, spec.h * ART_SCALE);
    const ctx = cv.getContext('2d')!;
    ctx.scale(ART_SCALE, ART_SCALE);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    spec.draw(ctx);
    res = { source: cv, w: spec.w, h: spec.h, ox: spec.ox, oy: spec.oy };
  }
  cache.set(key, res);
  return res;
}

/** Registra no cache um sprite já pronto (usado pela boneca composta). */
export function putArt(key: string, res: ArtResult) {
  cache.set(key, res);
}

export function hasOverride(key: string) {
  return overrideImages.has(key);
}

export function getOverride(key: string) {
  return overrideImages.get(key);
}

/** Carrega os PNGs de substituição antes do jogo começar. */
export async function loadOverrides(): Promise<void> {
  const entries = Object.entries(PNG_OVERRIDES);
  await Promise.all(
    entries.map(
      ([key, url]) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            overrideImages.set(key, img);
            resolve();
          };
          img.onerror = () => {
            console.warn('PNG não encontrado para', key, url);
            resolve();
          };
          img.src = url;
        }),
    ),
  );
}

/** Garante que a textura exista no Phaser e devolve a chave. */
export function ensureTex(scene: Phaser.Scene, key: string): string {
  if (!scene.textures.exists(key)) {
    const a = getArt(key);
    if (a.source instanceof HTMLCanvasElement) scene.textures.addCanvas(key, a.source);
    else scene.textures.addImage(key, a.source);
  }
  return key;
}

/** Cria uma imagem do Phaser já com origem e escala corretas. */
export function artImage(scene: Phaser.Scene, x: number, y: number, key: string): Phaser.GameObjects.Image {
  ensureTex(scene, key);
  const a = getArt(key);
  const img = scene.add.image(x, y, key);
  img.setOrigin(a.ox / a.w, a.oy / a.h);
  img.setScale(1 / ART_SCALE);
  return img;
}

/** Atualiza textura e origem de uma imagem existente. */
export function setArt(img: Phaser.GameObjects.Image, key: string) {
  ensureTex(img.scene, key);
  const a = getArt(key);
  img.setTexture(key);
  img.setOrigin(a.ox / a.w, a.oy / a.h);
}

/** Gera uma URL de imagem (para a interface em HTML), recortada e com tamanho máximo. */
const urlCache = new Map<string, string>();
export function artDataUrl(key: string, maxW = 96, maxH = 96, crop?: { x: number; y: number; w: number; h: number }): string {
  const ck = `${key}|${maxW}|${maxH}|${crop ? Object.values(crop).join(',') : ''}`;
  const hit = urlCache.get(ck);
  if (hit) return hit;
  const a = getArt(key);
  const sx = (crop?.x ?? 0) * ART_SCALE;
  const sy = (crop?.y ?? 0) * ART_SCALE;
  const sw = (crop?.w ?? a.w) * ART_SCALE;
  const sh = (crop?.h ?? a.h) * ART_SCALE;
  const k = Math.min((maxW * 2) / sw, (maxH * 2) / sh, 1);
  const cv = makeCanvas(sw * k, sh * k);
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(a.source, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
  const url = cv.toDataURL();
  urlCache.set(ck, url);
  return url;
}
