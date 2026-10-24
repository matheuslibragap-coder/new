import Phaser from 'phaser';
import { fs, rrPath } from '../art/draw';
import { mgArt } from '../art/minigameArt';
import { sfx } from '../core/audio';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 11 — Barraca das Argolas: mire e lance as argolas nas garrafinhas. */
const BOTTLE_COLS = ['#f7a8c8', '#9fd3f7', '#9fe3c9', '#ffe08a', '#c7a8f0'];
BOTTLE_COLS.forEach((c, i) => mgArt(`garrafa${i}`, 40, 90, (ctx) => {
  ctx.beginPath();
  ctx.moveTo(14, 4);
  ctx.lineTo(26, 4);
  ctx.lineTo(26, 30);
  ctx.quadraticCurveTo(36, 38, 36, 52);
  ctx.lineTo(36, 84);
  ctx.quadraticCurveTo(20, 90, 4, 84);
  ctx.lineTo(4, 52);
  ctx.quadraticCurveTo(4, 38, 14, 30);
  ctx.closePath();
  fs(ctx, c, undefined, 2);
  rrPath(ctx, 9, 56, 22, 16, 4);
  fs(ctx, '#ffffff', null);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(8, 40, 4, 36);
}, 20, 86));

interface Bottle { img: Phaser.GameObjects.Image; baseX: number; phase: number; amp: number }

export class ArgolasGame extends MiniGameBase {
  readonly gameId = 'argolas';
  readonly title = 'Barraca das Argolas';
  bgColors: [number, number] = [0xfde3ef, 0xfff4dc];
  private bottles: Bottle[] = [];
  private rings = 10;
  private hits = 0;
  private angle = 0;
  private dir = 1;
  private flying = false;
  private aim!: Phaser.GameObjects.Graphics;
  private t = 0;
  private readonly lineY = 300;

  constructor() {
    super('mg_argolas');
  }

  setup() {
    this.rings = 10;
    this.hits = 0;
    this.bottles = [];
    const g = this.add.graphics();
    // toldo
    for (let i = 0; i < 10; i++) {
      g.fillStyle(i % 2 ? 0xffffff : 0xf7a8c8, 1);
      g.fillRect(i * 100, 70, 100, 60);
      g.fillCircle(i * 100 + 50, 130, 50);
    }
    g.fillStyle(0xc7a8f0, 1);
    g.fillRoundedRect(80, this.lineY + 4, 840, 30, 10);
    g.fillStyle(0xb392e6, 1);
    g.fillRect(80, this.lineY + 34, 840, 200);
    for (let i = 0; i < 5; i++) this.addBottle(i);
    this.aim = this.add.graphics();
    this.button(500, 630, 260, 70, 'Lançar!', 0xffb9d6, () => this.throwRing(), 28);
    this.input.keyboard?.on('keydown-SPACE', () => this.throwRing());
    this.updateScore();
  }

  private addBottle(i: number) {
    const baseX = 180 + i * 160;
    const img = this.img(baseX, this.lineY + 6, `mg:garrafa${i}`, 1.2);
    this.bottles.push({ img, baseX, phase: Math.random() * 6, amp: 0 });
  }

  private updateScore() {
    this.setScore(`Argolas: ${this.rings}   Acertos: ${this.hits}`);
  }

  private throwRing() {
    if (this.flying || this.ended || this.rings <= 0) return;
    this.flying = true;
    this.rings--;
    this.updateScore();
    sfx('whoosh');
    const sx = 500;
    const sy = 560;
    const dist = (sy - this.lineY) / Math.cos(this.angle);
    const tx = sx + Math.sin(this.angle) * dist;
    const ring = this.add.graphics();
    const draw = (s: number) => {
      ring.clear();
      ring.lineStyle(9 * s, 0xffd45e, 1);
      ring.strokeEllipse(0, 0, 60 * s, 24 * s);
      ring.lineStyle(3 * s, 0xd9a73a, 1);
      ring.strokeEllipse(0, 0, 60 * s, 24 * s);
    };
    draw(1);
    ring.setPosition(sx, sy);
    this.tweens.add({
      targets: ring, x: tx, y: this.lineY - 40, duration: 650, ease: 'Quad.easeOut',
      onUpdate: (tw) => draw(1 - tw.progress * 0.35),
      onComplete: () => {
        const hit = this.bottles.find((b) => Math.abs(b.img.x - tx) < 26);
        if (hit) {
          this.tweens.add({ targets: ring, y: this.lineY - 34 + 10, duration: 200, onComplete: () => this.time.delayedCall(500, () => ring.destroy()) });
          this.hits++;
          sfx('star');
          this.hearts(hit.img.x, this.lineY - 60, 3);
          this.floatText(hit.img.x, this.lineY - 110, 'Acertou!', '#5fae6b', 30);
          if (this.hits >= 3) hit.amp = 30 + this.hits * 6;
        } else {
          sfx('error');
          this.tweens.add({ targets: ring, y: this.lineY + 120, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
          this.floatText(tx, this.lineY - 90, 'Quase!', '#f2727a', 26);
        }
        this.updateScore();
        this.time.delayedCall(700, () => {
          this.flying = false;
          if (this.rings <= 0) this.end();
        });
      },
    });
  }

  update(_t: number, dtRaw: number) {
    const dt = Math.min(dtRaw, 100) / 1000;
    this.t += dt;
    if (!this.flying && !this.ended) {
      this.angle += this.dir * dt * (0.9 + this.hits * 0.08);
      if (this.angle > 0.95) this.dir = -1;
      if (this.angle < -0.95) this.dir = 1;
    }
    for (const b of this.bottles) b.img.x = b.baseX + Math.sin(this.t * 1.5 + b.phase) * b.amp;
    const g = this.aim;
    g.clear();
    if (this.flying || this.ended) return;
    const sx = 500;
    const sy = 560;
    g.lineStyle(6, 0xe9739f, 0.9);
    for (let k = 0; k < 8; k++) {
      const d0 = 30 + k * 30;
      g.lineBetween(sx + Math.sin(this.angle) * d0, sy - Math.cos(this.angle) * d0, sx + Math.sin(this.angle) * (d0 + 16), sy - Math.cos(this.angle) * (d0 + 16));
    }
    g.fillStyle(0xffd45e, 1);
    g.fillEllipse(sx, sy, 60, 24);
  }

  private end() {
    if (this.ended) return;
    const st = this.hits >= 7 ? 3 : this.hits >= 4 ? 2 : 1;
    this.finish(st, `${this.hits} de 10 argolas certeiras`);
  }
}
