import { TILE_H, TILE_W } from '../config';
import { darken, ellPath, flowerShape, fs, heartPath, lighten, polyPath, rrPath, sparkle, starPath, type Ctx } from './draw';
import { P } from './palette';
import { registerFamily, type ArtSpec } from './registry';
import { WALL_H, wallTransform } from './tiles';

const HW = TILE_W / 2;
const HH = TILE_H / 2;

/**
 * Objetos de parede (janelas, quadros, espelhos…). São desenhados "de frente" num retângulo
 * de 32 x WALL_H e depois inclinados para a parede esquerda (L) ou direita (R).
 * Chave: wobj:<nome>:<L|R>
 */
type WallDraw = (ctx: Ctx) => void;

function frame(ctx: Ctx, x: number, y: number, w: number, h: number, col = '#e3b98c') {
  rrPath(ctx, x, y, w, h, 2);
  fs(ctx, col);
}

export const WALL_OBJECTS: Record<string, WallDraw> = {
  janela: (ctx) => {
    frame(ctx, 3, 22, 26, 34, '#fffaf0');
    rrPath(ctx, 5.5, 24.5, 21, 29, 1.5);
    const g = ctx.createLinearGradient(0, 24, 0, 54);
    g.addColorStop(0, '#bfe6ff');
    g.addColorStop(1, '#e9f6ff');
    fs(ctx, g, '#c9b9a0', 0.8);
    ellPath(ctx, 12, 34, 5, 2.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(15.2, 24.5, 1.6, 29);
    ctx.fillRect(5.5, 38, 21, 1.6);
    // cortininha
    polyPath(ctx, [[3, 20], [11, 20], [6, 48], [3, 48]]);
    fs(ctx, P.pinkLight);
    polyPath(ctx, [[29, 20], [21, 20], [26, 48], [29, 48]]);
    fs(ctx, P.pinkLight);
  },
  janela_redonda: (ctx) => {
    ellPath(ctx, 16, 38, 12, 12);
    fs(ctx, '#fffaf0');
    ellPath(ctx, 16, 38, 9.5, 9.5);
    fs(ctx, '#cdeeff', '#c9b9a0', 0.8);
    starPath(ctx, 19, 35, 2.5, 1.1);
    ctx.fillStyle = '#fff';
    ctx.fill();
  },
  quadro_flor: (ctx) => {
    frame(ctx, 6, 26, 20, 24, '#f2c14e');
    rrPath(ctx, 8.5, 28.5, 15, 19, 1);
    fs(ctx, '#fff8ec', null);
    ctx.strokeStyle = P.greenDark;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(16, 46);
    ctx.lineTo(16, 36);
    ctx.stroke();
    flowerShape(ctx, 16, 35, 5, P.pink, P.yellow);
  },
  quadro_gato: (ctx) => {
    frame(ctx, 5, 24, 22, 26, '#c7a8f0');
    rrPath(ctx, 7.5, 26.5, 17, 21, 1);
    fs(ctx, '#e9f6ff', null);
    const x = 16;
    const y = 39;
    polyPath(ctx, [[x - 6, y - 2], [x - 5, y - 9], [x - 1, y - 5]]);
    fs(ctx, '#ffc28a');
    polyPath(ctx, [[x + 6, y - 2], [x + 5, y - 9], [x + 1, y - 5]]);
    fs(ctx, '#ffc28a');
    ellPath(ctx, x, y, 6.5, 5.5);
    fs(ctx, '#ffc28a');
    ellPath(ctx, x - 2.3, y - 0.5, 0.9, 1.2);
    ellPath(ctx, x + 2.3, y - 0.5, 0.9, 1.2);
    ctx.fillStyle = P.ink;
    ctx.fill();
  },
  quadro_arcoiris: (ctx) => {
    frame(ctx, 4, 26, 24, 20, '#ffffff');
    const cols = ['#f2727a', '#ffb347', '#ffe08a', '#8fd18a', '#7aa7e8', '#b79cf0'];
    cols.forEach((c, i) => {
      ctx.beginPath();
      ctx.arc(16, 43, 10 - i * 1.5, Math.PI, 0);
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  },
  espelho: (ctx) => {
    ellPath(ctx, 16, 38, 11, 17);
    fs(ctx, '#f2c14e');
    ellPath(ctx, 16, 38, 8.5, 14.5);
    const g = ctx.createLinearGradient(8, 24, 24, 52);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#d5ecfc');
    g.addColorStop(1, '#f3fbff');
    fs(ctx, g, '#c9a54f', 0.8);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(12, 32);
    ctx.lineTo(16, 28);
    ctx.stroke();
  },
  relogio: (ctx) => {
    ellPath(ctx, 16, 34, 9, 9);
    fs(ctx, '#ffffff', '#f7a8c8', 2);
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(16, 34);
    ctx.lineTo(16, 28.5);
    ctx.moveTo(16, 34);
    ctx.lineTo(20, 35.5);
    ctx.stroke();
  },
  cartaz_moda: (ctx) => {
    frame(ctx, 4, 20, 24, 34, '#ffffff');
    rrPath(ctx, 6, 22, 20, 30, 1);
    fs(ctx, P.lilacLight, null);
    polyPath(ctx, [[13, 30], [19, 30], [23, 48], [9, 48]]);
    fs(ctx, P.pink);
    ellPath(ctx, 16, 27, 3, 3);
    fs(ctx, '#d9a07a');
  },
  cartaz_bolo: (ctx) => {
    frame(ctx, 4, 22, 24, 28, '#ffffff');
    rrPath(ctx, 9, 38, 14, 8, 2);
    fs(ctx, '#fbd0e2');
    rrPath(ctx, 11, 31, 10, 7, 2);
    fs(ctx, '#fff3dc');
    ellPath(ctx, 16, 29, 2, 2);
    fs(ctx, P.red);
  },
  cartaz_pet: (ctx) => {
    frame(ctx, 4, 22, 24, 28, '#ffffff');
    heartPath(ctx, 16, 36, 8);
    fs(ctx, P.mint);
    for (const [x, y] of [[13, 34], [19, 34], [16, 39]]) {
      ellPath(ctx, x, y, 1.6, 1.6);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  },
  prateleira: (ctx) => {
    rrPath(ctx, 2, 44, 28, 3, 1);
    fs(ctx, '#d9a77a');
    const cols = [P.pink, P.sky, P.mint, P.yellow];
    cols.forEach((c, i) => {
      rrPath(ctx, 5 + i * 6, 34 + (i % 2) * 2, 4.5, 10 - (i % 2) * 2, 1);
      fs(ctx, c);
    });
  },
  estrelas: (ctx) => {
    for (const [x, y, r] of [[8, 26, 4], [22, 34, 5], [12, 46, 3.5], [24, 20, 3]]) {
      starPath(ctx, x, y, r, r * 0.45);
      fs(ctx, '#fff3b0', '#e4c86a', 0.8);
    }
  },
  lousa: (ctx) => {
    frame(ctx, 2, 22, 28, 26, '#d9a77a');
    rrPath(ctx, 4, 24, 24, 22, 1);
    fs(ctx, '#5f8f78', null);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(8, 30);
    ctx.lineTo(18, 30);
    ctx.moveTo(8, 35);
    ctx.lineTo(22, 35);
    ctx.stroke();
    heartPath(ctx, 21, 41, 2.5);
    ctx.strokeStyle = '#fbc4d6';
    ctx.stroke();
  },
  coracao_neon: (ctx) => {
    heartPath(ctx, 16, 36, 10);
    ctx.strokeStyle = 'rgba(247,168,200,0.45)';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = '#ff7fb3';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  },
  cortina_palco: (ctx) => {
    polyPath(ctx, [[0, 4], [32, 4], [32, 70], [24, 70], [16, 40], [8, 70], [0, 70]]);
    fs(ctx, '#e9739f');
    ctx.strokeStyle = darken('#e9739f', 0.15);
    for (let x = 4; x < 32; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 6);
      ctx.lineTo(x, 40);
      ctx.stroke();
    }
  },
  vitral: (ctx) => {
    ctx.beginPath();
    ctx.moveTo(6, 64);
    ctx.lineTo(6, 30);
    ctx.arc(16, 30, 10, Math.PI, 0);
    ctx.lineTo(26, 64);
    ctx.closePath();
    fs(ctx, '#fff7e0', '#c9a54f', 1.5);
    const cols = [P.pink, P.sky, P.yellow, P.lilac, P.mint];
    for (let i = 0; i < 5; i++) {
      rrPath(ctx, 8 + (i % 2) * 8, 32 + Math.floor(i / 2) * 10, 7, 8, 1);
      fs(ctx, lighten(cols[i], 0.2), '#c9a54f', 0.6);
    }
    starPath(ctx, 16, 26, 4, 1.8);
    fs(ctx, '#fff3b0', '#c9a54f', 0.6);
    sparkle(ctx, 22, 22, 2);
  },
  mapa_parede: (ctx) => {
    frame(ctx, 3, 22, 26, 22, '#fffaf0');
    rrPath(ctx, 5, 24, 22, 18, 1);
    fs(ctx, '#cdeeff', null);
    ellPath(ctx, 12, 32, 5, 3);
    fs(ctx, '#9fdc9a', null);
    ellPath(ctx, 21, 37, 4, 2.5);
    fs(ctx, '#9fdc9a', null);
  },
};

function wallObjSpec(name: string, side: 'L' | 'R'): ArtSpec | null {
  const d = WALL_OBJECTS[name];
  if (!d) return null;
  const H = HH + WALL_H + 2;
  return {
    w: HW,
    h: H,
    ox: side === 'L' ? 0 : HW,
    oy: H,
    draw: (ctx) => {
      ctx.save();
      wallTransform(ctx, side, H);
      d(ctx);
      ctx.restore();
    },
  };
}

registerFamily('wobj', ([name, side]) => wallObjSpec(name, side as 'L' | 'R'));
