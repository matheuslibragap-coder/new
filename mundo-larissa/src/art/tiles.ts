import { TILE_H, TILE_W } from '../config';
import {
  darken, ellPath, flowerShape, fs, heartPath, lighten, mix, outlineOf, patternFill, polyPath, rrPath, sparkle, starPath,
  type Ctx, type Pattern,
} from './draw';
import { P } from './palette';
import { registerFamily, type ArtSpec } from './registry';

export const WALL_H = 104;
const HW = TILE_W / 2;
const HH = TILE_H / 2;

/** Gerador pseudoaleatório determinístico (mesmo desenho sempre). */
export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

interface FloorStyle {
  base: string;
  edge: string;
  walk?: boolean; // falso = não dá para andar
  detail?: (ctx: Ctx, r: () => number, v: number) => void;
}

function diamond(ctx: Ctx, grow = 0.6) {
  polyPath(ctx, [
    [HW, -grow],
    [TILE_W + grow, HH],
    [HW, TILE_H + grow],
    [-grow, HH],
  ]);
}

/** Pontos aleatórios dentro do losango. */
function inDiamond(r: () => number): [number, number] {
  const a = r();
  const b = r();
  // coordenadas (a,b) no espaço do tile → tela
  return [HW + (a - b) * HW * 0.85, HH + (a + b - 1) * HH * 0.85];
}

export const FLOORS: Record<string, FloorStyle> = {
  grama: {
    base: '#a8e09a', edge: '#b98a63',
    detail: (ctx, r, v) => {
      for (let i = 0; i < 7; i++) {
        const [x, y] = inDiamond(r);
        ctx.strokeStyle = '#86c97b';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 1, y - 2.5);
        ctx.moveTo(x + 1.5, y);
        ctx.lineTo(x + 2, y - 2.2);
        ctx.stroke();
      }
      if (v === 3) {
        const [x, y] = inDiamond(r);
        flowerShape(ctx, x, y, 2.6, '#fff', P.yellow);
      }
    },
  },
  flores: {
    base: '#a8e09a', edge: '#b98a63',
    detail: (ctx, r) => {
      const cols = [P.pink, '#fff', P.lilac, P.yellow, P.peach];
      for (let i = 0; i < 4; i++) {
        const [x, y] = inDiamond(r);
        flowerShape(ctx, x, y, 2.6, cols[Math.floor(r() * cols.length)], P.yellow);
      }
    },
  },
  caminho: {
    base: '#efe1cf', edge: '#b9a28a',
    detail: (ctx, r) => {
      ctx.strokeStyle = '#d9c4ad';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(HW * 0.5, HH * 0.5);
      ctx.lineTo(HW * 1.5, HH * 1.5);
      ctx.moveTo(HW * 1.5, HH * 0.5);
      ctx.lineTo(HW * 0.5, HH * 1.5);
      ctx.stroke();
    },
  },
  pedra: {
    base: '#ddd5e8', edge: '#a99db8',
    detail: (ctx, r) => {
      for (let i = 0; i < 3; i++) {
        const [x, y] = inDiamond(r);
        ellPath(ctx, x, y, 5 + r() * 3, 2.5 + r() * 1.5);
        fs(ctx, mix('#ddd5e8', '#ffffff', 0.35), '#c4b9d3', 0.7);
      }
    },
  },
  madeira: {
    base: '#e8c39c', edge: '#b98458',
    detail: (ctx) => {
      ctx.strokeStyle = '#d4a77b';
      ctx.lineWidth = 0.8;
      for (let i = 1; i < 4; i++) {
        const t = i / 4;
        ctx.beginPath();
        ctx.moveTo(HW * t, HH - HH * t);
        ctx.lineTo(HW * t + HW, HH - HH * t + HH);
        ctx.stroke();
      }
    },
  },
  madeira_escura: {
    base: '#b98a6a', edge: '#7e5a44',
    detail: (ctx) => {
      ctx.strokeStyle = '#a07456';
      ctx.lineWidth = 0.8;
      for (let i = 1; i < 4; i++) {
        const t = i / 4;
        ctx.beginPath();
        ctx.moveTo(HW * t, HH - HH * t);
        ctx.lineTo(HW * t + HW, HH - HH * t + HH);
        ctx.stroke();
      }
    },
  },
  xadrez_rosa: {
    base: '#fde2ee', edge: '#d99ab5',
    detail: (ctx) => {
      ctx.fillStyle = '#f8c3da';
      polyPath(ctx, [[HW, 0], [TILE_W * 0.75, HH * 0.5], [HW, HH], [HW * 0.5, HH * 0.5]]);
      ctx.fill();
      polyPath(ctx, [[HW, HH], [TILE_W * 0.75, HH * 1.5], [HW, TILE_H], [HW * 0.5, HH * 1.5]]);
      ctx.fill();
    },
  },
  ladrilho: {
    base: '#e4f6ef', edge: '#93c7b3',
    detail: (ctx) => {
      ctx.strokeStyle = '#bfe3d5';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(HW * 0.5, HH * 0.5);
      ctx.lineTo(HW * 1.5, HH * 1.5);
      ctx.moveTo(HW * 1.5, HH * 0.5);
      ctx.lineTo(HW * 0.5, HH * 1.5);
      ctx.stroke();
    },
  },
  carpete_lilas: {
    base: '#dccbf4', edge: '#a58bcb',
    detail: (ctx, r) => {
      ctx.fillStyle = '#cfbaef';
      for (let i = 0; i < 10; i++) {
        const [x, y] = inDiamond(r);
        ctx.fillRect(x, y, 1, 1);
      }
    },
  },
  tapete_real: {
    base: '#f19bb8', edge: '#b9607f',
    detail: (ctx) => {
      ctx.fillStyle = '#f7c2d4';
      starPath(ctx, HW, HH, 4, 1.8, 4);
      ctx.fill();
    },
  },
  nuvem: {
    base: '#f4f8ff', edge: '#b8c9e6',
    detail: (ctx, r) => {
      for (let i = 0; i < 3; i++) {
        const [x, y] = inDiamond(r);
        ellPath(ctx, x, y, 4, 2);
        ctx.fillStyle = '#e3ecfb';
        ctx.fill();
      }
    },
  },
  estrelado: {
    base: '#cdbdf2', edge: '#8c78bf',
    detail: (ctx, r) => {
      for (let i = 0; i < 3; i++) {
        const [x, y] = inDiamond(r);
        starPath(ctx, x, y, 2.2, 1);
        ctx.fillStyle = '#fff6c9';
        ctx.fill();
      }
    },
  },
  areia: {
    base: '#f8e6b9', edge: '#d1ad74',
    detail: (ctx, r) => {
      ctx.fillStyle = '#ecd29a';
      for (let i = 0; i < 9; i++) {
        const [x, y] = inDiamond(r);
        ctx.fillRect(x, y, 1, 1);
      }
    },
  },
  agua: {
    base: '#8fd3f2', edge: '#5fa3c6', walk: false,
    detail: (ctx, r) => {
      ctx.strokeStyle = '#d8f2ff';
      ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        const [x, y] = inDiamond(r);
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.quadraticCurveTo(x - 2, y - 1.5, x, y);
        ctx.quadraticCurveTo(x + 2, y + 1.5, x + 4, y);
        ctx.stroke();
      }
    },
  },
  gelo: {
    base: '#e3f4ff', edge: '#9cc3dc',
    detail: (ctx, r) => {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      const [x, y] = inDiamond(r);
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 2);
      ctx.lineTo(x + 6, y - 2);
      ctx.stroke();
    },
  },
  neve: {
    base: '#f7fbff', edge: '#bcd0e0',
    detail: (ctx, r) => {
      ctx.fillStyle = '#e6eef7';
      for (let i = 0; i < 3; i++) {
        const [x, y] = inDiamond(r);
        ellPath(ctx, x, y, 3, 1.4);
        ctx.fill();
      }
    },
  },
  cristal: {
    base: '#d9c9f5', edge: '#9a85c9',
    detail: (ctx, r) => {
      for (let i = 0; i < 2; i++) {
        const [x, y] = inDiamond(r);
        sparkle(ctx, x, y, 2.5, '#ffffff');
      }
    },
  },
  musgo: {
    base: '#9fd6a9', edge: '#6f9f7a',
    detail: (ctx, r) => {
      ctx.fillStyle = '#8bc996';
      for (let i = 0; i < 4; i++) {
        const [x, y] = inDiamond(r);
        ellPath(ctx, x, y, 2.5, 1.2);
        ctx.fill();
      }
    },
  },
  terra: {
    base: '#d9b08a', edge: '#a77b58',
    detail: (ctx) => {
      ctx.strokeStyle = '#c69a74';
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        const t = i / 3;
        ctx.beginPath();
        ctx.moveTo(HW * t + 3, HH - HH * t + 1.5);
        ctx.lineTo(HW * t + HW - 3, HH - HH * t + HH - 1.5);
        ctx.stroke();
      }
    },
  },
  palco: {
    base: '#f2d0a6', edge: '#b48a5c',
    detail: (ctx) => {
      ctx.strokeStyle = '#e0b98a';
      ctx.lineWidth = 0.8;
      for (let i = 1; i < 3; i++) {
        const t = i / 3;
        ctx.beginPath();
        ctx.moveTo(HW * t, HH + HH * t);
        ctx.lineTo(HW * t + HW, HH * t);
        ctx.stroke();
      }
    },
  },
  danca: {
    base: '#f8d0e8', edge: '#c08ab0',
    detail: (ctx, r, v) => {
      const cols = ['#f8b0d8', '#b8d8f8', '#fff0a8', '#c8f0d0'];
      polyPath(ctx, [[HW, 3], [TILE_W - 5, HH], [HW, TILE_H - 3], [5, HH]]);
      fs(ctx, cols[v % 4], null);
    },
  },
  marmore: {
    base: '#fbf3f8', edge: '#cdb6c6',
    detail: (ctx, r) => {
      ctx.strokeStyle = '#ecd9e6';
      ctx.lineWidth = 0.7;
      const [x, y] = inDiamond(r);
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 2);
      ctx.quadraticCurveTo(x, y + 3, x + 8, y - 1);
      ctx.stroke();
    },
  },
  ouro: {
    base: '#fbe7a6', edge: '#c9a54f',
    detail: (ctx) => {
      sparkle(ctx, HW, HH, 3, '#ffffff');
    },
  },
  arcoiris: {
    base: '#fff', edge: '#c9a9d6',
    detail: (ctx, r, v) => {
      const cols = ['#ffc3c3', '#ffe0b0', '#fff3b0', '#c9f2c7', '#c3e2ff', '#e1c9ff'];
      polyPath(ctx, [[HW, 0], [TILE_W, HH], [HW, TILE_H], [0, HH]]);
      fs(ctx, cols[v % cols.length], null);
    },
  },
};

export function floorWalkable(type: string) {
  return FLOORS[type]?.walk !== false;
}

function floorSpec(type: string, variant: number): ArtSpec {
  const st = FLOORS[type] ?? FLOORS.grama;
  return {
    w: TILE_W,
    h: TILE_H,
    ox: HW,
    oy: HH,
    draw: (ctx) => {
      diamond(ctx);
      ctx.fillStyle = st.base;
      ctx.fill();
      // leve brilho no topo do losango
      const g = ctx.createLinearGradient(0, 0, 0, TILE_H);
      g.addColorStop(0, 'rgba(255,255,255,0.18)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.save();
      diamond(ctx, 0);
      ctx.clip();
      st.detail?.(ctx, rng(variant * 977 + type.length * 131 + 7), variant);
      ctx.restore();
      // linha sutil entre tiles
      diamond(ctx, 0);
      ctx.strokeStyle = 'rgba(74,54,87,0.07)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    },
  };
}

/** Borda (espessura) de baixo dos tiles da frente — dá o efeito de "ilha" flutuante. */
export const EDGE_H = 14;
function edgeSpec(side: string, type: string): ArtSpec {
  const st = FLOORS[type] ?? FLOORS.grama;
  return {
    w: HW + 1,
    h: HH + EDGE_H + 1,
    ox: side === 'L' ? 0 : HW,
    oy: 0,
    draw: (ctx) => {
      // L: do canto esquerdo (0,0) até o canto de baixo (HW, HH)
      const pts = side === 'L'
        ? [[0, 0], [HW, HH], [HW, HH + EDGE_H], [0, EDGE_H]]
        : [[0, HH], [HW, 0], [HW, EDGE_H], [0, HH + EDGE_H]];
      polyPath(ctx, pts);
      const c = side === 'L' ? st.edge : darken(st.edge, 0.15);
      fs(ctx, c, null);
      ctx.strokeStyle = lighten(st.edge, 0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1] + 0.5);
      ctx.lineTo(pts[1][0], pts[1][1] + 0.5);
      ctx.stroke();
    },
  };
}

// ---------------------------------------------------------------- Paredes
export interface WallStyle {
  base: string;
  pattern?: Pattern | 'bricks' | 'books' | 'panels' | 'clouds' | 'mirror' | 'stone';
  pat?: string;
  trim?: string;
}

export const WALLS: Record<string, WallStyle> = {
  // papéis de parede das casas
  parede_creme: { base: '#fff1dc', trim: '#e8c9a3' },
  parede_listras: { base: '#fde0ec', pattern: 'stripes', pat: '#f8c4da', trim: '#e9a3c0' },
  parede_bolinhas: { base: '#e1f3fb', pattern: 'dots', pat: '#ffffff', trim: '#9fcde6' },
  parede_coracoes: { base: '#fbe1ee', pattern: 'hearts', pat: '#f5a9c9', trim: '#e990b6' },
  parede_estrelas: { base: '#d9d0f6', pattern: 'stars', pat: '#fff3b8', trim: '#a996dc' },
  parede_nuvens: { base: '#bfe3fb', pattern: 'clouds', pat: '#ffffff', trim: '#8cc3e6' },
  parede_flores: { base: '#e6f7e3', pattern: 'flowers', pat: '#f6a7c6', trim: '#9ed59a' },
  parede_xadrez: { base: '#fff4d6', pattern: 'check', pat: '#ffd59a', trim: '#e9bd76' },
  parede_madeira: { base: '#d9a77a', pattern: 'panels', pat: '#c48f62', trim: '#a87650' },
  parede_castelo: { base: '#e9e3f3', pattern: 'stone', pat: '#d5cbe6', trim: '#b7a8d1' },
  // paredes dos mapas
  loja: { base: '#fff0f7', pattern: 'stripes', pat: '#fde3ef', trim: '#f2a7c9' },
  salao: { base: '#f3e7ff', pattern: 'dots', pat: '#e3d0fb', trim: '#c4a6ea' },
  confeitaria: { base: '#fff4e0', pattern: 'check', pat: '#ffd8e6', trim: '#f1b28f' },
  clinica: { base: '#e5f7f1', pattern: 'stripes', pat: '#d2efe5', trim: '#86cdb3' },
  danca: { base: '#fde6f3', pattern: 'mirror', pat: '#dff2ff', trim: '#d690bd' },
  biblioteca: { base: '#c99d77', pattern: 'books', pat: '#8b5e42', trim: '#8b5e42' },
  atelie: { base: '#fffaf0', pattern: 'dots', pat: '#ffd3a8', trim: '#d9b58a' },
  castelo: { base: '#efe6fa', pattern: 'stone', pat: '#ddd0ef', trim: '#bca7dd' },
  tijolo: { base: '#f3c9b5', pattern: 'bricks', pat: '#e4ab92', trim: '#c98b70' },
};

function drawWallFace(ctx: Ctx, st: WallStyle, side: 'L' | 'R', W: number) {
  // desenha no espaço local da parede: retângulo (0,0)-(W, WALL_H), y para baixo
  rrPath(ctx, 0, 0, W, WALL_H, 0);
  ctx.fillStyle = side === 'L' ? st.base : darken(st.base, 0.06);
  ctx.fill();
  const pat = st.pat ?? '#ffffff';
  const p = st.pattern;
  ctx.save();
  rrPath(ctx, 0, 0, W, WALL_H, 0);
  ctx.clip();
  if (p === 'bricks' || p === 'stone') {
    ctx.strokeStyle = pat;
    ctx.lineWidth = 1.2;
    const bh = p === 'stone' ? 14 : 8;
    for (let y = 0, row = 0; y < WALL_H; y += bh, row++) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      for (let x = (row % 2) * (bh); x < W; x += bh * 2) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + bh);
        ctx.stroke();
      }
    }
  } else if (p === 'books') {
    const cols = ['#f29bb1', '#9cc9f0', '#a8dea0', '#ffd98a', '#c9a8ee', '#ffb48f'];
    const r = rng(side === 'L' ? 5 : 9);
    for (let sy = 10; sy < WALL_H - 10; sy += 22) {
      ctx.fillStyle = pat;
      ctx.fillRect(0, sy + 16, W, 4);
      for (let x = 1; x < W - 2; ) {
        const bw = 3 + Math.floor(r() * 3);
        const bh = 10 + Math.floor(r() * 5);
        rrPath(ctx, x, sy + 16 - bh, bw, bh, 1);
        fs(ctx, cols[Math.floor(r() * cols.length)], undefined, 0.6);
        x += bw + 0.6;
      }
    }
  } else if (p === 'panels') {
    ctx.strokeStyle = pat;
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WALL_H);
      ctx.stroke();
    }
  } else if (p === 'clouds') {
    ctx.fillStyle = pat;
    const r = rng(side === 'L' ? 3 : 4);
    for (let i = 0; i < 4; i++) {
      const x = r() * W;
      const y = 10 + r() * (WALL_H - 30);
      ellPath(ctx, x, y, 7, 3.5);
      ctx.fill();
      ellPath(ctx, x + 4, y - 2, 5, 3.5);
      ctx.fill();
    }
  } else if (p === 'mirror') {
    rrPath(ctx, 2, 14, W - 4, WALL_H - 34, 2);
    const g = ctx.createLinearGradient(0, 14, W, WALL_H);
    g.addColorStop(0, '#f3fbff');
    g.addColorStop(0.5, pat);
    g.addColorStop(1, '#ffffff');
    fs(ctx, g, '#b9d4e6', 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 30);
    ctx.lineTo(14, 22);
    ctx.stroke();
    // barra de balé
    ctx.fillStyle = '#d9a77a';
    ctx.fillRect(0, WALL_H - 44, W, 3);
  } else if (p) {
    rrPath(ctx, 0, 0, W, WALL_H, 0);
    patternFill(ctx, p as Pattern, pat, 0, 0, W, WALL_H, 1.6);
  }
  ctx.restore();
  // rodapé e acabamento de cima
  const trim = st.trim ?? darken(st.base, 0.2);
  ctx.fillStyle = trim;
  ctx.fillRect(0, WALL_H - 7, W, 7);
  ctx.fillStyle = lighten(trim, 0.35);
  ctx.fillRect(0, 0, W, 4);
  ctx.strokeStyle = outlineOf(trim);
  ctx.lineWidth = 0.8;
  ctx.strokeRect(0, 0, W, WALL_H);
}

/** Aplica a transformação "parede esquerda" ou "parede direita" ao contexto. */
export function wallTransform(ctx: Ctx, side: 'L' | 'R', H: number) {
  if (side === 'L') ctx.transform(1, -0.5, 0, 1, 0, H - WALL_H);
  else ctx.transform(1, 0.5, 0, 1, 0, H - HH - WALL_H);
}

function wallSpec(style: string, side: 'L' | 'R'): ArtSpec {
  const st = WALLS[style] ?? WALLS.parede_creme;
  const H = HH + WALL_H + 2;
  return {
    w: HW,
    h: H,
    ox: side === 'L' ? 0 : HW,
    oy: H,
    draw: (ctx) => {
      ctx.save();
      wallTransform(ctx, side, H);
      drawWallFace(ctx, st, side, HW);
      ctx.restore();
    },
  };
}

/** Tampa/quina onde as duas paredes se encontram. */
function cornerSpec(style: string): ArtSpec {
  const st = WALLS[style] ?? WALLS.parede_creme;
  return {
    w: 8,
    h: WALL_H + 10,
    ox: 4,
    oy: WALL_H + 8,
    draw: (ctx) => {
      rrPath(ctx, 2.5, 4, 3, WALL_H + 4, 1.5);
      fs(ctx, st.trim ?? darken(st.base, 0.2), undefined, 0.8);
    },
  };
}

registerFamily('floor', ([type, v]) => floorSpec(type, Number(v) || 0));
registerFamily('edge', ([side, type]) => edgeSpec(side, type));
registerFamily('wall', ([style, side]) => wallSpec(style, side as 'L' | 'R'));
registerFamily('wallcorner', ([style]) => cornerSpec(style));

/** Miniatura de papel de parede/piso para a interface. */
export function surfaceSwatch(kind: 'floor' | 'wall', id: string): ArtSpec {
  if (kind === 'floor') {
    return {
      w: TILE_W * 2,
      h: TILE_H * 2 + 4,
      ox: 0,
      oy: 0,
      draw: (ctx) => {
        const pos: number[][] = [[HW, 0, 0], [0, HH, 1], [TILE_W, HH, 2], [HW, TILE_H, 3]];
        for (const [dx, dy, v] of pos) {
          ctx.save();
          ctx.translate(dx, dy + 2);
          floorSpec(id, v).draw(ctx);
          ctx.restore();
        }
      },
    };
  }
  return {
    w: 40,
    h: 48,
    ox: 0,
    oy: 0,
    draw: (ctx) => {
      ctx.save();
      ctx.scale(40 / HW, 48 / WALL_H);
      drawWallFace(ctx, WALLS[id] ?? WALLS.parede_creme, 'L', HW);
      ctx.restore();
    },
  };
}
registerFamily('swatch', ([kind, id]) => surfaceSwatch(kind as 'floor' | 'wall', id));

export { heartPath };
