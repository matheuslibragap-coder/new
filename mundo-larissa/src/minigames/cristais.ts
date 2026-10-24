import Phaser from 'phaser';
import { fs, polyPath, sparkle, vgrad, lighten } from '../art/draw';
import { mgArt } from '../art/minigameArt';
import { sfx } from '../core/audio';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 14 — Cristais Mágicos: troque cristais vizinhos e junte 3 ou mais iguais. */
const COLS = ['#f7a8c8', '#9fd3f7', '#9fe3c9', '#ffe08a', '#c7a8f0'];
const SHAPES = [6, 4, 5, 8, 3];
COLS.forEach((c, i) => mgArt(`cristal${i}`, 64, 64, (ctx) => {
  const n = SHAPES[i];
  const pts: number[][] = [];
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (k / n) * Math.PI * 2;
    pts.push([32 + Math.cos(a) * 26, 32 + Math.sin(a) * 26]);
  }
  polyPath(ctx, pts);
  fs(ctx, vgrad(ctx, 6, 58, lighten(c, 0.55), c), undefined, 2.2);
  polyPath(ctx, pts.map(([x, y]) => [32 + (x - 32) * 0.5, 32 + (y - 32) * 0.5 - 3]));
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
  sparkle(ctx, 22, 20, 5, '#ffffff');
}));

const N = 7;
const SZ = 76;
const OX = 500 - (N * SZ) / 2 + SZ / 2;
const OY = 110 + SZ / 2;

export class CristaisGame extends MiniGameBase {
  readonly gameId = 'cristais';
  readonly title = 'Cristais Mágicos';
  bgColors: [number, number] = [0xd9c9f5, 0xf3eefe];
  private board: number[][] = [];
  private imgs: (Phaser.GameObjects.Image | null)[][] = [];
  private sel: [number, number] | null = null;
  private selG!: Phaser.GameObjects.Graphics;
  private busy = false;
  private points = 0;
  private downAt: [number, number] | null = null;

  constructor() {
    super('mg_cristais');
  }

  setup() {
    this.points = 0;
    this.sel = null;
    this.busy = false;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.55);
    g.fillRoundedRect(OX - SZ / 2 - 10, OY - SZ / 2 - 10, N * SZ + 20, N * SZ + 20, 26);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      g.fillStyle((r + c) % 2 ? 0xefe6fc : 0xf8f3ff, 1);
      g.fillRoundedRect(OX + c * SZ - SZ / 2 + 3, OY + r * SZ - SZ / 2 + 3, SZ - 6, SZ - 6, 12);
    }
    this.selG = this.add.graphics().setDepth(5);
    this.fillBoard();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.down(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.up(p));
    this.setScore('Pontos: 0');
    this.countdown(70, () => this.end());
  }

  private fillBoard() {
    do {
      this.board = [];
      for (let r = 0; r < N; r++) {
        this.board.push([]);
        for (let c = 0; c < N; c++) {
          let v: number;
          do v = Phaser.Math.Between(0, COLS.length - 1);
          while ((c >= 2 && this.board[r][c - 1] === v && this.board[r][c - 2] === v) || (r >= 2 && this.board[r - 1][c] === v && this.board[r - 2][c] === v));
          this.board[r].push(v);
        }
      }
    } while (!this.hasMoves());
    this.imgs.forEach((row) => row.forEach((i) => i?.destroy()));
    this.imgs = this.board.map((row, r) => row.map((v, c) => this.img(OX + c * SZ, OY + r * SZ, `mg:cristal${v}`, 1)));
  }

  private cell(p: Phaser.Input.Pointer): [number, number] | null {
    const c = Math.round((p.worldX - OX) / SZ);
    const r = Math.round((p.worldY - OY) / SZ);
    return r >= 0 && c >= 0 && r < N && c < N ? [r, c] : null;
  }

  private down(p: Phaser.Input.Pointer) {
    if (this.busy || this.ended) return;
    const c = this.cell(p);
    this.downAt = c;
    if (!c) return;
    if (this.sel && Math.abs(this.sel[0] - c[0]) + Math.abs(this.sel[1] - c[1]) === 1) {
      const a = this.sel;
      this.sel = null;
      this.drawSel();
      this.swap(a, c);
      this.downAt = null;
      return;
    }
    this.sel = c;
    sfx('tick');
    this.drawSel();
  }

  private up(p: Phaser.Input.Pointer) {
    // arrastar o dedo para o lado também troca
    if (!this.downAt || this.busy) return;
    const dx = p.worldX - (OX + this.downAt[1] * SZ);
    const dy = p.worldY - (OY + this.downAt[0] * SZ);
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SZ * 0.6) return;
    const t: [number, number] = Math.abs(dx) > Math.abs(dy) ? [this.downAt[0], this.downAt[1] + Math.sign(dx)] : [this.downAt[0] + Math.sign(dy), this.downAt[1]];
    if (t[0] < 0 || t[1] < 0 || t[0] >= N || t[1] >= N) return;
    const a = this.downAt;
    this.sel = null;
    this.drawSel();
    this.downAt = null;
    this.swap(a, t);
  }

  private drawSel() {
    this.selG.clear();
    if (!this.sel) return;
    this.selG.lineStyle(5, 0xe9739f, 1);
    this.selG.strokeRoundedRect(OX + this.sel[1] * SZ - SZ / 2 + 3, OY + this.sel[0] * SZ - SZ / 2 + 3, SZ - 6, SZ - 6, 14);
  }

  private swapData(a: [number, number], b: [number, number]) {
    const t = this.board[a[0]][a[1]];
    this.board[a[0]][a[1]] = this.board[b[0]][b[1]];
    this.board[b[0]][b[1]] = t;
    const ti = this.imgs[a[0]][a[1]];
    this.imgs[a[0]][a[1]] = this.imgs[b[0]][b[1]];
    this.imgs[b[0]][b[1]] = ti;
  }

  private animTo(img: Phaser.GameObjects.Image | null, r: number, c: number, dur = 160) {
    if (!img) return;
    this.tweens.add({ targets: img, x: OX + c * SZ, y: OY + r * SZ, duration: dur, ease: 'Quad.easeOut' });
  }

  private swap(a: [number, number], b: [number, number]) {
    this.busy = true;
    this.swapData(a, b);
    this.animTo(this.imgs[a[0]][a[1]], a[0], a[1]);
    this.animTo(this.imgs[b[0]][b[1]], b[0], b[1]);
    sfx('whoosh');
    this.time.delayedCall(200, () => {
      if (this.findMatches().length) this.resolve(1);
      else {
        sfx('error');
        this.swapData(a, b);
        this.animTo(this.imgs[a[0]][a[1]], a[0], a[1]);
        this.animTo(this.imgs[b[0]][b[1]], b[0], b[1]);
        this.time.delayedCall(200, () => (this.busy = false));
      }
    });
  }

  private findMatches(): [number, number][] {
    const set = new Set<string>();
    for (let r = 0; r < N; r++) for (let c = 0; c < N - 2; c++) {
      const v = this.board[r][c];
      if (v >= 0 && v === this.board[r][c + 1] && v === this.board[r][c + 2]) for (let k = 0; k < 3; k++) set.add(`${r},${c + k}`);
    }
    for (let c = 0; c < N; c++) for (let r = 0; r < N - 2; r++) {
      const v = this.board[r][c];
      if (v >= 0 && v === this.board[r + 1][c] && v === this.board[r + 2][c]) for (let k = 0; k < 3; k++) set.add(`${r + k},${c}`);
    }
    return [...set].map((s) => s.split(',').map(Number) as [number, number]);
  }

  private resolve(combo: number) {
    const m = this.findMatches();
    if (!m.length) {
      if (!this.hasMoves()) {
        this.floatText(500, 340, 'Embaralhando!', '#9b7fd4', 34);
        this.fillBoard();
      }
      this.busy = false;
      return;
    }
    const gain = m.length * 10 * combo;
    this.points += gain;
    this.setScore(`Pontos: ${this.points}`);
    sfx(combo > 1 ? 'magic' : 'star');
    for (const [r, c] of m) {
      const img = this.imgs[r][c];
      if (img) this.tweens.add({ targets: img, scale: 0, alpha: 0, duration: 200, onComplete: () => img.destroy() });
      this.imgs[r][c] = null;
      this.board[r][c] = -1;
    }
    const [fr, fc] = m[0];
    this.floatText(OX + fc * SZ, OY + fr * SZ, `+${gain}`, '#e9739f', 28);
    this.time.delayedCall(230, () => {
      // gravidade e reposição
      for (let c = 0; c < N; c++) {
        let w = N - 1;
        for (let r = N - 1; r >= 0; r--) {
          if (this.board[r][c] >= 0) {
            if (w !== r) {
              this.board[w][c] = this.board[r][c];
              this.imgs[w][c] = this.imgs[r][c];
              this.board[r][c] = -1;
              this.imgs[r][c] = null;
              this.animTo(this.imgs[w][c], w, c, 220);
            }
            w--;
          }
        }
        for (let r = w; r >= 0; r--) {
          const v = Phaser.Math.Between(0, COLS.length - 1);
          this.board[r][c] = v;
          const img = this.img(OX + c * SZ, OY - (w - r + 1) * SZ, `mg:cristal${v}`, 1);
          this.imgs[r][c] = img;
          this.animTo(img, r, c, 260);
        }
      }
      this.time.delayedCall(290, () => this.resolve(combo + 1));
    });
  }

  private hasMoves(): boolean {
    const b = this.board;
    const test = (r1: number, c1: number, r2: number, c2: number) => {
      [b[r1][c1], b[r2][c2]] = [b[r2][c2], b[r1][c1]];
      const ok = this.findMatchesOn(b);
      [b[r1][c1], b[r2][c2]] = [b[r2][c2], b[r1][c1]];
      return ok;
    };
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (c < N - 1 && test(r, c, r, c + 1)) return true;
      if (r < N - 1 && test(r, c, r + 1, c)) return true;
    }
    return false;
  }

  private findMatchesOn(b: number[][]) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N - 2; c++) if (b[r][c] === b[r][c + 1] && b[r][c] === b[r][c + 2]) return true;
    for (let c = 0; c < N; c++) for (let r = 0; r < N - 2; r++) if (b[r][c] === b[r + 1][c] && b[r][c] === b[r + 2][c]) return true;
    return false;
  }

  private end() {
    if (this.ended) return;
    const st = this.points >= 900 ? 3 : this.points >= 450 ? 2 : 1;
    this.finish(st, `${this.points} pontos de cristal`);
  }
}
