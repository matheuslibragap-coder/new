'use strict';

/* =========================================================================
   TEIA DA CIDADE — plataforma 2D estilo Mario com heroi que usa teias
   Motor: Canvas 2D + JS puro, sem dependencias externas.
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. SETUP / CONSTANTES
   ------------------------------------------------------------------------- */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const GAME_W = canvas.width;   // 960
const GAME_H = canvas.height;  // 540

// fisica do jogador (valores calibrados para 60fps; dt = 1 a 60fps)
const GRAVITY = 0.62;
const MOVE_ACCEL = 0.85;
const AIR_ACCEL = 0.6;
const MAX_RUN_SPEED = 6;
const GROUND_FRICTION = 0.78;
const AIR_FRICTION = 0.95;
const JUMP_VELOCITY = -13.2;
const JUMP_CUT_MULTIPLIER = 0.45;
const MAX_FALL_SPEED = 15;

const WALL_SLIDE_SPEED = 2.2;
const WALL_CLING_MAX = 130;      // frames de "stamina" para grudar na parede
const WALL_CLIMB_SPEED = -1.9;
const WALL_JUMP_VX = 7.5;
const WALL_JUMP_VY = -12.5;

const WEB_ATTACH_RANGE = 300;
const WEB_MIN_LEN = 50;
const WEB_MAX_LEN = 260;
const WEB_SWING_PUMP = 0.0017;
const WEB_MAX_ANGLE = Math.PI * 0.92;

const INVULN_FRAMES = 100;
const PLAYER_W = 26, PLAYER_H = 42;

/* -------------------------------------------------------------------------
   2. UTILITARIOS
   ------------------------------------------------------------------------- */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function rect(x, y, w, h) { return { x, y, w, h }; }

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------
   3. INPUT
   ------------------------------------------------------------------------- */
const Input = {
  left: false, right: false, up: false, down: false,
  jump: false, web: false, confirm: false,
  _prevJump: false, _prevConfirm: false,
  jumpPressed: false, jumpReleased: false, confirmPressed: false,
};

const KEYMAP_LEFT = ['ArrowLeft', 'KeyA'];
const KEYMAP_RIGHT = ['ArrowRight', 'KeyD'];
const KEYMAP_UP = ['ArrowUp', 'KeyW'];
const KEYMAP_DOWN = ['ArrowDown', 'KeyS'];
const KEYMAP_JUMP = ['Space', 'ArrowUp', 'KeyW'];
const KEYMAP_WEB = ['ShiftLeft', 'ShiftRight'];
const KEYMAP_CONFIRM = ['Enter', 'Space'];

window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (KEYMAP_LEFT.includes(e.code)) Input.left = true;
  if (KEYMAP_RIGHT.includes(e.code)) Input.right = true;
  if (KEYMAP_UP.includes(e.code)) Input.up = true;
  if (KEYMAP_DOWN.includes(e.code)) Input.down = true;
  if (KEYMAP_JUMP.includes(e.code)) Input.jump = true;
  if (KEYMAP_WEB.includes(e.code)) Input.web = true;
  if (KEYMAP_CONFIRM.includes(e.code)) Input.confirm = true;
});
window.addEventListener('keyup', (e) => {
  if (KEYMAP_LEFT.includes(e.code)) Input.left = false;
  if (KEYMAP_RIGHT.includes(e.code)) Input.right = false;
  if (KEYMAP_UP.includes(e.code)) Input.up = false;
  if (KEYMAP_DOWN.includes(e.code)) Input.down = false;
  if (KEYMAP_JUMP.includes(e.code)) Input.jump = false;
  if (KEYMAP_WEB.includes(e.code)) Input.web = false;
  if (KEYMAP_CONFIRM.includes(e.code)) Input.confirm = false;
});
canvas.addEventListener('mousedown', () => { Input.web = true; });
window.addEventListener('mouseup', () => { Input.web = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function updateInputEdges() {
  Input.jumpPressed = Input.jump && !Input._prevJump;
  Input.jumpReleased = !Input.jump && Input._prevJump;
  Input.confirmPressed = Input.confirm && !Input._prevConfirm;
  Input._prevJump = Input.jump;
  Input._prevConfirm = Input.confirm;
}

/* -------------------------------------------------------------------------
   4. COLISAO / FISICA GENERICA
   ------------------------------------------------------------------------- */
function resolveX(entity, solids) {
  entity.touchingWallLeft = false;
  entity.touchingWallRight = false;
  for (const s of solids) {
    if (rectsOverlap(entity, s)) {
      if (entity.vx > 0) { entity.x = s.x - entity.w; entity.touchingWallRight = true; }
      else if (entity.vx < 0) { entity.x = s.x + s.w; entity.touchingWallLeft = true; }
      entity.vx = 0;
    }
  }
}

function resolveY(entity, solids, oneways, prevBottom) {
  let grounded = false;
  for (const s of solids) {
    if (rectsOverlap(entity, s)) {
      if (entity.vy > 0) { entity.y = s.y - entity.h; grounded = true; }
      else if (entity.vy < 0) { entity.y = s.y + s.h; }
      entity.vy = 0;
    }
  }
  for (const s of oneways) {
    if (entity.vy >= 0 && rectsOverlap(entity, s) && prevBottom <= s.y + 1) {
      entity.y = s.y - entity.h;
      entity.vy = 0;
      grounded = true;
    }
  }
  return grounded;
}

/* -------------------------------------------------------------------------
   5. GERACAO DE CENARIO (parallax) — deterministica por seed
   ------------------------------------------------------------------------- */
function genBuildingLayer(rng, levelWidth, count, minH, maxH, minW, maxW, colorPick) {
  const buildings = [];
  let x = -50;
  for (let i = 0; i < count && x < levelWidth + 100; i++) {
    const w = minW + rng() * (maxW - minW);
    const h = minH + rng() * (maxH - minH);
    const windows = [];
    const cols = Math.max(1, Math.floor(w / 18));
    const rows = Math.max(1, Math.floor(h / 22));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng() < 0.55) windows.push({ x: 6 + c * 18, y: 10 + r * 22 });
      }
    }
    buildings.push({ x, w, h, color: colorPick(rng), windows });
    x += w + 4 + rng() * 30;
  }
  return buildings;
}

function buildBackground(seed, levelWidth, theme) {
  const rng = mulberry32(seed);
  const dayFar = () => (rng() < 0.5 ? '#7c8db5' : '#8fa0c4');
  const dayMid = () => (rng() < 0.5 ? '#5d6f9c' : '#6a7dab');
  const dayNear = () => (rng() < 0.5 ? '#3f4f7a' : '#485a86');
  const nightFar = () => (rng() < 0.5 ? '#232049' : '#2a2657');
  const nightMid = () => (rng() < 0.5 ? '#191634' : '#1f1c3d');
  const nightNear = () => (rng() < 0.5 ? '#100e26' : '#15132e');
  const far = theme === 'night' ? nightFar : dayFar;
  const mid = theme === 'night' ? nightMid : dayMid;
  const near = theme === 'night' ? nightNear : dayNear;
  return {
    far: genBuildingLayer(rng, levelWidth, 60, 120, 260, 60, 140, far),
    mid: genBuildingLayer(rng, levelWidth, 70, 90, 220, 50, 120, mid),
    near: genBuildingLayer(rng, levelWidth, 80, 60, 170, 40, 100, near),
  };
}

/* -------------------------------------------------------------------------
   6. SPRITES PIXEL-ART (grades pequenas desenhadas em blocos)
   ------------------------------------------------------------------------- */
function drawPixelGrid(g, x, y, w, h, palette, flip) {
  const rows = g.length, cols = g[0].length;
  const pw = w / cols, ph = h / rows;
  ctx.save();
  if (flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.translate(-x, -y); }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = g[r][c];
      if (v === 0) continue;
      ctx.fillStyle = palette[v];
      ctx.fillRect(Math.floor(x + c * pw), Math.floor(y + r * ph), Math.ceil(pw) + 1, Math.ceil(ph) + 1);
    }
  }
  ctx.restore();
}

const PLAYER_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 4, 3, 3, 4, 1, 1],
  [1, 1, 3, 1, 1, 3, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 2, 1, 1, 1, 1, 2, 0],
  [0, 2, 1, 3, 3, 1, 2, 0],
  [0, 0, 2, 1, 1, 2, 0, 0],
  [0, 0, 2, 0, 0, 2, 0, 0],
  [0, 0, 2, 0, 0, 2, 0, 0],
  [0, 0, 2, 0, 0, 2, 0, 0],
  [0, 3, 3, 0, 0, 3, 3, 0],
];
const PLAYER_PALETTE = { 1: '#d62828', 2: '#1d3fd6', 3: '#111111', 4: '#ffffff' };

const PLAYER_SWING_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 4, 3, 3, 4, 1, 1],
  [1, 1, 3, 1, 1, 3, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [2, 2, 1, 1, 1, 1, 2, 2],
  [0, 2, 1, 3, 3, 1, 2, 0],
  [0, 0, 2, 1, 1, 2, 0, 0],
  [0, 0, 2, 0, 0, 2, 0, 0],
  [0, 0, 0, 2, 2, 0, 0, 0],
  [0, 0, 0, 2, 2, 0, 0, 0],
  [0, 0, 3, 0, 0, 3, 0, 0],
];

const THUG_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 4, 1, 1, 4, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 3, 0, 0, 0, 3, 0, 0],
];
const THUG_PALETTE = { 1: '#4a3b6b', 3: '#111111', 4: '#ffffff' };

const DRONE_GRID = [
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 4, 1, 1, 4, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 3, 1, 1, 1, 1, 3, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 3, 0, 0, 3, 0, 0, 0],
];
const DRONE_PALETTE = { 1: '#8a8a9a', 3: '#333333', 4: '#ff3333' };

const CAR_GRID = [
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 4, 4, 1, 1, 1, 1, 1, 4, 4, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 3, 3, 0, 0, 0, 0, 0, 3, 3, 0, 0],
];
const CAR_PALETTE = { 1: '#e8c23a', 3: '#111111', 4: '#87d9ff' };

const BOSS_GRID = [
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 4, 4, 1, 1, 4, 4, 1, 1, 0],
  [0, 1, 1, 4, 4, 1, 1, 4, 4, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1],
  [0, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 0],
  [0, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 0],
  [0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0],
  [0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0],
  [0, 0, 3, 3, 0, 0, 0, 0, 3, 3, 0, 0],
];
const BOSS_PALETTE = { 1: '#2f6b3a', 2: '#4a2f6b', 3: '#111111', 4: '#ff3333' };

const GEM_GRID = [
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 3, 3, 1, 1, 0],
  [1, 1, 3, 3, 3, 3, 1, 1],
  [1, 1, 3, 3, 3, 3, 1, 1],
  [0, 1, 1, 3, 3, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
];
const GEM_PALETTE = { 1: '#e23b3b', 3: '#111111' };

/* -------------------------------------------------------------------------
   7. FABRICA DE COLETAVEIS AUTOMATICA
   ------------------------------------------------------------------------- */
function autoCollectibles(walkableRects, spacing, yOffset) {
  const items = [];
  for (const r of walkableRects) {
    for (let x = r.x + 70; x < r.x + r.w - 70; x += spacing) {
      items.push({ x, y: r.y - yOffset, w: 16, h: 16, collected: false, bob: Math.random() * Math.PI * 2 });
    }
  }
  return items;
}

/* -------------------------------------------------------------------------
   8. ENTIDADES: INIMIGOS
   ------------------------------------------------------------------------- */
function makeThug(x, y, rangeMin, rangeMax, speed) {
  return { type: 'thug', x, y, w: 24, h: 38, vy: 0, dir: 1, speed: speed || 1.4,
    rangeMin, rangeMax, alive: true, stompable: true };
}
function makeDrone(x, y, rangeMin, rangeMax, speed) {
  return { type: 'drone', x, y, w: 28, h: 20, dir: 1, speed: speed || 1.8,
    rangeMin, rangeMax, baseY: y, bob: Math.random() * Math.PI * 2, alive: true, stompable: true };
}
function makeCar(x, y, rangeMin, rangeMax, speed) {
  return { type: 'car', x, y, w: 44, h: 22, dir: 1, speed: speed || 2.6,
    rangeMin, rangeMax, alive: true, stompable: false };
}

function updateThug(e, dt, solids, oneways) {
  e.x += e.dir * e.speed * dt;
  if (e.x < e.rangeMin) { e.x = e.rangeMin; e.dir = 1; }
  if (e.x + e.w > e.rangeMax) { e.x = e.rangeMax - e.w; e.dir = -1; }
  e.vy += GRAVITY * dt;
  e.y += e.vy * dt;
  for (const s of solids) {
    if (rectsOverlap(e, s) && e.vy >= 0) { e.y = s.y - e.h; e.vy = 0; }
  }
  for (const s of oneways) {
    if (rectsOverlap(e, s) && e.vy >= 0) { e.y = s.y - e.h; e.vy = 0; }
  }
}
function updateDrone(e, dt) {
  e.x += e.dir * e.speed * dt;
  if (e.x < e.rangeMin) { e.x = e.rangeMin; e.dir = 1; }
  if (e.x + e.w > e.rangeMax) { e.x = e.rangeMax - e.w; e.dir = -1; }
  e.bob += 0.05 * dt;
  e.y = e.baseY + Math.sin(e.bob) * 12;
}
function updateCar(e, dt) {
  e.x += e.dir * e.speed * dt;
  if (e.x < e.rangeMin) { e.x = e.rangeMin; e.dir = 1; }
  if (e.x + e.w > e.rangeMax) { e.x = e.rangeMax - e.w; e.dir = -1; }
}

/* -------------------------------------------------------------------------
   9. NIVEIS
   ------------------------------------------------------------------------- */
function createLevel1() {
  const groundY = 480;
  const solids = [
    rect(0, groundY, 820, GAME_H - groundY),
    rect(960, groundY, 440, GAME_H - groundY),
    rect(1540, groundY, 460, GAME_H - groundY),
    rect(2280, groundY, 420, GAME_H - groundY),
    rect(3000, groundY, 400, GAME_H - groundY),
  ];
  const oneways = [
    rect(2740, 430, 110, 16),
    rect(2880, 380, 110, 16),
  ];
  const anchors = [{ x: 2140, y: 200, r: 14 }];
  const enemies = [
    makeThug(1050, groundY - 38, 970, 1360, 1.3),
    makeThug(1650, groundY - 38, 1560, 1960, 1.5),
    makeThug(2380, groundY - 38, 2300, 2660, 1.4),
  ];
  const collectibles = autoCollectibles(solids, 170, 50).concat(
    autoCollectibles(oneways, 140, 40)
  );
  const checkpoints = [
    { x: 980, y: groundY - 42, activated: true },
    { x: 2320, y: groundY - 42, activated: false },
  ];
  const flag = rect(3350, groundY - 120, 16, 120);
  const bg = buildBackground(101, 3400, 'day');
  return {
    name: 'Fase 1 — Ruas de Queens', width: 3400, theme: 'day', groundY,
    solids, oneways, anchors, enemies, collectibles, checkpoints, flag,
    boss: null, bg,
    playerStart: { x: 60, y: 400 },
    respawn: { x: 60, y: 400 },
  };
}

function createLevel2() {
  const groundY = 480;
  const roofY = 270;
  const solids = [
    rect(0, groundY, 700, GAME_H - groundY),
    rect(850, groundY, 300, GAME_H - groundY),
    rect(1450, groundY, 250, GAME_H - groundY),
    rect(1700, roofY, 50, GAME_H - roofY),                          // parede de escalada
    rect(1750, roofY, 400, 30),                                     // telhado D
    rect(2450, roofY, 300, 30),                                     // telhado E
    rect(3080, groundY, 520, GAME_H - groundY),
    rect(3760, groundY, 440, GAME_H - groundY),
    rect(4480, groundY, 120, GAME_H - groundY),
  ];
  const oneways = [
    rect(2750, 280, 120, 18),
    rect(2900, 350, 120, 18),
    rect(3050, 420, 120, 18),
  ];
  const anchors = [
    { x: 1300, y: 180, r: 14 },
    { x: 2300, y: roofY - 90, r: 14 },
    { x: 4340, y: 200, r: 14 },
  ];
  const enemies = [
    makeThug(1800, roofY - 38, 1760, 2130, 1.4),
    makeDrone(3200, 330, 3150, 3500, 1.6),
    makeCar(3200, groundY - 22, 3150, 3550, 2.8),
    makeThug(3820, groundY - 38, 3780, 4150, 1.5),
    makeThug(4050, groundY - 38, 3980, 4180, 1.7),
    makeDrone(3950, 300, 3850, 4150, 1.9),
  ];
  const collectibles = autoCollectibles(
    [solids[0], solids[1], solids[2], solids[4], solids[5], solids[6], solids[7], solids[8]], 190, 50
  ).concat(autoCollectibles(oneways, 130, 36));
  const checkpoints = [
    { x: 870, y: groundY - 42, activated: true },
    { x: 1770, y: roofY - 42, activated: false },
    { x: 3100, y: groundY - 42, activated: false },
    { x: 3780, y: groundY - 42, activated: false },
    { x: 4500, y: groundY - 42, activated: false },
  ];
  const flag = rect(4560, groundY - 120, 16, 120);
  const bg = buildBackground(202, 4600, 'night');
  return {
    name: 'Fase 2 — Distrito Financeiro à Noite', width: 4600, theme: 'night', groundY,
    solids, oneways, anchors, enemies, collectibles, checkpoints, flag,
    boss: null, bg,
    playerStart: { x: 60, y: 400 },
    respawn: { x: 60, y: 400 },
  };
}

function createLevel3() {
  const groundY = 480;
  const roofY = 270;
  const solids = [
    rect(0, groundY, 600, GAME_H - groundY),
    rect(770, groundY, 230, GAME_H - groundY),
    rect(1300, groundY, 200, GAME_H - groundY),
    rect(1500, roofY, 50, GAME_H - roofY),                         // parede 1
    rect(1550, roofY, 300, 30),                                    // telhado D
    rect(2170, roofY, 230, 30),                                    // telhado E
    rect(2700, groundY, 500, GAME_H - groundY),
    rect(3370, groundY, 330, GAME_H - groundY),
    rect(3700, roofY, 50, GAME_H - roofY),                         // parede 2
    rect(3750, roofY, 300, 30),                                    // telhado H
    rect(4400, groundY, 100, GAME_H - groundY),
    rect(4500, groundY, 500, GAME_H - groundY),                    // arena do chefe
  ];
  const oneways = [
    rect(2400, 280, 110, 18),
    rect(2540, 350, 110, 18),
    rect(2680, 420, 110, 18),
  ];
  const anchors = [
    { x: 1150, y: 180, r: 14 },
    { x: 2010, y: roofY - 90, r: 14 },
    { x: 4225, y: 160, r: 14 },
  ];
  const enemies = [
    makeThug(1650, roofY - 38, 1580, 1830, 1.6),
    makeDrone(1700, roofY - 60, 1600, 1800, 1.9),
    makeDrone(2250, roofY - 50, 2180, 2380, 2.0),
    makeThug(2950, groundY - 38, 2900, 3150, 1.6),
    makeCar(2950, groundY - 22, 2750, 3150, 3.0),
    makeThug(3450, groundY - 38, 3400, 3660, 1.7),
    makeThug(3550, groundY - 38, 3400, 3660, 1.9),
    makeDrone(3550, 300, 3400, 3660, 2.0),
    makeDrone(3900, 250, 3780, 4030, 2.1),
  ];
  const collectibles = autoCollectibles(
    [solids[0], solids[1], solids[2], solids[4], solids[5], solids[6], solids[7], solids[9], solids[10]], 200, 50
  ).concat(autoCollectibles(oneways, 130, 36));
  const checkpoints = [
    { x: 780, y: groundY - 42, activated: true },
    { x: 1570, y: roofY - 42, activated: false },
    { x: 2720, y: groundY - 42, activated: false },
    { x: 3770, y: roofY - 42, activated: false },
    { x: 4420, y: groundY - 42, activated: false },
  ];
  const boss = {
    x: 4750, y: groundY - 84, w: 60, h: 84,
    rangeMin: 4560, rangeMax: 4900,
    hp: 3, maxHp: 3, dir: 1, speed: 1.7,
    state: 'move', timer: 0, vy: 0, alive: true,
    groundY: groundY - 84,
  };
  const bg = buildBackground(303, 5000, 'dusk');
  return {
    name: 'Fase 3 — Confronto na Torre', width: 5000, theme: 'dusk', groundY,
    solids, oneways, anchors, enemies, collectibles, checkpoints, flag: null,
    boss, bg,
    playerStart: { x: 60, y: 400 },
    respawn: { x: 60, y: 400 },
  };
}

const LEVEL_FACTORIES = [createLevel1, createLevel2, createLevel3];

/* -------------------------------------------------------------------------
   10. JOGADOR
   ------------------------------------------------------------------------- */
function makePlayer() {
  return {
    x: 60, y: 400, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0,
    facing: 1, grounded: false,
    touchingWallLeft: false, touchingWallRight: false,
    onWallCling: false, wallClingTimer: 0,
    swinging: false, webAnchor: null, webLength: 0, webAngle: 0, webAngularVel: 0,
    invuln: 0, animTimer: 0,
  };
}

function attachWeb(p, anchor) {
  const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
  const dx = cx - anchor.x, dy = cy - anchor.y;
  const dist = Math.hypot(dx, dy) || 1;
  p.webLength = clamp(dist, WEB_MIN_LEN, WEB_MAX_LEN);
  p.webAnchor = anchor;
  p.webAngle = Math.atan2(dx, dy);
  const L = p.webLength;
  p.webAngularVel = (p.vx * Math.cos(p.webAngle) - p.vy * Math.sin(p.webAngle)) / L;
  p.swinging = true;
  p.onWallCling = false;
  p.grounded = false; // evita "grounded" (chao) residual enquanto balança no ar
}

function findAttachableAnchor(p, anchors) {
  const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
  let best = null, bestDist = Infinity;
  for (const a of anchors) {
    const d = Math.hypot(cx - a.x, cy - a.y);
    if (d <= WEB_ATTACH_RANGE && d < bestDist) { best = a; bestDist = d; }
  }
  return best;
}

function updateSwing(p, dt) {
  const L = p.webLength;
  let pump = 0;
  if (Input.left) pump -= WEB_SWING_PUMP;
  if (Input.right) pump += WEB_SWING_PUMP;
  const angAccel = -(GRAVITY / L) * Math.sin(p.webAngle) + pump;
  p.webAngularVel += angAccel * dt;
  p.webAngularVel *= 0.9985;
  p.webAngle += p.webAngularVel * dt;

  if (p.webAngle > WEB_MAX_ANGLE) { p.webAngle = WEB_MAX_ANGLE; p.webAngularVel = Math.min(p.webAngularVel, 0); }
  if (p.webAngle < -WEB_MAX_ANGLE) { p.webAngle = -WEB_MAX_ANGLE; p.webAngularVel = Math.max(p.webAngularVel, 0); }

  const cx = p.webAnchor.x + L * Math.sin(p.webAngle);
  const cy = p.webAnchor.y + L * Math.cos(p.webAngle);
  p.vx = L * Math.cos(p.webAngle) * p.webAngularVel;
  p.vy = -L * Math.sin(p.webAngle) * p.webAngularVel;
  p.x = cx - p.w / 2;
  p.y = cy - p.h / 2;
  p.facing = p.vx >= 0 ? 1 : -1;

  if (!Input.web) {
    p.swinging = false;
  } else if (Input.jumpPressed) {
    p.swinging = false;
    p.vy -= 5;
  }
}

function updatePlayer(p, level, dt) {
  if (p.invuln > 0) p.invuln -= dt;
  p.animTimer += dt;

  // decide ANTES de mover se comeca/continua balançando nesta rodada, para
  // que o quadro em que solta a teia nao rode tambem a fisica normal de
  // corrida (o que zeraria o momentum ganho no balanço via o clamp de
  // velocidade maxima de corrida)
  if (!p.swinging && Input.web) {
    const anchor = findAttachableAnchor(p, level.anchors);
    if (anchor) attachWeb(p, anchor);
  }

  if (p.swinging) {
    updateSwing(p, dt);
  } else {
    // o input de corrida nunca EMPURRA a velocidade alem de MAX_RUN_SPEED, mas
    // tambem nao corta de sopetao um momentum maior herdado de fora (balanço
    // de teia, impulso de parede) — esse excesso decai suavemente pelo atrito
    const accel = p.grounded ? MOVE_ACCEL : AIR_ACCEL;
    if (Input.left && !Input.right) {
      p.vx = p.vx > -MAX_RUN_SPEED ? Math.max(p.vx - accel * dt, -MAX_RUN_SPEED) : p.vx;
      p.facing = -1;
    } else if (Input.right && !Input.left) {
      p.vx = p.vx < MAX_RUN_SPEED ? Math.min(p.vx + accel * dt, MAX_RUN_SPEED) : p.vx;
      p.facing = 1;
    } else {
      const fr = p.grounded ? GROUND_FRICTION : AIR_FRICTION;
      p.vx *= Math.pow(fr, dt);
      if (Math.abs(p.vx) < 0.05) p.vx = 0;
    }

    // wall cling — primeiro agarre exige vy>=-1 (nao gruda em pulo forte),
    // mas a continuacao nao pode depender de vy pois a propria velocidade de
    // escalada (-1.9) violaria esse limite e causaria oscilacao frame a frame
    p.onWallCling = false;
    const alreadyClinging = p.wallClingTimer > 0 && p.wallClingTimer < WALL_CLING_MAX;
    if (!p.grounded && (p.vy >= -1 || alreadyClinging)) {
      const wallLeft = p.touchingWallLeft && Input.left;
      const wallRight = p.touchingWallRight && Input.right;
      if ((wallLeft || wallRight) && p.wallClingTimer < WALL_CLING_MAX) {
        p.onWallCling = true;
        p.wallClingTimer += dt;
        if (Input.up) p.vy = WALL_CLIMB_SPEED;
        else p.vy = Math.min(p.vy, WALL_SLIDE_SPEED);
      }
    }
    if (p.grounded) p.wallClingTimer = 0;

    // pulo
    if (Input.jumpPressed) {
      if (p.grounded) {
        p.vy = JUMP_VELOCITY;
        p.grounded = false;
      } else if (p.onWallCling) {
        p.vy = WALL_JUMP_VY;
        p.vx = p.touchingWallLeft ? WALL_JUMP_VX : -WALL_JUMP_VX;
        p.facing = p.touchingWallLeft ? 1 : -1;
        p.wallClingTimer = WALL_CLING_MAX;
        p.onWallCling = false;
      }
    }
    if (Input.jumpReleased && p.vy < 0) {
      p.vy *= JUMP_CUT_MULTIPLIER;
    }

    if (!p.onWallCling) {
      p.vy += GRAVITY * dt;
    }
    p.vy = clamp(p.vy, -999, MAX_FALL_SPEED);

    const prevBottom = p.y + p.h;
    p.x += p.vx * dt;
    resolveX(p, level.solids);
    p.y += p.vy * dt;
    p.grounded = resolveY(p, level.solids, level.oneways, prevBottom);
  }

  p.x = clamp(p.x, 0, level.width - p.w);
}

/* -------------------------------------------------------------------------
   11. CHEFE (fase 3)
   ------------------------------------------------------------------------- */
function updateBoss(boss, player, dt, onPlayerHit) {
  if (!boss || !boss.alive) return;
  switch (boss.state) {
    case 'move': {
      boss.x += boss.dir * boss.speed * dt;
      if (boss.x < boss.rangeMin) { boss.x = boss.rangeMin; boss.dir = 1; }
      if (boss.x + boss.w > boss.rangeMax) { boss.x = boss.rangeMax - boss.w; boss.dir = -1; }
      boss.timer += dt;
      if (boss.timer > 140) { boss.state = 'telegraph'; boss.timer = 0; }
      break;
    }
    case 'telegraph': {
      boss.timer += dt;
      if (boss.timer > 45) { boss.state = 'slam'; boss.vy = -11; boss.timer = 0; }
      break;
    }
    case 'slam': {
      boss.vy += GRAVITY * dt;
      boss.y += boss.vy * dt;
      if (boss.y >= boss.groundY) {
        boss.y = boss.groundY;
        boss.vy = 0;
        boss.state = 'stunned';
        boss.timer = 0;
        // onda de choque
        const cx = boss.x + boss.w / 2;
        if (player.grounded && Math.abs((player.x + player.w / 2) - cx) < 160 && player.invuln <= 0) {
          onPlayerHit();
        }
      }
      break;
    }
    case 'stunned': {
      boss.timer += dt;
      if (boss.timer > 100) {
        boss.state = 'move';
        boss.timer = 0;
        boss.speed = Math.min(boss.speed + 0.35, 3.2);
      }
      break;
    }
  }
}

/* -------------------------------------------------------------------------
   12. ESTADO DO JOGO
   ------------------------------------------------------------------------- */
const Game = {
  state: 'start', // start | playing | levelcomplete | gameover | win
  levelIndex: 0,
  score: 0,
  lives: 3,
  level: null,
  player: null,
  camera: { x: 0 },
  transitionTimer: 0,
};

function loadLevel(index) {
  Game.level = LEVEL_FACTORIES[index]();
  Game.player = makePlayer();
  Game.player.x = Game.level.playerStart.x;
  Game.player.y = Game.level.playerStart.y;
  Game.camera.x = 0;
}

function respawnPlayer() {
  const p = Game.player, r = Game.level.respawn;
  p.x = r.x; p.y = r.y; p.vx = 0; p.vy = 0;
  p.swinging = false; p.onWallCling = false; p.wallClingTimer = 0;
  p.invuln = INVULN_FRAMES;
}

function loseLife() {
  Game.lives--;
  if (Game.lives <= 0) {
    Game.lives = 0;
    Game.state = 'gameover';
  } else {
    respawnPlayer();
  }
}

function triggerLevelComplete() {
  Game.state = 'levelcomplete';
  Game.transitionTimer = 0;
}

function startGame() {
  Game.score = 0;
  Game.lives = 3;
  Game.levelIndex = 0;
  loadLevel(0);
  Game.state = 'playing';
}

/* -------------------------------------------------------------------------
   13. ATUALIZACAO PRINCIPAL
   ------------------------------------------------------------------------- */
function updatePlaying(dt) {
  const level = Game.level, p = Game.player;

  updatePlayer(p, level, dt);

  for (const e of level.enemies) {
    if (!e.alive) continue;
    if (e.type === 'thug') updateThug(e, dt, level.solids, level.oneways);
    else if (e.type === 'drone') updateDrone(e, dt);
    else if (e.type === 'car') updateCar(e, dt);
  }

  if (level.boss) {
    updateBoss(level.boss, p, dt, () => loseLife());
  }

  // checkpoints
  for (const cp of level.checkpoints) {
    if (!cp.activated && p.x >= cp.x) {
      cp.activated = true;
      level.respawn = { x: cp.x, y: cp.y };
    }
  }

  // coletaveis
  for (const c of level.collectibles) {
    if (c.collected) continue;
    c.bob += 0.08 * dt;
    const box = { x: c.x, y: c.y + Math.sin(c.bob) * 4, w: c.w, h: c.h };
    if (rectsOverlap(p, box)) { c.collected = true; Game.score += 10; }
  }

  // inimigos: colisao
  for (const e of level.enemies) {
    if (!e.alive) continue;
    if (rectsOverlap(p, e)) {
      const stomp = e.stompable && p.vy > 0 && (p.y + p.h) < (e.y + e.h * 0.5 + 10);
      if (stomp) {
        e.alive = false;
        Game.score += 50;
        p.vy = -9;
      } else if (p.invuln <= 0) {
        loseLife();
      }
    }
  }

  // chefe: colisao
  if (level.boss && level.boss.alive) {
    const boss = level.boss;
    if (rectsOverlap(p, boss)) {
      const canStomp = boss.state === 'stunned' && p.vy > 0 && (p.y + p.h) < (boss.y + boss.h * 0.5 + 12);
      if (canStomp) {
        boss.hp--;
        p.vy = -10;
        boss.timer = 0;
        if (boss.hp <= 0) {
          boss.alive = false;
          Game.score += 500;
          triggerLevelComplete();
        }
      } else if (p.invuln <= 0) {
        loseLife();
      }
    }
  }

  // queda em poco
  if (p.y > GAME_H + 150) {
    loseLife();
  }

  // bandeira
  if (level.flag && rectsOverlap(p, level.flag)) {
    triggerLevelComplete();
  }

  // camera
  const targetX = p.x + p.w / 2 - GAME_W / 2;
  Game.camera.x = clamp(targetX, 0, Math.max(0, level.width - GAME_W));
}

function update(dt) {
  updateInputEdges();
  if (Game.state === 'playing') {
    updatePlaying(dt);
  } else if (Game.state === 'levelcomplete') {
    Game.transitionTimer += dt;
    if (Game.transitionTimer > 120) {
      if (Game.levelIndex < LEVEL_FACTORIES.length - 1) {
        Game.levelIndex++;
        const keepScore = Game.score, keepLives = Game.lives;
        loadLevel(Game.levelIndex);
        Game.score = keepScore; Game.lives = keepLives;
        Game.state = 'playing';
      } else {
        Game.state = 'win';
      }
    }
  } else if (Game.state === 'start') {
    if (Input.confirmPressed) startGame();
  } else if (Game.state === 'gameover' || Game.state === 'win') {
    if (Input.confirmPressed) startGame();
  }
}

/* -------------------------------------------------------------------------
   14. RENDERIZACAO
   ------------------------------------------------------------------------- */
function drawBackgroundLayer(buildings, camX, factor, theme) {
  const offset = camX * factor;
  for (const b of buildings) {
    const sx = b.x - offset;
    if (sx + b.w < 0 || sx > GAME_W) continue;
    const top = GAME_H - 60 - b.h;
    ctx.fillStyle = b.color;
    ctx.fillRect(sx, top, b.w, b.h + 80);
    ctx.fillStyle = theme === 'night' || theme === 'dusk' ? '#f4d35e' : '#dfe9f5';
    for (const w of b.windows) {
      if (theme === 'night' || theme === 'dusk') {
        if ((Math.floor((w.x + b.x) / 7) % 5) !== 0) continue; // parte das janelas acesas
      }
      ctx.fillRect(sx + w.x, top + w.y, 8, 10);
    }
  }
}

function drawSky(theme) {
  let g;
  if (theme === 'night') {
    g = ctx.createLinearGradient(0, 0, 0, GAME_H);
    g.addColorStop(0, '#05061a'); g.addColorStop(1, '#1b1440');
  } else if (theme === 'dusk') {
    g = ctx.createLinearGradient(0, 0, 0, GAME_H);
    g.addColorStop(0, '#2a1435'); g.addColorStop(0.5, '#7a2f4d'); g.addColorStop(1, '#c96a3f');
  } else {
    g = ctx.createLinearGradient(0, 0, 0, GAME_H);
    g.addColorStop(0, '#79c6ec'); g.addColorStop(1, '#c9ecf5');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  if (theme !== 'day') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const rng = mulberry32(7);
    for (let i = 0; i < 60; i++) {
      const sx = (rng() * GAME_W * 2) % GAME_W;
      const sy = rng() * (GAME_H * 0.5);
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
}

function drawStreet(level, camX) {
  const groundY = level.groundY;
  ctx.fillStyle = level.theme === 'day' ? '#5a5a68' : '#25232f';
  ctx.fillRect(0, groundY, GAME_W, GAME_H - groundY);
  ctx.fillStyle = level.theme === 'day' ? '#6f6f7d' : '#332f40';
  for (let x = -((camX) % 40); x < GAME_W; x += 40) {
    ctx.fillRect(x, groundY, 2, GAME_H - groundY);
  }
  // bueiros
  ctx.fillStyle = '#141419';
  for (let wx = 200; wx < level.width; wx += 420) {
    const sx = wx - camX;
    if (sx > -40 && sx < GAME_W + 40) ctx.fillRect(sx, groundY + 6, 26, 10);
  }
}

function drawPlatforms(level, camX) {
  for (const s of level.solids) {
    const sx = s.x - camX;
    if (sx + s.w < 0 || sx > GAME_W) continue;
    ctx.fillStyle = level.theme === 'day' ? '#7a7a86' : '#3a3648';
    ctx.fillRect(sx, s.y, s.w, s.h);
    ctx.fillStyle = level.theme === 'day' ? '#8f8f9a' : '#4c4760';
    for (let bx = 0; bx < s.w; bx += 22) {
      ctx.fillRect(sx + bx, s.y, 18, 6);
    }
  }
  for (const o of level.oneways) {
    const sx = o.x - camX;
    if (sx + o.w < 0 || sx > GAME_W) continue;
    ctx.fillStyle = '#9b6b3c';
    ctx.fillRect(sx, o.y, o.w, o.h);
    ctx.fillStyle = '#c98f4e';
    ctx.fillRect(sx, o.y, o.w, 3);
  }
}

function drawAnchors(level, camX, t) {
  for (const a of level.anchors) {
    const sx = a.x - camX, sy = a.y;
    if (sx < -20 || sx > GAME_W + 20) continue;
    const pulse = 3 + Math.sin(t * 0.08) * 2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, a.r + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f4d35e';
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWeb(p, camX) {
  if (!p.swinging || !p.webAnchor) return;
  const ax = p.webAnchor.x - camX, ay = p.webAnchor.y;
  const px = p.x + p.w / 2 - camX, py = p.y + p.h / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(px, py);
  ctx.stroke();
}

function drawCollectibles(level, camX) {
  for (const c of level.collectibles) {
    if (c.collected) continue;
    const sx = c.x - camX;
    if (sx < -20 || sx > GAME_W + 20) continue;
    const sy = c.y + Math.sin(c.bob) * 4;
    drawPixelGrid(GEM_GRID, sx, sy, c.w, c.h, GEM_PALETTE, false);
  }
}

function drawEnemies(level, camX) {
  for (const e of level.enemies) {
    if (!e.alive) continue;
    const sx = e.x - camX;
    if (sx < -50 || sx > GAME_W + 50) continue;
    const flip = e.dir < 0;
    if (e.type === 'thug') drawPixelGrid(THUG_GRID, sx, e.y, e.w, e.h, THUG_PALETTE, flip);
    else if (e.type === 'drone') drawPixelGrid(DRONE_GRID, sx, e.y, e.w, e.h, DRONE_PALETTE, flip);
    else if (e.type === 'car') drawPixelGrid(CAR_GRID, sx, e.y, e.w, e.h, CAR_PALETTE, e.dir < 0);
  }
}

function drawBoss(level, camX) {
  const boss = level.boss;
  if (!boss || !boss.alive) return;
  const sx = boss.x - camX;
  if (sx < -100 || sx > GAME_W + 100) return;
  if (boss.state === 'telegraph' && Math.floor(boss.timer / 6) % 2 === 0) {
    ctx.save(); ctx.globalAlpha = 0.5;
    drawPixelGrid(BOSS_GRID, sx, boss.y, boss.w, boss.h, { 1: '#ff5555', 2: '#4a2f6b', 3: '#111111', 4: '#ffff55' }, boss.dir < 0);
    ctx.restore();
  } else {
    drawPixelGrid(BOSS_GRID, sx, boss.y, boss.w, boss.h, BOSS_PALETTE, boss.dir < 0);
  }
  // barra de vida
  const barW = 200, barX = GAME_W / 2 - barW / 2;
  ctx.fillStyle = '#111';
  ctx.fillRect(barX - 3, 17, barW + 6, 16);
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, 20, barW, 10);
  ctx.fillStyle = '#ff3b3b';
  ctx.fillRect(barX, 20, barW * (boss.hp / boss.maxHp), 10);
  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  ctx.fillText('CAPANGA-CHEFE', barX, 14);
}

function drawPlayer(p, camX) {
  const sx = p.x - camX;
  const flip = p.facing < 0;
  if (p.invuln > 0 && Math.floor(p.invuln / 5) % 2 === 0) return; // pisca ao levar dano
  const grid = p.swinging ? PLAYER_SWING_GRID : PLAYER_GRID;
  drawPixelGrid(grid, sx, p.y, p.w, p.h, PLAYER_PALETTE, flip);
}

function drawHUD() {
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#000';
  ctx.fillText('PONTOS: ' + Game.score, 18 + 1, 31 + 1);
  ctx.fillStyle = '#fff';
  ctx.fillText('PONTOS: ' + Game.score, 18, 31);

  for (let i = 0; i < 3; i++) {
    const x = GAME_W - 30 - i * 26, y = 22;
    const palette = i < Game.lives ? PLAYER_PALETTE : { 1: '#444', 2: '#333', 3: '#222', 4: '#555' };
    drawPixelGrid([[0, 1, 1, 0], [1, 1, 1, 1], [1, 1, 1, 1], [0, 1, 1, 0]], x, y, 20, 20, palette, false);
  }

  if (Game.level) {
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(Game.level.name, 18, 50);
  }
}

function drawWorld() {
  const level = Game.level, camX = Game.camera.x;
  drawSky(level.theme);
  drawBackgroundLayer(level.bg.far, camX, 0.2, level.theme);
  drawBackgroundLayer(level.bg.mid, camX, 0.45, level.theme);
  drawBackgroundLayer(level.bg.near, camX, 0.7, level.theme);
  drawStreet(level, camX);
  drawPlatforms(level, camX);
  drawAnchors(level, camX, performance.now());
  drawWeb(Game.player, camX);
  drawCollectibles(level, camX);
  drawEnemies(level, camX);
  drawBoss(level, camX);
  drawPlayer(Game.player, camX);
  if (level.flag) {
    const sx = level.flag.x - camX;
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(sx, level.flag.y, 4, level.flag.h);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(sx + 4, level.flag.y, 26, 18);
  }
  drawHUD();
}

function drawPanel(lines, accent) {
  ctx.fillStyle = 'rgba(5,5,15,0.85)';
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  ctx.textAlign = 'center';
  let y = GAME_H / 2 - (lines.length * 30) / 2;
  for (const line of lines) {
    ctx.font = line.font || 'bold 20px monospace';
    ctx.fillStyle = line.color || '#fff';
    ctx.fillText(line.text, GAME_W / 2, y);
    y += line.gap || 32;
  }
  ctx.textAlign = 'left';
}

function drawStartScreen() {
  drawSky('night');
  ctx.textAlign = 'center';
  ctx.font = 'bold 42px monospace';
  ctx.fillStyle = '#d62828';
  ctx.fillText('TEIA DA CIDADE', GAME_W / 2, 130);
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Uma aventura pixelada do Homem-Aranha', GAME_W / 2, 165);

  drawPixelGrid(PLAYER_GRID, GAME_W / 2 - 40, 190, 80, 130, PLAYER_PALETTE, false);

  const lines = [
    '=== CONTROLES ===',
    'Setas / WASD — mover',
    'ESPAÇO — pular (segure para pular mais alto)',
    'SHIFT ou clique do mouse — atirar/segurar teia',
    'Aproxime-se de um ponto de ancoragem para balançar',
    'Encoste em paredes de prédios para escalar (wall-cling)',
    '',
    'Pressione ENTER para começar',
  ];
  ctx.font = '14px monospace';
  ctx.fillStyle = '#e5e5e5';
  let y = 345;
  for (const l of lines) {
    ctx.fillText(l, GAME_W / 2, y);
    y += 20;
  }
  ctx.textAlign = 'left';
}

function drawLevelComplete() {
  drawWorld();
  drawPanel([
    { text: 'FASE CONCLUÍDA!', color: '#22c55e', font: 'bold 32px monospace', gap: 44 },
    { text: 'Pontuação: ' + Game.score, gap: 30 },
  ]);
}

function drawGameOver() {
  drawWorld();
  drawPanel([
    { text: 'FIM DE JOGO', color: '#d62828', font: 'bold 36px monospace', gap: 46 },
    { text: 'Pontuação final: ' + Game.score, gap: 30 },
    { text: 'Pressione ENTER para reiniciar', font: '14px monospace', color: '#ccc' },
  ]);
}

function drawWin() {
  drawWorld();
  drawPanel([
    { text: 'VOCÊ VENCEU!', color: '#f4d35e', font: 'bold 38px monospace', gap: 48 },
    { text: 'O Capanga-Chefe foi derrotado.', font: '14px monospace', gap: 28 },
    { text: 'Pontuação final: ' + Game.score, gap: 30 },
    { text: 'Pressione ENTER para jogar novamente', font: '14px monospace', color: '#ccc' },
  ]);
}

function render() {
  ctx.clearRect(0, 0, GAME_W, GAME_H);
  if (Game.state === 'start') drawStartScreen();
  else if (Game.state === 'playing') drawWorld();
  else if (Game.state === 'levelcomplete') drawLevelComplete();
  else if (Game.state === 'gameover') drawGameOver();
  else if (Game.state === 'win') drawWin();
}

/* -------------------------------------------------------------------------
   15. LOOP PRINCIPAL
   ------------------------------------------------------------------------- */
let lastTime = 0;
function loop(ts) {
  if (!lastTime) lastTime = ts;
  let dt = (ts - lastTime) / (1000 / 60);
  dt = clamp(dt, 0, 2.5);
  lastTime = ts;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
