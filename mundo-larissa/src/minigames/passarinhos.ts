import { ellPath, fs, lighten, polyPath, rrPath, sparkle } from '../art/draw';
import { mgArt } from '../art/minigameArt';
import { sfx } from '../core/audio';
import { MiniGameBase, MW } from './MiniGameBase';
import { dollTexture } from '../character/Character';
import { S } from '../core/state';
import { ART_SCALE } from '../config';

/** Mini game 1 — Alimente os Passarinhos: toque quando o marcador estiver na faixa verde. */
const COLORS = ['#9fd3f7', '#f7a8c8', '#ffe08a'];
COLORS.forEach((c, i) => {
  for (const happy of [false, true]) {
    mgArt(`passaro${i}${happy ? 'f' : ''}`, 80, 74, (ctx) => {
      // rabinho
      polyPath(ctx, [[14, 46], [2, 40], [6, 54]]);
      fs(ctx, c);
      ellPath(ctx, 40, 44, 28, 25);
      fs(ctx, c);
      ellPath(ctx, 44, 52, 16, 12);
      fs(ctx, lighten(c, 0.5), null);
      // asinha
      ellPath(ctx, 26, 46, 11, 8);
      fs(ctx, lighten(c, 0.2));
      // bico
      polyPath(ctx, happy ? [[62, 36], [76, 32], [62, 44]] : [[62, 38], [74, 42], [62, 46]]);
      fs(ctx, '#f2b04e');
      if (happy) polyPath(ctx, [[62, 44], [74, 50], [62, 48]]), fs(ctx, '#f2b04e');
      // olhos
      ctx.strokeStyle = '#4a3657';
      ctx.fillStyle = '#4a3657';
      ctx.lineWidth = 2.2;
      if (happy) {
        ctx.beginPath();
        ctx.arc(50, 36, 4, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      } else {
        ellPath(ctx, 51, 35, 3.6, 4.4);
        ctx.fill();
        ellPath(ctx, 52, 33.5, 1.3, 1.3);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      ellPath(ctx, 56, 44, 4, 2.4);
      ctx.fillStyle = 'rgba(242,114,138,0.45)';
      ctx.fill();
      // topete
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 20);
      ctx.quadraticCurveTo(44, 10, 50, 12);
      ctx.stroke();
    });
  }
});
mgArt('semente', 20, 16, (ctx) => {
  for (const [x, y] of [[6, 8], [12, 6], [14, 11], [8, 12]]) {
    ellPath(ctx, x, y, 3, 2.2);
    fs(ctx, '#e3b98c');
  }
});
mgArt('galho', 760, 50, (ctx) => {
  rrPath(ctx, 0, 14, 760, 22, 11);
  fs(ctx, '#c99d77');
  for (const x of [120, 330, 560, 700]) {
    ellPath(ctx, x, 12, 16, 9);
    fs(ctx, '#8fd18a');
  }
});
mgArt('balao_fome', 56, 50, (ctx) => {
  ellPath(ctx, 28, 22, 24, 19);
  fs(ctx, '#ffffff');
  polyPath(ctx, [[18, 36], [12, 48], [28, 38]]);
  fs(ctx, '#ffffff', null);
  for (const [x, y] of [[20, 22], [28, 18], [35, 24], [26, 27]]) {
    ellPath(ctx, x, y, 3.6, 2.6);
    fs(ctx, '#e3b98c');
  }
  sparkle(ctx, 44, 8, 4, '#fff7b0');
});

export class PassarinhosGame extends MiniGameBase {
  readonly gameId = 'passarinhos';
  readonly title = 'Alimente os Passarinhos';
  bgColors: [number, number] = [0xbfe6ff, 0xe9f8ff];
  private round = 0;
  private hits = 0;
  private readonly total = 10;
  private markerX = 0;
  private dirX = 1;
  private speed = 300;
  private zone = { x: 0, w: 140 };
  private barX = 200;
  private barW = 600;
  private gfx!: Phaser.GameObjects.Graphics;
  private birds: Phaser.GameObjects.Image[] = [];
  private hungry = 0;
  private bubble!: Phaser.GameObjects.Image;
  private locked = true;
  private larissa!: Phaser.GameObjects.Image;

  constructor() {
    super('mg_passarinhos');
  }

  setup() {
    this.round = 0;
    this.hits = 0;
    this.birds = [];
    this.locked = true;
    // nuvens
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.9);
    for (const [x, y] of [[150, 120], [820, 150], [520, 100]]) {
      g.fillEllipse(x, y, 140, 50);
      g.fillEllipse(x + 40, y - 18, 90, 50);
    }
    g.fillStyle(0xa8e09a, 1);
    g.fillRect(-3000, 610, MW + 6000, 2000);
    this.img(500, 260, 'mg:galho');
    [260, 500, 740].forEach((x, i) => {
      const b = this.img(x, 222, `mg:passaro${i}`, 1.2);
      this.birds.push(b);
      this.tweens.add({ targets: b, y: 218, yoyo: true, repeat: -1, duration: 600 + i * 120 });
    });
    this.bubble = this.img(0, 0, 'mg:balao_fome', 1.1).setVisible(false);
    this.larissa = this.add.image(140, 620, this.tex(dollTexture(this, S.outfit, 'front', 0))).setOrigin(0.5, 0.96).setScale(2.6 / ART_SCALE);
    this.gfx = this.add.graphics();
    this.text(500, 470, 'Toque quando o coração estiver na faixa verde!', { size: 22, bold: true }).setOrigin(0.5);
    this.button(500, 615, 330, 70, 'Jogar sementes!', 0xffb9d6, () => this.throwSeeds(), 28);
    this.input.keyboard?.on('keydown-SPACE', () => this.throwSeeds());
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: unknown[]) => {
      if (!over.length) this.throwSeeds();
    });
    this.setScore(`Passarinhos: 0/${this.total}`);
    this.banner('Prepare-se!', 800);
    this.time.delayedCall(1100, () => this.nextRound());
  }

  private nextRound() {
    if (this.round >= this.total) {
      const st = this.hits >= 9 ? 3 : this.hits >= 6 ? 2 : 1;
      this.finish(st, `${this.hits} de ${this.total} passarinhos alimentados`);
      return;
    }
    this.round++;
    this.hungry = Math.floor(Math.random() * 3);
    const b = this.birds[this.hungry];
    this.bubble.setPosition(b.x + 46, b.y - 60).setVisible(true);
    this.zone.w = Math.max(56, 150 - this.round * 9);
    this.zone.x = this.barX + 20 + Math.random() * (this.barW - this.zone.w - 40);
    this.speed = 320 + this.round * 38;
    this.markerX = this.barX;
    this.dirX = 1;
    this.locked = false;
  }

  private throwSeeds() {
    if (this.locked || this.ended) return;
    this.locked = true;
    const ok = this.markerX >= this.zone.x && this.markerX <= this.zone.x + this.zone.w;
    const b = this.birds[this.hungry];
    const seed = this.img(this.larissa.x + 30, this.larissa.y - 120, 'mg:semente', 1.6);
    const tx = ok ? b.x : b.x + (Math.random() < 0.5 ? -90 : 90);
    const ty = ok ? b.y + 10 : 600;
    sfx('whoosh');
    this.tweens.add({
      targets: seed, x: tx, duration: 600, ease: 'Linear',
    });
    this.tweens.add({
      targets: seed, y: { from: seed.y, to: ty }, duration: 600, ease: ok ? 'Quad.easeOut' : 'Quad.easeIn',
      onComplete: () => {
        seed.destroy();
        this.bubble.setVisible(false);
        if (ok) {
          this.hits++;
          sfx('chirp');
          b.setTexture(this.tex(`mg:passaro${this.hungry}f`));
          this.hearts(b.x, b.y - 40);
          this.floatText(b.x, b.y - 80, 'Nham nham!', '#5fae6b');
          this.tweens.add({ targets: b, scale: b.scale * 1.15, yoyo: true, duration: 150 });
        } else {
          sfx('error');
          this.floatText(b.x, b.y - 80, 'Quase!', '#f2727a');
        }
        this.setScore(`Passarinhos: ${this.hits}/${this.total}`);
        this.time.delayedCall(700, () => {
          b.setTexture(this.tex(`mg:passaro${this.hungry}`));
          this.nextRound();
        });
      },
    });
  }

  update(_t: number, dtRaw: number) {
    const dt = Math.min(dtRaw, 100) / 1000;
    if (!this.locked) {
      this.markerX += this.dirX * this.speed * dt;
      if (this.markerX > this.barX + this.barW) {
        this.markerX = this.barX + this.barW;
        this.dirX = -1;
      } else if (this.markerX < this.barX) {
        this.markerX = this.barX;
        this.dirX = 1;
      }
    }
    const g = this.gfx;
    g.clear();
    const y = 520;
    g.fillStyle(0x4a3657, 0.15);
    g.fillRoundedRect(this.barX - 4, y - 18, this.barW + 8, 44, 22);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(this.barX, y - 20, this.barW, 40, 20);
    g.fillStyle(0x9fe3c9, 1);
    g.fillRoundedRect(this.zone.x, y - 16, this.zone.w, 32, 14);
    // marcador coração
    const mx = this.markerX;
    g.fillStyle(0xe9739f, 1);
    g.fillCircle(mx - 7, y - 4, 9);
    g.fillCircle(mx + 7, y - 4, 9);
    g.fillTriangle(mx - 15, y, mx + 15, y, mx, y + 18);
  }
}
