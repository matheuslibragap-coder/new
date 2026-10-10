import { TILE_H, TILE_W } from '../config';
import { darken, ellPath, fs, lighten, outlineOf, polyPath, rgrad, type Ctx } from './draw';
import type { ArtSpec } from './registry';

const HW = TILE_W / 2;
const HH = TILE_H / 2;

/**
 * "Pintor isométrico": desenha caixas, cilindros e bolas sobre a pegada (footprint)
 * de um objeto de w x d tiles. Usado por objetos dos mapas e pelos móveis.
 * Coordenadas: u (eixo x do mapa, em tiles), v (eixo y do mapa, em tiles), z (altura em px).
 */
export class Iso {
  topX: number;
  topY: number;
  constructor(public ctx: Ctx, public w: number, public d: number, public H: number, pad = 0) {
    this.topX = d * HW + pad;
    this.topY = H - (w + d) * HH;
  }

  pt(u: number, v: number, z = 0): [number, number] {
    return [this.topX + (u - v) * HW, this.topY + (u + v) * HH - z];
  }

  /** Caixa com as três faces visíveis sombreadas. */
  box(u: number, v: number, z: number, du: number, dv: number, dz: number, color: string, opt: { top?: string; lw?: number; stroke?: string } = {}) {
    const { ctx } = this;
    const u1 = u + du;
    const v1 = v + dv;
    const z1 = z + dz;
    const st = opt.stroke ?? outlineOf(color);
    const lw = opt.lw ?? 1;
    polyPath(ctx, [this.pt(u, v1, z), this.pt(u1, v1, z), this.pt(u1, v1, z1), this.pt(u, v1, z1)]);
    fs(ctx, color, st, lw);
    polyPath(ctx, [this.pt(u1, v, z), this.pt(u1, v1, z), this.pt(u1, v1, z1), this.pt(u1, v, z1)]);
    fs(ctx, darken(color, 0.16), st, lw);
    polyPath(ctx, [this.pt(u, v, z1), this.pt(u1, v, z1), this.pt(u1, v1, z1), this.pt(u, v1, z1)]);
    fs(ctx, opt.top ?? lighten(color, 0.28), st, lw);
  }

  /** Losango plano (tapetes, sombras, tampos). */
  flat(u: number, v: number, z: number, du: number, dv: number, color: string, stroke?: string | null, lw = 1) {
    polyPath(this.ctx, [this.pt(u, v, z), this.pt(u + du, v, z), this.pt(u + du, v + dv, z), this.pt(u, v + dv, z)]);
    fs(this.ctx, color, stroke, lw);
  }

  /** Cilindro vertical com centro (cu, cv) e raio r em tiles. */
  cyl(cu: number, cv: number, r: number, z: number, h: number, color: string, top?: string) {
    const { ctx } = this;
    const [x, y] = this.pt(cu, cv, z);
    const rx = r * HW * Math.SQRT2;
    const ry = r * HH * Math.SQRT2;
    const st = outlineOf(color);
    ctx.beginPath();
    ctx.moveTo(x - rx, y - h);
    ctx.lineTo(x - rx, y);
    ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(x + rx, y - h);
    ctx.closePath();
    const g = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
    g.addColorStop(0, lighten(color, 0.1));
    g.addColorStop(1, darken(color, 0.18));
    fs(ctx, g, st, 1);
    ellPath(ctx, x, y - h, rx, ry);
    fs(ctx, top ?? lighten(color, 0.25), st, 1);
  }

  /** Bola com brilho (copas de árvores, arbustos, doces…). */
  ball(cu: number, cv: number, z: number, r: number, color: string, ry?: number) {
    const [x, y] = this.pt(cu, cv, z);
    ellPath(this.ctx, x, y - r, r, ry ?? r);
    fs(this.ctx, rgrad(this.ctx, x, y - r, r, lighten(color, 0.35), color), outlineOf(color), 1);
  }

  shadow(cu: number, cv: number, r: number, alpha = 0.18) {
    const [x, y] = this.pt(cu, cv, 0);
    ellPath(this.ctx, x, y, r * HW * 1.3, r * HH * 1.3);
    this.ctx.fillStyle = `rgba(74,54,87,${alpha})`;
    this.ctx.fill();
  }
}

/** Monta um ArtSpec para um objeto de pegada w x d e altura h (px). */
export function isoSpec(w: number, d: number, h: number, draw: (g: Iso) => void, pad = 10): ArtSpec {
  const H = (w + d) * HH + h + 4;
  return {
    w: (w + d) * HW + pad * 2,
    h: H,
    ox: w * HW + pad,
    oy: H - 2,
    draw: (ctx) => draw(new Iso(ctx, w, d, H - 2, pad)),
  };
}
