import Phaser from 'phaser';
import { sfx } from '../core/audio';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 4 — Monte o Bolo: empilhe as camadas na ordem do pedido antes do tempo acabar. */
const FLAVORS = [
  { name: 'Morango', c: 0xf7a8c8 },
  { name: 'Chocolate', c: 0xb07a55 },
  { name: 'Baunilha', c: 0xfff0c8 },
  { name: 'Menta', c: 0x9fe3c9 },
  { name: 'Mirtilo', c: 0xc7a8f0 },
];

export class BoloGame extends MiniGameBase {
  readonly gameId = 'bolo';
  readonly title = 'Monte o Bolo';
  bgColors: [number, number] = [0xfff4e0, 0xfde8f3];
  private order: number[] = [];
  private stack: number[] = [];
  private cakes = 0;
  private gfx!: Phaser.GameObjects.Graphics;
  private orderG!: Phaser.GameObjects.Graphics;
  private busy = false;
  private shakeX = 0;

  constructor() {
    super('mg_bolo');
  }

  setup() {
    this.cakes = 0;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.85);
    g.fillRoundedRect(40, 90, 260, 420, 30);
    g.fillStyle(0xe3b98c, 1);
    g.fillRect(-3000, 520, 7000, 300);
    this.text(170, 120, 'Pedido:', { size: 26, bold: true, color: '#e9739f' }).setOrigin(0.5);
    this.orderG = this.add.graphics();
    this.gfx = this.add.graphics();
    FLAVORS.forEach((f, i) => {
      const x = 180 + i * 160;
      this.button(x, 610, 145, 70, f.name, f.c, () => this.add1(i), 20);
    });
    this.countdown(60, () => this.end());
    this.newOrder();
  }

  private newOrder() {
    const n = Math.min(5, 3 + Math.floor(this.cakes / 2));
    this.order = Array.from({ length: n }, () => Phaser.Math.Between(0, FLAVORS.length - 1));
    this.stack = [];
    this.busy = false;
    this.setScore(`Bolos: ${this.cakes}`);
    this.drawOrder();
    this.draw();
  }

  private layer(g: Phaser.GameObjects.Graphics, cx: number, y: number, w: number, h: number, c: number) {
    g.fillStyle(0x4a3657, 0.25);
    g.fillRoundedRect(cx - w / 2 - 2, y - 2, w + 4, h + 4, 12);
    g.fillStyle(c, 1);
    g.fillRoundedRect(cx - w / 2, y, w, h, 10);
    g.fillStyle(0xffffff, 0.35);
    g.fillRoundedRect(cx - w / 2 + 6, y + 4, w - 12, 6, 3);
  }

  private drawOrder() {
    const g = this.orderG;
    g.clear();
    this.order.forEach((f, i) => this.layer(g, 170, 460 - (i + 1) * 52, 170 - i * 12, 44, FLAVORS[f].c));
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(170, 468, 220, 26);
  }

  private draw() {
    const g = this.gfx;
    g.clear();
    const cx = 620 + this.shakeX;
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx, 512, 330, 40);
    g.lineStyle(3, 0xe8dff0);
    g.strokeEllipse(cx, 512, 330, 40);
    this.stack.forEach((f, i) => this.layer(g, cx, 500 - (i + 1) * 62, 260 - i * 18, 56, FLAVORS[f].c));
    if (this.stack.length === this.order.length && this.stack.length) {
      const top = 500 - this.stack.length * 62;
      g.fillStyle(0xf2727a, 1);
      g.fillCircle(cx, top - 10, 14);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(cx - 4, top - 14, 4);
    }
  }

  private add1(i: number) {
    if (this.busy || this.ended) return;
    const want = this.order[this.stack.length];
    if (i !== want) {
      sfx('error');
      this.busy = true;
      this.floatText(620, 260, 'Ops! Sabor errado', '#f2727a');
      this.tweens.addCounter({
        from: 0, to: 1, duration: 400,
        onUpdate: (t) => { this.shakeX = Math.sin((t.getValue() ?? 0) * Math.PI * 8) * 10; this.draw(); },
        onComplete: () => { this.shakeX = 0; this.stack = []; this.busy = false; this.draw(); },
      });
      return;
    }
    sfx('pop');
    this.stack.push(i);
    this.draw();
    if (this.stack.length === this.order.length) {
      this.cakes++;
      this.busy = true;
      sfx('win');
      this.hearts(620, 250, 4);
      this.floatText(620, 200, 'Bolo pronto!', '#5fae6b', 36);
      this.time.delayedCall(900, () => this.newOrder());
    }
  }

  private end() {
    if (this.ended) return;
    const st = this.cakes >= 6 ? 3 : this.cakes >= 3 ? 2 : 1;
    this.finish(st, `${this.cakes} bolos feitos`);
  }
}
