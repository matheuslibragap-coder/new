/**
 * Funções utilitárias de desenho em Canvas 2D.
 * Todo o visual "fofo" do jogo nasce daqui: formas arredondadas, contornos suaves e gradientes.
 */
export type Ctx = CanvasRenderingContext2D;

const OUT = '#4a3657';

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mistura duas cores (t=0 → a, t=1 → b). */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

export const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
export const darken = (c: string, t: number) => mix(c, '#3a2648', t);
/** Cor de contorno derivada da cor de preenchimento. */
export const outlineOf = (c: string) => mix(c, OUT, 0.62);

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

export function rrPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function ellPath(ctx: Ctx, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
}

export function polyPath(ctx: Ctx, pts: number[][], close = true) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
}

/** Preenche o caminho atual e contorna com uma versão escura da cor. */
export function fs(ctx: Ctx, fill: string | CanvasGradient, stroke?: string | null, lw = 1.1) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke !== null) {
    ctx.strokeStyle = stroke ?? (typeof fill === 'string' ? outlineOf(fill) : OUT);
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

export function vgrad(ctx: Ctx, y0: number, y1: number, c0: string, c1: string) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

export function rgrad(ctx: Ctx, x: number, y: number, r: number, c0: string, c1: string) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

/** Linha grossa com pontas arredondadas e contorno (usada em braços, pernas, mangas…). */
export function capsule(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, w: number, fill: string, stroke?: string) {
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = stroke ?? outlineOf(fill);
  ctx.lineWidth = w + 2.2;
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = w;
  ctx.stroke();
}

export function starPath(ctx: Ctx, cx: number, cy: number, r1: number, r2: number, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = rot + (i * Math.PI) / n;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

export function heartPath(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.3, cy + s * 0.1, cx - s * 0.9, cy - s * 0.95, cx, cy - s * 0.35);
  ctx.bezierCurveTo(cx + s * 0.9, cy - s * 0.95, cx + s * 1.3, cy + s * 0.1, cx, cy + s * 0.9);
  ctx.closePath();
}

export function flowerShape(ctx: Ctx, cx: number, cy: number, r: number, petal: string, center = '#ffe08a', n = 5) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    ellPath(ctx, cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.48, r * 0.48);
    fs(ctx, petal, undefined, 0.8);
  }
  ellPath(ctx, cx, cy, r * 0.36, r * 0.36);
  fs(ctx, center, undefined, 0.8);
}

export function sparkle(ctx: Ctx, cx: number, cy: number, r: number, color = '#ffffff') {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fillStyle = color;
  ctx.fill();
}

export type Pattern = 'none' | 'dots' | 'stripes' | 'hearts' | 'stars' | 'flowers' | 'check' | 'glitter';

/**
 * Preenche um padrão dentro do caminho atual (usa clip).
 * Chame depois de criar o caminho e preencher a cor base.
 */
export function patternFill(ctx: Ctx, p: Pattern, color: string, x: number, y: number, w: number, h: number, s = 1) {
  if (p === 'none') return;
  ctx.save();
  ctx.clip();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  const step = 5 * s;
  if (p === 'dots') {
    for (let yy = y; yy < y + h; yy += step) {
      for (let xx = x + (((yy - y) / step) % 2 ? step / 2 : 0); xx < x + w; xx += step) {
        ellPath(ctx, xx, yy, 0.9 * s, 0.9 * s);
        ctx.fill();
      }
    }
  } else if (p === 'stripes') {
    ctx.lineWidth = 1.4 * s;
    for (let yy = y; yy < y + h; yy += step * 0.9) {
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w, yy);
      ctx.stroke();
    }
  } else if (p === 'check') {
    ctx.globalAlpha = 0.55;
    for (let yy = y, r = 0; yy < y + h; yy += step, r++) {
      for (let xx = x + (r % 2) * step; xx < x + w; xx += step * 2) ctx.fillRect(xx, yy, step, step);
    }
  } else if (p === 'hearts' || p === 'stars' || p === 'flowers' || p === 'glitter') {
    const st = step * 1.5;
    for (let yy = y + 2; yy < y + h; yy += st) {
      for (let xx = x + (((yy - y) / st) % 2 > 0.5 ? st / 2 : 1); xx < x + w; xx += st) {
        if (p === 'hearts') {
          heartPath(ctx, xx, yy, 1.4 * s);
          ctx.fill();
        } else if (p === 'stars') {
          starPath(ctx, xx, yy, 1.8 * s, 0.8 * s);
          ctx.fill();
        } else if (p === 'glitter') {
          sparkle(ctx, xx, yy, 1.5 * s, color);
        } else {
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2;
            ellPath(ctx, xx + Math.cos(a) * 1.1 * s, yy + Math.sin(a) * 1.1 * s, 0.9 * s, 0.9 * s);
            ctx.fill();
          }
        }
      }
    }
  }
  ctx.restore();
}
