import Phaser from 'phaser';
import { sfx } from '../core/audio';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 13 — Pinte o Quadro: escolha a cor e pinte cada parte igual ao modelo. */
const PALETTE = [0x9fd3f7, 0x8fd18a, 0xf7a8c8, 0xffe08a, 0xb98458, 0xf2727a, 0xc7a8f0, 0xffb347];

type Shape = { kind: 'rect'; x: number; y: number; w: number; h: number } | { kind: 'circle'; x: number; y: number; r: number } | { kind: 'poly'; pts: number[] };
interface Region { shape: Shape; color: number }
interface Picture { name: string; regions: Region[] }

// coordenadas num quadro de 300 x 300 (as primeiras regiões ficam atrás)
const PICTURES: Picture[] = [
  {
    name: 'Casinha',
    regions: [
      { shape: { kind: 'rect', x: 0, y: 0, w: 300, h: 210 }, color: PALETTE[0] },
      { shape: { kind: 'rect', x: 0, y: 210, w: 300, h: 90 }, color: PALETTE[1] },
      { shape: { kind: 'circle', x: 245, y: 55, r: 32 }, color: PALETTE[3] },
      { shape: { kind: 'rect', x: 70, y: 140, w: 120, h: 100 }, color: PALETTE[2] },
      { shape: { kind: 'poly', pts: [55, 145, 130, 80, 205, 145] }, color: PALETTE[5] },
      { shape: { kind: 'rect', x: 115, y: 190, w: 30, h: 50 }, color: PALETTE[4] },
      { shape: { kind: 'rect', x: 232, y: 180, w: 16, h: 60 }, color: PALETTE[4] },
      { shape: { kind: 'circle', x: 240, y: 160, r: 30 }, color: PALETTE[1] },
    ],
  },
  {
    name: 'Sorvete',
    regions: [
      { shape: { kind: 'rect', x: 0, y: 0, w: 300, h: 300 }, color: PALETTE[6] },
      { shape: { kind: 'rect', x: 0, y: 250, w: 300, h: 50 }, color: PALETTE[3] },
      { shape: { kind: 'poly', pts: [105, 160, 195, 160, 150, 270] }, color: PALETTE[7] },
      { shape: { kind: 'circle', x: 150, y: 145, r: 48 }, color: PALETTE[2] },
      { shape: { kind: 'circle', x: 150, y: 90, r: 38 }, color: PALETTE[1] },
      { shape: { kind: 'circle', x: 150, y: 46, r: 13 }, color: PALETTE[5] },
    ],
  },
  {
    name: 'Peixinho',
    regions: [
      { shape: { kind: 'rect', x: 0, y: 0, w: 300, h: 240 }, color: PALETTE[0] },
      { shape: { kind: 'rect', x: 0, y: 240, w: 300, h: 60 }, color: PALETTE[3] },
      { shape: { kind: 'poly', pts: [40, 250, 55, 160, 70, 250] }, color: PALETTE[1] },
      { shape: { kind: 'poly', pts: [215, 130, 270, 95, 270, 165] }, color: PALETTE[2] },
      { shape: { kind: 'circle', x: 160, y: 130, r: 60 }, color: PALETTE[7] },
      { shape: { kind: 'circle', x: 120, y: 120, r: 12 }, color: 0xffffff },
      { shape: { kind: 'circle', x: 90, y: 50, r: 14 }, color: PALETTE[6] },
    ],
  },
];

export class PinturaGame extends MiniGameBase {
  readonly gameId = 'pintura';
  readonly title = 'Pinte o Quadro';
  bgColors: [number, number] = [0xfffaf0, 0xf3e6d8];
  private pic = 0;
  private fills: (number | null)[] = [];
  private brush = PALETTE[0];
  private model!: Phaser.GameObjects.Graphics;
  private canvasG!: Phaser.GameObjects.Graphics;
  private palG!: Phaser.GameObjects.Graphics;
  private correct = 0;
  private totalRegions = 0;
  private label!: Phaser.GameObjects.Text;
  private readonly CX = 540;
  private readonly CY = 110;
  private readonly CS = 1.4;

  constructor() {
    super('mg_pintura');
  }

  setup() {
    this.pic = 0;
    this.correct = 0;
    this.totalRegions = 0;
    const g = this.add.graphics();
    g.fillStyle(0xd9b58a, 1);
    g.fillRoundedRect(40, 110, 330, 330, 16);
    g.fillRoundedRect(this.CX - 14, this.CY - 14, 300 * this.CS + 28, 300 * this.CS + 28, 20);
    this.text(205, 470, 'Modelo', { size: 24, bold: true }).setOrigin(0.5);
    this.label = this.text(205, 90, '', { size: 24, bold: true, color: '#e9739f' }).setOrigin(0.5);
    this.model = this.add.graphics();
    this.canvasG = this.add.graphics();
    this.palG = this.add.graphics();
    PALETTE.forEach((c, i) => {
      const x = 70 + (i % 4) * 82;
      const y = 540 + Math.floor(i / 4) * 80;
      const z = this.add.zone(x, y, 72, 72).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        this.brush = c;
        sfx('pop');
        this.drawPalette();
      });
    });
    const area = this.add.zone(this.CX + 150 * this.CS, this.CY + 150 * this.CS, 300 * this.CS, 300 * this.CS).setInteractive();
    area.on('pointerdown', (p: Phaser.Input.Pointer) => this.paint(p));
    this.button(440, 620, 170, 64, 'Pronto!', 0xffb9d6, () => this.nextPic(), 26);
    this.countdown(100, () => this.end());
    this.loadPic();
  }

  private loadPic() {
    const p = PICTURES[this.pic];
    this.fills = p.regions.map(() => null);
    this.label.setText(`${p.name} (${this.pic + 1}/${PICTURES.length})`);
    this.drawModel();
    this.drawCanvas();
    this.drawPalette();
    this.setScore(`Quadro ${this.pic + 1} de ${PICTURES.length}`);
  }

  private shapeDraw(g: Phaser.GameObjects.Graphics, s: Shape, ox: number, oy: number, k: number, fill: number | null, outline = true) {
    if (fill !== null) g.fillStyle(fill, 1);
    else g.fillStyle(0xffffff, 1);
    g.lineStyle(outline ? 3 : 0, 0x4a3657, 0.8);
    if (s.kind === 'rect') {
      g.fillRect(ox + s.x * k, oy + s.y * k, s.w * k, s.h * k);
      if (outline) g.strokeRect(ox + s.x * k, oy + s.y * k, s.w * k, s.h * k);
    } else if (s.kind === 'circle') {
      g.fillCircle(ox + s.x * k, oy + s.y * k, s.r * k);
      if (outline) g.strokeCircle(ox + s.x * k, oy + s.y * k, s.r * k);
    } else {
      const pts = [];
      for (let i = 0; i < s.pts.length; i += 2) pts.push(new Phaser.Math.Vector2(ox + s.pts[i] * k, oy + s.pts[i + 1] * k));
      g.fillPoints(pts, true);
      if (outline) g.strokePoints(pts, true);
    }
  }

  private drawModel() {
    const g = this.model;
    g.clear();
    for (const r of PICTURES[this.pic].regions) this.shapeDraw(g, r.shape, 55, 125, 1, r.color, true);
  }

  private drawCanvas() {
    const g = this.canvasG;
    g.clear();
    PICTURES[this.pic].regions.forEach((r, i) => this.shapeDraw(g, r.shape, this.CX, this.CY, this.CS, this.fills[i], true));
  }

  private drawPalette() {
    const g = this.palG;
    g.clear();
    PALETTE.forEach((c, i) => {
      const x = 70 + (i % 4) * 82;
      const y = 540 + Math.floor(i / 4) * 80;
      g.fillStyle(c, 1);
      g.fillCircle(x, y, 30);
      g.lineStyle(this.brush === c ? 7 : 3, this.brush === c ? 0xe9739f : 0xffffff, 1);
      g.strokeCircle(x, y, 30);
    });
  }

  private contains(s: Shape, x: number, y: number) {
    if (s.kind === 'rect') return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
    if (s.kind === 'circle') return Math.hypot(x - s.x, y - s.y) <= s.r;
    return Phaser.Geom.Polygon.Contains(new Phaser.Geom.Polygon(s.pts), x, y);
  }

  private paint(p: Phaser.Input.Pointer) {
    if (this.ended) return;
    const x = (p.worldX - this.CX) / this.CS;
    const y = (p.worldY - this.CY) / this.CS;
    const regs = PICTURES[this.pic].regions;
    for (let i = regs.length - 1; i >= 0; i--) {
      if (this.contains(regs[i].shape, x, y)) {
        this.fills[i] = this.brush;
        sfx('splash');
        this.drawCanvas();
        if (this.fills.every((f, j) => f === regs[j].color)) {
          this.floatText(this.CX + 220, this.CY + 200, 'Igualzinho!', '#5fae6b', 36);
          this.time.delayedCall(700, () => this.nextPic());
        }
        return;
      }
    }
  }

  private nextPic() {
    if (this.ended) return;
    const regs = PICTURES[this.pic].regions;
    const ok = this.fills.filter((f, j) => f === regs[j].color).length;
    this.correct += ok;
    this.totalRegions += regs.length;
    sfx(ok === regs.length ? 'win' : 'good');
    this.pic++;
    if (this.pic >= PICTURES.length) return this.end(true);
    this.loadPic();
  }

  private end(finished = false) {
    if (this.ended) return;
    if (!finished) {
      // conta o quadro atual também
      for (let i = this.pic; i < PICTURES.length; i++) {
        const regs = PICTURES[i].regions;
        if (i === this.pic) this.correct += this.fills.filter((f, j) => f === regs[j].color).length;
        this.totalRegions += regs.length;
      }
    }
    const acc = this.totalRegions ? this.correct / this.totalRegions : 0;
    const st = acc >= 0.9 ? 3 : acc >= 0.65 ? 2 : 1;
    this.finish(st, `${Math.round(acc * 100)}% igual aos modelos`);
  }
}
