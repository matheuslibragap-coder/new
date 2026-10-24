import Phaser from 'phaser';
import { sfx } from '../core/audio';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 9 — Palavras Escondidas: caça-palavras simples (só na horizontal e vertical). */
const BANKS = [
  ['LIVRO', 'FADA', 'LUA', 'CONTO', 'MAGIA'],
  ['GATO', 'FLOR', 'SOL', 'MAR', 'NUVEM'],
  ['BOLO', 'DOCE', 'MEL', 'SUCO', 'PERA'],
  ['CASA', 'BOLA', 'PIPA', 'URSO', 'ARCO'],
];
const N = 8;
const CELL = 58;
const OX = 120;
const OY = 110;
const HL = [0xf7a8c8, 0x9fd3f7, 0x9fe3c9, 0xffe08a, 0xc7a8f0];

export class PalavrasGame extends MiniGameBase {
  readonly gameId = 'palavras';
  readonly title = 'Palavras Escondidas';
  bgColors: [number, number] = [0xf3e6d8, 0xfff8ee];
  private grid: string[][] = [];
  private words: { w: string; cells: [number, number][]; found: boolean }[] = [];
  private first: [number, number] | null = null;
  private hl!: Phaser.GameObjects.Graphics;
  private sel!: Phaser.GameObjects.Graphics;
  private list: Phaser.GameObjects.Text[] = [];
  private left = 90;
  private dragging = false;

  constructor() {
    super('mg_palavras');
  }

  setup() {
    this.first = null;
    const bank = Phaser.Utils.Array.GetRandom(BANKS);
    this.build(bank);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.9);
    g.fillRoundedRect(OX - 14, OY - 14, N * CELL + 28, N * CELL + 28, 24);
    this.hl = this.add.graphics();
    this.sel = this.add.graphics();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      this.text(OX + c * CELL + CELL / 2, OY + r * CELL + CELL / 2, this.grid[r][c], { size: 32, bold: true }).setOrigin(0.5);
    }
    const p2 = this.add.graphics();
    p2.fillStyle(0xffffff, 0.85);
    p2.fillRoundedRect(640, 110, 300, 400, 24);
    this.text(790, 140, 'Encontre:', { size: 26, bold: true, color: '#e9739f' }).setOrigin(0.5);
    this.list = this.words.map((w, i) => this.text(790, 200 + i * 60, w.w, { size: 30, bold: true }).setOrigin(0.5));
    this.text(790, 560, 'Toque na primeira e na última letra\n(ou arraste o dedo)', { size: 18 }).setOrigin(0.5);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.down(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.move(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.up(p));
    this.left = 90;
    this.countdown(90, () => this.end());
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.left-- });
    this.updateScore();
  }

  private build(bank: string[]) {
    for (let attempt = 0; attempt < 200; attempt++) {
      this.grid = Array.from({ length: N }, () => Array(N).fill(''));
      this.words = [];
      let ok = true;
      for (const w of bank) {
        let placed = false;
        for (let k = 0; k < 100 && !placed; k++) {
          const hor = Math.random() < 0.5;
          const r = Phaser.Math.Between(0, hor ? N - 1 : N - w.length);
          const c = Phaser.Math.Between(0, hor ? N - w.length : N - 1);
          const cells: [number, number][] = [...w].map((_, i) => (hor ? [r, c + i] : [r + i, c]));
          if (cells.every(([rr, cc], i) => !this.grid[rr][cc] || this.grid[rr][cc] === w[i])) {
            cells.forEach(([rr, cc], i) => (this.grid[rr][cc] = w[i]));
            this.words.push({ w, cells, found: false });
            placed = true;
          }
        }
        if (!placed) {
          ok = false;
          break;
        }
      }
      if (ok) break;
    }
    const abc = 'ABCDEFGHIJLMNOPRSTUV';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!this.grid[r][c]) this.grid[r][c] = abc[Phaser.Math.Between(0, abc.length - 1)];
  }

  private cellAt(p: Phaser.Input.Pointer): [number, number] | null {
    const c = Math.floor((p.worldX - OX) / CELL);
    const r = Math.floor((p.worldY - OY) / CELL);
    if (r < 0 || c < 0 || r >= N || c >= N) return null;
    return [r, c];
  }

  private line(a: [number, number], b: [number, number]): [number, number][] | null {
    if (a[0] !== b[0] && a[1] !== b[1]) return null;
    const cells: [number, number][] = [];
    const dr = Math.sign(b[0] - a[0]);
    const dc = Math.sign(b[1] - a[1]);
    let [r, c] = a;
    cells.push([r, c]);
    while (r !== b[0] || c !== b[1]) {
      r += dr;
      c += dc;
      cells.push([r, c]);
    }
    return cells;
  }

  private drawSel(cells: [number, number][] | null) {
    this.sel.clear();
    if (!cells) return;
    this.sel.fillStyle(0xc7a8f0, 0.45);
    for (const [r, c] of cells) this.sel.fillRoundedRect(OX + c * CELL + 4, OY + r * CELL + 4, CELL - 8, CELL - 8, 12);
  }

  private down(p: Phaser.Input.Pointer) {
    if (this.ended) return;
    const cell = this.cellAt(p);
    if (!cell) return;
    if (this.first) {
      this.tryWord(this.first, cell);
      this.first = null;
      this.drawSel(null);
      return;
    }
    this.first = cell;
    this.dragging = true;
    sfx('tick');
    this.drawSel([cell]);
  }

  private move(p: Phaser.Input.Pointer) {
    if (!this.dragging || !this.first || !p.isDown) return;
    const cell = this.cellAt(p);
    if (cell) this.drawSel(this.line(this.first, cell) ?? [this.first]);
  }

  private up(p: Phaser.Input.Pointer) {
    if (!this.dragging || !this.first) return;
    this.dragging = false;
    const cell = this.cellAt(p);
    if (cell && (cell[0] !== this.first[0] || cell[1] !== this.first[1])) {
      this.tryWord(this.first, cell);
      this.first = null;
      this.drawSel(null);
    }
  }

  private tryWord(a: [number, number], b: [number, number]) {
    const cells = this.line(a, b);
    if (!cells) return sfx('error');
    const s = cells.map(([r, c]) => this.grid[r][c]).join('');
    const rev = [...s].reverse().join('');
    const w = this.words.find((x) => !x.found && (x.w === s || x.w === rev) && x.cells.length === cells.length);
    if (!w) {
      sfx('error');
      return;
    }
    w.found = true;
    const i = this.words.indexOf(w);
    sfx('star');
    this.hl.fillStyle(HL[i % HL.length], 0.7);
    for (const [r, c] of w.cells) this.hl.fillRoundedRect(OX + c * CELL + 3, OY + r * CELL + 3, CELL - 6, CELL - 6, 14);
    this.list[i].setColor('#b9aec8');
    const strike = this.add.graphics();
    strike.lineStyle(4, 0xe9739f);
    strike.lineBetween(this.list[i].x - this.list[i].width / 2 - 6, this.list[i].y, this.list[i].x + this.list[i].width / 2 + 6, this.list[i].y);
    this.floatText(790, this.list[i].y - 20, 'Achou!', '#5fae6b', 26);
    this.updateScore();
    if (this.words.every((x) => x.found)) this.end();
  }

  private updateScore() {
    this.setScore(`Palavras: ${this.words.filter((w) => w.found).length}/${this.words.length}`);
  }

  private end() {
    if (this.ended) return;
    const found = this.words.filter((w) => w.found).length;
    const all = found === this.words.length;
    const st = all ? (this.left >= 35 ? 3 : 2) : found >= 3 ? 2 : 1;
    this.finish(st, `${found} de ${this.words.length} palavras`);
  }
}
