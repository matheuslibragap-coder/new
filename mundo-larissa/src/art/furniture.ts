import { FURN_BY_ID } from '../data/furniture';
import { darken, ellPath, flowerShape, fs, heartPath, lighten, outlineOf, polyPath, rgrad, rrPath, sparkle, starPath } from './draw';
import { Iso, isoSpec } from './isoArt';
import { P } from './palette';
import { registerFamily } from './registry';

/**
 * Arte dos móveis (chave 'mov:<id>'). Quadros usam a arte de parede ('wobj:<id>:L|R').
 * Cada função recebe o pintor isométrico já com a pegada do móvel.
 */
type Draw = (g: Iso) => void;

function bedBase(g: Iso, du: number, dv: number, frame: string, blanket: string, pillow = '#ffffff') {
  g.box(0.05, 0.05, 0, du - 0.1, dv - 0.1, 10, frame);
  g.box(0.08, 0.08, 10, du - 0.16, dv - 0.16, 7, '#ffffff');
  g.box(0.08, 0.55, 17, du - 0.16, dv - 0.63, 3, blanket);
  g.box(0.18, 0.12, 17, du - 0.36, 0.36, 5, pillow);
  g.box(0.02, 0.02, 0, du - 0.04, 0.1, 34, frame);
}

function tableLegs(g: Iso, du: number, dv: number, h: number, col: string) {
  for (const [u, v] of [[0.12, 0.12], [du - 0.2, 0.12], [0.12, dv - 0.2], [du - 0.2, dv - 0.2]]) g.box(u, v, 0, 0.08, 0.08, h, col);
}

function pot(g: Iso, col = '#f2a98f', h = 14, r = 0.2) {
  g.shadow(0.5, 0.5, 0.3);
  g.cyl(0.5, 0.5, r, 0, h, col);
}

function leaves(g: Iso, z: number, col: string, n = 6, spread = 12, len = 12) {
  const ctx = g.ctx;
  const [x, y] = g.pt(0.5, 0.5, z);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * spread * 0.6, y + Math.sin(a) * len, 4.2, len * 0.8, a + Math.PI / 2, 0, Math.PI * 2);
    fs(ctx, i % 2 ? col : lighten(col, 0.12));
  }
}

const ART: Record<string, { h: number; draw: Draw }> = {
  // ---------------------------------------------------------------- camas
  cama_simples: { h: 44, draw: (g) => bedBase(g, 1, 2, '#e3b98c', '#f7a8c8') },
  cama_estrela: {
    h: 46,
    draw: (g) => {
      bedBase(g, 1, 2, '#9fd3f7', '#7aa7e8', '#fff2c4');
      const ctx = g.ctx;
      for (const v of [0.9, 1.3, 1.7]) {
        const [x, y] = g.pt(0.5, v, 20);
        starPath(ctx, x, y, 3.2, 1.4);
        fs(ctx, '#fff2c4', null);
      }
    },
  },
  cama_nuvem: {
    h: 52,
    draw: (g) => {
      g.ball(0.5, 1.4, -8, 22, '#ffffff', 14);
      g.ball(1.4, 0.6, -8, 22, '#ffffff', 14);
      g.ball(1, 1, -4, 26, '#f4f8ff', 16);
      g.ball(1.3, 1.3, -6, 20, '#ffffff', 12);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.7, 0.7, 20);
      ellPath(ctx, x, y - 4, 12, 6);
      fs(ctx, '#fcd3e3');
      sparkle(ctx, x + 24, y - 10, 4, '#fff7b0');
    },
  },
  beliche: {
    h: 96,
    draw: (g) => {
      for (const [u, v] of [[0.05, 0.05], [0.85, 0.05], [0.05, 1.85], [0.85, 1.85]]) g.box(u, v, 0, 0.1, 0.1, 76, '#e3b98c');
      g.box(0.08, 0.08, 8, 0.84, 1.84, 8, '#ffffff');
      g.box(0.08, 0.6, 16, 0.84, 1.32, 3, '#9fe3c9');
      g.box(0.15, 0.12, 16, 0.7, 0.36, 4, '#ffffff');
      g.box(0.08, 0.08, 46, 0.84, 1.84, 8, '#ffffff');
      g.box(0.08, 0.6, 54, 0.84, 1.32, 3, '#f7a8c8');
      g.box(0.15, 0.12, 54, 0.7, 0.36, 4, '#ffffff');
      g.box(0.85, 1.85, 54, 0.1, 0.1, 22, '#e3b98c');
      // escada
      for (let i = 0; i < 4; i++) g.box(0.9, 1.2, 8 + i * 11, 0.05, 0.5, 2, '#d9a77a');
    },
  },
  cama_dossel: {
    h: 120,
    draw: (g) => {
      bedBase(g, 2, 2, '#f2c14e', '#c7a8f0', '#fcd3e3');
      for (const [u, v] of [[0.05, 0.05], [1.85, 0.05], [0.05, 1.85], [1.85, 1.85]]) g.box(u, v, 0, 0.1, 0.1, 92, '#f2c14e');
      const ctx = g.ctx;
      const a = g.pt(0, 0, 92);
      const b = g.pt(2, 0, 92);
      const c = g.pt(2, 2, 92);
      const d = g.pt(0, 2, 92);
      polyPath(ctx, [a, b, c, d]);
      fs(ctx, '#fcd3e3');
      // cortininhas
      for (const [p, q] of [[d, c], [c, b]]) {
        polyPath(ctx, [p, [p[0], p[1] + 46], [p[0] + (q[0] - p[0]) * 0.2, p[1] + 30 + (q[1] - p[1]) * 0.2], [p[0] + (q[0] - p[0]) * 0.25, p[1] + (q[1] - p[1]) * 0.25]]);
        fs(ctx, 'rgba(252,211,227,0.9)', '#e9a3c0', 1);
        polyPath(ctx, [q, [q[0], q[1] + 46], [q[0] - (q[0] - p[0]) * 0.2, q[1] + 30 - (q[1] - p[1]) * 0.2], [q[0] - (q[0] - p[0]) * 0.25, q[1] - (q[1] - p[1]) * 0.25]]);
        fs(ctx, 'rgba(252,211,227,0.9)', '#e9a3c0', 1);
      }
      const [tx, ty] = g.pt(1, 1, 92);
      heartPath(ctx, tx, ty - 6, 6);
      fs(ctx, '#f2727a');
    },
  },
  // ---------------------------------------------------------------- sofás
  pufe: { h: 30, draw: (g) => { g.shadow(0.5, 0.5, 0.35); g.cyl(0.5, 0.5, 0.32, 0, 16, '#9fe3c9', '#c4f0de'); } },
  poltrona_rosa: {
    h: 50,
    draw: (g) => {
      g.box(0.12, 0.12, 0, 0.76, 0.76, 16, '#f7a8c8');
      g.box(0.12, 0.12, 16, 0.2, 0.76, 22, '#ef93b8');
      g.box(0.12, 0.12, 16, 0.76, 0.14, 12, '#ef93b8');
      g.box(0.12, 0.74, 16, 0.76, 0.14, 12, '#ef93b8');
    },
  },
  sofa_lilas: {
    h: 50,
    draw: (g) => {
      g.box(0.08, 0.15, 0, 1.84, 0.75, 16, '#c7a8f0');
      g.box(0.08, 0.15, 16, 1.84, 0.2, 22, '#b392e6');
      g.box(0.08, 0.15, 16, 0.18, 0.75, 12, '#b392e6');
      g.box(1.74, 0.15, 16, 0.18, 0.75, 12, '#b392e6');
      g.box(0.4, 0.35, 16, 0.4, 0.15, 12, '#fcd3e3');
    },
  },
  sofa_nuvem: {
    h: 50,
    draw: (g) => {
      g.ball(0.4, 0.5, -6, 18, '#ffffff', 12);
      g.ball(1.6, 0.5, -6, 18, '#ffffff', 12);
      g.ball(1, 0.35, 2, 22, '#f4f8ff', 14);
      g.ball(1, 0.6, -6, 20, '#ffffff', 11);
      sparkle(g.ctx, ...g.pt(1.6, 0.3, 30), 4, '#9fd3f7');
    },
  },
  namoradeira: {
    h: 60,
    draw: (g) => {
      g.box(0.08, 0.2, 0, 1.84, 0.7, 16, '#f2727a');
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 0.2, 16);
      heartPath(ctx, x, y - 10, 22);
      fs(ctx, '#f7a8c8');
      g.box(0.08, 0.2, 16, 0.16, 0.7, 10, '#e9739f');
      g.box(1.76, 0.2, 16, 0.16, 0.7, 10, '#e9739f');
    },
  },
  // ---------------------------------------------------------------- mesas
  mesinha: { h: 30, draw: (g) => { tableLegs(g, 1, 1, 12, '#d9a77a'); g.box(0.1, 0.1, 12, 0.8, 0.8, 4, '#e8c39c'); } },
  mesa_redonda: {
    h: 44,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.35);
      g.cyl(0.5, 0.5, 0.05, 0, 22, '#d9a77a');
      g.cyl(0.5, 0.5, 0.36, 22, 4, '#fffaf0', '#fde3ef');
      const [x, y] = g.pt(0.5, 0.5, 26);
      flowerShape(g.ctx, x, y - 6, 4, P.pink, P.yellow);
    },
  },
  mesa_cha: {
    h: 48,
    draw: (g) => {
      OBJ_TABLE(g);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 26);
      ellPath(ctx, x, y - 7, 7, 6);
      fs(ctx, '#ffffff');
      ellPath(ctx, x, y - 13, 2, 1.5);
      fs(ctx, '#f7a8c8');
      ctx.strokeStyle = outlineOf('#ffffff');
      ctx.beginPath();
      ctx.moveTo(x + 6, y - 8);
      ctx.lineTo(x + 11, y - 11);
      ctx.stroke();
      ellPath(ctx, x - 12, y - 2, 4, 2);
      fs(ctx, '#ffffff');
    },
  },
  escrivaninha: {
    h: 64,
    draw: (g) => {
      tableLegs(g, 2, 1, 24, '#ffffff');
      g.box(0.08, 0.1, 24, 1.84, 0.8, 4, '#fde3ef');
      g.box(1.3, 0.15, 0, 0.55, 0.7, 24, '#fcd3e3');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.4, 28);
      rrPath(ctx, x - 6, y - 10, 5, 10, 1);
      fs(ctx, P.sky);
      rrPath(ctx, x - 1, y - 12, 5, 12, 1);
      fs(ctx, P.yellow);
      const [lx, ly] = g.pt(1.6, 0.35, 28);
      ctx.strokeStyle = '#a99db8';
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx, ly - 18);
      ctx.stroke();
      ellPath(ctx, lx, ly - 20, 8, 5);
      fs(ctx, P.mint);
    },
  },
  penteadeira_casa: {
    h: 86,
    draw: (g) => {
      g.box(0.1, 0.2, 0, 0.8, 0.6, 26, '#ffffff', { top: '#fdf1f7' });
      g.box(0.1, 0.2, 26, 0.8, 0.08, 4, '#f7c5dc');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.24, 52);
      ellPath(ctx, x, y, 12, 17);
      fs(ctx, '#f7a8c8');
      ellPath(ctx, x, y, 9, 14);
      const gr = ctx.createLinearGradient(x - 9, y - 14, x + 9, y + 14);
      gr.addColorStop(0, '#ffffff');
      gr.addColorStop(1, '#cfe9fb');
      fs(ctx, gr, '#e9a3c0', 1);
      const [bx, by] = g.pt(0.45, 0.55, 26);
      rrPath(ctx, bx - 4, by - 8, 4, 8, 1.5);
      fs(ctx, P.lilac);
      rrPath(ctx, bx + 2, by - 6, 4, 6, 1.5);
      fs(ctx, P.coral);
    },
  },
  // ---------------------------------------------------------------- luminárias
  abajur: {
    h: 50,
    draw: (g) => {
      g.box(0.25, 0.25, 0, 0.5, 0.5, 18, '#e8c39c');
      g.cyl(0.5, 0.5, 0.03, 18, 10, '#a99db8');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 28);
      polyPath(ctx, [[x - 7, y - 12], [x + 7, y - 12], [x + 11, y + 1], [x - 11, y + 1]]);
      fs(ctx, '#fff2c4');
    },
  },
  luminaria_pe: {
    h: 84,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.25);
      g.cyl(0.5, 0.5, 0.16, 0, 3, '#a99db8');
      g.cyl(0.5, 0.5, 0.025, 3, 54, '#a99db8');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 57);
      polyPath(ctx, [[x - 9, y - 16], [x + 9, y - 16], [x + 14, y + 2], [x - 14, y + 2]]);
      fs(ctx, '#f7a8c8');
    },
  },
  luminaria_estrela: {
    h: 60,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.25);
      g.cyl(0.5, 0.5, 0.15, 0, 4, '#c7a8f0');
      g.cyl(0.5, 0.5, 0.025, 4, 20, '#c7a8f0');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 24);
      ellPath(ctx, x, y - 14, 20, 20);
      const gr = ctx.createRadialGradient(x, y - 14, 2, x, y - 14, 20);
      gr.addColorStop(0, 'rgba(255,240,170,0.8)');
      gr.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = gr;
      ctx.fill();
      starPath(ctx, x, y - 14, 13, 6);
      fs(ctx, rgrad(ctx, x, y - 14, 13, '#fffbe0', '#ffd45e'), '#d9a73a');
    },
  },
  luminaria_lua: {
    h: 60,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.25);
      g.box(0.3, 0.3, 0, 0.4, 0.4, 6, '#9b7fd4');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 6);
      ellPath(ctx, x, y - 22, 22, 22);
      const gr = ctx.createRadialGradient(x, y - 22, 2, x, y - 22, 22);
      gr.addColorStop(0, 'rgba(220,235,255,0.7)');
      gr.addColorStop(1, 'rgba(220,235,255,0)');
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - 22, 15, 0.35 * Math.PI, 1.65 * Math.PI);
      ctx.arc(x + 6, y - 24, 12, 1.55 * Math.PI, 0.45 * Math.PI, true);
      ctx.closePath();
      fs(ctx, '#fff6d6', '#d9b44f');
    },
  },
  lampiao_fadas: {
    h: 54,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.25);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      rrPath(ctx, x - 11, y - 30, 22, 30, 7);
      fs(ctx, 'rgba(214,236,252,0.55)', '#9fc4d8', 1.5);
      rrPath(ctx, x - 8, y - 36, 16, 7, 2);
      fs(ctx, '#d9a77a');
      for (const [dx, dy] of [[-4, -10], [4, -18], [0, -24], [5, -6], [-5, -20]]) {
        ellPath(ctx, x + dx, y + dy, 3.5, 3.5);
        ctx.fillStyle = 'rgba(255,240,140,0.6)';
        ctx.fill();
        ellPath(ctx, x + dx, y + dy, 1.4, 1.4);
        ctx.fillStyle = '#fff7b0';
        ctx.fill();
      }
    },
  },
  // ---------------------------------------------------------------- plantas
  vaso_flor: {
    h: 44,
    draw: (g) => {
      pot(g, '#c7a8f0', 12, 0.16);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 12);
      for (const [dx, dy, c] of [[-6, -14, P.pink], [5, -18, P.yellow], [0, -24, P.coral]] as [number, number, string][]) {
        ctx.strokeStyle = P.greenDark;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
        flowerShape(ctx, x + dx, y + dy, 4.5, c, '#fff');
      }
    },
  },
  cacto_fofo: {
    h: 46,
    draw: (g) => {
      pot(g, '#f7a8c8', 10, 0.16);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 10);
      rrPath(ctx, x - 7, y - 28, 14, 30, 7);
      fs(ctx, '#8fd18a');
      rrPath(ctx, x + 5, y - 20, 9, 6, 3);
      fs(ctx, '#8fd18a');
      ellPath(ctx, x - 2.5, y - 18, 1, 1.3);
      ellPath(ctx, x + 2.5, y - 18, 1, 1.3);
      ctx.fillStyle = P.ink;
      ctx.fill();
      flowerShape(ctx, x, y - 29, 3.5, P.pink, P.yellow);
    },
  },
  samambaia: { h: 52, draw: (g) => { pot(g, '#e3b98c', 14, 0.2); leaves(g, 14, '#7cc77e', 7, 16, 16); } },
  girassois: { h: 60, draw: (g) => OBJ_SUNFLOWER(g) },
  arvorezinha: {
    h: 70,
    draw: (g) => {
      pot(g, '#f2a98f', 14, 0.22);
      g.cyl(0.5, 0.5, 0.04, 14, 16, '#b98458');
      g.ball(0.5, 0.5, 26, 16, '#8fd18a');
      const [x, y] = g.pt(0.5, 0.5, 42);
      for (const [dx, dy] of [[-7, -6], [6, -12], [2, -2]]) {
        ellPath(g.ctx, x + dx, y + dy, 2.3, 2.3);
        fs(g.ctx, '#f2727a', undefined, 0.6);
      }
    },
  },
  // ---------------------------------------------------------------- tapetes
  tapete_redondo: {
    h: 4,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 1, 0);
      ellPath(ctx, x, y, 56, 28);
      fs(ctx, '#f7a8c8');
      ellPath(ctx, x, y, 42, 21);
      fs(ctx, '#fcd3e3', null);
      ellPath(ctx, x, y, 24, 12);
      fs(ctx, '#ffffff', null);
    },
  },
  tapete_listrado: {
    h: 4,
    draw: (g) => {
      g.flat(0.1, 0.1, 0, 1.8, 1.8, '#9fd3f7');
      const cols = ['#ffffff', '#ffe08a', '#ffffff'];
      cols.forEach((c, i) => g.flat(0.1, 0.4 + i * 0.45, 0.1, 1.8, 0.2, c, null));
    },
  },
  tapete_nuvem: {
    h: 6,
    draw: (g) => {
      const ctx = g.ctx;
      for (const [u, v, r] of [[0.6, 1.2, 26], [1.3, 0.6, 26], [1, 1, 32], [1.4, 1.3, 22], [0.6, 0.6, 20]]) {
        const [x, y] = g.pt(u, v, 0);
        ellPath(ctx, x, y, r, r / 2);
        fs(ctx, '#ffffff', '#c9d8ee');
      }
      for (const [u, v, r] of [[0.6, 1.2, 26], [1.3, 0.6, 26], [1, 1, 32], [1.4, 1.3, 22], [0.6, 0.6, 20]]) {
        const [x, y] = g.pt(u, v, 0);
        ellPath(ctx, x, y, r - 1.5, r / 2 - 1);
        fs(ctx, '#ffffff', null);
      }
    },
  },
  tapete_coracao: {
    h: 6,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(1, 1, 0);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, 0.5);
      heartPath(ctx, 0, -6, 40);
      fs(ctx, '#f2727a', undefined, 2);
      heartPath(ctx, 0, -6, 28);
      fs(ctx, '#f7a8c8', null);
      ctx.restore();
    },
  },
  tapete_arcoiris: {
    h: 4,
    draw: (g) => {
      const cols = ['#ffc3c3', '#ffe0b0', '#fff3b0', '#c9f2c7', '#c3e2ff', '#e1c9ff'];
      cols.forEach((c, i) => g.flat(0.1, 0.1 + i * 0.47, 0, 1.8, 0.47, c, i === 0 ? null : null));
      g.flat(0.1, 0.1, 0.2, 1.8, 2.8, 'rgba(0,0,0,0)', '#c9a9d6', 1.5);
    },
  },
  // ---------------------------------------------------------------- brinquedos
  ursinho: {
    h: 44,
    draw: (g) => {
      g.shadow(0.5, 0.5, 0.25);
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      const c = '#d9a77a';
      ellPath(ctx, x, y - 10, 11, 10);
      fs(ctx, c);
      ellPath(ctx, x, y - 8, 6, 6);
      fs(ctx, '#f3d6b8', null);
      for (const s of [-1, 1]) {
        ellPath(ctx, x + s * 8, y - 33, 4.5, 4.5);
        fs(ctx, c);
      }
      ellPath(ctx, x, y - 26, 10, 9);
      fs(ctx, c);
      ellPath(ctx, x, y - 23, 4.5, 3.5);
      fs(ctx, '#f3d6b8', null);
      ellPath(ctx, x - 3.5, y - 28, 1.2, 1.4);
      ellPath(ctx, x + 3.5, y - 28, 1.2, 1.4);
      ellPath(ctx, x, y - 24.5, 1.4, 1);
      ctx.fillStyle = P.ink;
      ctx.fill();
      heartPath(ctx, x, y - 12, 3);
      fs(ctx, P.pink, null);
    },
  },
  bau_brinquedos: {
    h: 44,
    draw: (g) => {
      g.box(0.12, 0.18, 0, 0.76, 0.64, 20, '#9fd3f7');
      g.box(0.1, 0.16, 20, 0.8, 0.68, 6, '#7aa7e8');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.85, 12);
      starPath(ctx, x, y, 5, 2.2);
      fs(ctx, P.yellow);
      const [bx, by] = g.pt(0.4, 0.4, 26);
      ellPath(ctx, bx, by - 6, 6, 6);
      fs(ctx, P.coral);
    },
  },
  cavalinho: {
    h: 56,
    draw: (g) => {
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 0);
      g.shadow(0.5, 0.5, 0.4);
      ctx.beginPath();
      ctx.moveTo(x - 20, y - 6);
      ctx.quadraticCurveTo(x, y + 6, x + 20, y - 6);
      ctx.strokeStyle = '#b98458';
      ctx.lineWidth = 4;
      ctx.stroke();
      for (const dx of [-11, 11]) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + dx * 0.8, y - 4);
        ctx.lineTo(x + dx * 0.6, y - 20);
        ctx.stroke();
      }
      ellPath(ctx, x, y - 24, 15, 8);
      fs(ctx, '#ffffff');
      ctx.beginPath();
      ctx.ellipse(x - 14, y - 36, 6, 12, -0.5, 0, Math.PI * 2);
      fs(ctx, '#ffffff');
      ellPath(ctx, x - 18, y - 44, 6, 5);
      fs(ctx, '#ffffff');
      for (let i = 0; i < 4; i++) {
        ellPath(ctx, x - 9 + i * 1.5, y - 44 + i * 4, 3, 3);
        fs(ctx, '#f7a8c8', undefined, 0.6);
      }
      ellPath(ctx, x - 20, y - 45, 1, 1.2);
      ctx.fillStyle = P.ink;
      ctx.fill();
      ellPath(ctx, x + 14, y - 26, 5, 3);
      fs(ctx, '#c7a8f0');
    },
  },
  casinha_boneca: {
    h: 72,
    draw: (g) => {
      g.box(0.1, 0.1, 0, 0.8, 0.8, 34, '#fff1dc');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 34);
      polyPath(ctx, [[x - 30, y + 2], [x, y - 26], [x + 30, y + 2], [x, y + 16]]);
      fs(ctx, '#f7a8c8');
      polyPath(ctx, [g.pt(0.3, 0.9, 4), g.pt(0.6, 0.9, 4), g.pt(0.6, 0.9, 22), g.pt(0.3, 0.9, 22)]);
      fs(ctx, '#c7a8f0');
      polyPath(ctx, [g.pt(0.9, 0.3, 14), g.pt(0.9, 0.65, 14), g.pt(0.9, 0.65, 26), g.pt(0.9, 0.3, 26)]);
      fs(ctx, '#bfe6ff');
    },
  },
  piano: {
    h: 56,
    draw: (g) => {
      tableLegs(g, 2, 1, 16, '#9b7fd4');
      g.box(0.08, 0.15, 16, 1.84, 0.7, 10, '#c7a8f0');
      g.box(0.08, 0.15, 26, 1.84, 0.2, 18, '#b392e6');
      for (let i = 0; i < 10; i++) g.box(0.15 + i * 0.17, 0.4, 26, 0.15, 0.4, 1.5, '#ffffff', { stroke: '#c9c3d6', lw: 0.6 });
      for (let i = 0; i < 9; i++) if (i % 3 !== 2) g.box(0.27 + i * 0.17, 0.4, 27.5, 0.08, 0.22, 2, '#4a3657');
    },
  },
  // ---------------------------------------------------------------- pet
  potinho: {
    h: 18,
    draw: (g) => {
      g.cyl(0.5, 0.5, 0.2, 0, 7, '#f7a8c8');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 7);
      ellPath(ctx, x, y, 11, 5.5);
      fs(ctx, '#c99d77');
      for (const dx of [-4, 0, 4]) {
        ellPath(ctx, x + dx, y - 1, 2, 1.5);
        fs(ctx, '#a0683f', null);
      }
    },
  },
  caminha_casa: {
    h: 26,
    draw: (g) => {
      g.cyl(0.5, 0.5, 0.38, 0, 10, '#c7a8f0', '#e4d6fa');
      const [x, y] = g.pt(0.5, 0.5, 10);
      heartPath(g.ctx, x, y - 1, 5);
      fs(g.ctx, '#f7a8c8', null);
    },
  },
  arranhador_casa: {
    h: 86,
    draw: (g) => {
      g.box(0.1, 0.1, 0, 0.8, 0.8, 6, '#9fe3c9');
      g.cyl(0.5, 0.5, 0.1, 6, 50, '#e9d5b0');
      g.box(0.15, 0.15, 56, 0.7, 0.7, 6, '#9fe3c9');
      g.ball(0.75, 0.75, 30, 5, P.coral);
    },
  },
  aquario: {
    h: 60,
    draw: (g) => {
      g.box(0.15, 0.25, 0, 0.7, 0.5, 18, '#d9a77a');
      g.box(0.15, 0.25, 18, 0.7, 0.5, 28, 'rgba(160,215,245,0.6)' as string, { top: '#d5ecfc', stroke: '#9fc4d8' });
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.75, 30);
      ellPath(ctx, x - 6, y, 5, 3.2);
      fs(ctx, '#ffb347');
      polyPath(ctx, [[x - 1, y], [x + 4, y - 3], [x + 4, y + 3]]);
      fs(ctx, '#ffb347');
      ellPath(ctx, x + 10, y - 6, 1.5, 1.5);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    },
  },
  casinha_pet: {
    h: 70,
    draw: (g) => {
      g.box(0.1, 0.1, 0, 0.8, 0.8, 30, '#9fd3f7');
      const ctx = g.ctx;
      const [x, y] = g.pt(0.5, 0.5, 30);
      polyPath(ctx, [[x - 30, y + 2], [x, y - 24], [x + 30, y + 2], [x, y + 14]]);
      fs(ctx, '#f2727a');
      const [dx, dy] = g.pt(0.9, 0.5, 0);
      ctx.beginPath();
      ctx.ellipse(dx - 2, dy - 12, 7, 12, -0.4, Math.PI, 0);
      ctx.closePath();
      fs(ctx, '#5a4a6a', null);
      const [bx, by] = g.pt(0.5, 0.9, 22);
      rrPath(ctx, bx - 8, by - 4, 16, 6, 2);
      fs(ctx, '#ffffff');
    },
  },
};

function OBJ_TABLE(g: Iso) {
  g.shadow(0.5, 0.5, 0.35);
  g.cyl(0.5, 0.5, 0.05, 0, 22, '#ffffff');
  g.cyl(0.5, 0.5, 0.36, 22, 4, '#fcd3e3', '#fff4f9');
}

function OBJ_SUNFLOWER(g: Iso) {
  pot(g, '#9fd3f7', 12, 0.2);
  const ctx = g.ctx;
  for (const [u, hh] of [[0.4, 34], [0.6, 42]]) {
    const [x, y] = g.pt(u, 0.5, 12);
    ctx.strokeStyle = P.greenDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - hh);
    ctx.stroke();
    flowerShape(ctx, x, y - hh, 7, '#ffd84d', '#a0683f', 10);
  }
}

registerFamily('mov', ([id]) => {
  const f = FURN_BY_ID[id];
  const a = ART[id];
  if (!f || !a) return null;
  return isoSpec(f.w, f.d, a.h, a.draw);
});

export function furnitureArtKey(id: string, side: 'L' | 'R' = 'L'): string {
  const f = FURN_BY_ID[id];
  if (f?.kind === 'wall') return `wobj:${id}:${side}`;
  return `mov:${id}`;
}

export { darken, lighten };
