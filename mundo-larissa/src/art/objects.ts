import {
  darken, ellPath, flowerShape, fs, heartPath, lighten, outlineOf, polyPath, rgrad, rrPath, sparkle, starPath, vgrad,
} from './draw';
import { Iso, isoSpec } from './isoArt';
import { P } from './palette';
import { registerFamily } from './registry';

/**
 * Objetos de cenário dos mapas. Cada objeto tem:
 *  - w, d: pegada em tiles (quantos tiles ocupa no chão)
 *  - h: altura do desenho em px
 *  - solid: se bloqueia a passagem (padrão: true)
 *  - draw: desenho isométrico
 */
export interface ObjDef {
  w: number;
  d: number;
  h: number;
  solid?: boolean;
  draw: (g: Iso) => void;
}

// ------------------------------------------------------------------ peças reutilizáveis
function tree(g: Iso, cu: number, cv: number, canopy: string, trunkH = 26, r = 18, fruit?: string) {
  g.shadow(cu, cv, 0.45);
  g.cyl(cu, cv, 0.09, 0, trunkH, '#b98458');
  g.ball(cu - 0.18, cv + 0.12, trunkH - 6, r * 0.75, darken(canopy, 0.05));
  g.ball(cu + 0.18, cv - 0.12, trunkH - 4, r * 0.78, canopy);
  g.ball(cu, cv, trunkH + 8, r, lighten(canopy, 0.05));
  if (fruit) {
    const ctx = g.ctx;
    const [x, y] = g.pt(cu, cv, trunkH + 8);
    for (const [dx, dy] of [[-8, -14], [7, -20], [-2, -26], [10, -8], [-11, -4]]) {
      ellPath(ctx, x + dx, y + dy, 2.6, 2.6);
      fs(ctx, fruit, undefined, 0.8);
    }
  }
}

function pineTree(g: Iso, cu: number, cv: number, col: string, snow = false) {
  g.shadow(cu, cv, 0.4);
  g.cyl(cu, cv, 0.08, 0, 14, '#a8744e');
  const ctx = g.ctx;
  const [x, y] = g.pt(cu, cv, 0);
  for (let i = 0; i < 3; i++) {
    const yy = y - 14 - i * 16;
    const w = 20 - i * 5;
    polyPath(ctx, [[x - w, yy], [x + w, yy], [x, yy - 26]]);
    fs(ctx, i % 2 ? col : lighten(col, 0.08));
    if (snow) {
      polyPath(ctx, [[x - w * 0.45, yy - 14], [x + w * 0.45, yy - 14], [x, yy - 26]]);
      fs(ctx, '#ffffff', '#cfe0ee', 0.8);
    }
  }
}

function crystal(g: Iso, cu: number, cv: number, col: string, h = 40, w = 9) {
  const ctx = g.ctx;
  const [x, y] = g.pt(cu, cv, 0);
  polyPath(ctx, [[x - w, y - 4], [x - w * 0.8, y - h * 0.7], [x, y - h], [x + w * 0.8, y - h * 0.7], [x + w, y - 4], [x, y + 2]]);
  fs(ctx, vgrad(ctx, y - h, y, lighten(col, 0.5), col), outlineOf(col));
  polyPath(ctx, [[x, y - h], [x, y + 2], [x + w, y - 4], [x + w * 0.8, y - h * 0.7]]);
  ctx.fillStyle = 'rgba(74,54,87,0.12)';
  ctx.fill();
  sparkle(ctx, x - w * 0.35, y - h * 0.6, 3);
}

function signBoard(g: Iso, cu: number, cv: number, board: string, h = 34) {
  g.cyl(cu, cv, 0.05, 0, h, P.woodDark);
  const ctx = g.ctx;
  const [x, y] = g.pt(cu, cv, h);
  rrPath(ctx, x - 14, y - 12, 28, 16, 4);
  fs(ctx, board);
}

function personSeat(g: Iso, col: string) {
  g.box(0.2, 0.2, 0, 0.6, 0.6, 14, col);
  g.box(0.2, 0.2, 14, 0.15, 0.6, 18, darken(col, 0.05));
}

function cake(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, cols: string[]) {
  let yy = y;
  cols.forEach((c, i) => {
    const w = s * (1 - i * 0.18);
    rrPath(ctx, x - w, yy - s * 0.55, w * 2, s * 0.6, 2);
    fs(ctx, c);
    yy -= s * 0.55;
  });
  ellPath(ctx, x, yy - 2, 2.5, 2.5);
  fs(ctx, P.red);
}

function stall(g: Iso, roofA: string, roofB: string, counter: string) {
  g.box(0.1, 0.15, 0, 1.8, 0.7, 22, counter);
  g.cyl(0.15, 0.2, 0.04, 0, 62, '#f3efe9');
  g.cyl(1.85, 0.2, 0.04, 0, 62, '#f3efe9');
  g.cyl(0.15, 0.8, 0.04, 22, 40, '#f3efe9');
  g.cyl(1.85, 0.8, 0.04, 22, 40, '#f3efe9');
  const ctx = g.ctx;
  for (let i = 0; i < 6; i++) {
    const u0 = (i / 6) * 2;
    const u1 = ((i + 1) / 6) * 2;
    polyPath(ctx, [g.pt(u0, 0, 62), g.pt(u1, 0, 62), g.pt(u1, 1.05, 52), g.pt(u0, 1.05, 52)]);
    fs(ctx, i % 2 ? roofA : roofB, outlineOf(roofA), 0.8);
  }
  // babadinho
  for (let i = 0; i < 6; i++) {
    const [x, y] = g.pt((i + 0.5) / 3, 1.05, 52);
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI);
    fs(ctx, i % 2 ? roofA : roofB, outlineOf(roofA), 0.8);
  }
}

function animalCat(g: Iso, col: string, cu = 0.5, cv = 0.5, sleeping = false) {
  const ctx = g.ctx;
  const [x, y] = g.pt(cu, cv, 0);
  g.shadow(cu, cv, 0.25);
  if (sleeping) {
    ellPath(ctx, x, y - 6, 11, 7);
    fs(ctx, col);
    ellPath(ctx, x - 7, y - 9, 6, 5.5);
    fs(ctx, col);
    ctx.strokeStyle = outlineOf(col);
    ctx.beginPath();
    ctx.arc(x - 9, y - 9, 1.5, 0, Math.PI);
    ctx.arc(x - 5, y - 9, 1.5, 0, Math.PI);
    ctx.stroke();
    return;
  }
  // rabinho
  ctx.strokeStyle = outlineOf(col);
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 6);
  ctx.quadraticCurveTo(x + 15, y - 10, x + 12, y - 20);
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ellPath(ctx, x, y - 7, 8, 7);
  fs(ctx, col);
  // cabeça
  polyPath(ctx, [[x - 8, y - 18], [x - 7, y - 27], [x - 2, y - 21]]);
  fs(ctx, col);
  polyPath(ctx, [[x + 8, y - 18], [x + 7, y - 27], [x + 2, y - 21]]);
  fs(ctx, col);
  ellPath(ctx, x, y - 17, 9, 7.5);
  fs(ctx, col);
  ellPath(ctx, x - 3.2, y - 17.5, 1.4, 1.8);
  ellPath(ctx, x + 3.2, y - 17.5, 1.4, 1.8);
  ctx.fillStyle = P.ink;
  ctx.fill();
  ellPath(ctx, x, y - 14.5, 1.2, 0.8);
  ctx.fillStyle = P.pinkDeep;
  ctx.fill();
}

function bird(ctx: CanvasRenderingContext2D, x: number, y: number, col: string, flip = false) {
  const s = flip ? -1 : 1;
  ellPath(ctx, x, y, 5, 4.3);
  fs(ctx, col);
  polyPath(ctx, [[x + s * 4.5, y - 1], [x + s * 7.5, y], [x + s * 4.5, y + 1]]);
  fs(ctx, P.gold);
  ellPath(ctx, x + s * 2, y - 1.2, 0.9, 0.9);
  ctx.fillStyle = P.ink;
  ctx.fill();
  ellPath(ctx, x - s * 1, y + 0.5, 2.6, 1.8);
  fs(ctx, lighten(col, 0.35), undefined, 0.6);
}

function stationSparkles(g: Iso, z: number) {
  const ctx = g.ctx;
  const [x, y] = g.pt(0.5, 0.5, z);
  sparkle(ctx, x - 14, y - 4, 4, '#fff7b0');
  sparkle(ctx, x + 15, y - 12, 3, '#ffffff');
}

// ------------------------------------------------------------------ catálogo
export const OBJECTS: Record<string, ObjDef> = {
  // ---------- natureza
  arvore: { w: 1, d: 1, h: 92, draw: (g) => tree(g, 0.5, 0.5, '#8fd18a', 30, 20) },
  arvore_rosa: { w: 1, d: 1, h: 92, draw: (g) => tree(g, 0.5, 0.5, '#f7b8d2', 30, 20) },
  arvore_lilas: { w: 1, d: 1, h: 92, draw: (g) => tree(g, 0.5, 0.5, '#c9b2f0', 30, 20) },
  macieira: { w: 1, d: 1, h: 92, draw: (g) => tree(g, 0.5, 0.5, '#8fd18a', 28, 20, '#f2727a') },
  laranjeira: { w: 1, d: 1, h: 92, draw: (g) => tree(g, 0.5, 0.5, '#86c97b', 28, 20, '#ffb347') },
  pinheiro: { w: 1, d: 1, h: 96, draw: (g) => pineTree(g, 0.5, 0.5, '#7cc499') },
  pinheiro_neve: { w: 1, d: 1, h: 96, draw: (g) => pineTree(g, 0.5, 0.5, '#7cc4a6', true) },
  coqueiro: {
    w: 1, d: 1, h: 104,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.45);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#a77b52';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 10, y - 40, x + 4, y - 78);
      ctx.stroke();
      ctx.strokeStyle = '#d6a878';
      ctx.lineWidth = 6.5;
      ctx.stroke();
      const top: [number, number] = [x + 4, y - 80];
      for (const a of [-2.7, -2.0, -1.2, -0.4, 0.3, 3.4]) {
        ctx.beginPath();
        ctx.moveTo(top[0], top[1]);
        const ex = top[0] + Math.cos(a) * 30;
        const ey = top[1] + Math.sin(a) * 14 + 10;
        ctx.quadraticCurveTo(top[0] + Math.cos(a) * 18, top[1] + Math.sin(a) * 18 - 8, ex, ey);
        ctx.strokeStyle = '#5fae6b';
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.strokeStyle = '#8fd18a';
        ctx.lineWidth = 5.5;
        ctx.stroke();
      }
      for (const [dx, dy] of [[-3, 2], [4, 3]]) {
        ellPath(ctx, top[0] + dx, top[1] + dy, 3.5, 3.5);
        fs(ctx, '#a6774f');
      }
    },
  },
  arbusto: {
    w: 1, d: 1, h: 34,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.4);
      g.ball(0.3, 0.6, 0, 11, '#7fc77f');
      g.ball(0.7, 0.4, 0, 11, '#7fc77f');
      g.ball(0.5, 0.5, 4, 13, '#94d690');
    },
  },
  arbusto_flor: {
    w: 1, d: 1, h: 34,
    draw: (g) => {
      OBJECTS.arbusto.draw(g);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      for (const [dx, dy] of [[-8, -14], [6, -20], [0, -26], [10, -10]]) flowerShape(ctx, x + dx, y + dy, 3, P.pink, P.yellow);
    },
  },
  canteiro: {
    w: 1, d: 1, h: 26,
    draw: (g) => {
      g.box(0.08, 0.08, 0, 0.84, 0.84, 10, '#e3b98c');
      g.flat(0.14, 0.14, 10.2, 0.72, 0.72, '#a07456', null);
      const ctx = g.ctx;
      const cols = [P.pink, '#fff', P.lilac, P.yellow, P.coral];
      let i = 0;
      for (const u of [0.3, 0.5, 0.7]) {
        for (const v of [0.3, 0.5, 0.7]) {
          const [x, y] = g.pt(u, v, 14);
          ctx.strokeStyle = '#5fae6b';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, y + 4);
          ctx.lineTo(x, y);
          ctx.stroke();
          flowerShape(ctx, x, y, 3.2, cols[i++ % cols.length], P.yellow);
        }
      }
    },
  },
  girassol: {
    w: 1, d: 1, h: 60,
    draw: (g) => {
      const ctx = g.ctx;
      for (const [u, v, hh] of [[0.3, 0.4, 44], [0.65, 0.35, 52], [0.5, 0.7, 38]]) {
        const [x, y] = g.pt(u, v, 0);
        ctx.strokeStyle = '#5fae6b';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - hh);
        ctx.stroke();
        ellPath(ctx, x + 4, y - hh * 0.5, 4, 2);
        fs(ctx, P.leaf);
        flowerShape(ctx, x, y - hh, 8, '#ffd84d', '#a0683f', 10);
      }
    },
  },
  cogumelo: {
    w: 1, d: 1, h: 46,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.35);
      g.cyl(0.5, 0.5, 0.12, 0, 20, '#fff4e6');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 20);
      ctx.beginPath();
      ctx.ellipse(x, y, 20, 16, 0, Math.PI, 0);
      ctx.closePath();
      fs(ctx, rgrad(ctx, x, y - 8, 20, '#ffc7e0', '#e98bb5'));
      for (const [dx, dy, r] of [[-9, -6, 3], [4, -11, 3.5], [11, -4, 2.5], [-2, -3, 2]]) {
        ellPath(ctx, x + dx, y + dy, r, r * 0.85);
        fs(ctx, '#fff', null);
      }
    },
  },
  pedra: {
    w: 1, d: 1, h: 26,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.4);
      g.ball(0.4, 0.55, -4, 13, '#cfc6dc', 10);
      g.ball(0.65, 0.4, -2, 9, '#ddd5e8', 8);
    },
  },
  cristal_rosa: { w: 1, d: 1, h: 56, draw: (g) => { g.shadow(0.5, 0.5, 0.4); crystal(g, 0.35, 0.6, '#f7a8c8', 34, 7); crystal(g, 0.6, 0.45, '#f7a8c8', 48, 9); } },
  cristal_azul: { w: 1, d: 1, h: 56, draw: (g) => { g.shadow(0.5, 0.5, 0.4); crystal(g, 0.4, 0.55, '#9fd3f7', 50, 9); crystal(g, 0.7, 0.6, '#9fd3f7', 28, 6); } },
  cristal_lilas: { w: 1, d: 1, h: 66, draw: (g) => { g.shadow(0.5, 0.5, 0.4); crystal(g, 0.5, 0.5, '#c7a8f0', 60, 11); } },
  cristal_verde: { w: 1, d: 1, h: 56, draw: (g) => { g.shadow(0.5, 0.5, 0.4); crystal(g, 0.3, 0.5, '#9fe3c9', 40, 8); crystal(g, 0.65, 0.55, '#9fe3c9', 30, 7); } },
  arvore_magica: {
    w: 1, d: 1, h: 100,
    draw: (g) => {
      tree(g, 0.5, 0.5, '#b9a4ef', 32, 20);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 40);
      for (const [dx, dy] of [[-12, -10], [10, -22], [0, -32], [14, -4], [-6, -24]]) sparkle(ctx, x + dx, y + dy, 3.5, '#fff7b0');
    },
  },
  vaso_planta: {
    w: 1, d: 1, h: 52,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.3);
      g.cyl(0.5, 0.5, 0.2, 0, 16, '#f2a98f');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 16);
      for (const a of [-2.4, -1.9, -1.5, -1.1, -0.7]) {
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 12, y + Math.sin(a) * 16, 4.5, 11, a + Math.PI / 2, 0, Math.PI * 2);
        fs(ctx, '#86cf86');
      }
    },
  },
  // ---------- praça
  banco: {
    w: 1, d: 1, h: 34,
    draw: (g) => {
      g.box(0.15, 0.3, 0, 0.08, 0.08, 10, '#8a7a9a');
      g.box(0.77, 0.3, 0, 0.08, 0.08, 10, '#8a7a9a');
      g.box(0.1, 0.25, 10, 0.8, 0.45, 4, '#e8b98a');
      g.box(0.1, 0.18, 14, 0.8, 0.08, 14, '#e8b98a');
    },
  },
  poste: {
    w: 1, d: 1, h: 92,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.2);
      g.cyl(0.5, 0.5, 0.1, 0, 6, '#7b6d92');
      g.cyl(0.5, 0.5, 0.04, 6, 64, '#8d7fa6');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 70);
      ellPath(ctx, x, y - 6, 9, 9);
      fs(ctx, rgrad(ctx, x, y - 6, 9, '#ffffff', '#ffe9a3'), '#c9a54f');
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 13);
      ctx.quadraticCurveTo(x, y - 24, x + 10, y - 13);
      ctx.closePath();
      fs(ctx, '#8d7fa6');
    },
  },
  fonte: {
    w: 2, d: 2, h: 76,
    draw: (g) => {
      g.shadow(1, 1, 1.1, 0.15);
      g.cyl(1, 1, 0.85, 0, 14, '#e6dff0', '#e6dff0');
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 1, 14);
      ellPath(ctx, x, y, 0.72 * 45, 0.72 * 22.6);
      fs(ctx, '#9fd8f5', '#7cbde0');
      g.cyl(1, 1, 0.12, 14, 26, '#e6dff0');
      g.cyl(1, 1, 0.38, 40, 6, '#e6dff0', '#9fd8f5');
      g.cyl(1, 1, 0.08, 46, 12, '#e6dff0');
      const [tx, ty] = g.pt(1, 1, 58);
      ctx.strokeStyle = 'rgba(200,238,255,0.95)';
      ctx.lineWidth = 2.2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(tx + s * 14, ty - 12, tx + s * 18, ty + 12);
        ctx.stroke();
      }
      heartPath(ctx, tx, ty - 6, 5);
      fs(ctx, P.pink);
    },
  },
  comedouro: {
    w: 1, d: 1, h: 86,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.3);
      g.cyl(0.5, 0.5, 0.05, 0, 46, P.woodDark);
      g.box(0.22, 0.22, 46, 0.56, 0.56, 4, P.wood);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 50);
      polyPath(ctx, [[x - 20, y], [x, y - 22], [x + 20, y]]);
      fs(ctx, P.pinkDeep);
      bird(ctx, x - 10, y + 4, P.sky);
      bird(ctx, x + 10, y + 6, P.yellow, true);
      bird(ctx, x + 2, y - 30, P.pink);
      stationSparkles(g, 70);
    },
  },
  placa: {
    w: 1, d: 1, h: 52,
    draw: (g) => signBoard(g, 0.5, 0.5, '#fff1dc'),
  },
  portal: {
    w: 1, d: 1, h: 40, solid: false,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      ellPath(ctx, x, y, 26, 13);
      const gr = ctx.createRadialGradient(x, y, 2, x, y, 26);
      gr.addColorStop(0, 'rgba(255,255,255,0.95)');
      gr.addColorStop(0.6, 'rgba(247,168,200,0.75)');
      gr.addColorStop(1, 'rgba(199,168,240,0.15)');
      ctx.fillStyle = gr;
      ctx.fill();
      ellPath(ctx, x, y, 20, 10);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      sparkle(ctx, x - 12, y - 14, 4, '#fff7b0');
      sparkle(ctx, x + 14, y - 22, 3, '#fff');
      sparkle(ctx, x + 2, y - 30, 3.5, '#ffd6ea');
    },
  },
  // ---------- shopping
  arara: {
    w: 2, d: 1, h: 64,
    draw: (g) => {
      g.box(0.1, 0.35, 0, 0.08, 0.3, 50, '#b8aecb');
      g.box(1.82, 0.35, 0, 0.08, 0.3, 50, '#b8aecb');
      g.box(0.1, 0.45, 48, 1.8, 0.1, 3, '#d9d2e3');
      const ctx = g.ctx;
      const cols = [P.pink, P.sky, P.yellow, P.lilac, P.mint, P.coral];
      for (let i = 0; i < 6; i++) {
        const [x, y] = g.pt(0.3 + i * 0.27, 0.5, 46);
        polyPath(ctx, [[x - 4, y], [x + 4, y], [x + 8, y + 26], [x - 8, y + 26]]);
        fs(ctx, cols[i]);
      }
    },
  },
  manequim: {
    w: 1, d: 1, h: 74,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.25);
      g.cyl(0.5, 0.5, 0.18, 0, 4, '#b8aecb');
      g.cyl(0.5, 0.5, 0.03, 4, 26, '#b8aecb');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 30);
      polyPath(ctx, [[x - 6, y - 30], [x + 6, y - 30], [x + 15, y + 2], [x - 15, y + 2]]);
      fs(ctx, P.pink);
      ctx.save();
      polyPath(ctx, [[x - 6, y - 30], [x + 6, y - 30], [x + 15, y + 2], [x - 15, y + 2]]);
      ctx.clip();
      for (let i = 0; i < 5; i++) {
        heartPath(ctx, x - 9 + i * 5, y - 10 + (i % 2) * 6, 1.8);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      ctx.restore();
      ellPath(ctx, x, y - 34, 5, 5);
      fs(ctx, '#efe9f5');
    },
  },
  balcao: {
    w: 2, d: 1, h: 46,
    draw: (g) => {
      g.box(0.05, 0.1, 0, 1.9, 0.8, 26, '#f7c5dc', { top: '#fff4f9' });
      g.box(1.2, 0.3, 26, 0.5, 0.35, 10, '#c7a8f0');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.6, 0.5, 26);
      heartPath(ctx, x, y - 6, 5);
      fs(ctx, P.pinkDeep);
    },
  },
  prateleira_bolsas: {
    w: 1, d: 1, h: 80,
    draw: (g) => {
      g.box(0.15, 0.15, 0, 0.7, 0.7, 64, '#fff0f7', { top: '#ffffff' });
      const ctx = g.ctx;
      const cols = [P.lilac, P.coral, P.mint];
      for (let i = 0; i < 3; i++) {
        const [x, y] = g.pt(0.85, 0.5, 14 + i * 18);
        g.box(0.15, 0.85, 12 + i * 18, 0.7, 0.02, 2, '#e8c9db');
        rrPath(ctx, x - 14, y - 10, 11, 9, 3);
        fs(ctx, cols[i]);
        ctx.beginPath();
        ctx.arc(x - 8.5, y - 10, 3.5, Math.PI, 0);
        ctx.strokeStyle = outlineOf(cols[i]);
        ctx.stroke();
      }
    },
  },
  espelho_pe: {
    w: 1, d: 1, h: 76,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.25);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      ellPath(ctx, x, y - 38, 14, 30);
      fs(ctx, '#f2c14e');
      ellPath(ctx, x, y - 38, 10.5, 26);
      const gr = ctx.createLinearGradient(x - 10, y - 60, x + 10, y - 10);
      gr.addColorStop(0, '#ffffff');
      gr.addColorStop(0.5, '#cfe9fb');
      gr.addColorStop(1, '#eef8ff');
      fs(ctx, gr, '#c9a54f');
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 52);
      ctx.lineTo(x + 2, y - 58);
      ctx.stroke();
    },
  },
  passarela: {
    w: 2, d: 2, h: 50,
    draw: (g) => {
      g.box(0, 0, 0, 2, 2, 8, '#f7a8c8', { top: '#fde3ef' });
      const ctx = g.ctx;
      for (let i = 0; i < 5; i++) {
        const [x, y] = g.pt(0.2 + i * 0.4, 1.9, 8);
        ellPath(ctx, x, y - 2, 2.5, 2.5);
        fs(ctx, '#fff7b0', '#e4c86a', 0.8);
      }
      const [cx, cy] = g.pt(1, 1, 8);
      starPath(ctx, cx, cy - 26, 16, 7);
      fs(ctx, rgrad(ctx, cx, cy - 26, 16, '#fff7c4', '#f2c14e'), '#c9a54f');
      sparkle(ctx, cx + 20, cy - 36, 4);
      sparkle(ctx, cx - 22, cy - 18, 3);
    },
  },
  // ---------- salão
  cadeira_salao: {
    w: 1, d: 1, h: 76,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.3);
      g.cyl(0.5, 0.5, 0.08, 0, 12, '#b8aecb');
      g.box(0.2, 0.2, 12, 0.6, 0.6, 8, '#c7a8f0');
      g.box(0.2, 0.2, 20, 0.12, 0.6, 22, '#c7a8f0');
      g.cyl(0.25, 0.5, 0.06, 42, 14, '#d9d2e3');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.35, 0.5, 58);
      ctx.beginPath();
      ctx.ellipse(x + 4, y, 15, 11, 0, Math.PI * 0.9, Math.PI * 2.1);
      ctx.closePath();
      fs(ctx, rgrad(ctx, x, y - 6, 14, '#ffffff', '#f7c5dc'));
    },
  },
  penteadeira: {
    w: 1, d: 1, h: 84,
    draw: (g) => {
      g.box(0.1, 0.2, 0, 0.8, 0.6, 26, '#ffffff', { top: '#fdf1f7' });
      g.box(0.1, 0.2, 26, 0.8, 0.08, 46, '#f7c5dc');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.25, 50);
      ctx.save();
      ctx.transform(1, 0.5, 0, 1, 0, 0);
      ctx.restore();
      ellPath(ctx, x, y - 2, 11, 15);
      const gr = ctx.createLinearGradient(x - 10, y - 16, x + 10, y + 12);
      gr.addColorStop(0, '#ffffff');
      gr.addColorStop(1, '#cfe9fb');
      fs(ctx, gr, '#e9a3c0', 1.5);
      const [bx, by] = g.pt(0.4, 0.55, 26);
      rrPath(ctx, bx - 3, by - 9, 5, 9, 1.5);
      fs(ctx, P.mint);
      rrPath(ctx, bx + 5, by - 7, 5, 7, 1.5);
      fs(ctx, P.coral);
    },
  },
  lavatorio: {
    w: 1, d: 1, h: 56,
    draw: (g) => {
      g.box(0.15, 0.25, 0, 0.7, 0.55, 26, '#e5f7f1', { top: '#ffffff' });
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.52, 26);
      ellPath(ctx, x, y, 14, 7);
      fs(ctx, '#cfeefd', '#9fc4d8');
      g.cyl(0.5, 0.3, 0.04, 26, 16, '#d9d2e3');
    },
  },
  prateleira_produtos: {
    w: 1, d: 1, h: 76,
    draw: (g) => {
      g.box(0.15, 0.2, 0, 0.7, 0.55, 60, '#fff4e6', { top: '#fffaf3' });
      const ctx = g.ctx;
      const cols = [P.pink, P.mint, P.lilac, P.yellow, P.sky, P.coral];
      for (let s = 0; s < 3; s++) {
        for (let i = 0; i < 3; i++) {
          const [x, y] = g.pt(0.85, 0.3 + i * 0.2, 8 + s * 19);
          rrPath(ctx, x - 2.5, y - 11, 5, 11, 2);
          fs(ctx, cols[(s * 3 + i) % cols.length], undefined, 0.8);
        }
      }
    },
  },
  secador: {
    w: 1, d: 1, h: 70,
    draw: (g) => {
      OBJECTS.cadeira_salao.draw(g);
      stationSparkles(g, 60);
    },
  },
  // ---------- confeitaria
  vitrine_bolos: {
    w: 2, d: 1, h: 60,
    draw: (g) => {
      g.box(0.05, 0.1, 0, 1.9, 0.8, 24, '#ffd8e6', { top: '#fff' });
      const ctx = g.ctx;
      const cs = [['#fff3dc', '#f7a8c8'], ['#c99d77', '#fff3dc'], ['#d6f5e6', '#f7a8c8']];
      cs.forEach((c, i) => {
        const [x, y] = g.pt(0.4 + i * 0.6, 0.5, 24);
        cake(ctx, x, y, 8, c);
      });
      // vidro
      polyPath(ctx, [g.pt(0.05, 0.9, 24), g.pt(1.95, 0.9, 24), g.pt(1.95, 0.9, 46), g.pt(0.05, 0.9, 46)]);
      ctx.fillStyle = 'rgba(220,240,255,0.35)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.stroke();
    },
  },
  mesa_cafe: {
    w: 1, d: 1, h: 46,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.35);
      g.cyl(0.5, 0.5, 0.05, 0, 22, '#b8aecb');
      g.cyl(0.5, 0.5, 0.32, 22, 4, '#ffffff', '#fdf1f7');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 26);
      rrPath(ctx, x - 5, y - 8, 10, 7, 2);
      fs(ctx, '#f2c1a0');
      ellPath(ctx, x, y - 10, 6, 4);
      fs(ctx, P.pink);
      ellPath(ctx, x, y - 14, 1.8, 1.8);
      fs(ctx, P.red);
    },
  },
  cadeira: { w: 1, d: 1, h: 46, draw: (g) => personSeat(g, '#f7c5dc') },
  cadeira_azul: { w: 1, d: 1, h: 46, draw: (g) => personSeat(g, '#bfe3fb') },
  forno: {
    w: 1, d: 1, h: 60,
    draw: (g) => {
      g.box(0.1, 0.15, 0, 0.8, 0.7, 44, '#ffe1cf', { top: '#fff3e8' });
      const ctx = g.ctx;
      polyPath(ctx, [g.pt(0.2, 0.85, 8), g.pt(0.8, 0.85, 8), g.pt(0.8, 0.85, 30), g.pt(0.2, 0.85, 30)]);
      fs(ctx, '#ffb28a');
      polyPath(ctx, [g.pt(0.28, 0.85, 12), g.pt(0.72, 0.85, 12), g.pt(0.72, 0.85, 26), g.pt(0.28, 0.85, 26)]);
      fs(ctx, '#ffe2a6');
    },
  },
  bolo_gigante: {
    w: 1, d: 1, h: 84,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.4);
      g.cyl(0.5, 0.5, 0.06, 0, 10, '#d9d2e3');
      g.cyl(0.5, 0.5, 0.42, 10, 3, '#ffffff');
      g.cyl(0.5, 0.5, 0.36, 13, 16, '#fbd0e2', '#fff3f8');
      g.cyl(0.5, 0.5, 0.27, 29, 14, '#fff3dc', '#fffaf0');
      g.cyl(0.5, 0.5, 0.18, 43, 12, '#d6f5e6', '#f2fff9');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 55);
      ellPath(ctx, x, y - 3, 4, 4);
      fs(ctx, P.red);
      stationSparkles(g, 60);
    },
  },
  // ---------- parque das flores
  coreto: {
    w: 2, d: 2, h: 110,
    draw: (g) => {
      g.cyl(1, 1, 0.9, 0, 6, '#f3efe9');
      for (const [u, v] of [[0.35, 0.35], [1.65, 0.35], [0.35, 1.65], [1.65, 1.65]]) g.cyl(u, v, 0.05, 6, 56, '#fffaf7');
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 1, 62);
      polyPath(ctx, [[x - 58, y + 2], [x, y - 40], [x + 58, y + 2], [x, y + 28]]);
      fs(ctx, '#f7a8c8');
      polyPath(ctx, [[x - 58, y + 2], [x, y + 28], [x + 58, y + 2], [x + 58, y + 7], [x, y + 33], [x - 58, y + 7]]);
      fs(ctx, '#e9739f');
      ellPath(ctx, x, y - 42, 4, 4);
      fs(ctx, P.gold);
    },
  },
  horta: {
    w: 2, d: 2, h: 40,
    draw: (g) => {
      g.box(0.05, 0.05, 0, 1.9, 1.9, 8, '#c69a74', { top: '#a8784f' });
      const ctx = g.ctx;
      for (let u = 0; u < 3; u++) {
        for (let v = 0; v < 3; v++) {
          const [x, y] = g.pt(0.35 + u * 0.65, 0.35 + v * 0.65, 8);
          ctx.strokeStyle = '#5fae6b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y - 7);
          ctx.stroke();
          ellPath(ctx, x - 3, y - 7, 3, 1.6);
          fs(ctx, P.leaf, undefined, 0.6);
          ellPath(ctx, x + 3, y - 8, 3, 1.6);
          fs(ctx, P.leaf, undefined, 0.6);
        }
      }
      const [x, y] = g.pt(1.7, 0.4, 8);
      // regador
      rrPath(ctx, x - 7, y - 14, 12, 12, 3);
      fs(ctx, P.sky);
      ctx.beginPath();
      ctx.moveTo(x + 4, y - 10);
      ctx.lineTo(x + 12, y - 16);
      ctx.strokeStyle = outlineOf(P.sky);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      stationSparkles(g, 24);
    },
  },
  borboleta: {
    w: 1, d: 1, h: 50, solid: false,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 34);
      for (const s of [-1, 1]) {
        ellPath(ctx, x + s * 5, y - 3, 5, 6);
        fs(ctx, P.lilac);
        ellPath(ctx, x + s * 4, y + 4, 3.5, 4);
        fs(ctx, P.pink);
      }
      rrPath(ctx, x - 1, y - 6, 2, 12, 1);
      fs(ctx, P.ink, null);
    },
  },
  // ---------- clínica
  maca: {
    w: 2, d: 1, h: 46,
    draw: (g) => {
      g.box(0.15, 0.3, 0, 0.08, 0.08, 22, '#b8aecb');
      g.box(1.75, 0.3, 0, 0.08, 0.08, 22, '#b8aecb');
      g.box(0.1, 0.15, 22, 1.8, 0.7, 6, '#9fe3c9', { top: '#d2f5e8' });
      g.box(0.15, 0.25, 28, 0.4, 0.5, 4, '#ffffff');
    },
  },
  caminha_pet: {
    w: 1, d: 1, h: 30,
    draw: (g) => {
      g.cyl(0.5, 0.5, 0.36, 0, 10, '#f7a8c8', '#fde3ef');
      animalCat(g, '#ffd2a6', 0.5, 0.55, true);
    },
  },
  arranhador: {
    w: 1, d: 1, h: 86,
    draw: (g) => {
      g.box(0.1, 0.1, 0, 0.8, 0.8, 6, '#c7a8f0');
      g.cyl(0.5, 0.5, 0.1, 6, 50, '#e9d5b0');
      g.box(0.15, 0.15, 56, 0.7, 0.7, 6, '#c7a8f0');
      animalCat(g, '#b9b0c9', 0.55, 0.55);
    },
  },
  prateleira_remedios: {
    w: 1, d: 1, h: 76,
    draw: (g) => {
      g.box(0.15, 0.2, 0, 0.7, 0.55, 60, '#ffffff', { top: '#f6fbf9' });
      const ctx = g.ctx;
      const [x, y] = g.pt(0.85, 0.47, 44);
      rrPath(ctx, x - 7, y - 7, 14, 14, 3);
      fs(ctx, '#f2727a');
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 1.8, y - 5, 3.6, 10);
      ctx.fillRect(x - 5, y - 1.8, 10, 3.6);
    },
  },
  casinha_gato: {
    w: 1, d: 1, h: 76,
    draw: (g) => {
      g.box(0.1, 0.1, 0, 0.8, 0.8, 32, '#ffd8e6');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 32);
      polyPath(ctx, [[x - 30, y + 2], [x, y - 24], [x + 30, y + 2], [x, y + 14]]);
      fs(ctx, P.pinkDeep);
      const [dx, dy] = g.pt(0.9, 0.5, 0);
      ctx.beginPath();
      ctx.ellipse(dx - 2, dy - 12, 7, 11, -0.4, Math.PI, 0);
      ctx.closePath();
      fs(ctx, '#7a5a6a', null);
      heartPath(ctx, x, y - 4, 4);
      fs(ctx, '#fff');
      animalCat(g, '#ffc28a', 0.95, 0.85);
      stationSparkles(g, 60);
    },
  },
  // ---------- animais
  gatinho: { w: 1, d: 1, h: 36, draw: (g) => animalCat(g, '#ffc28a') },
  gatinho_cinza: { w: 1, d: 1, h: 36, draw: (g) => animalCat(g, '#c9c3d6') },
  cachorrinho: {
    w: 1, d: 1, h: 36,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      g.shadow(0.5, 0.5, 0.3);
      ellPath(ctx, x + 2, y - 8, 10, 7);
      fs(ctx, '#f0d2a8');
      ellPath(ctx, x - 6, y - 18, 8, 7);
      fs(ctx, '#f0d2a8');
      ellPath(ctx, x - 12, y - 17, 3.5, 6);
      fs(ctx, '#b98458');
      ellPath(ctx, x, y - 17, 3.5, 6);
      fs(ctx, '#b98458');
      ellPath(ctx, x - 6, y - 15, 2, 1.4);
      ctx.fillStyle = P.ink;
      ctx.fill();
      ellPath(ctx, x - 8.5, y - 19, 1, 1.3);
      ctx.fill();
      ellPath(ctx, x - 3.5, y - 19, 1, 1.3);
      ctx.fill();
    },
  },
  galinha: {
    w: 1, d: 1, h: 32,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      g.shadow(0.5, 0.5, 0.25);
      ellPath(ctx, x, y - 9, 9, 8);
      fs(ctx, '#ffffff');
      ellPath(ctx, x - 6, y - 18, 5.5, 5.5);
      fs(ctx, '#ffffff');
      polyPath(ctx, [[x - 11, y - 18], [x - 15, y - 17], [x - 11, y - 16]]);
      fs(ctx, P.gold);
      ellPath(ctx, x - 6, y - 24, 2.5, 2);
      fs(ctx, P.red);
      ellPath(ctx, x - 7.5, y - 19, 0.9, 0.9);
      ctx.fillStyle = P.ink;
      ctx.fill();
    },
  },
  vaquinha: {
    w: 1, d: 1, h: 48,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      g.shadow(0.5, 0.5, 0.45);
      for (const dx of [-9, -3, 5, 11]) {
        rrPath(ctx, x + dx - 2, y - 10, 4, 10, 1.5);
        fs(ctx, '#fff');
      }
      ellPath(ctx, x + 1, y - 17, 16, 10);
      fs(ctx, '#ffffff');
      ellPath(ctx, x + 5, y - 19, 5, 4);
      fs(ctx, '#7a6a80', null);
      ellPath(ctx, x - 13, y - 25, 8, 7.5);
      fs(ctx, '#ffffff');
      ellPath(ctx, x - 14, y - 21, 6, 3.5);
      fs(ctx, '#fbc4d6');
      ellPath(ctx, x - 16, y - 28, 1, 1.3);
      ctx.fillStyle = P.ink;
      ctx.fill();
      ellPath(ctx, x - 11, y - 28, 1, 1.3);
      ctx.fill();
      ellPath(ctx, x - 20, y - 31, 3, 1.6);
      fs(ctx, '#fff');
      ellPath(ctx, x - 6, y - 31, 3, 1.6);
      fs(ctx, '#fff');
    },
  },
  coelho: {
    w: 1, d: 1, h: 40,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      g.shadow(0.5, 0.5, 0.25);
      ellPath(ctx, x, y - 8, 8, 7);
      fs(ctx, '#fff');
      for (const dx of [-3, 3]) {
        ellPath(ctx, x + dx, y - 26, 2.5, 7);
        fs(ctx, '#fff');
        ellPath(ctx, x + dx, y - 26, 1.2, 5);
        ctx.fillStyle = '#fbc4d6';
        ctx.fill();
      }
      ellPath(ctx, x, y - 17, 7, 6);
      fs(ctx, '#fff');
      ellPath(ctx, x - 2.5, y - 18, 0.9, 1.2);
      ellPath(ctx, x + 2.5, y - 18, 0.9, 1.2);
      ctx.fillStyle = P.ink;
      ctx.fill();
    },
  },
  // ---------- praia
  guarda_sol: {
    w: 1, d: 1, h: 86, solid: true,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.7, 0.12);
      g.cyl(0.5, 0.5, 0.03, 0, 60, '#fff');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 60);
      const cols = [P.pink, '#fff', P.sky, '#fff', P.yellow, '#fff'];
      for (let i = 0; i < 6; i++) {
        const a0 = Math.PI + (i / 6) * Math.PI;
        const a1 = Math.PI + ((i + 1) / 6) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x, y - 14);
        ctx.lineTo(x + Math.cos(a0) * 34, y + Math.sin(a0) * 4 + 6);
        ctx.lineTo(x + Math.cos(a1) * 34, y + Math.sin(a1) * 4 + 6);
        ctx.closePath();
        fs(ctx, cols[i], '#c98fb0', 0.8);
      }
    },
  },
  castelo_areia: {
    w: 1, d: 1, h: 46,
    draw: (g) => {
      g.box(0.15, 0.15, 0, 0.7, 0.7, 14, '#f3d69d');
      g.cyl(0.25, 0.25, 0.12, 14, 14, '#f3d69d');
      g.cyl(0.75, 0.75, 0.12, 14, 10, '#f3d69d');
      g.cyl(0.5, 0.5, 0.15, 14, 20, '#f3d69d');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 34);
      ctx.strokeStyle = P.ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 10);
      ctx.stroke();
      polyPath(ctx, [[x, y - 10], [x + 7, y - 8], [x, y - 6]]);
      fs(ctx, P.pinkDeep);
    },
  },
  toalha: {
    w: 1, d: 2, h: 4, solid: false,
    draw: (g) => {
      g.flat(0.1, 0.1, 0, 0.8, 1.8, '#f7a8c8');
      for (let i = 0; i < 4; i++) g.flat(0.1, 0.25 + i * 0.4, 0.2, 0.8, 0.15, '#ffffff', null);
    },
  },
  concha_grande: {
    w: 1, d: 1, h: 50,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.4);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      ctx.beginPath();
      ctx.moveTo(x, y - 2);
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        ctx.lineTo(x + Math.cos(a) * 22, y - 8 + Math.sin(a) * 26);
      }
      ctx.closePath();
      fs(ctx, rgrad(ctx, x, y - 16, 24, '#fff2f6', '#f7a8c8'));
      ctx.strokeStyle = '#e48db2';
      for (let i = 1; i < 8; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x, y - 2);
        ctx.lineTo(x + Math.cos(a) * 20, y - 8 + Math.sin(a) * 23);
        ctx.stroke();
      }
      stationSparkles(g, 40);
    },
  },
  barquinho: {
    w: 2, d: 1, h: 60,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 0.5, 0);
      ctx.beginPath();
      ctx.moveTo(x - 34, y - 14);
      ctx.lineTo(x + 34, y - 14);
      ctx.quadraticCurveTo(x + 26, y + 2, x, y + 2);
      ctx.quadraticCurveTo(x - 26, y + 2, x - 34, y - 14);
      fs(ctx, '#fff1dc');
      ctx.fillStyle = P.coral;
      ctx.fillRect(x - 30, y - 12, 60, 3);
      ctx.strokeStyle = P.woodDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x, y - 56);
      ctx.stroke();
      polyPath(ctx, [[x + 2, y - 54], [x + 26, y - 20], [x + 2, y - 20]]);
      fs(ctx, '#fff');
    },
  },
  // ---------- dança
  caixa_som: {
    w: 1, d: 1, h: 64,
    draw: (g) => {
      g.box(0.2, 0.25, 0, 0.6, 0.5, 48, '#9b7fd4');
      const ctx = g.ctx;
      for (const [z, r] of [[34, 7], [14, 9]]) {
        const [x, y] = g.pt(0.8, 0.5, z);
        ellPath(ctx, x - 1, y, r * 0.7, r);
        fs(ctx, '#5c4a7c', '#3d2b4f');
        ellPath(ctx, x - 1, y, r * 0.25, r * 0.35);
        fs(ctx, '#c7a8f0', null);
      }
    },
  },
  barra_bale: {
    w: 2, d: 1, h: 50, solid: true,
    draw: (g) => {
      g.cyl(0.2, 0.5, 0.04, 0, 36, '#b8aecb');
      g.cyl(1.8, 0.5, 0.04, 0, 36, '#b8aecb');
      g.box(0.15, 0.45, 34, 1.7, 0.1, 3, '#e3b98c');
    },
  },
  pista_luz: {
    w: 2, d: 2, h: 40,
    draw: (g) => {
      const cols = ['#f8b0d8', '#b8d8f8', '#fff0a8', '#c8f0d0'];
      for (let u = 0; u < 4; u++) for (let v = 0; v < 4; v++) g.flat(u * 0.5, v * 0.5, 2, 0.5, 0.5, cols[(u + v) % 4], '#ffffff', 1);
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 1, 2);
      // setas
      ctx.fillStyle = '#ffffff';
      for (const [dx, dy, a] of [[-18, 0, Math.PI], [18, 0, 0], [0, -10, -Math.PI / 2], [0, 10, Math.PI / 2]]) {
        ctx.save();
        ctx.translate(x + dx, y + dy);
        ctx.rotate(a);
        polyPath(ctx, [[5, 0], [-3, -4], [-3, 4]]);
        fs(ctx, '#ffffff', '#c08ab0', 0.8);
        ctx.restore();
      }
      stationSparkles(g, 20);
    },
  },
  // ---------- biblioteca
  estante: {
    w: 1, d: 1, h: 96,
    draw: (g) => {
      g.box(0.12, 0.2, 0, 0.76, 0.6, 82, '#b98458', { top: '#d9a77a' });
      const ctx = g.ctx;
      const cols = ['#f29bb1', '#9cc9f0', '#a8dea0', '#ffd98a', '#c9a8ee', '#ffb48f'];
      for (let s = 0; s < 4; s++) {
        for (let i = 0; i < 5; i++) {
          const u = 0.18 + i * 0.13;
          polyPath(ctx, [g.pt(u, 0.8, 4 + s * 20), g.pt(u + 0.11, 0.8, 4 + s * 20), g.pt(u + 0.11, 0.8, 18 + s * 20 - (i % 2) * 3), g.pt(u, 0.8, 18 + s * 20 - (i % 2) * 3)]);
          fs(ctx, cols[(s + i) % cols.length], undefined, 0.6);
        }
      }
    },
  },
  mesa_leitura: {
    w: 2, d: 1, h: 46,
    draw: (g) => {
      for (const u of [0.15, 1.75]) for (const v of [0.2, 0.7]) g.box(u, v, 0, 0.1, 0.1, 22, '#b98458');
      g.box(0.1, 0.15, 22, 1.8, 0.7, 4, '#d9a77a');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.7, 0.5, 26);
      polyPath(ctx, [[x - 10, y], [x, y - 4], [x + 10, y], [x, y + 4]]);
      fs(ctx, '#fff');
      const [lx, ly] = g.pt(1.5, 0.4, 26);
      ellPath(ctx, lx, ly - 18, 8, 5);
      fs(ctx, P.mint);
      ctx.strokeStyle = '#a99db8';
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx, ly - 14);
      ctx.stroke();
    },
  },
  globo: {
    w: 1, d: 1, h: 60,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.3);
      g.cyl(0.5, 0.5, 0.15, 0, 6, '#b98458');
      g.cyl(0.5, 0.5, 0.03, 6, 18, '#b98458');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 24);
      ellPath(ctx, x, y - 14, 14, 14);
      fs(ctx, rgrad(ctx, x, y - 14, 14, '#d5ecfc', '#7aa7e8'));
      ellPath(ctx, x - 4, y - 18, 5, 4);
      fs(ctx, '#9fdc9a', null);
      ellPath(ctx, x + 5, y - 9, 4, 3);
      fs(ctx, '#9fdc9a', null);
    },
  },
  poltrona: {
    w: 1, d: 1, h: 50,
    draw: (g) => {
      g.box(0.15, 0.15, 0, 0.7, 0.7, 16, '#c7a8f0');
      g.box(0.15, 0.15, 16, 0.18, 0.7, 20, '#b392e6');
      g.box(0.15, 0.15, 16, 0.7, 0.12, 12, '#b392e6');
      g.box(0.15, 0.73, 16, 0.7, 0.12, 12, '#b392e6');
    },
  },
  livro_magico: {
    w: 1, d: 1, h: 80,
    draw: (g) => {
      g.cyl(0.5, 0.5, 0.22, 0, 8, '#d9d2e3');
      g.cyl(0.5, 0.5, 0.1, 8, 28, '#e9e3f3');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 36);
      ellPath(ctx, x, y - 14, 20, 20);
      const gr = ctx.createRadialGradient(x, y - 14, 2, x, y - 14, 20);
      gr.addColorStop(0, 'rgba(255,247,176,0.9)');
      gr.addColorStop(1, 'rgba(255,247,176,0)');
      ctx.fillStyle = gr;
      ctx.fill();
      polyPath(ctx, [[x - 14, y - 6], [x, y - 2], [x, y - 16], [x - 14, y - 20]]);
      fs(ctx, '#fff');
      polyPath(ctx, [[x + 14, y - 6], [x, y - 2], [x, y - 16], [x + 14, y - 20]]);
      fs(ctx, '#fffaf0');
      sparkle(ctx, x - 6, y - 30, 4, '#fff7b0');
      sparkle(ctx, x + 9, y - 26, 3, '#fff');
    },
  },
  // ---------- fazenda
  celeiro: {
    w: 3, d: 3, h: 130,
    draw: (g) => {
      g.box(0.1, 0.1, 0, 2.8, 2.8, 64, '#f2938f', { top: '#f2938f' });
      const ctx = g.ctx;
      // telhado
      const a = g.pt(0.1, 0.1, 64);
      const b = g.pt(2.9, 0.1, 64);
      const c = g.pt(2.9, 2.9, 64);
      const d = g.pt(0.1, 2.9, 64);
      const rt = g.pt(1.5, 0.1, 104);
      const rb = g.pt(1.5, 2.9, 104);
      polyPath(ctx, [d, c, rb]);
      fs(ctx, '#fff1dc');
      polyPath(ctx, [a, rt, rb, d]);
      fs(ctx, '#a8728a');
      polyPath(ctx, [rt, b, c, rb]);
      fs(ctx, '#8f5f78');
      void b;
      // porta
      polyPath(ctx, [g.pt(0.9, 2.9, 0), g.pt(2.1, 2.9, 0), g.pt(2.1, 2.9, 44), g.pt(0.9, 2.9, 44)]);
      fs(ctx, '#fff1dc');
      ctx.strokeStyle = '#f2938f';
      ctx.lineWidth = 2;
      polyPath(ctx, [g.pt(0.95, 2.9, 2), g.pt(2.05, 2.9, 42)], false);
      ctx.stroke();
      polyPath(ctx, [g.pt(2.05, 2.9, 2), g.pt(0.95, 2.9, 42)], false);
      ctx.stroke();
    },
  },
  feno: {
    w: 1, d: 1, h: 34,
    draw: (g) => {
      g.box(0.12, 0.2, 0, 0.76, 0.6, 22, '#f5d77a', { top: '#fbe7a6' });
      const ctx = g.ctx;
      ctx.strokeStyle = '#d9b44f';
      ctx.lineWidth = 0.8;
      for (let i = 1; i < 4; i++) {
        polyPath(ctx, [g.pt(0.12, 0.8, i * 5.5), g.pt(0.88, 0.8, i * 5.5)], false);
        ctx.stroke();
      }
    },
  },
  cerca: {
    w: 1, d: 1, h: 34,
    draw: (g) => {
      g.box(0.05, 0.45, 0, 0.1, 0.1, 26, '#fffaf0');
      g.box(0.85, 0.45, 0, 0.1, 0.1, 26, '#fffaf0');
      g.box(0, 0.47, 8, 1, 0.06, 4, '#fffaf0');
      g.box(0, 0.47, 18, 1, 0.06, 4, '#fffaf0');
    },
  },
  cerca_v: {
    w: 1, d: 1, h: 34,
    draw: (g) => {
      g.box(0.45, 0.05, 0, 0.1, 0.1, 26, '#fffaf0');
      g.box(0.45, 0.85, 0, 0.1, 0.1, 26, '#fffaf0');
      g.box(0.47, 0, 8, 0.06, 1, 4, '#fffaf0');
      g.box(0.47, 0, 18, 0.06, 1, 4, '#fffaf0');
    },
  },
  poco: {
    w: 1, d: 1, h: 76,
    draw: (g) => {
      g.cyl(0.5, 0.5, 0.36, 0, 20, '#d9d2e3');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 20);
      ellPath(ctx, x, y, 18, 9);
      fs(ctx, '#7cc4e8', '#a99db8');
      g.box(0.18, 0.48, 20, 0.06, 0.06, 32, P.woodDark);
      g.box(0.78, 0.48, 20, 0.06, 0.06, 32, P.woodDark);
      const [rx, ry] = g.pt(0.5, 0.5, 52);
      polyPath(ctx, [[rx - 26, ry + 6], [rx, ry - 14], [rx + 26, ry + 6]]);
      fs(ctx, '#f2938f');
    },
  },
  plantacao: {
    w: 1, d: 1, h: 30,
    draw: (g) => {
      g.flat(0.05, 0.05, 0, 0.9, 0.9, '#c69a74', null);
      const ctx = g.ctx;
      for (const [u, v] of [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]]) {
        const [x, y] = g.pt(u, v, 0);
        ellPath(ctx, x, y - 6, 4, 6);
        fs(ctx, '#8fd18a');
        ellPath(ctx, x, y - 2, 3, 3);
        fs(ctx, '#ff9f5a');
      }
    },
  },
  cesta_frutas: {
    w: 1, d: 1, h: 50,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.4);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      for (const [dx, dy, c] of [[-8, -22, "#f2727a"], [2, -25, "#ffb347"], [10, -21, "#b4e07a"], [-2, -18, "#c7a8f0"]] as [number, number, string][]) {
        ellPath(ctx, x + dx, y + dy, 6, 6);
        fs(ctx, c as string);
      }
      ctx.beginPath();
      ctx.moveTo(x - 20, y - 18);
      ctx.lineTo(x + 20, y - 18);
      ctx.lineTo(x + 15, y);
      ctx.lineTo(x - 15, y);
      ctx.closePath();
      fs(ctx, '#e0b07f');
      ctx.strokeStyle = '#c1905e';
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 20 + i, y - 18 + i * 4.5);
        ctx.lineTo(x + 20 - i, y - 18 + i * 4.5);
        ctx.stroke();
      }
      stationSparkles(g, 36);
    },
  },
  // ---------- parque de diversões
  roda_gigante: {
    w: 2, d: 2, h: 190,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 1, 0);
      const cy = y - 100;
      const R = 74;
      ctx.strokeStyle = '#9b7fd4';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - 30, y);
      ctx.lineTo(x, cy);
      ctx.lineTo(x + 30, y);
      ctx.stroke();
      ellPath(ctx, x, cy, R, R);
      ctx.strokeStyle = '#f7a8c8';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#e9739f';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x, cy);
        ctx.lineTo(x + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }
      const cols = [P.sky, P.yellow, P.mint, P.lilac, P.coral, P.pink, P.peach, P.blue];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const gx = x + Math.cos(a) * R;
        const gy = cy + Math.sin(a) * R;
        rrPath(ctx, gx - 9, gy, 18, 14, 5);
        fs(ctx, cols[i]);
      }
      ellPath(ctx, x, cy, 8, 8);
      fs(ctx, P.gold);
    },
  },
  carrossel: {
    w: 2, d: 2, h: 110,
    draw: (g) => {
      g.cyl(1, 1, 0.9, 0, 8, '#fde3ef');
      g.cyl(1, 1, 0.1, 8, 60, '#f2c14e');
      const ctx = g.ctx;
      for (const [u, v, c] of [[0.5, 1.4, P.sky], [1.45, 1.45, P.pink], [1.4, 0.55, P.mint]]) {
        g.cyl(u as number, v as number, 0.02, 8, 52, '#f2c14e');
        const [x, y] = g.pt(u as number, v as number, 26);
        ellPath(ctx, x, y, 10, 6);
        fs(ctx, c as string);
        ellPath(ctx, x - 9, y - 6, 4, 5);
        fs(ctx, c as string);
      }
      const [x, y] = g.pt(1, 1, 68);
      ctx.beginPath();
      ctx.moveTo(x - 62, y + 4);
      ctx.lineTo(x, y - 36);
      ctx.lineTo(x + 62, y + 4);
      ctx.quadraticCurveTo(x, y + 30, x - 62, y + 4);
      fs(ctx, '#f7a8c8');
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y - 36);
        ctx.lineTo(x + i * 24, y + 10 - Math.abs(i) * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      starPath(ctx, x, y - 42, 7, 3);
      fs(ctx, P.gold);
    },
  },
  barraca_argolas: { w: 2, d: 1, h: 90, draw: (g) => { stall(g, '#f7a8c8', '#ffffff', '#c7a8f0'); stationSparkles(g, 70); } },
  barraca_pipoca: {
    w: 2, d: 1, h: 90,
    draw: (g) => {
      stall(g, '#9fd3f7', '#ffffff', '#ffe08a');
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 0.5, 22);
      for (let i = 0; i < 9; i++) {
        ellPath(ctx, x - 12 + (i % 5) * 6, y - 4 - Math.floor(i / 5) * 5, 3.5, 3.5);
        fs(ctx, '#fff8e0', '#e4c86a', 0.7);
      }
    },
  },
  baloes: {
    w: 1, d: 1, h: 100, solid: true,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      const cols = [P.pink, P.sky, P.yellow, P.mint, P.lilac];
      const pos = [[-10, -70], [10, -74], [0, -88], [-16, -86], [16, -90]];
      pos.forEach(([dx, dy], i) => {
        ctx.strokeStyle = '#a99db8';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + dx, y + dy + 10);
        ctx.stroke();
        ellPath(ctx, x + dx, y + dy, 9, 11);
        fs(ctx, rgrad(ctx, x + dx, y + dy, 11, lighten(cols[i], 0.5), cols[i]));
      });
      rrPath(ctx, x - 4, y - 8, 8, 8, 2);
      fs(ctx, P.wood);
    },
  },
  algodao_doce: {
    w: 1, d: 1, h: 76,
    draw: (g) => {
      g.box(0.15, 0.2, 0, 0.7, 0.6, 30, '#ffffff');
      for (const [u, c] of [[0.3, P.pink], [0.55, P.lilac], [0.75, P.sky]]) {
        g.cyl(u as number, 0.5, 0.02, 30, 16, '#fff');
        g.ball(u as number, 0.5, 44, 9, c as string);
      }
    },
  },
  // ---------- pista de gelo
  boneco_neve: {
    w: 1, d: 1, h: 70,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.4);
      g.ball(0.5, 0.5, 0, 16, '#ffffff');
      g.ball(0.5, 0.5, 26, 12, '#ffffff');
      g.ball(0.5, 0.5, 46, 9, '#ffffff');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 46);
      ellPath(ctx, x - 3, y - 11, 1.2, 1.4);
      ellPath(ctx, x + 3, y - 11, 1.2, 1.4);
      ctx.fillStyle = P.ink;
      ctx.fill();
      polyPath(ctx, [[x, y - 8], [x + 8, y - 7], [x, y - 6]]);
      fs(ctx, '#ffa25a');
      rrPath(ctx, x - 10, y - 3, 20, 4, 2);
      fs(ctx, P.pinkDeep);
      polyPath(ctx, [[x - 8, y - 18], [x + 8, y - 18], [x + 5, y - 30], [x - 5, y - 30]]);
      fs(ctx, P.lilac);
      ellPath(ctx, x, y - 31, 3.5, 3.5);
      fs(ctx, '#fff');
    },
  },
  cone: {
    w: 1, d: 1, h: 30,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      g.flat(0.25, 0.25, 0, 0.5, 0.5, '#ffb28a');
      polyPath(ctx, [[x - 8, y - 2], [x, y - 24], [x + 8, y - 2]]);
      fs(ctx, '#ffa070');
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 4.5, y - 13, 9, 3);
    },
  },
  barraca_chocolate: {
    w: 2, d: 1, h: 90,
    draw: (g) => {
      stall(g, '#c99d77', '#fff3dc', '#f7c5dc');
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 0.5, 22);
      for (let i = 0; i < 3; i++) {
        rrPath(ctx, x - 14 + i * 10, y - 10, 7, 9, 2);
        fs(ctx, '#ffffff');
        ellPath(ctx, x - 10.5 + i * 10, y - 10, 3.5, 1.4);
        fs(ctx, '#a0683f', null);
      }
    },
  },
  patins: {
    w: 1, d: 1, h: 64,
    draw: (g) => {
      signBoard(g, 0.5, 0.5, '#dff3ff', 36);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 36);
      // botinha de patins
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 10);
      ctx.lineTo(x - 7, y - 2);
      ctx.lineTo(x + 7, y - 2);
      ctx.lineTo(x + 7, y - 4);
      ctx.lineTo(x - 1, y - 6);
      ctx.lineTo(x - 1, y - 10);
      ctx.closePath();
      fs(ctx, P.pink);
      ctx.strokeStyle = '#9cc3dc';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 8, y);
      ctx.stroke();
      stationSparkles(g, 50);
    },
  },
  // ---------- ateliê
  cavalete: {
    w: 1, d: 1, h: 80,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      ctx.strokeStyle = '#b98458';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 12, y);
      ctx.lineTo(x, y - 70);
      ctx.lineTo(x + 12, y);
      ctx.moveTo(x, y - 70);
      ctx.lineTo(x + 2, y + 2);
      ctx.stroke();
      rrPath(ctx, x - 16, y - 60, 32, 28, 2);
      fs(ctx, '#fffaf0', '#b98458', 1.5);
      ellPath(ctx, x - 5, y - 48, 7, 7);
      fs(ctx, P.yellow, null);
      ctx.fillStyle = P.mint;
      ctx.fillRect(x - 14, y - 40, 28, 6);
      heartPath(ctx, x + 7, y - 50, 4);
      fs(ctx, P.pink, null);
    },
  },
  cavalete_grande: {
    w: 1, d: 1, h: 96,
    draw: (g) => {
      OBJECTS.cavalete.draw(g);
      stationSparkles(g, 80);
    },
  },
  mesa_tintas: {
    w: 2, d: 1, h: 46,
    draw: (g) => {
      for (const u of [0.15, 1.75]) for (const v of [0.2, 0.7]) g.box(u, v, 0, 0.1, 0.1, 22, '#d9b58a');
      g.box(0.1, 0.15, 22, 1.8, 0.7, 4, '#fffaf0');
      const ctx = g.ctx;
      const cols = [P.red, P.yellow, P.blue, P.green, P.pink, P.purple];
      cols.forEach((c, i) => {
        const [x, y] = g.pt(0.3 + (i % 3) * 0.5, 0.35 + Math.floor(i / 3) * 0.35, 26);
        ellPath(ctx, x, y - 2, 5, 2.6);
        fs(ctx, c);
      });
    },
  },
  escultura: {
    w: 1, d: 1, h: 80,
    draw: (g) => {
      g.box(0.2, 0.2, 0, 0.6, 0.6, 30, '#efe9f5');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 30);
      heartPath(ctx, x, y - 22, 16);
      fs(ctx, rgrad(ctx, x, y - 22, 18, '#ffffff', '#c9c3d6'));
    },
  },
  // ---------- castelo
  pilar: {
    w: 1, d: 1, h: 130,
    draw: (g) => {
      g.box(0.15, 0.15, 0, 0.7, 0.7, 8, '#e9e3f3');
      g.cyl(0.5, 0.5, 0.24, 8, 100, '#f7f2fc');
      g.box(0.15, 0.15, 108, 0.7, 0.7, 8, '#e9e3f3');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 60);
      starPath(ctx, x, y, 5, 2.2);
      fs(ctx, P.gold);
    },
  },
  trono: {
    w: 1, d: 1, h: 80,
    draw: (g) => {
      g.box(0.1, 0.1, 0, 0.8, 0.8, 18, '#f7a8c8');
      g.box(0.1, 0.1, 18, 0.2, 0.8, 46, '#f2c14e');
      g.box(0.25, 0.15, 18, 0.6, 0.7, 6, '#fde3ef');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.2, 0.5, 64);
      starPath(ctx, x, y - 6, 8, 3.5);
      fs(ctx, '#fff3b0', '#c9a54f');
    },
  },
  candelabro: {
    w: 1, d: 1, h: 96,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.25);
      g.cyl(0.5, 0.5, 0.15, 0, 4, P.gold);
      g.cyl(0.5, 0.5, 0.03, 4, 60, P.gold);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 64);
      ctx.strokeStyle = P.gold;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - 14, y - 10);
      ctx.quadraticCurveTo(x, y + 8, x + 14, y - 10);
      ctx.stroke();
      for (const dx of [-14, 0, 14]) {
        rrPath(ctx, x + dx - 2, y - 18 + (dx ? 0 : 8), 4, 10, 1);
        fs(ctx, '#fff');
        ellPath(ctx, x + dx, y - 22 + (dx ? 0 : 8), 2.2, 3.5);
        fs(ctx, '#ffd24d', '#f2a33a', 0.6);
      }
    },
  },
  estatua_estrela: {
    w: 1, d: 1, h: 90,
    draw: (g) => {
      g.box(0.2, 0.2, 0, 0.6, 0.6, 30, '#efe9f5');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 30);
      starPath(ctx, x, y - 24, 20, 9);
      fs(ctx, rgrad(ctx, x, y - 24, 20, '#fff7c4', '#f2c14e'), '#c9a54f');
      sparkle(ctx, x + 20, y - 40, 4);
    },
  },
  palco_baile: {
    w: 2, d: 2, h: 70,
    draw: (g) => {
      g.box(0, 0, 0, 2, 2, 10, '#c7a8f0', { top: '#efe6fa' });
      g.flat(0.3, 0.3, 10.2, 1.4, 1.4, '#f7a8c8', '#e9739f');
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 1, 10);
      starPath(ctx, x, y - 36, 20, 9);
      fs(ctx, rgrad(ctx, x, y - 36, 20, '#fff7c4', '#f2c14e'), '#c9a54f');
      sparkle(ctx, x + 26, y - 48, 5);
      sparkle(ctx, x - 26, y - 30, 4, '#fff7b0');
      sparkle(ctx, x + 6, y - 64, 3.5);
    },
  },
  nuvem_deco: {
    w: 1, d: 1, h: 40,
    draw: (g) => {
      g.ball(0.35, 0.6, -2, 11, '#ffffff', 8);
      g.ball(0.7, 0.4, 0, 10, '#ffffff', 8);
      g.ball(0.5, 0.5, 6, 12, '#ffffff', 9);
    },
  },
  // ---------- genéricos
  caixote: { w: 1, d: 1, h: 34, draw: (g) => g.box(0.15, 0.15, 0, 0.7, 0.7, 24, '#e3b98c') },
  luzinhas: {
    w: 1, d: 1, h: 60, solid: false,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 40);
      const cols = [P.pink, P.yellow, P.sky, P.mint];
      for (let i = 0; i < 6; i++) {
        ellPath(ctx, x - 25 + i * 10, y + Math.sin(i) * 4, 2.5, 3);
        fs(ctx, cols[i % 4]);
      }
    },
  },
};

registerFamily('obj', ([name]) => {
  const d = OBJECTS[name];
  if (!d) return null;
  return isoSpec(d.w, d.d, d.h, d.draw);
});

export { starPath, vgrad, Iso };
