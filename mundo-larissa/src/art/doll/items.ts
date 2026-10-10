import type { ClothingItem } from '../../data/clothes';
import {
  darken, ellPath, flowerShape, fs, heartPath, lighten, outlineOf, patternFill, polyPath, rgba, rrPath, sparkle, starPath,
  type Ctx,
} from '../draw';
import { along, type Skel } from './skeleton';
import { fillLimb, hipBlock, legsCover, puffSleeves, skirt, sleeves, torso } from './parts';

/**
 * Desenho de cada estilo de roupa/acessório. A função recebe o esqueleto (S) e o item (cores e padrão).
 * Para criar um estilo novo: adicione uma função aqui e use o nome no catálogo (src/data/clothes.ts).
 */
type ItemFn = (ctx: Ctx, S: Skel, it: ClothingItem) => void;

// ------------------------------------------------------------------ estampas de camiseta
function print(ctx: Ctx, S: Skel, it: ClothingItem) {
  if (S.dir === 'back') return;
  const x = S.dir === 'side' ? S.hx + 3 : S.hx;
  const y = 60;
  const c = it.c2 ?? '#f2727a';
  const kind = it.id.replace('cam_', '');
  if (kind === 'coracao') {
    heartPath(ctx, x, y, 3.4);
    fs(ctx, c, undefined, 0.8);
  } else if (kind === 'estrela') {
    starPath(ctx, x, y, 4.2, 1.9);
    fs(ctx, c, undefined, 0.8);
  } else if (kind === 'flor') {
    flowerShape(ctx, x, y, 4, c, '#ffe08a');
  } else if (kind === 'arcoiris') {
    const cols = ['#f2727a', '#ffb347', '#ffe08a', '#8fd18a', '#7aa7e8'];
    cols.forEach((col, i) => {
      ctx.beginPath();
      ctx.arc(x, y + 3, 5.5 - i * 0.9, Math.PI, 0);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  } else if (kind === 'gatinho') {
    polyPath(ctx, [[x - 4, y - 1], [x - 3.5, y - 5], [x - 1, y - 2.5]]);
    fs(ctx, c, null);
    polyPath(ctx, [[x + 4, y - 1], [x + 3.5, y - 5], [x + 1, y - 2.5]]);
    fs(ctx, c, null);
    ellPath(ctx, x, y, 4, 3.3);
    fs(ctx, c, null);
    ellPath(ctx, x - 1.5, y - 0.3, 0.6, 0.7);
    ellPath(ctx, x + 1.5, y - 0.3, 0.6, 0.7);
    ctx.fillStyle = '#fff';
    ctx.fill();
  } else if (kind === 'lua') {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0.3 * Math.PI, 1.7 * Math.PI);
    ctx.arc(x + 2, y - 0.5, 3.2, 1.6 * Math.PI, 0.4 * Math.PI, true);
    ctx.closePath();
    fs(ctx, c, undefined, 0.8);
  }
}

function collar(ctx: Ctx, S: Skel, c: string) {
  if (S.dir !== 'front') return;
  const y = S.sh.y - 1;
  for (const s of [-1, 1]) {
    polyPath(ctx, [[S.hx, y + 2.5], [S.hx + s * 6.5, y - 0.5], [S.hx + s * 5, y + 4.5]]);
    fs(ctx, c, undefined, 0.9);
  }
}

function belt(ctx: Ctx, S: Skel, c: string) {
  ctx.beginPath();
  ctx.rect(S.waist.l - 0.5, S.waist.y - 1.6, S.waist.r - S.waist.l + 1, 3.2);
  fs(ctx, c, undefined, 0.8);
  if (S.dir === 'front') {
    // lacinho
    const x = S.hx;
    const y = S.waist.y;
    polyPath(ctx, [[x, y], [x - 4, y - 2.5], [x - 4, y + 2.5]]);
    fs(ctx, c, undefined, 0.8);
    polyPath(ctx, [[x, y], [x + 4, y - 2.5], [x + 4, y + 2.5]]);
    fs(ctx, c, undefined, 0.8);
  }
}

function cuff(ctx: Ctx, S: Skel, t: number, w: number, c: string) {
  for (const a of S.arms) {
    const [x, y] = along(a, t);
    ellPath(ctx, x, y, w / 2 + 1.2, 1.9);
    fs(ctx, c, undefined, 0.8);
  }
}

// ------------------------------------------------------------------ calçados
function footShape(ctx: Ctx, S: Skel, f: { x: number; y: number; face: number }, color: string, big = 0) {
  if (f.face) ellPath(ctx, f.x + 1.6, f.y - 1.2, 5.4 + big, 3 + big * 0.4);
  else ellPath(ctx, f.x, f.y - 1.2, 4.2 + big, 3 + big * 0.4);
  fs(ctx, color, undefined, 1);
}

function shoes(ctx: Ctx, S: Skel, it: ClothingItem) {
  const c = it.c1;
  const c2 = it.c2 ?? '#fff';
  for (let i = 0; i < S.feet.length; i++) {
    const f = S.feet[i];
    const leg = S.legs[i];
    switch (it.style) {
      case 'tenis': {
        footShape(ctx, S, f, c, 0.6);
        // sola
        ctx.save();
        if (f.face) ellPath(ctx, f.x + 1.6, f.y - 1.2, 6, 3.2);
        else ellPath(ctx, f.x, f.y - 1.2, 4.8, 3.2);
        ctx.clip();
        ctx.fillStyle = c2;
        ctx.fillRect(f.x - 8, f.y - 0.2, 18, 4);
        ctx.restore();
        if (S.dir === 'front') {
          ctx.strokeStyle = c2;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(f.x - 1.5, f.y - 3);
          ctx.lineTo(f.x + 1.5, f.y - 3);
          ctx.stroke();
        }
        if (it.id === 'tenis_brilho') sparkle(ctx, f.x + (f.face ? 2 : 0), f.y - 2, 1.8, '#fff');
        break;
      }
      case 'sapatilha':
        footShape(ctx, S, f, c);
        if (S.dir === 'front') {
          ellPath(ctx, f.x, f.y - 2.8, 1.4, 1);
          fs(ctx, c2, undefined, 0.6);
        }
        break;
      case 'boneca':
        footShape(ctx, S, f, c, 0.3);
        ctx.strokeStyle = darken(c, 0.2);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(f.x - 3, f.y - 4);
        ctx.lineTo(f.x + 3, f.y - 4);
        ctx.stroke();
        break;
      case 'bota':
      case 'bota_cano': {
        const t0 = it.style === 'bota' ? 0.72 : 0.42;
        fillLimb(ctx, leg, t0, 1, leg.w + 1.8, c);
        footShape(ctx, S, f, c, 0.6);
        const [x, y] = along(leg, t0);
        ellPath(ctx, x, y, (leg.w + 2.4) / 2, 1.6);
        fs(ctx, c2, undefined, 0.8);
        break;
      }
      case 'sandalia': {
        if (f.face) ellPath(ctx, f.x + 1.6, f.y + 0.4, 5.6, 1.6);
        else ellPath(ctx, f.x, f.y + 0.4, 4.4, 1.6);
        fs(ctx, darken(c, 0.12), undefined, 0.8);
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(f.x - 3, f.y - 2);
        ctx.lineTo(f.x + 3, f.y - 2);
        ctx.moveTo(f.x - 2.6, f.y - 4.3);
        ctx.lineTo(f.x + 2.6, f.y - 4.3);
        ctx.stroke();
        if (it.id === 'sandalia_flor' && S.dir !== 'back') flowerShape(ctx, f.x + (f.face ? 2 : 0), f.y - 2.5, 2, c2, '#ffe08a');
        break;
      }
    }
  }
}

// ------------------------------------------------------------------ cabeça
function hats(ctx: Ctx, S: Skel, it: ClothingItem) {
  const { hx, hy, hr, dir } = S;
  const c = it.c1;
  const c2 = it.c2 ?? '#fff';
  switch (it.style) {
    case 'chapeu_sol': {
      const by = hy - hr * 0.42;
      ctx.beginPath();
      ctx.ellipse(hx, by - 3, hr - 1.5, hr * 0.72, 0, Math.PI, 0);
      ctx.closePath();
      fs(ctx, lighten(c, 0.05));
      ellPath(ctx, hx, by, hr + 10, 5.6);
      fs(ctx, c);
      ellPath(ctx, hx, by - 1.2, hr - 1.6, 2.6);
      fs(ctx, darken(c, 0.08), null);
      ctx.beginPath();
      ctx.rect(hx - hr + 1.5, by - 5.5, hr * 2 - 3, 3.4);
      fs(ctx, c2, undefined, 0.8);
      if (dir !== 'back') {
        const fx = dir === 'side' ? hx - 6 : hx + 9;
        flowerShape(ctx, fx, by - 4, 3.6, c2 === '#ffffff' ? '#f7a8c8' : c2, '#ffe08a');
      }
      break;
    }
    case 'gorro': {
      ctx.beginPath();
      ctx.ellipse(hx, hy - 4, hr + 1.6, hr + 0.5, 0, Math.PI, 0);
      ctx.closePath();
      fs(ctx, c);
      ctx.strokeStyle = darken(c, 0.12);
      ctx.lineWidth = 0.8;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(hx + i * 4, hy - 5);
        ctx.lineTo(hx + i * 3, hy - hr - 1);
        ctx.stroke();
      }
      rrPath(ctx, hx - hr - 2, hy - 7.5, hr * 2 + 4, 5.5, 2.5);
      fs(ctx, c2);
      ellPath(ctx, hx, hy - hr - 5.5, 4.4, 4.4);
      fs(ctx, c2);
      break;
    }
    case 'chapeu_festa': {
      const ax = dir === 'side' ? hx - 1 : hx + 2;
      polyPath(ctx, [[hx - 7.5, hy - hr + 2.5], [hx + 7.5, hy - hr + 2.5], [ax, hy - hr - 20]]);
      fs(ctx, c);
      polyPath(ctx, [[hx - 7.5, hy - hr + 2.5], [hx + 7.5, hy - hr + 2.5], [ax, hy - hr - 20]]);
      patternFill(ctx, it.pat ?? 'dots', c2, hx - 9, hy - hr - 22, 18, 26, 0.9);
      ellPath(ctx, ax, hy - hr - 21, 3, 3);
      fs(ctx, c2);
      break;
    }
    case 'bone': {
      ctx.beginPath();
      ctx.ellipse(hx, hy - 4.5, hr + 1.2, hr * 0.92, 0, Math.PI, 0);
      ctx.closePath();
      fs(ctx, c);
      ellPath(ctx, hx + (dir === 'side' ? -2 : 0), hy - hr - 3.6, 2, 1.4);
      fs(ctx, darken(c, 0.15), null);
      if (dir === 'front') {
        ctx.beginPath();
        ctx.ellipse(hx, hy - 4.2, 12.5, 4, 0, 0, Math.PI);
        ctx.closePath();
        fs(ctx, darken(c, 0.1));
        starPath(ctx, hx, hy - 10, 3.2, 1.4);
        fs(ctx, c2, undefined, 0.6);
      } else if (dir === 'side') {
        ellPath(ctx, hx + hr + 2.5, hy - 4.5, 9, 2.6);
        fs(ctx, darken(c, 0.1));
        starPath(ctx, hx + 7, hy - 10, 3, 1.3);
        fs(ctx, c2, undefined, 0.6);
      } else {
        ctx.beginPath();
        ctx.rect(hx - 4, hy - 7, 8, 2.5);
        fs(ctx, c2, undefined, 0.6);
      }
      break;
    }
    case 'tiara':
    case 'tiara_flores':
    case 'tiara_orelhas': {
      const ear = (x: number, y: number) => {
        if (it.id === 'tiara_coelhinha') {
          ellPath(ctx, x, y - 8, 3, 9);
          fs(ctx, c);
          ellPath(ctx, x, y - 8, 1.5, 6.5);
          fs(ctx, c2, null);
        } else {
          polyPath(ctx, [[x - 5, y + 1], [x, y - 9], [x + 5, y + 1]]);
          fs(ctx, c);
          polyPath(ctx, [[x - 2.5, y], [x, y - 5.5], [x + 2.5, y]]);
          fs(ctx, c2, null);
        }
      };
      if (dir === 'side') {
        if (it.style === 'tiara_orelhas') {
          ear(hx - 3, hy - hr - 1);
        }
        ctx.beginPath();
        ctx.ellipse(hx + 1, hy - 1, 4, hr + 1.8, 0.15, Math.PI * 1.05, Math.PI * 1.75);
        ctx.strokeStyle = outlineOf(c);
        ctx.lineWidth = 4.2;
        ctx.stroke();
        ctx.strokeStyle = c;
        ctx.lineWidth = 2.6;
        ctx.stroke();
        if (it.style === 'tiara_flores') flowerShape(ctx, hx - 1, hy - hr - 1.5, 3.2, c2, '#ffe08a');
      } else {
        if (it.style === 'tiara_orelhas') {
          ear(hx - 9, hy - hr + 1);
          ear(hx + 9, hy - hr + 1);
        }
        ctx.beginPath();
        ctx.ellipse(hx, hy - 1, hr + 0.8, hr + 1.6, 0, Math.PI * 1.1, Math.PI * 1.9);
        ctx.strokeStyle = outlineOf(c);
        ctx.lineWidth = 4.2;
        ctx.stroke();
        ctx.strokeStyle = c;
        ctx.lineWidth = 2.6;
        ctx.stroke();
        if (it.style === 'tiara_flores') {
          for (let i = 0; i < 5; i++) {
            const a = Math.PI * (1.18 + i * 0.16);
            flowerShape(ctx, hx + Math.cos(a) * (hr + 0.8), hy - 1 + Math.sin(a) * (hr + 1.6), 3, c2, '#ffe08a');
          }
        }
        if (it.id === 'tiara_perola') {
          for (let i = 0; i < 7; i++) {
            const a = Math.PI * (1.15 + i * 0.117);
            ellPath(ctx, hx + Math.cos(a) * (hr + 0.8), hy - 1 + Math.sin(a) * (hr + 1.6), 1.4, 1.4);
            fs(ctx, '#fff', '#c9b9d6', 0.6);
          }
        }
      }
      break;
    }
    case 'laco': {
      const big = it.id === 'laco_grande';
      const s = big ? 1.5 : 1;
      const x = dir === 'front' ? hx + (big ? 0 : 9) : dir === 'back' ? hx - (big ? 0 : 9) : hx - 3;
      const y = hy - hr + (big ? -1 : 1.5);
      drawBow(ctx, x, y, s, c, it.pat, c2);
      break;
    }
    case 'coroa':
    case 'coroa_estrela': {
      const w = dir === 'side' ? 9 : 10.5;
      const by = hy - hr + 3.5;
      const x = dir === 'side' ? hx - 1 : hx;
      polyPath(ctx, [[x - w, by], [x - w - 1, by - 9], [x - w * 0.5, by - 4.5], [x, by - 11], [x + w * 0.5, by - 4.5], [x + w + 1, by - 9], [x + w, by]]);
      const g = ctx.createLinearGradient(0, by - 11, 0, by);
      g.addColorStop(0, lighten(c, 0.4));
      g.addColorStop(1, c);
      fs(ctx, g, outlineOf(c), 1);
      if (it.style === 'coroa_estrela') {
        starPath(ctx, x, by - 13, 6.5, 2.8);
        fs(ctx, '#fff6c4', '#e0a92e', 1);
        sparkle(ctx, x + 9, by - 16, 2.5, '#fff');
      } else if (it.id === 'coroa_flores') {
        for (const dx of [-6, 0, 6]) flowerShape(ctx, x + dx, by - 3, 2.6, c2, '#ffe08a');
      } else {
        for (const dx of [-6, 0, 6]) {
          ellPath(ctx, x + dx, by - 3, 1.6, 1.6);
          fs(ctx, c2, undefined, 0.6);
        }
      }
      break;
    }
  }
}

export function drawBow(ctx: Ctx, x: number, y: number, s: number, c: string, pat?: string, c2 = '#fff') {
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + side * 7 * s, y - 7 * s, x + side * 9 * s, y + 5 * s, x, y);
    fs(ctx, c, undefined, 1);
    if (pat && pat !== 'none') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + side * 7 * s, y - 7 * s, x + side * 9 * s, y + 5 * s, x, y);
      patternFill(ctx, pat as never, c2, x - 10 * s, y - 8 * s, 20 * s, 14 * s, 0.7 * s);
    }
    polyPath(ctx, [[x, y], [x + side * 3 * s, y + 6 * s], [x + side * 1 * s, y + 6.5 * s]]);
    fs(ctx, c, undefined, 0.8);
  }
  ellPath(ctx, x, y, 2 * s, 2 * s);
  fs(ctx, darken(c, 0.1), undefined, 0.9);
}

// ------------------------------------------------------------------ acessórios
function glasses(ctx: Ctx, S: Skel, it: ClothingItem) {
  const { hx, hy, dir } = S;
  if (dir === 'back') return;
  const c = it.c1;
  const lens = (x: number, y: number) => {
    if (it.style === 'oculos_coracao') heartPath(ctx, x, y + 0.5, 3.6);
    else if (it.style === 'oculos_estrela') starPath(ctx, x, y, 4.6, 2.3);
    else ellPath(ctx, x, y, 3.6, 3.6);
    ctx.fillStyle = rgba(it.c2 ?? '#e3f4ff', 0.55);
    ctx.fill();
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };
  if (dir === 'front') {
    lens(hx - 5.6, hy + 3);
    lens(hx + 5.6, hy + 3);
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx - 2, hy + 2.4);
    ctx.lineTo(hx + 2, hy + 2.4);
    ctx.stroke();
  } else {
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx + 5, hy + 2);
    ctx.lineTo(hx - 3, hy + 2);
    ctx.stroke();
    lens(hx + 9, hy + 3);
  }
}

function necklace(ctx: Ctx, S: Skel, it: ClothingItem) {
  if (S.dir === 'back') return;
  const c = it.c1;
  const front = S.dir === 'front';
  const x0 = front ? S.hx - 5.5 : S.hx - 1;
  const x1 = front ? S.hx + 5.5 : S.hx + 5;
  const y0 = S.sh.y - 1.5;
  const cx = front ? S.hx : S.hx + 3.5;
  const cy = S.sh.y + 4.5;
  if (it.style === 'colar_perolas') {
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (cy + 2) + t * t * y0;
      ellPath(ctx, x, y, 1.3, 1.3);
      fs(ctx, c, '#c9b9d6', 0.6);
    }
    return;
  }
  ctx.strokeStyle = c;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy + 1, x1, y0);
  ctx.stroke();
  const py = (y0 + cy + 1) / 2 + 2.6;
  if (it.style === 'colar_coracao') {
    heartPath(ctx, cx, py, 2.4);
    fs(ctx, it.c2 ?? '#f2727a', undefined, 0.7);
  } else {
    starPath(ctx, cx, py, 3, 1.3);
    fs(ctx, it.c2 ?? '#ffe08a', undefined, 0.7);
  }
}

function bag(ctx: Ctx, S: Skel, it: ClothingItem) {
  const c = it.c1;
  const c2 = it.c2 ?? '#fff';
  const { dir } = S;
  if (it.style === 'mochila') {
    if (dir === 'back') {
      rrPath(ctx, S.hx - 9, 53, 18, 19, 5);
      fs(ctx, c);
      rrPath(ctx, S.hx - 6, 62, 12, 8, 3);
      fs(ctx, c2);
    } else if (dir === 'side') {
      rrPath(ctx, S.hx - 13, 53, 7, 18, 3);
      fs(ctx, c);
      ctx.strokeStyle = darken(c, 0.15);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(S.hx - 6, 54);
      ctx.lineTo(S.hx + 2, 54);
      ctx.lineTo(S.hx - 2, 66);
      ctx.stroke();
    } else {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(S.hx + s * 6, S.sh.y - 1);
        ctx.lineTo(S.hx + s * 6.5, S.waist.y + 2);
        ctx.stroke();
      }
    }
    return;
  }
  // bolsa a tiracolo
  let sx: number, sy: number, bx: number, by: number;
  if (dir === 'front') {
    sx = S.sh.r - 2.5; sy = S.sh.y - 1; bx = S.hip.l - 3; by = S.hip.y - 2;
  } else if (dir === 'back') {
    sx = S.sh.l + 2.5; sy = S.sh.y - 1; bx = S.hip.r + 3; by = S.hip.y - 2;
  } else {
    sx = S.hx - 1; sy = S.sh.y - 1; bx = S.hx + 4; by = S.hip.y - 1;
  }
  ctx.strokeStyle = darken(c, 0.15);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(bx, by - 3);
  ctx.stroke();
  if (it.style === 'bolsa_coracao') {
    heartPath(ctx, bx, by + 1.5, 5.5);
    fs(ctx, c);
    sparkle(ctx, bx - 2, by - 1, 1.5, '#fff');
  } else {
    rrPath(ctx, bx - 5, by - 3, 10, 8.5, 3);
    fs(ctx, c);
    ctx.beginPath();
    ctx.moveTo(bx - 5, by - 1);
    ctx.quadraticCurveTo(bx, by + 4, bx + 5, by - 1);
    ctx.lineTo(bx + 5, by - 3);
    ctx.lineTo(bx - 5, by - 3);
    ctx.closePath();
    fs(ctx, darken(c, 0.08), undefined, 0.8);
    ellPath(ctx, bx, by + 1.3, 1.2, 1.2);
    fs(ctx, c2, undefined, 0.6);
  }
}

export function drawWings(ctx: Ctx, S: Skel, c: string, c2: string, butterfly: boolean) {
  const alpha = butterfly ? 0.95 : 0.78;
  const wing = (x: number, y: number, rx: number, ry: number, rot: number, col: string) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fillStyle = rgba(col, alpha);
    ctx.fill();
    ctx.strokeStyle = c2;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    if (butterfly) {
      ellPath(ctx, x + Math.cos(rot) * 2, y + 1, rx * 0.35, ry * 0.3);
      ctx.fillStyle = rgba(c2, 0.9);
      ctx.fill();
    } else {
      sparkle(ctx, x, y - 2, 2.2, '#ffffff');
    }
  };
  if (S.dir === 'side') {
    wing(S.hx - 11, 51, 8, 13, -0.6, c);
    wing(S.hx - 9, 64, 5.5, 8, -0.9, lighten(c, 0.2));
    return;
  }
  for (const s of [-1, 1]) {
    wing(S.hx + s * 14, 50, 9, 14, s * 0.55, c);
    wing(S.hx + s * 11, 65, 6, 8.5, s * 0.9, lighten(c, 0.2));
  }
}

// ------------------------------------------------------------------ roupas
const ITEMS: Record<string, ItemFn> = {
  blusa: (ctx, S, it) => {
    torso(ctx, S, it.c1, { bottom: S.hip.y - 0.5, pat: it.pat, patColor: it.c2 });
    puffSleeves(ctx, S, it.c1);
    collar(ctx, S, it.c2 ?? '#fff');
  },
  blusa_manga: (ctx, S, it) => {
    torso(ctx, S, it.c1, { bottom: S.hip.y + 2, flare: 1, pat: it.pat, patColor: it.c2 });
    sleeves(ctx, S, it.c1, 0.86, 2.2, it.pat, it.c2);
    cuff(ctx, S, 0.86, 6, it.c2 ?? '#fff');
  },
  camiseta: (ctx, S, it) => {
    torso(ctx, S, it.c1, { bottom: S.hip.y + 1.5, flare: 0.5 });
    sleeves(ctx, S, it.c1, 0.36, 2.8);
    print(ctx, S, it);
  },
  saia_rodada: (ctx, S, it) => skirt(ctx, S, it.c1, S.waist.y - 1, 82, 7, { pat: it.pat, patColor: it.c2 }),
  saia_pregas: (ctx, S, it) => {
    skirt(ctx, S, it.c1, S.waist.y - 1, 80, 5, { pat: it.pat, patColor: it.c2 });
    belt(ctx, S, darken(it.c1, 0.1));
  },
  saia_tutu: (ctx, S, it) => {
    skirt(ctx, S, it.c2 ?? it.c1, S.waist.y - 1, 81, 10, { hem: 'scallop' });
    skirt(ctx, S, it.c1, S.waist.y - 1, 77, 8, { hem: 'scallop', pat: it.pat, patColor: '#ffffff' });
  },
  calca: (ctx, S, it) => {
    legsCover(ctx, S, it.c1, 0.98, 1.8);
    if (it.id === 'calca_jeans') {
      ctx.strokeStyle = darken(it.c1, 0.2);
      ctx.lineWidth = 0.6;
      ctx.setLineDash([1.2, 1.2]);
      for (const l of S.legs) {
        ctx.beginPath();
        ctx.moveTo(l.x1 + 1, l.y1 + 2);
        ctx.lineTo(l.x2 + 1, l.y2 - 1);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  },
  legging: (ctx, S, it) => legsCover(ctx, S, it.c1, 0.96, 0.6, it.pat, it.c2),
  short: (ctx, S, it) => legsCover(ctx, S, it.c1, 0.3, 2.2, it.pat, it.c2),
  short_barra: (ctx, S, it) => {
    legsCover(ctx, S, it.c1, 0.32, 2.4, it.pat, it.c2);
    for (const l of S.legs) {
      const [x, y] = along({ ...l, y1: l.y1 - 3 }, 0.32);
      ellPath(ctx, x, y, (l.w + 3) / 2, 1.8);
      fs(ctx, it.c2 ?? '#fff', undefined, 0.8);
    }
  },
  vestido_rodado: (ctx, S, it) => {
    torso(ctx, S, it.c1, { bottom: S.waist.y + 1, pat: it.pat, patColor: it.c2 });
    skirt(ctx, S, it.c1, S.waist.y, 84, 8, { pat: it.pat, patColor: it.c2 });
    puffSleeves(ctx, S, it.c1);
    belt(ctx, S, it.c2 ?? '#fff');
  },
  vestido_babado: (ctx, S, it) => {
    const c2 = it.c2 ?? '#fff';
    torso(ctx, S, it.c1, { bottom: S.waist.y + 1, neck: 'scoop', pat: it.pat, patColor: '#ffffff' });
    skirt(ctx, S, it.c1, S.waist.y, 87, 10, { hem: 'scallop' });
    skirt(ctx, S, lighten(it.c1, 0.15), S.waist.y, 80, 7, { hem: 'scallop', pat: it.pat, patColor: '#ffffff' });
    skirt(ctx, S, it.c1, S.waist.y, 73, 4, { hem: 'scallop' });
    puffSleeves(ctx, S, c2);
  },
  vestido_longo: (ctx, S, it) => {
    torso(ctx, S, it.c1, { bottom: S.waist.y + 1, neck: 'scoop', pat: it.pat, patColor: it.c2 });
    skirt(ctx, S, it.c1, S.waist.y, 95, 10, { pat: it.pat, patColor: it.c2 });
    sleeves(ctx, S, it.c1, 0.3, 2.6);
    belt(ctx, S, darken(it.c1, 0.12));
  },
  macacao_calca: (ctx, S, it) => overall(ctx, S, it, 0.98),
  macacao_short: (ctx, S, it) => overall(ctx, S, it, 0.3),
};

function overall(ctx: Ctx, S: Skel, it: ClothingItem, len: number) {
  const inner = it.c2 ?? '#fff';
  torso(ctx, S, inner, { bottom: S.hip.y - 1 });
  sleeves(ctx, S, inner, 0.34, 2.6);
  legsCover(ctx, S, it.c1, len, 2, it.pat, '#ffffff');
  hipBlock(ctx, S, it.c1, S.hip.y + 5);
  // peitilho e alças
  if (S.dir === 'front') {
    rrPath(ctx, S.hx - 6, S.waist.y - 9, 12, 12, 2);
    fs(ctx, it.c1);
    rrPath(ctx, S.hx - 2.5, S.waist.y - 6.5, 5, 3.5, 1);
    fs(ctx, darken(it.c1, 0.1), undefined, 0.6);
  }
  ctx.strokeStyle = darken(it.c1, 0.08);
  ctx.lineWidth = 2.2;
  if (S.dir === 'front') {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(S.hx + s * 5, S.waist.y - 8);
      ctx.lineTo(S.hx + s * 6.5, S.sh.y - 1);
      ctx.stroke();
      ellPath(ctx, S.hx + s * 4.5, S.waist.y - 7.5, 1.3, 1.3);
      fs(ctx, '#fff2c4', undefined, 0.6);
    }
  } else if (S.dir === 'back') {
    ctx.beginPath();
    ctx.moveTo(S.hx - 6, S.sh.y - 1);
    ctx.lineTo(S.hx + 5, S.waist.y);
    ctx.moveTo(S.hx + 6, S.sh.y - 1);
    ctx.lineTo(S.hx - 5, S.waist.y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(S.hx, S.sh.y - 1);
    ctx.lineTo(S.hx + 2, S.waist.y);
    ctx.stroke();
  }
}

export function drawItem(ctx: Ctx, S: Skel, it: ClothingItem) {
  switch (it.slot) {
    case 'shoes':
      return shoes(ctx, S, it);
    case 'hat':
      return hats(ctx, S, it);
    case 'glasses':
      return glasses(ctx, S, it);
    case 'necklace':
      return necklace(ctx, S, it);
    case 'bag':
      return bag(ctx, S, it);
    case 'wings':
      return drawWings(ctx, S, it.c1, it.c2 ?? '#fff', it.style === 'asas_borboleta');
    default:
      ITEMS[it.style]?.(ctx, S, it);
  }
}

export { patternFill, polyPath, fs, ellPath, lighten, darken, outlineOf };
