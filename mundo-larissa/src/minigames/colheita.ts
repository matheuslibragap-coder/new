import Phaser from 'phaser';
import { ellPath, fs, polyPath, rgrad } from '../art/draw';
import { mgArt } from '../art/minigameArt';
import { sfx } from '../core/audio';
import { MiniGameBase, MW } from './MiniGameBase';

/** Mini game 10 — Colheita Rápida: pegue as frutas com a cesta e desvie das abelhas. */
const FRUITS: [string, string, string][] = [['maca', '#f2727a', '#8fd18a'], ['laranja', '#ffb347', '#8fd18a'], ['pera', '#c8e07a', '#8fd18a'], ['uva', '#b79cf0', '#8fd18a'], ['morango', '#ff7f8f', '#7cc77e']];
for (const [n, c, leaf] of FRUITS) {
  mgArt(`fruta_${n}`, 56, 60, (ctx) => {
    if (n === 'uva') {
      for (const [x, y] of [[20, 26], [34, 26], [27, 36], [14, 36], [40, 36], [21, 46], [33, 46], [27, 55]]) {
        ellPath(ctx, x, y, 8, 8);
        fs(ctx, rgrad(ctx, x, y, 8, '#e8dcff', c), undefined, 1.3);
      }
    } else if (n === 'morango') {
      polyPath(ctx, [[8, 22], [48, 22], [28, 56]]);
      fs(ctx, c, undefined, 1.5);
      ctx.fillStyle = '#fff5c0';
      for (const [x, y] of [[20, 30], [34, 30], [27, 40], [22, 46], [32, 46]]) ctx.fillRect(x, y, 2.5, 2.5);
    } else {
      ellPath(ctx, 28, 36, n === 'pera' ? 17 : 21, n === 'pera' ? 21 : 20);
      fs(ctx, rgrad(ctx, 28, 36, 22, '#ffffff', c), undefined, 1.5);
    }
    ellPath(ctx, 34, 14, 9, 5);
    fs(ctx, leaf, undefined, 1.3);
    ctx.strokeStyle = '#8a5a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(28, 20);
    ctx.lineTo(28, 10);
    ctx.stroke();
  });
}
mgArt('abelha', 60, 50, (ctx) => {
  for (const s of [-1, 1]) {
    ellPath(ctx, 30 + s * 9, 13, 10, 8);
    ctx.fillStyle = 'rgba(214,236,252,0.9)';
    ctx.fill();
    ctx.strokeStyle = '#9fc4d8';
    ctx.stroke();
  }
  ellPath(ctx, 30, 30, 20, 15);
  fs(ctx, '#ffd45e', undefined, 2);
  ctx.fillStyle = '#4a3657';
  ctx.fillRect(24, 16, 5, 28);
  ctx.fillRect(34, 16, 5, 28);
  ellPath(ctx, 14, 28, 2.5, 2.5);
  ctx.fill();
});
mgArt('cesta', 160, 90, (ctx) => {
  ctx.strokeStyle = '#a77b52';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(80, 40, 48, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, 34);
  ctx.lineTo(152, 34);
  ctx.lineTo(136, 86);
  ctx.lineTo(24, 86);
  ctx.closePath();
  fs(ctx, '#e0b07f', undefined, 2.5);
  ctx.strokeStyle = '#c1905e';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(10 + i * 3, 34 + i * 13);
    ctx.lineTo(150 - i * 3, 34 + i * 13);
    ctx.stroke();
  }
});

interface Fall { img: Phaser.GameObjects.Image; vy: number; bee: boolean; vx: number }

export class ColheitaGame extends MiniGameBase {
  readonly gameId = 'colheita';
  readonly title = 'Colheita Rápida';
  bgColors: [number, number] = [0xcdeeff, 0xd9f5d0];
  private basket!: Phaser.GameObjects.Image;
  private items: Fall[] = [];
  private score = 0;
  private elapsed = 0;
  private spawnT = 0;
  private tx = 500;

  constructor() {
    super('mg_colheita');
  }

  setup() {
    this.score = 0;
    this.items = [];
    this.elapsed = 0;
    this.spawnT = 0;
    const g = this.add.graphics();
    g.fillStyle(0x8fd18a, 1);
    g.fillRect(-3000, 600, 7000, 1000);
    g.fillStyle(0x7cc77e, 1);
    for (let x = 0; x <= MW; x += 120) {
      g.fillCircle(x, 100, 70);
      g.fillCircle(x + 60, 80, 60);
    }
    this.basket = this.img(500, 600, 'mg:cesta', 1.3).setDepth(10);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => (this.tx = p.worldX));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (this.tx = p.worldX));
    this.setScore('Frutas: 0');
    this.countdown(45, () => this.end());
  }

  update(_t: number, dtRaw: number) {
    if (this.ended) return;
    const dt = Math.min(dtRaw, 100) / 1000;
    this.elapsed += dt;
    const kb = this.input.keyboard?.createCursorKeys();
    if (kb?.left.isDown) this.tx = this.basket.x - 40;
    if (kb?.right.isDown) this.tx = this.basket.x + 40;
    this.tx = Phaser.Math.Clamp(this.tx, 70, 930);
    this.basket.x += (this.tx - this.basket.x) * Math.min(1, dt * 14);
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Math.max(0.38, 0.95 - this.elapsed * 0.012);
      const bee = Math.random() < 0.18 + this.elapsed * 0.003;
      const key = bee ? 'mg:abelha' : `mg:fruta_${Phaser.Utils.Array.GetRandom(FRUITS)[0]}`;
      const img = this.img(Phaser.Math.Between(60, 940), 60, key, 1.2);
      this.items.push({ img, vy: 170 + this.elapsed * 5 + Math.random() * 60, bee, vx: bee ? (Math.random() - 0.5) * 120 : 0 });
    }
    for (const it of [...this.items]) {
      it.img.y += it.vy * dt;
      it.img.x += it.vx * dt;
      if (it.bee) it.img.x += Math.sin(this.elapsed * 6 + it.img.y * 0.02) * 2;
      if (it.img.y > 560 && it.img.y < 610 && Math.abs(it.img.x - this.basket.x) < 70) {
        this.items.splice(this.items.indexOf(it), 1);
        if (it.bee) {
          this.score = Math.max(0, this.score - 2);
          sfx('error');
          this.floatText(it.img.x, 520, 'Bzzz! -2', '#f2727a', 26);
          this.cameras.main.shake(150, 0.005);
        } else {
          this.score++;
          sfx('coin');
          this.floatText(it.img.x, 520, '+1', '#5fae6b', 26);
          this.tweens.add({ targets: this.basket, scaleY: this.basket.scaleY * 0.9, yoyo: true, duration: 80 });
        }
        it.img.destroy();
        this.setScore(`Frutas: ${this.score}`);
      } else if (it.img.y > 700) {
        this.items.splice(this.items.indexOf(it), 1);
        it.img.destroy();
      }
    }
  }

  private end() {
    if (this.ended) return;
    const st = this.score >= 25 ? 3 : this.score >= 14 ? 2 : 1;
    this.finish(st, `${this.score} frutas colhidas`);
  }
}
