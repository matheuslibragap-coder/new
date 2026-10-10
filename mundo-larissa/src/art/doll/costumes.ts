import type { ClothingItem } from '../../data/clothes';
import { darken, ellPath, flowerShape, fs, lighten, outlineOf, patternFill, polyPath, rgba, rrPath, sparkle, starPath, type Ctx } from '../draw';
import { drawWings } from './items';
import { fillLimb, legsCover, puffSleeves, skirt, sleeves, torso } from './parts';
import { along, type Skel } from './skeleton';

/** Fantasias especiais: substituem blusa, saia/calça, vestido e sapatos. */
export type CostumePart = 'body' | 'head' | 'back';

export const COSTUME_FLAGS: Record<string, { hideLegs?: boolean; hasHead?: boolean; hasBack?: boolean }> = {
  sereia: { hideLegs: true, hasHead: true },
  princesa: { hasHead: true },
  astronauta: { hasHead: true, hasBack: true },
  bailarina: { hasHead: true },
  fada: { hasHead: true, hasBack: true },
  estrela: { hasBack: true },
};

function slippers(ctx: Ctx, S: Skel, c: string) {
  for (const f of S.feet) {
    if (f.face) ellPath(ctx, f.x + 1.6, f.y - 1.2, 5.4, 3);
    else ellPath(ctx, f.x, f.y - 1.2, 4.2, 3);
    fs(ctx, c);
  }
}

function smallTiara(ctx: Ctx, S: Skel, c: string, gem: string) {
  const x = S.dir === 'side' ? S.hx - 1 : S.hx;
  const by = S.hy - S.hr + 2.5;
  polyPath(ctx, [[x - 7, by], [x - 6, by - 4], [x - 3, by - 2.5], [x, by - 7.5], [x + 3, by - 2.5], [x + 6, by - 4], [x + 7, by]]);
  fs(ctx, c);
  ellPath(ctx, x, by - 3, 1.6, 1.6);
  fs(ctx, gem, undefined, 0.6);
}

const DRAW: Record<string, (ctx: Ctx, S: Skel, it: ClothingItem, part: CostumePart) => void> = {
  sereia: (ctx, S, it, part) => {
    const c = it.c1;
    const top = it.c2 ?? '#c7a8f0';
    if (part === 'head') {
      const x = S.dir === 'back' ? S.hx - 9 : S.dir === 'side' ? S.hx - 4 : S.hx + 9;
      starPath(ctx, x, S.hy - S.hr + 2, 4.5, 2);
      fs(ctx, '#ffb28a');
      return;
    }
    if (part !== 'body') return;
    // cauda
    const sway = S.frame === 1 ? 2 : S.frame === 2 ? -2 : 0;
    const side = S.dir === 'side';
    const l = S.hip.l - 0.5;
    const r = S.hip.r + 0.5;
    const cx = S.hx + sway;
    ctx.beginPath();
    ctx.moveTo(S.waist.l - 0.5, S.waist.y);
    ctx.lineTo(S.waist.r + 0.5, S.waist.y);
    ctx.quadraticCurveTo(r + 2, 74, cx + (side ? 5 : 4), 90);
    ctx.lineTo(cx - (side ? 1 : 4), 90);
    ctx.quadraticCurveTo(l - 2, 74, S.waist.l - 0.5, S.waist.y);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, S.waist.y, 0, 92);
    g.addColorStop(0, lighten(c, 0.1));
    g.addColorStop(1, darken(c, 0.1));
    fs(ctx, g, outlineOf(c));
    // escamas
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(S.waist.l - 0.5, S.waist.y);
    ctx.lineTo(S.waist.r + 0.5, S.waist.y);
    ctx.quadraticCurveTo(r + 2, 74, cx + 4, 90);
    ctx.lineTo(cx - 4, 90);
    ctx.quadraticCurveTo(l - 2, 74, S.waist.l - 0.5, S.waist.y);
    ctx.clip();
    ctx.strokeStyle = lighten(c, 0.4);
    ctx.lineWidth = 0.8;
    for (let y = S.waist.y + 4; y < 92; y += 4) {
      for (let x = l - 4 + ((y / 4) % 2) * 2; x < r + 4; x += 4) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI);
        ctx.stroke();
      }
    }
    ctx.restore();
    // nadadeira
    const fx = cx + (side ? 2 : 0);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(fx, 89);
      ctx.quadraticCurveTo(fx + s * 6, 90, fx + s * 10, 98);
      ctx.quadraticCurveTo(fx + s * 4, 96, fx, 93);
      ctx.closePath();
      fs(ctx, lighten(c, 0.15), outlineOf(c));
    }
    torso(ctx, S, top, { bottom: S.waist.y + 1, neck: 'scoop', pat: 'glitter', patColor: '#ffffff' });
    if (S.dir === 'front') {
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(S.hx + s * 4, S.sh.y + 4, 3.5, Math.PI, 0);
        ctx.closePath();
        fs(ctx, '#fcd3e3');
      }
    }
  },
  princesa: (ctx, S, it, part) => {
    if (part === 'head') return smallTiara(ctx, S, '#f2c14e', '#f2727a');
    if (part !== 'body') return;
    const c = it.c1;
    const c2 = it.c2 ?? '#fff';
    slippers(ctx, S, c);
    skirt(ctx, S, lighten(c, 0.2), S.waist.y, 98, 15, { hem: 'scallop', pat: 'glitter', patColor: '#ffffff' });
    skirt(ctx, S, c, S.waist.y, 90, 11, { hem: 'scallop' });
    torso(ctx, S, c, { bottom: S.waist.y + 1, neck: 'scoop' });
    puffSleeves(ctx, S, c2);
    ctx.beginPath();
    ctx.rect(S.waist.l - 0.5, S.waist.y - 1.5, S.waist.r - S.waist.l + 1, 3);
    fs(ctx, c2, undefined, 0.8);
  },
  astronauta: (ctx, S, it, part) => {
    const c = it.c1;
    const c2 = it.c2 ?? '#9b7fd4';
    if (part === 'back') {
      if (S.dir === 'front') return;
      if (S.dir === 'back') {
        rrPath(ctx, S.hx - 9, 52, 18, 18, 4);
        fs(ctx, '#e3e6f0');
        ellPath(ctx, S.hx - 4, 58, 2, 2);
        fs(ctx, '#f2727a', undefined, 0.6);
        ellPath(ctx, S.hx + 4, 58, 2, 2);
        fs(ctx, '#9fe3c9', undefined, 0.6);
      } else {
        rrPath(ctx, S.hx - 14, 52, 8, 18, 3);
        fs(ctx, '#e3e6f0');
      }
      return;
    }
    if (part === 'head') {
      ellPath(ctx, S.hx, S.hy, S.hr + 5, S.hr + 4.5);
      ctx.fillStyle = 'rgba(214,236,252,0.28)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.strokeStyle = outlineOf('#d9e2f2');
      ctx.lineWidth = 0.8;
      ctx.stroke();
      if (S.dir !== 'back') {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(S.hx, S.hy, S.hr + 1.5, -2.6, -2.0);
        ctx.stroke();
      }
      rrPath(ctx, S.hx - 10, S.neckY - 1, 20, 4, 2);
      fs(ctx, c2);
      return;
    }
    legsCover(ctx, S, c, 0.98, 2.6);
    for (let i = 0; i < S.legs.length; i++) {
      fillLimb(ctx, S.legs[i], 0.7, 1, S.legs[i].w + 3, c2);
      const f = S.feet[i];
      if (f.face) ellPath(ctx, f.x + 1.6, f.y - 1.2, 6, 3.4);
      else ellPath(ctx, f.x, f.y - 1.2, 5, 3.4);
      fs(ctx, c2);
    }
    torso(ctx, S, c, { bottom: S.hip.y + 2, flare: 1, neck: 'high' });
    sleeves(ctx, S, c, 0.95, 3.4);
    for (const a of S.arms) {
      const [x, y] = along(a, 1);
      ellPath(ctx, x, y + 0.5, 3.4, 3.4);
      fs(ctx, c2);
    }
    if (S.dir === 'front') {
      rrPath(ctx, S.hx - 5, 56, 10, 7, 2);
      fs(ctx, '#e3e6f0');
      for (const [dx, col] of [[-2.5, '#f2727a'], [0, '#ffe08a'], [2.5, '#9fe3c9']] as [number, string][]) {
        ellPath(ctx, S.hx + dx, 59.5, 1, 1);
        fs(ctx, col, undefined, 0.5);
      }
    }
  },
  bailarina: (ctx, S, it, part) => {
    if (part === 'head') return smallTiara(ctx, S, '#e3e6f0', '#9fd3f7');
    if (part !== 'body') return;
    const c = it.c1;
    // meia-calça rosinha
    for (const l of S.legs) fillLimb(ctx, l, 0, 1, l.w + 0.3, '#fbe0ea');
    slippers(ctx, S, '#f7a8c8');
    if (S.dir !== 'back') {
      for (const l of S.legs) {
        ctx.strokeStyle = '#f7a8c8';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(l.x2 - 3, l.y2 + 1);
        ctx.lineTo(l.x2 + 3, l.y2 - 4);
        ctx.moveTo(l.x2 + 3, l.y2 + 1);
        ctx.lineTo(l.x2 - 3, l.y2 - 4);
        ctx.stroke();
      }
    }
    torso(ctx, S, c, { bottom: S.hip.y + 3, neck: 'scoop', pat: 'glitter', patColor: '#ffffff' });
    // tutu achatado
    const y = S.hip.y - 1;
    const w = S.dir === 'side' ? 13 : 17;
    for (let i = 0; i < 3; i++) {
      ellPath(ctx, S.hx, y - i * 1.2, w - i * 1.5, 4.6 - i * 0.6);
      fs(ctx, i % 2 ? '#ffffff' : c, outlineOf(c), 0.9);
    }
    ctx.save();
    ellPath(ctx, S.hx, y - 2.4, w - 3, 3.4);
    ctx.clip();
    patternFill(ctx, 'glitter', '#ffffff', S.hx - w, y - 6, w * 2, 8, 0.8);
    ctx.restore();
  },
  fada: (ctx, S, it, part) => {
    const c = it.c1;
    const c2 = it.c2 ?? '#f7a8c8';
    if (part === 'back') return drawWings(ctx, S, '#e8fbff', '#9fd3f7', false);
    if (part === 'head') {
      const by = S.hy - S.hr + 3;
      if (S.dir === 'side') {
        for (const dx of [-6, -1, 4]) flowerShape(ctx, S.hx + dx, by - (dx === -1 ? 2 : 0), 2.8, c2, '#ffe08a');
      } else {
        for (const dx of [-10, -5, 0, 5, 10]) flowerShape(ctx, S.hx + dx, by + Math.abs(dx) * 0.25 - 1, 2.8, dx % 10 ? '#ffffff' : c2, '#ffe08a');
      }
      return;
    }
    slippers(ctx, S, '#9fe3c9');
    skirt(ctx, S, c2, S.waist.y, 84, 9, { hem: 'petal' });
    skirt(ctx, S, c, S.waist.y, 79, 7, { hem: 'petal', pat: 'glitter', patColor: '#ffffff' });
    torso(ctx, S, c, { bottom: S.waist.y + 1, neck: 'scoop' });
    // varinha
    if (S.dir !== 'back') {
      const a = S.arms[S.arms.length - 1];
      const [hx, hy] = along(a, 1);
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 4, hy - 12);
      ctx.stroke();
      starPath(ctx, hx + 4.5, hy - 14, 4, 1.8);
      fs(ctx, '#fff2c4', '#e0a92e', 0.8);
    }
  },
  estrela: (ctx, S, it, part) => {
    const c = it.c1;
    const c2 = it.c2 ?? '#b79cf0';
    if (part === 'back') {
      // capinha de estrelas
      if (S.dir === 'front') {
        polyPath(ctx, [[S.sh.l + 1, S.sh.y], [S.sh.r - 1, S.sh.y], [S.hip.r + 10, 90], [S.hip.l - 10, 90]]);
      } else if (S.dir === 'back') {
        polyPath(ctx, [[S.sh.l, S.sh.y - 1], [S.sh.r, S.sh.y - 1], [S.hip.r + 9, 92], [S.hip.l - 9, 92]]);
      } else {
        polyPath(ctx, [[S.hx - 3, S.sh.y - 1], [S.hx + 1, S.sh.y], [S.hx - 6, 92], [S.hx - 18, 90]]);
      }
      fs(ctx, rgba(c2, 0.95), outlineOf(c2));
      if (S.dir === 'front') {
        polyPath(ctx, [[S.sh.l + 1, S.sh.y], [S.sh.r - 1, S.sh.y], [S.hip.r + 10, 90], [S.hip.l - 10, 90]]);
      } else if (S.dir === 'back') {
        polyPath(ctx, [[S.sh.l, S.sh.y - 1], [S.sh.r, S.sh.y - 1], [S.hip.r + 9, 92], [S.hip.l - 9, 92]]);
      } else {
        polyPath(ctx, [[S.hx - 3, S.sh.y - 1], [S.hx + 1, S.sh.y], [S.hx - 6, 92], [S.hx - 18, 90]]);
      }
      patternFill(ctx, 'stars', '#fff6c4', 0, 50, 64, 50, 1);
      return;
    }
    if (part !== 'body') return;
    slippers(ctx, S, '#f2c14e');
    skirt(ctx, S, c, S.waist.y, 97, 13, { hem: 'scallop', pat: 'stars', patColor: c2 });
    skirt(ctx, S, lighten(c, 0.3), S.waist.y, 76, 7, { hem: 'petal', pat: 'glitter', patColor: '#f2c14e' });
    torso(ctx, S, c, { bottom: S.waist.y + 1, neck: 'scoop', pat: 'glitter', patColor: '#f2c14e' });
    puffSleeves(ctx, S, lighten(c2, 0.3));
    if (S.dir === 'front') {
      starPath(ctx, S.hx, S.sh.y + 6, 3.4, 1.5);
      fs(ctx, '#f2c14e', undefined, 0.7);
    }
    sparkle(ctx, S.hx + 12, 80, 2.5, '#ffffff');
    sparkle(ctx, S.hx - 10, 90, 2, '#ffffff');
  },
};

export function drawCostume(ctx: Ctx, S: Skel, it: ClothingItem, part: CostumePart) {
  DRAW[it.style]?.(ctx, S, it, part);
}
