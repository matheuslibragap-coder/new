import { ART_SCALE } from '../../config';
import type { Outfit } from '../../core/state';
import { clothing, hairColorHex, skinHex } from '../../data/clothes';
import { makeCanvas } from '../draw';
import { getArt, putArt, registerFamily, type ArtResult } from '../registry';
import { drawBody } from './body';
import { COSTUME_FLAGS, drawCostume, type CostumePart } from './costumes';
import { drawHair } from './hair';
import { drawItem } from './items';
import { DOLL_H, DOLL_OX, DOLL_OY, DOLL_W, skeleton, type Dir } from './skeleton';

/**
 * Cada camada da boneca é um sprite independente com a chave:
 *   doll:body:<pele>:<semPernas>:<dir>:<quadro>
 *   doll:hairB:<penteado>:<cor>:<dir>      (cabelo de trás)
 *   doll:hairF:<penteado>:<cor>:<dir>      (franja)
 *   doll:item:<idDoItem>:<dir>:<quadro>
 *   doll:cost:<idDaFantasia>:<parte>:<dir>:<quadro>
 * Assim cada camada pode ser trocada por um PNG (veja src/art/overrides.ts).
 */
function dollSpec(draw: (ctx: CanvasRenderingContext2D) => void) {
  return { w: DOLL_W, h: DOLL_H, ox: DOLL_OX, oy: DOLL_OY, draw };
}

registerFamily('doll', (a) => {
  const kind = a[0];
  if (kind === 'body') {
    const [, skin, hide, dir, fr] = a;
    const S = skeleton(dir as Dir, Number(fr));
    return dollSpec((ctx) => drawBody(ctx, S, skinHex(skin), hide === '1'));
  }
  if (kind === 'hairB' || kind === 'hairF') {
    const [, style, color, dir] = a;
    const S = skeleton(dir as Dir, 0);
    const st = clothing(style)?.style ?? 'longo';
    return dollSpec((ctx) => drawHair(ctx, S, st, hairColorHex(color), kind === 'hairB' ? 'B' : 'F'));
  }
  if (kind === 'item') {
    const [, id, dir, fr] = a;
    const it = clothing(id);
    if (!it) return null;
    const S = skeleton(dir as Dir, Number(fr));
    return dollSpec((ctx) => drawItem(ctx, S, it));
  }
  if (kind === 'cost') {
    const [, id, part, dir, fr] = a;
    const it = clothing(id);
    if (!it) return null;
    const S = skeleton(dir as Dir, Number(fr));
    return dollSpec((ctx) => drawCostume(ctx, S, it, part as CostumePart));
  }
  return null;
});

/** Itens que só dependem da cabeça não mudam com o passo (economiza memória). */
const HEAD_SLOTS = new Set(['hat', 'glasses']);

/** Lista as chaves das camadas, na ordem certa de desenho, para uma direção e quadro. */
export function dollLayerKeys(o: Outfit, dir: Dir, frame: number): string[] {
  const costume = clothing(o.costume);
  const flags = costume ? COSTUME_FLAGS[costume.style] ?? {} : {};
  const item = (slot: keyof Outfit) => {
    const id = o[slot];
    if (!id) return null;
    if (costume && (slot === 'top' || slot === 'bottom' || slot === 'full' || slot === 'shoes')) return null;
    if (costume && slot === 'hat' && flags.hasHead) return null;
    const it = clothing(id);
    if (!it) return null;
    return `doll:item:${id}:${dir}:${HEAD_SLOTS.has(it.slot) ? 0 : frame}`;
  };
  const cost = (part: CostumePart) => {
    if (!costume) return null;
    if (part === 'head' && !flags.hasHead) return null;
    if (part === 'back' && !flags.hasBack) return null;
    return `doll:cost:${costume.id}:${part}:${dir}:${frame}`;
  };
  const body = `doll:body:${o.skin}:${flags.hideLegs ? 1 : 0}:${dir}:${frame}`;
  const hairB = `doll:hairB:${o.hairStyle}:${o.hairColor}:${dir}`;
  const hairF = `doll:hairF:${o.hairStyle}:${o.hairColor}:${dir}`;
  const order: (string | null)[] = dir === 'back'
    ? [body, item('bottom'), item('shoes'), item('top'), item('full'), cost('body'), hairB, hairF, item('glasses'), item('hat'), cost('head'), item('bag'), cost('back'), item('wings')]
    : [item('wings'), cost('back'), hairB, body, item('bottom'), item('shoes'), item('top'), item('full'), cost('body'), item('necklace'), hairF, item('glasses'), item('hat'), cost('head'), item('bag')];
  return order.filter((k): k is string => !!k);
}

export function outfitHash(o: Outfit): string {
  const s = JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k as keyof Outfit]]));
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Monta a boneca inteira (todas as camadas) num único sprite. */
export function dollComposite(o: Outfit, dir: Dir, frame: number): { key: string; art: ArtResult } {
  const key = `dollc:${outfitHash(o)}:${dir}:${frame}`;
  const keys = dollLayerKeys(o, dir, frame);
  const cv = makeCanvas(DOLL_W * ART_SCALE, DOLL_H * ART_SCALE);
  const ctx = cv.getContext('2d')!;
  for (const k of keys) {
    const a = getArt(k);
    ctx.drawImage(a.source, 0, 0, DOLL_W * ART_SCALE, DOLL_H * ART_SCALE);
  }
  const art: ArtResult = { source: cv, w: DOLL_W, h: DOLL_H, ox: DOLL_OX, oy: DOLL_OY };
  putArt(key, art);
  return { key, art };
}

/** Desenha a boneca num canvas qualquer (prévia do guarda-roupa, miniaturas). */
export function drawDollTo(ctx: CanvasRenderingContext2D, o: Outfit, dir: Dir, frame: number, x: number, y: number, scale: number, mirror = false) {
  const keys = dollLayerKeys(o, dir, frame);
  ctx.save();
  if (mirror) {
    ctx.translate(x + DOLL_W * scale, y);
    ctx.scale(-1, 1);
  } else ctx.translate(x, y);
  for (const k of keys) {
    const a = getArt(k);
    ctx.drawImage(a.source, 0, 0, DOLL_W * scale, DOLL_H * scale);
  }
  ctx.restore();
}
