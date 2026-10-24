import { darken, ellPath, fs, heartPath, polyPath, sparkle, starPath } from './draw';
import { Iso, isoSpec } from './isoArt';
import { registerFamily } from './registry';

/** Fachadas das casas para a loja e para o painel "Minha Casa" (chave 'house:<id>'). */
function roof(g: Iso, z: number, h: number, col: string, u0 = 0, v0 = 0, du = 2, dv = 2) {
  const ctx = g.ctx;
  const a = g.pt(u0, v0, z);
  const b = g.pt(u0 + du, v0, z);
  const c = g.pt(u0 + du, v0 + dv, z);
  const d = g.pt(u0, v0 + dv, z);
  const top = g.pt(u0 + du / 2, v0 + dv / 2, z + h);
  polyPath(ctx, [d, c, top]);
  fs(ctx, col);
  polyPath(ctx, [c, b, top]);
  fs(ctx, darken(col, 0.12));
  void a;
}

function windowL(g: Iso, u: number, v: number, z: number, col = '#bfe6ff') {
  polyPath(g.ctx, [g.pt(u, v, z), g.pt(u + 0.35, v, z), g.pt(u + 0.35, v, z + 14), g.pt(u, v, z + 14)]);
  fs(g.ctx, col, '#ffffff', 1.5);
}

function windowR(g: Iso, u: number, v: number, z: number, col = '#bfe6ff') {
  polyPath(g.ctx, [g.pt(u, v, z), g.pt(u, v + 0.35, z), g.pt(u, v + 0.35, z + 14), g.pt(u, v, z + 14)]);
  fs(g.ctx, col, '#ffffff', 1.5);
}

const ART: Record<string, { h: number; draw: (g: Iso) => void }> = {
  quartinho: {
    h: 70,
    draw: (g) => {
      g.shadow(1, 1, 1);
      g.box(0.3, 0.3, 0, 1.4, 1.4, 34, '#fff1dc');
      roof(g, 34, 26, '#e3b98c', 0.2, 0.2, 1.6, 1.6);
      windowL(g, 0.6, 1.7, 14);
      windowR(g, 1.7, 0.7, 14);
    },
  },
  apto_rosa: {
    h: 130,
    draw: (g) => {
      g.shadow(1, 1, 1);
      g.box(0.3, 0.3, 0, 1.4, 1.4, 100, '#f7a8c8');
      for (let f = 0; f < 4; f++) {
        windowL(g, 0.45, 1.7, 12 + f * 22);
        windowL(g, 1.1, 1.7, 12 + f * 22);
        windowR(g, 1.7, 0.5, 12 + f * 22);
        windowR(g, 1.7, 1.1, 12 + f * 22);
      }
      const [x, y] = g.pt(1, 1, 100);
      heartPath(g.ctx, x, y - 10, 8);
      fs(g.ctx, '#f2727a');
    },
  },
  casa_praia: {
    h: 90,
    draw: (g) => {
      g.flat(-0.1, -0.1, 0, 2.2, 2.2, '#f8e6b9', null);
      g.box(0.3, 0.3, 0, 1.4, 1.4, 40, '#ffffff');
      roof(g, 40, 22, '#7aa7e8', 0.2, 0.2, 1.6, 1.6);
      const ctx = g.ctx;
      for (const [u, v] of [[0.8, 1.7], [1.7, 0.8]]) {
        const [x, y] = g.pt(u, v, 22);
        ellPath(ctx, x, y, 6, 6);
        fs(ctx, '#bfe6ff', '#7aa7e8', 2);
      }
      g.cyl(1.9, 1.9, 0.03, 0, 50, '#c99d77');
      g.ball(1.9, 1.9, 50, 9, '#8fd18a');
    },
  },
  chale: {
    h: 100,
    draw: (g) => {
      g.shadow(1, 1, 1);
      g.box(0.3, 0.3, 0, 1.4, 1.4, 36, '#c99d77');
      roof(g, 36, 40, '#8f5f78', 0.15, 0.15, 1.7, 1.7);
      windowL(g, 0.7, 1.7, 14, '#ffe9a3');
      windowR(g, 1.7, 0.7, 14, '#ffe9a3');
      g.cyl(0.1, 1.8, 0.04, 0, 30, '#a77b58');
      g.ball(0.1, 1.8, 30, 10, '#7cc499');
    },
  },
  casa_arvore: {
    h: 140,
    draw: (g) => {
      g.shadow(1, 1, 0.8);
      g.cyl(1, 1, 0.22, 0, 70, '#b98458');
      g.ball(0.5, 0.8, 60, 26, '#7fc77f');
      g.ball(1.5, 1.2, 62, 26, '#8fd18a');
      g.box(0.5, 0.5, 70, 1, 1, 30, '#f3d69d');
      roof(g, 100, 22, '#f2727a', 0.4, 0.4, 1.2, 1.2);
      windowL(g, 0.8, 1.5, 80);
      const ctx = g.ctx;
      for (let i = 0; i < 6; i++) {
        const [x, y] = g.pt(1.4, 1.6, i * 11);
        ctx.fillStyle = '#e3b98c';
        ctx.fillRect(x - 6, y - 3, 12, 3);
      }
    },
  },
  castelo_nuvens: {
    h: 150,
    draw: (g) => {
      g.ball(0.4, 1.4, -10, 26, '#ffffff', 14);
      g.ball(1.5, 0.5, -10, 26, '#ffffff', 14);
      g.ball(1, 1, -6, 32, '#f4f8ff', 16);
      g.box(0.4, 0.4, 10, 1.2, 1.2, 50, '#efe6fa');
      for (const [u, v] of [[0.4, 0.4], [1.6, 0.4], [0.4, 1.6], [1.6, 1.6]]) {
        g.cyl(u, v, 0.22, 10, 74, '#f7f2fc');
        const ctx = g.ctx;
        const [x, y] = g.pt(u, v, 84);
        polyPath(ctx, [[x - 15, y], [x, y - 26], [x + 15, y]]);
        fs(ctx, '#c7a8f0');
      }
      const [x, y] = g.pt(1, 1, 60);
      starPath(g.ctx, x, y - 8, 9, 4);
      fs(g.ctx, '#ffd45e');
      sparkle(g.ctx, x + 30, y - 50, 5);
    },
  },
};

registerFamily('house', ([id]) => {
  const a = ART[id];
  if (!a) return null;
  return isoSpec(2, 2, a.h, a.draw);
});
