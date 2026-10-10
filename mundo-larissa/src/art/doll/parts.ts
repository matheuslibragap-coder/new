import { darken, ellPath, fs, lighten, outlineOf, patternFill, type Ctx, type Pattern } from '../draw';
import { along, type Limb, type Skel } from './skeleton';

/** Caminho de um membro (braço/perna) entre t0 e t1, com pontas arredondadas. */
export function limbPath(ctx: Ctx, l: Limb, t0: number, t1: number, w: number, roundStart = true) {
  const [x0, y0] = along(l, t0);
  const [x1, y1] = along(l, t1);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (w / 2);
  const ny = (dx / len) * (w / 2);
  const ang = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(x0 + nx, y0 + ny);
  ctx.lineTo(x1 + nx, y1 + ny);
  ctx.arc(x1, y1, w / 2, ang + Math.PI / 2, ang - Math.PI / 2, true);
  ctx.lineTo(x0 - nx, y0 - ny);
  if (roundStart) ctx.arc(x0, y0, w / 2, ang - Math.PI / 2, ang + Math.PI / 2, true);
  ctx.closePath();
}

export function fillLimb(ctx: Ctx, l: Limb, t0: number, t1: number, w: number, color: string, pat?: Pattern, patColor?: string) {
  limbPath(ctx, l, t0, t1, w);
  fs(ctx, color, undefined, 1);
  if (pat && pat !== 'none') {
    limbPath(ctx, l, t0, t1, w);
    patternFill(ctx, pat, patColor ?? '#ffffff', Math.min(l.x1, l.x2) - w, l.y1 - 2, w * 3, l.y2 - l.y1 + 6, 0.8);
  }
}

/** Caminho do tronco, do ombro até `bottom`. `neck` define o decote. */
export function torsoPath(ctx: Ctx, S: Skel, bottom = S.hip.y, flare = 0, neck: 'round' | 'scoop' | 'high' = 'round') {
  const { sh, waist, hip } = S;
  const cx = (sh.l + sh.r) / 2;
  const top = sh.y - 1.5;
  ctx.beginPath();
  ctx.moveTo(sh.l + 2, top);
  ctx.quadraticCurveTo(sh.l - 0.6, top + 0.5, sh.l - 0.4, sh.y + 3);
  ctx.lineTo(waist.l, waist.y);
  if (bottom > waist.y) {
    const t = Math.min(1, (bottom - waist.y) / (hip.y - waist.y));
    ctx.lineTo(waist.l + (hip.l - waist.l) * t - flare, bottom);
    ctx.lineTo(waist.r + (hip.r - waist.r) * t + flare, bottom);
  } else {
    ctx.lineTo(waist.l, bottom);
    ctx.lineTo(waist.r, bottom);
  }
  ctx.lineTo(waist.r, waist.y);
  ctx.lineTo(sh.r + 0.4, sh.y + 3);
  ctx.quadraticCurveTo(sh.r + 0.6, top + 0.5, sh.r - 2, top);
  if (S.dir === 'front') {
    const depth = neck === 'scoop' ? 7 : neck === 'round' ? 3.2 : 1;
    ctx.quadraticCurveTo(cx, top + depth * 2, sh.l + 2, top);
  } else if (S.dir === 'side') {
    const depth = neck === 'scoop' ? 4 : neck === 'round' ? 2 : 0.5;
    ctx.quadraticCurveTo(cx + 3, top + depth * 2, sh.l + 2, top);
  }
  ctx.closePath();
}

export function torso(ctx: Ctx, S: Skel, color: string, opt: { bottom?: number; flare?: number; neck?: 'round' | 'scoop' | 'high'; pat?: Pattern; patColor?: string } = {}) {
  torsoPath(ctx, S, opt.bottom ?? S.hip.y, opt.flare ?? 0, opt.neck ?? 'round');
  const g = ctx.createLinearGradient(S.sh.l, 0, S.sh.r, 0);
  g.addColorStop(0, lighten(color, 0.12));
  g.addColorStop(1, darken(color, 0.06));
  fs(ctx, g, outlineOf(color), 1);
  if (opt.pat && opt.pat !== 'none') {
    torsoPath(ctx, S, opt.bottom ?? S.hip.y, opt.flare ?? 0, opt.neck ?? 'round');
    patternFill(ctx, opt.pat, opt.patColor ?? '#ffffff', S.sh.l - 4, S.sh.y - 2, S.sh.r - S.sh.l + 8, 30, 0.9);
  }
}

/** Mangas: fração `len` do braço (0.3 = curtinha, 0.9 = comprida). */
export function sleeves(ctx: Ctx, S: Skel, color: string, len: number, extra = 2.2, pat?: Pattern, patColor?: string) {
  for (const a of S.arms) fillLimb(ctx, a, 0, len, a.w + extra, color, pat, patColor);
}

export function puffSleeves(ctx: Ctx, S: Skel, color: string) {
  for (const a of S.arms) {
    const [x, y] = along(a, 0.16);
    ellPath(ctx, x, y, 4.2, 4);
    fs(ctx, lighten(color, 0.08), outlineOf(color), 1);
  }
}

/** Bloco do quadril (une as duas pernas da calça/short). */
export function hipBlock(ctx: Ctx, S: Skel, color: string, bottom = S.hip.y + 5) {
  const { hip, waist } = S;
  ctx.beginPath();
  ctx.moveTo(waist.l - 0.3, waist.y + 1);
  ctx.lineTo(waist.r + 0.3, waist.y + 1);
  ctx.lineTo(hip.r + 0.2, hip.y);
  ctx.lineTo(hip.r - 1, bottom);
  ctx.lineTo(hip.l + 1, bottom);
  ctx.lineTo(hip.l - 0.2, hip.y);
  ctx.closePath();
  fs(ctx, color, outlineOf(color), 1);
}

export function legsCover(ctx: Ctx, S: Skel, color: string, t1: number, extra = 1.6, pat?: Pattern, patColor?: string) {
  for (const l of S.legs) fillLimb(ctx, { ...l, y1: l.y1 - 3 }, 0, t1, l.w + extra, color, pat, patColor);
  hipBlock(ctx, S, color);
  if (pat && pat !== 'none') {
    ctx.beginPath();
    ctx.rect(S.hip.l, S.waist.y + 1, S.hip.r - S.hip.l, S.hip.y + 5 - S.waist.y);
    patternFill(ctx, pat, patColor ?? '#fff', S.hip.l, S.waist.y, S.hip.r - S.hip.l, 12, 0.8);
  }
}

/** Saia do `top` (cintura) até `bottom`, abrindo `flare` px para cada lado. */
export function skirtPath(ctx: Ctx, S: Skel, top: number, bottom: number, flare: number, hem: 'curve' | 'scallop' | 'petal' = 'curve') {
  const { waist, hip } = S;
  const side = S.dir === 'side';
  const l0 = waist.l - 0.6;
  const r0 = waist.r + 0.6;
  const l1 = hip.l - flare - (side ? 1.5 : 0);
  const r1 = hip.r + flare + (side ? 0.5 : 0);
  ctx.beginPath();
  ctx.moveTo(l0, top);
  ctx.lineTo(r0, top);
  ctx.quadraticCurveTo(r1 - 1, (top + bottom) / 2, r1, bottom);
  if (hem === 'curve') {
    ctx.quadraticCurveTo((l1 + r1) / 2, bottom + 3, l1, bottom);
  } else {
    const n = hem === 'petal' ? 5 : 6;
    const w = (r1 - l1) / n;
    for (let i = 0; i < n; i++) {
      const x0 = r1 - i * w;
      const x1 = r1 - (i + 1) * w;
      if (hem === 'petal') {
        ctx.lineTo((x0 + x1) / 2, bottom + 4.5);
        ctx.lineTo(x1, bottom);
      } else {
        ctx.quadraticCurveTo((x0 + x1) / 2, bottom + 4.5, x1, bottom);
      }
    }
  }
  ctx.quadraticCurveTo(l1 + 1, (top + bottom) / 2, l0, top);
  ctx.closePath();
}

export function skirt(ctx: Ctx, S: Skel, color: string, top: number, bottom: number, flare: number, opt: { hem?: 'curve' | 'scallop' | 'petal'; pat?: Pattern; patColor?: string } = {}) {
  skirtPath(ctx, S, top, bottom, flare, opt.hem);
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, darken(color, 0.04));
  g.addColorStop(1, lighten(color, 0.1));
  fs(ctx, g, outlineOf(color), 1);
  if (opt.pat && opt.pat !== 'none') {
    skirtPath(ctx, S, top, bottom, flare, opt.hem);
    patternFill(ctx, opt.pat, opt.patColor ?? '#fff', S.hip.l - flare - 3, top, S.hip.r - S.hip.l + flare * 2 + 6, bottom - top + 5, 1);
  }
  // dobrinhas
  ctx.strokeStyle = 'rgba(74,54,87,0.13)';
  ctx.lineWidth = 0.8;
  const cx = (S.waist.l + S.waist.r) / 2;
  for (const k of S.dir === 'side' ? [-0.3, 0.3] : [-0.55, 0, 0.55]) {
    ctx.beginPath();
    ctx.moveTo(cx + k * 5, top + 3);
    ctx.lineTo(cx + k * (flare + 9), bottom - 1);
    ctx.stroke();
  }
}
