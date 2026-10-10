import { ellPath, fs, mix, outlineOf, rgba, type Ctx } from '../draw';
import { P } from '../palette';
import { fillLimb, limbPath, torso } from './parts';
import type { Skel } from './skeleton';

const COLLANT = '#f1ebfa';

/** Corpo base: pele, rosto e um collant clarinho por baixo das roupas. */
export function drawBody(ctx: Ctx, S: Skel, skin: string, hideLegs: boolean) {
  const out = outlineOf(skin);
  // pernas e pés
  if (!hideLegs) {
    for (const l of S.legs) fillLimb(ctx, l, 0, 1, l.w, skin);
    for (const f of S.feet) {
      ellPath(ctx, f.x + (f.face ? 1 : 0), f.y - 1, f.face ? 4 : 3.2, 2.2);
      fs(ctx, skin, out, 1);
    }
  }
  // braços (na frente/costas ficam atrás do tronco)
  const drawArms = () => {
    for (const a of S.arms) {
      fillLimb(ctx, a, 0, 1, a.w, skin);
      ellPath(ctx, a.x2, a.y2 + 0.5, 2.9, 2.9);
      fs(ctx, skin, out, 1);
    }
  };
  if (S.dir !== 'side') drawArms();
  // pescoço
  ctx.beginPath();
  ctx.rect(S.hx - 2.8, S.neckY - 3, 5.6, 6);
  fs(ctx, mix(skin, '#000000', 0.06), out, 1);
  // tronco: pele + collant
  torso(ctx, S, skin, { neck: 'high' });
  if (!hideLegs) {
    torso(ctx, S, COLLANT, { neck: 'scoop', bottom: S.hip.y + 1 });
    for (const l of S.legs) fillLimb(ctx, { ...l, y1: l.y1 - 2 }, 0, 0.18, l.w + 0.8, COLLANT);
  }
  if (S.dir === 'side') drawArms();
  // cabeça
  const { hx, hy, hr } = S;
  if (S.dir === 'front') {
    for (const s of [-1, 1]) {
      ellPath(ctx, hx + s * (hr - 0.5), hy + 3, 2.6, 3.4);
      fs(ctx, skin, out, 1);
    }
  }
  if (S.dir === 'side') {
    // narizinho
    ellPath(ctx, hx + hr - 0.8, hy + 5.5, 2, 1.7);
    fs(ctx, skin, out, 1);
  }
  ellPath(ctx, hx, hy, hr, hr - 1);
  fs(ctx, skin, out, 1.1);
  if (S.dir === 'side') {
    ellPath(ctx, hx - 4, hy + 3.5, 2.3, 3);
    fs(ctx, skin, out, 0.9);
  }
  drawFace(ctx, S);
}

export function drawFace(ctx: Ctx, S: Skel) {
  const { hx, hy } = S;
  if (S.dir === 'back') return;
  const eye = (x: number, y: number, rx: number, ry: number, lashDir: number) => {
    ellPath(ctx, x, y, rx, ry);
    ctx.fillStyle = '#3b2a4a';
    ctx.fill();
    ellPath(ctx, x + 0.7, y - 1.1, rx * 0.42, rx * 0.42);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ellPath(ctx, x - 0.6, y + 1.2, rx * 0.2, rx * 0.2);
    ctx.fill();
    ctx.strokeStyle = '#3b2a4a';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x + lashDir * rx * 0.7, y - ry * 0.75);
    ctx.lineTo(x + lashDir * (rx + 1.4), y - ry - 0.8);
    ctx.stroke();
  };
  const blush = (x: number, y: number) => {
    ellPath(ctx, x, y, 2.6, 1.5);
    ctx.fillStyle = rgba('#f27fa4', 0.4);
    ctx.fill();
  };
  ctx.lineCap = 'round';
  if (S.dir === 'front') {
    eye(hx - 5.6, hy + 3, 2.3, 3.1, -1);
    eye(hx + 5.6, hy + 3, 2.3, 3.1, 1);
    blush(hx - 9.2, hy + 7.8);
    blush(hx + 9.2, hy + 7.8);
    ctx.strokeStyle = '#8a4a5e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hx, hy + 7.2, 2.1, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else {
    eye(hx + 8.6, hy + 3, 2, 3, 1);
    blush(hx + 7.5, hy + 8);
    ctx.strokeStyle = '#8a4a5e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hx + 12.6, hy + 8.4, 1.6, 0.25 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  void P;
  void limbPath;
}
