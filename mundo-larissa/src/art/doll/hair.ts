import { darken, ellPath, fs, lighten, outlineOf, rrPath, type Ctx } from '../draw';
import type { Skel } from './skeleton';

/**
 * Penteados. Cada penteado tem duas camadas:
 *  - 'B' (de trás): cabelo comprido, rabos, coques… atrás do corpo (ou por cima, de costas)
 *  - 'F' (da frente): franja e topo da cabeça
 */
type HairFn = (ctx: Ctx, S: Skel, c: string, layer: 'B' | 'F') => void;

function hairFill(ctx: Ctx, c: string) {
  fs(ctx, c, outlineOf(c), 1.1);
}

/** Topo da cabeça com franja (vista de frente). */
function capFront(ctx: Ctx, S: Skel, c: string, sideDrop: number, fringe: 'soft' | 'straight' | 'curly' = 'soft') {
  const { hx, hy, hr } = S;
  ctx.beginPath();
  ctx.moveTo(hx - hr - 1.4, hy + sideDrop);
  ctx.bezierCurveTo(hx - hr - 2.4, hy - hr * 0.9, hx - hr * 0.6, hy - hr - 3.6, hx, hy - hr - 3);
  ctx.bezierCurveTo(hx + hr * 0.6, hy - hr - 3.6, hx + hr + 2.4, hy - hr * 0.9, hx + hr + 1.4, hy + sideDrop);
  ctx.lineTo(hx + hr - 3.2, hy + sideDrop);
  ctx.lineTo(hx + hr - 3.4, hy - 1);
  if (fringe === 'straight') {
    ctx.lineTo(hx + hr - 4, hy - 3.5);
    ctx.lineTo(hx - hr + 4, hy - 3.5);
  } else {
    const pts: number[][] = fringe === 'curly'
      ? [[hx + 9, hy - 5], [hx + 4.5, hy - 2.5], [hx, hy - 5.5], [hx - 4.5, hy - 2.5], [hx - 9, hy - 5], [hx - hr + 3.4, hy - 1]]
      : [[hx + 9, hy - 6.5], [hx + 4, hy - 2], [hx - 0.5, hy - 7.5], [hx - 5, hy - 2.5], [hx - 9.5, hy - 6.5], [hx - hr + 3.4, hy - 1]];
    let px = hx + hr - 3.4;
    let py = hy - 1;
    for (const [x, y] of pts) {
      const mx = (px + x) / 2;
      const my = Math.min(py, y) - (fringe === 'curly' ? 3 : 1.5);
      ctx.quadraticCurveTo(mx, my + (y > py ? 3 : 0), x, y);
      px = x;
      py = y;
    }
  }
  ctx.lineTo(hx - hr + 3.2, hy + sideDrop);
  ctx.closePath();
  hairFill(ctx, c);
  shine(ctx, S, c);
}

function shine(ctx: Ctx, S: Skel, c: string) {
  const { hx, hy, hr } = S;
  ctx.strokeStyle = lighten(c, 0.45);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (S.dir === 'side') ctx.arc(hx - 1, hy - 2, hr - 2, -2.3, -1.7);
  else ctx.arc(hx, hy - 1, hr - 1.5, -2.5, -1.9);
  ctx.stroke();
}

/** Cabelo cobrindo a nuca (vista de costas). */
function capBack(ctx: Ctx, S: Skel, c: string, drop: number) {
  const { hx, hy, hr } = S;
  ctx.beginPath();
  ctx.moveTo(hx - hr - 1.5, hy + drop);
  ctx.bezierCurveTo(hx - hr - 2.5, hy - hr * 0.9, hx - hr * 0.6, hy - hr - 3.6, hx, hy - hr - 3);
  ctx.bezierCurveTo(hx + hr * 0.6, hy - hr - 3.6, hx + hr + 2.5, hy - hr * 0.9, hx + hr + 1.5, hy + drop);
  ctx.quadraticCurveTo(hx, hy + drop + 3, hx - hr - 1.5, hy + drop);
  ctx.closePath();
  ctx.fillStyle = c;
  ctx.fill();
  // contorno só no topo, para emendar com o cabelo comprido
  ctx.beginPath();
  ctx.moveTo(hx - hr - 1.5, hy + drop);
  ctx.bezierCurveTo(hx - hr - 2.5, hy - hr * 0.9, hx - hr * 0.6, hy - hr - 3.6, hx, hy - hr - 3);
  ctx.bezierCurveTo(hx + hr * 0.6, hy - hr - 3.6, hx + hr + 2.5, hy - hr * 0.9, hx + hr + 1.5, hy + drop);
  ctx.strokeStyle = outlineOf(c);
  ctx.lineWidth = 1.1;
  ctx.stroke();
  shine(ctx, S, c);
}

/** Topo da cabeça de perfil (olhando para a direita). */
function capSide(ctx: Ctx, S: Skel, c: string, drop: number) {
  const { hx, hy, hr } = S;
  ctx.beginPath();
  ctx.moveTo(hx + hr * 0.82, hy - 2);
  ctx.quadraticCurveTo(hx + hr + 2, hy - hr * 0.65, hx + hr * 0.25, hy - hr - 2.8);
  ctx.bezierCurveTo(hx - hr * 0.7, hy - hr - 4, hx - hr - 3, hy - hr * 0.4, hx - hr - 1.6, hy + drop);
  ctx.lineTo(hx - 6, hy + drop);
  ctx.quadraticCurveTo(hx - 1.5, hy + 2, hx + 1, hy - 3.5);
  ctx.quadraticCurveTo(hx + 6, hy - 4.5, hx + hr * 0.82, hy - 2);
  ctx.closePath();
  hairFill(ctx, c);
  shine(ctx, S, c);
}

function cap(ctx: Ctx, S: Skel, c: string, drop: number, fringe: 'soft' | 'straight' | 'curly' = 'soft') {
  if (S.dir === 'front') capFront(ctx, S, c, drop, fringe);
  else if (S.dir === 'back') capBack(ctx, S, c, drop);
  else capSide(ctx, S, c, drop);
}

function longBack(ctx: Ctx, S: Skel, c: string, bottom: number) {
  const { hx, hy, hr } = S;
  if (S.dir === 'side') {
    ctx.beginPath();
    ctx.moveTo(hx - hr - 1.5, hy - 6);
    ctx.lineTo(hx + 2, hy - 6);
    ctx.lineTo(hx - 1, bottom - 4);
    ctx.quadraticCurveTo(hx - 6, bottom + 2, hx - hr - 3.5, bottom - 2);
    ctx.quadraticCurveTo(hx - hr - 4, hy + 10, hx - hr - 1.5, hy - 6);
    ctx.closePath();
  } else {
    const k = S.dir === 'back' ? 1 : 2.6;
    const l = hx - hr - k;
    const r = hx + hr + k;
    ctx.beginPath();
    ctx.moveTo(l, hy - 4);
    ctx.lineTo(r, hy - 4);
    ctx.quadraticCurveTo(r + 1.5, bottom - 10, r - 1, bottom);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const x0 = r - 1 - (i * (r - l - 2)) / n;
      const x1 = r - 1 - ((i + 1) * (r - l - 2)) / n;
      ctx.quadraticCurveTo((x0 + x1) / 2, bottom + 3, x1, bottom);
    }
    ctx.quadraticCurveTo(l - 1.5, bottom - 10, l, hy - 4);
    ctx.closePath();
  }
  const g = ctx.createLinearGradient(0, hy, 0, bottom);
  g.addColorStop(0, c);
  g.addColorStop(1, darken(c, 0.12));
  fs(ctx, g, outlineOf(c), 1.1);
}

function tie(ctx: Ctx, x: number, y: number, col = '#f7a8c8') {
  ellPath(ctx, x, y, 2.4, 2.4);
  fs(ctx, col, undefined, 0.9);
}

function braid(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, c: string) {
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    ellPath(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 3.2 - t * 0.6, 2.8);
    fs(ctx, i % 2 ? c : lighten(c, 0.08), outlineOf(c), 0.9);
  }
  tie(ctx, x1, y1 + 2);
  ctx.beginPath();
  ctx.moveTo(x1 - 2, y1 + 3.5);
  ctx.lineTo(x1, y1 + 8);
  ctx.lineTo(x1 + 2, y1 + 3.5);
  ctx.closePath();
  hairFill(ctx, c);
}

function puff(ctx: Ctx, x: number, y: number, rx: number, ry: number, c: string, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 1, x, y, Math.max(rx, ry));
  g.addColorStop(0, lighten(c, 0.2));
  g.addColorStop(1, c);
  fs(ctx, g, outlineOf(c), 1.1);
}

function curlCloud(ctx: Ctx, S: Skel, c: string) {
  const { hx, hy, hr } = S;
  const pts: number[][] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.85 + (i / 10) * Math.PI * 1.3;
    pts.push([hx + Math.cos(a) * (hr + 4), hy - 1 + Math.sin(a) * (hr + 3.5)]);
  }
  pts.push([hx + hr + 3, hy + 14], [hx - hr - 3, hy + 14]);
  for (const [x, y] of pts) {
    ellPath(ctx, x, y, 6.5, 6.5);
    fs(ctx, c, outlineOf(c), 1.1);
  }
  ellPath(ctx, hx, hy + 2, hr + 4, hr + 3);
  fs(ctx, c, null);
}

const STYLES: Record<string, HairFn> = {
  longo: (ctx, S, c, L) => {
    if (L === 'B') longBack(ctx, S, c, S.dir === 'back' ? 68 : 72);
    else cap(ctx, S, c, 12);
  },
  chiquinhas: (ctx, S, c, L) => {
    const { hx, hy, hr } = S;
    if (L === 'B') {
      if (S.dir === 'side') {
        puff(ctx, hx - hr - 3, hy + 10, 5.5, 10, c, 0.25);
        tie(ctx, hx - hr - 0.5, hy + 0.5);
      } else {
        for (const s of [-1, 1]) {
          puff(ctx, hx + s * (hr + 4), hy + 10, 5.5, 10.5, c, -s * 0.3);
          tie(ctx, hx + s * (hr + 1), hy + 0.5);
        }
      }
    } else cap(ctx, S, c, 5);
  },
  coque: (ctx, S, c, L) => {
    const { hx, hy, hr } = S;
    if (L === 'B') {
      const x = S.dir === 'side' ? hx - 5 : hx;
      puff(ctx, x, hy - hr - 4, 7.5, 7, c);
      ctx.strokeStyle = '#f7a8c8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, hy - hr - 4, 7.8, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else cap(ctx, S, c, 5);
  },
  coques: (ctx, S, c, L) => {
    const { hx, hy, hr } = S;
    if (L === 'B') {
      if (S.dir === 'side') puff(ctx, hx - 6, hy - hr - 1, 6.5, 6.5, c);
      else for (const s of [-1, 1]) puff(ctx, hx + s * 10.5, hy - hr + 1, 6.5, 6.5, c);
    } else cap(ctx, S, c, 5);
  },
  cacheado: (ctx, S, c, L) => {
    if (L === 'B') {
      if (S.dir !== 'side') curlCloud(ctx, S, c);
      else {
        const { hx, hy, hr } = S;
        for (const [dx, dy] of [[-hr - 2, -6], [-hr - 3, 4], [-hr - 1, 13], [-8, -hr - 1], [-hr + 2, -hr + 2], [-4, 14]]) {
          ellPath(ctx, hx + dx, hy + dy, 7, 7);
          fs(ctx, c, outlineOf(c), 1.1);
        }
      }
    } else {
      cap(ctx, S, c, 8, 'curly');
      if (S.dir === 'front') {
        const { hx, hy, hr } = S;
        for (const s of [-1, 1]) {
          ellPath(ctx, hx + s * (hr + 0.5), hy + 4, 3.6, 5);
          fs(ctx, c, outlineOf(c), 1);
        }
      }
    }
  },
  rabo: (ctx, S, c, L) => {
    const { hx, hy, hr } = S;
    if (L === 'B') {
      if (S.dir === 'side') {
        ctx.beginPath();
        ctx.moveTo(hx - hr + 1, hy - 10);
        ctx.quadraticCurveTo(hx - hr - 12, hy - 6, hx - hr - 7, hy + 22);
        ctx.quadraticCurveTo(hx - hr - 2, hy + 10, hx - hr + 3, hy - 4);
        ctx.closePath();
        hairFill(ctx, c);
        tie(ctx, hx - hr, hy - 8);
      } else if (S.dir === 'back') {
        ctx.beginPath();
        ctx.moveTo(hx - 4, hy - 6);
        ctx.quadraticCurveTo(hx - 8, hy + 14, hx, hy + 26);
        ctx.quadraticCurveTo(hx + 8, hy + 14, hx + 4, hy - 6);
        ctx.closePath();
        hairFill(ctx, c);
      } else {
        puff(ctx, hx + hr - 1, hy - hr + 4, 5, 6, c, 0.6);
      }
    } else {
      cap(ctx, S, c, 5);
      if (S.dir === 'back') tie(ctx, hx, hy - 6);
    }
  },
  trancas: (ctx, S, c, L) => {
    const { hx, hy, hr } = S;
    if (L === 'B') {
      if (S.dir === 'back') for (const s of [-1, 1]) braid(ctx, hx + s * 6, hy + 6, hx + s * 8, 66, c);
    } else {
      cap(ctx, S, c, 6);
      if (S.dir === 'front') for (const s of [-1, 1]) braid(ctx, hx + s * (hr - 1), hy + 8, hx + s * (hr - 3), 64, c);
      if (S.dir === 'side') braid(ctx, hx - 6, hy + 8, hx - 9, 63, c);
    }
  },
  chanel: (ctx, S, c, L) => {
    const { hx, hy, hr } = S;
    if (L === 'B') {
      if (S.dir === 'side') {
        rrPath(ctx, hx - hr - 2.5, hy - 6, hr + 4, hr + 4, 7);
      } else {
        rrPath(ctx, hx - hr - 3, hy - 6, hr * 2 + 6, hr + 7, 7);
      }
      hairFill(ctx, c);
    } else cap(ctx, S, c, 13, 'straight');
  },
  curtinho: (ctx, S, c, L) => {
    if (L === 'F') cap(ctx, S, c, 2);
  },
};

export function drawHair(ctx: Ctx, S: Skel, style: string, color: string, layer: 'B' | 'F') {
  (STYLES[style] ?? STYLES.longo)(ctx, S, color, layer);
}
