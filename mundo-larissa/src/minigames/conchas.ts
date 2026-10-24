import Phaser from 'phaser';
import { ellPath, fs, polyPath, rgrad } from '../art/draw';
import { mgArt } from '../art/minigameArt';
import { ART_SCALE } from '../config';
import { dollTexture } from '../character/Character';
import { sfx } from '../core/audio';
import { S } from '../core/state';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 7 — Caça às Conchas: colete conchas na areia e fuja dos caranguejos. */
const SHELL_COLS = ['#f7a8c8', '#ffe08a', '#c7a8f0', '#ffc29f'];
SHELL_COLS.forEach((c, i) => mgArt(`concha${i}`, 48, 44, (ctx) => {
  ctx.beginPath();
  ctx.moveTo(24, 40);
  for (let k = 0; k <= 8; k++) {
    const a = Math.PI + (k / 8) * Math.PI;
    ctx.lineTo(24 + Math.cos(a) * 20, 30 + Math.sin(a) * 24);
  }
  ctx.closePath();
  fs(ctx, rgrad(ctx, 24, 20, 24, '#ffffff', c), undefined, 1.6);
  ctx.strokeStyle = 'rgba(74,54,87,0.35)';
  for (let k = 1; k < 8; k++) {
    const a = Math.PI + (k / 8) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(24, 40);
    ctx.lineTo(24 + Math.cos(a) * 18, 30 + Math.sin(a) * 21);
    ctx.stroke();
  }
}));
mgArt('caranguejo', 80, 56, (ctx) => {
  const c = '#ff8f87';
  ctx.strokeStyle = '#d9605a';
  ctx.lineWidth = 4;
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(40 + s * 14, 36 + k * 4);
    ctx.lineTo(40 + s * 30, 44 + k * 5);
    ctx.stroke();
  }
  for (const s of [-1, 1]) {
    ellPath(ctx, 40 + s * 28, 16, 9, 8);
    fs(ctx, c, undefined, 2);
    polyPath(ctx, [[40 + s * 28, 10], [40 + s * 36, 4], [40 + s * 32, 14]]);
    fs(ctx, '#fff3f0', null);
  }
  ellPath(ctx, 40, 34, 22, 15);
  fs(ctx, c, undefined, 2);
  for (const s of [-1, 1]) {
    ellPath(ctx, 40 + s * 8, 18, 4.5, 4.5);
    fs(ctx, '#fff', undefined, 1.5);
    ellPath(ctx, 40 + s * 8, 18, 2, 2);
    ctx.fillStyle = '#4a3657';
    ctx.fill();
  }
  ctx.strokeStyle = '#4a3657';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(40, 34, 5, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
});

interface Crab { img: Phaser.GameObjects.Image; vx: number; vy: number }

export class ConchasGame extends MiniGameBase {
  readonly gameId = 'conchas';
  readonly title = 'Caça às Conchas';
  bgColors: [number, number] = [0xbfe6ff, 0xf8e6b9];
  private player!: Phaser.GameObjects.Image;
  private target = { x: 500, y: 420 };
  private shells: Phaser.GameObjects.Image[] = [];
  private crabs: Crab[] = [];
  private count = 0;
  private lives = 3;
  private inv = 0;
  private elapsed = 0;
  private side = '';

  constructor() {
    super('mg_conchas');
  }

  setup() {
    this.count = 0;
    this.lives = 3;
    this.inv = 0;
    this.elapsed = 0;
    this.shells = [];
    this.crabs = [];
    const g = this.add.graphics();
    g.fillStyle(0x8fd3f2, 1);
    g.fillRect(-3000, 70, 7000, 70);
    g.fillStyle(0xd8f2ff, 1);
    for (let x = -100; x < 1100; x += 60) g.fillEllipse(x, 140, 70, 18);
    g.fillStyle(0xf8e6b9, 1);
    g.fillRect(-3000, 145, 7000, 2000);
    this.player = this.add.image(500, 420, this.tex(dollTexture(this, S.outfit, 'front', 0))).setOrigin(0.5, 0.95).setScale(1.5 / ART_SCALE).setDepth(10);
    for (let i = 0; i < 5; i++) this.spawnShell();
    for (let i = 0; i < 2; i++) this.spawnCrab();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.setTarget(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => p.isDown && this.setTarget(p));
    this.updateScore();
    this.countdown(45, () => this.end());
  }

  private setTarget(p: Phaser.Input.Pointer) {
    if (p.worldY < 80) return;
    this.target = { x: Phaser.Math.Clamp(p.worldX, 30, 970), y: Phaser.Math.Clamp(p.worldY, 190, 660) };
  }

  private updateScore() {
    this.setScore(`Conchas: ${this.count}   Vidas: ${'♥'.repeat(Math.max(0, this.lives))}`);
  }

  private spawnShell() {
    const x = Phaser.Math.Between(60, 940);
    const y = Phaser.Math.Between(200, 640);
    const s = this.img(x, y, `mg:concha${Phaser.Math.Between(0, 3)}`, 1.2);
    s.setScale(0);
    this.tweens.add({ targets: s, scale: 1.2 / ART_SCALE, duration: 250, ease: 'Back.easeOut' });
    this.shells.push(s);
  }

  private spawnCrab() {
    const left = Math.random() < 0.5;
    const img = this.img(left ? -40 : 1040, Phaser.Math.Between(220, 620), 'mg:caranguejo', 1.1).setDepth(5);
    const sp = 90 + this.elapsed * 3;
    this.crabs.push({ img, vx: left ? sp : -sp, vy: (Math.random() - 0.5) * 60 });
  }

  update(_t: number, dtRaw: number) {
    if (this.ended) return;
    const dt = Math.min(dtRaw, 100) / 1000;
    this.elapsed += dt;
    // Larissa anda até o alvo
    const dx = this.target.x - this.player.x;
    const dy = this.target.y - this.player.y;
    const d = Math.hypot(dx, dy);
    const sp = 330 * dt;
    let dir: 'front' | 'back' | 'side' = 'front';
    let flip = false;
    if (d > 4) {
      this.player.x += (dx / d) * Math.min(sp, d);
      this.player.y += (dy / d) * Math.min(sp, d);
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = 'side';
        flip = dx < 0;
      } else dir = dy < 0 ? 'back' : 'front';
    }
    const frame = d > 4 ? [1, 0, 2, 0][Math.floor(this.elapsed * 8) % 4] : 0;
    const key = `${dir}${frame}${flip}`;
    if (key !== this.side) {
      this.side = key;
      this.player.setTexture(this.tex(dollTexture(this, S.outfit, dir, frame)));
      this.player.setFlipX(flip);
    }
    this.player.setDepth(this.player.y);
    // conchas
    for (const s of [...this.shells]) {
      if (Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y - 20) < 46) {
        this.shells.splice(this.shells.indexOf(s), 1);
        this.count++;
        sfx('coin');
        this.floatText(s.x, s.y - 20, '+1', '#e9739f', 26);
        s.destroy();
        this.updateScore();
        this.time.delayedCall(500, () => !this.ended && this.spawnShell());
      }
    }
    // caranguejos
    this.inv = Math.max(0, this.inv - dt);
    this.player.setAlpha(this.inv > 0 ? (Math.floor(this.elapsed * 10) % 2 ? 0.4 : 1) : 1);
    const wanted = 2 + Math.floor(this.elapsed / 12);
    if (this.crabs.length < wanted) this.spawnCrab();
    for (const c of [...this.crabs]) {
      c.img.x += c.vx * dt;
      c.img.y += c.vy * dt;
      c.img.y += Math.sin(this.elapsed * 10 + c.img.x) * 0.5;
      if (c.img.y < 200 || c.img.y > 650) c.vy *= -1;
      c.img.setDepth(c.img.y);
      if (c.img.x < -80 || c.img.x > 1080) {
        c.img.destroy();
        this.crabs.splice(this.crabs.indexOf(c), 1);
        continue;
      }
      if (this.inv <= 0 && Phaser.Math.Distance.Between(c.img.x, c.img.y, this.player.x, this.player.y - 15) < 44) {
        this.lives--;
        this.inv = 1.6;
        sfx('error');
        this.cameras.main.shake(180, 0.006);
        this.floatText(this.player.x, this.player.y - 90, 'Ai! Belisco!', '#f2727a', 26);
        this.updateScore();
        if (this.lives <= 0) this.end();
      }
    }
  }

  private end() {
    if (this.ended) return;
    const st = this.count >= 15 ? 3 : this.count >= 8 ? 2 : 1;
    this.finish(st, `${this.count} conchas coletadas`);
  }
}
