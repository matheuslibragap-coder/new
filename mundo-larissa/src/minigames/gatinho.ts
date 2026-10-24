import Phaser from 'phaser';
import { ellPath, fs, heartPath, lighten, polyPath } from '../art/draw';
import { mgArt } from '../art/minigameArt';
import { sfx } from '../core/audio';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 6 — Cuidar da Bolinha: uma gatinha virtual com fome, sujeira, alegria e sono. */
const FUR = '#ffc79a';
function catArt(mood: 'normal' | 'feliz' | 'dormindo' | 'triste') {
  return (ctx: CanvasRenderingContext2D) => {
    const cx = 120;
    // rabo
    ctx.strokeStyle = '#d99a6c';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(170, 190);
    ctx.quadraticCurveTo(225, 170, 205, 110);
    ctx.stroke();
    ctx.strokeStyle = FUR;
    ctx.lineWidth = 11;
    ctx.stroke();
    // corpo
    ellPath(ctx, cx, 180, 64, 50);
    fs(ctx, FUR, undefined, 2.5);
    ellPath(ctx, cx, 190, 34, 30);
    fs(ctx, lighten(FUR, 0.5), null);
    for (const dx of [-30, 30]) {
      ellPath(ctx, cx + dx, 224, 17, 11);
      fs(ctx, FUR, undefined, 2);
    }
    // orelhas
    polyPath(ctx, [[cx - 58, 92], [cx - 52, 30], [cx - 14, 66]]);
    fs(ctx, FUR, undefined, 2.5);
    polyPath(ctx, [[cx + 58, 92], [cx + 52, 30], [cx + 14, 66]]);
    fs(ctx, FUR, undefined, 2.5);
    polyPath(ctx, [[cx - 48, 76], [cx - 47, 46], [cx - 26, 66]]);
    fs(ctx, '#fbb6c9', null);
    polyPath(ctx, [[cx + 48, 76], [cx + 47, 46], [cx + 26, 66]]);
    fs(ctx, '#fbb6c9', null);
    // cabeça
    ellPath(ctx, cx, 96, 66, 54);
    fs(ctx, FUR, undefined, 2.5);
    // listrinhas
    ctx.strokeStyle = '#e9a878';
    ctx.lineWidth = 5;
    for (const dx of [-12, 0, 12]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx, 46);
      ctx.lineTo(cx + dx * 0.8, 62);
      ctx.stroke();
    }
    // rosto
    ctx.strokeStyle = '#4a3657';
    ctx.fillStyle = '#4a3657';
    ctx.lineWidth = 4;
    if (mood === 'dormindo' || mood === 'feliz') {
      for (const s of [-1, 1]) {
        ctx.beginPath();
        if (mood === 'feliz') ctx.arc(cx + s * 24, 96, 9, Math.PI * 1.1, Math.PI * 1.9);
        else ctx.arc(cx + s * 24, 92, 9, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();
      }
    } else {
      for (const s of [-1, 1]) {
        ellPath(ctx, cx + s * 24, 94, 9, 12);
        ctx.fill();
        ellPath(ctx, cx + s * 24 + 3, 89, 3.5, 3.5);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.fillStyle = '#4a3657';
      }
      if (mood === 'triste') {
        ctx.lineWidth = 3;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(cx + s * 14, 76);
          ctx.lineTo(cx + s * 32, 80);
          ctx.stroke();
        }
      }
    }
    ellPath(ctx, cx, 112, 6, 4.5);
    ctx.fillStyle = '#f27fa4';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (mood === 'triste') ctx.arc(cx, 128, 7, Math.PI * 1.15, Math.PI * 1.85);
    else {
      ctx.arc(cx - 6, 117, 6, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.moveTo(cx + 12, 117);
      ctx.arc(cx + 6, 117, 6, 0.1 * Math.PI, 0.9 * Math.PI);
    }
    ctx.stroke();
    // bochechas e bigodes
    for (const s of [-1, 1]) {
      ellPath(ctx, cx + s * 40, 112, 10, 6);
      ctx.fillStyle = 'rgba(242,127,164,0.4)';
      ctx.fill();
      ctx.strokeStyle = '#c99a7a';
      ctx.lineWidth = 2;
      for (const dy of [-4, 4]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * 50, 108 + dy);
        ctx.lineTo(cx + s * 74, 104 + dy * 2);
        ctx.stroke();
      }
    }
    // laço
    heartPath(ctx, cx + 40, 50, 9);
    fs(ctx, '#c7a8f0', undefined, 2);
  };
}
for (const m of ['normal', 'feliz', 'dormindo', 'triste'] as const) mgArt(`gata_${m}`, 240, 250, catArt(m), 120, 240);
mgArt('racao', 80, 50, (ctx) => {
  ellPath(ctx, 40, 32, 34, 14);
  fs(ctx, '#f7a8c8', undefined, 2);
  ellPath(ctx, 40, 26, 28, 9);
  fs(ctx, '#c99d77');
});
mgArt('bolinha_la', 44, 44, (ctx) => {
  ellPath(ctx, 22, 22, 18, 18);
  fs(ctx, '#ff8f87', undefined, 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(22, 22, 11, 0.3, 2.5);
  ctx.stroke();
});

type Need = 'fome' | 'limpeza' | 'alegria' | 'energia';
const LABEL: Record<Need, string> = { fome: 'Barriguinha', limpeza: 'Limpeza', alegria: 'Alegria', energia: 'Sono' };
const DECAY: Record<Need, number> = { fome: 4.2, limpeza: 3.2, alegria: 5, energia: 2.6 };
const COLOR: Record<Need, number> = { fome: 0xffb347, limpeza: 0x9fd3f7, alegria: 0xf7a8c8, energia: 0xc7a8f0 };

export class GatinhoGame extends MiniGameBase {
  readonly gameId = 'gatinho';
  readonly title = 'Cuidando da Bolinha';
  bgColors: [number, number] = [0xe5f7f1, 0xfdf3e8];
  private v: Record<Need, number> = { fome: 60, limpeza: 70, alegria: 55, energia: 75 };
  private cat!: Phaser.GameObjects.Image;
  private bars!: Phaser.GameObjects.Graphics;
  private dirt!: Phaser.GameObjects.Graphics;
  private sleeping = 0;
  private busy = 0;
  private samples: number[] = [];

  constructor() {
    super('mg_gatinho');
  }

  setup() {
    this.v = { fome: 55, limpeza: 65, alegria: 50, energia: 70 };
    this.samples = [];
    this.sleeping = 0;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.75);
    g.fillRoundedRect(40, 90, 330, 330, 30);
    g.fillStyle(0xfcd3e3, 1);
    g.fillEllipse(640, 500, 380, 90);
    this.cat = this.img(640, 510, 'mg:gata_normal', 1.25);
    this.cat.setInteractive({ useHandCursor: true });
    this.cat.on('pointerdown', () => {
      if (this.ended || this.sleeping > 0) return;
      this.v.alegria = Math.min(100, this.v.alegria + 3);
      sfx('meow');
      this.hearts(640, 280, 2);
    });
    this.tweens.add({ targets: this.cat, scaleY: this.cat.scaleY * 1.02, yoyo: true, repeat: -1, duration: 700 });
    this.dirt = this.add.graphics();
    this.bars = this.add.graphics();
    (Object.keys(LABEL) as Need[]).forEach((n, i) => this.text(70, 130 + i * 72, LABEL[n], { size: 20, bold: true }).setOrigin(0, 0.5));
    const acts: [string, number, () => void][] = [
      ['Comida', 0xffd29a, () => this.feed()],
      ['Banho', 0xbfe3fb, () => this.bath()],
      ['Brincar', 0xfcc3dd, () => this.play()],
      ['Dormir', 0xddc9fb, () => this.sleep()],
    ];
    acts.forEach(([l, c, f], i) => this.button(130 + i * 0 + (i % 2) * 150 + 10, 480 + Math.floor(i / 2) * 90, 140, 70, l, c, f, 24));
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.sample() });
    this.countdown(60, () => this.end());
  }

  private can() {
    if (this.ended) return false;
    if (this.sleeping > 0) {
      this.floatText(640, 250, 'Shhh… ela está dormindo', '#9b7fd4', 24);
      return false;
    }
    if (this.busy > 0) return false;
    return true;
  }

  private feed() {
    if (!this.can()) return;
    this.busy = 900;
    this.v.fome = Math.min(100, this.v.fome + 35);
    sfx('pop');
    const r = this.img(560, 520, 'mg:racao', 1.3);
    this.tweens.add({ targets: r, alpha: 0, delay: 700, duration: 300, onComplete: () => r.destroy() });
    this.floatText(640, 260, 'Nham nham!', '#e9a03a');
  }

  private bath() {
    if (!this.can()) return;
    this.busy = 1200;
    this.v.limpeza = Math.min(100, this.v.limpeza + 40);
    sfx('splash');
    for (let i = 0; i < 14; i++) {
      const b = this.add.circle(560 + Math.random() * 160, 440 - Math.random() * 180, 8 + Math.random() * 10, 0xffffff, 0.85).setStrokeStyle(2, 0x9fd3f7);
      this.tweens.add({ targets: b, y: b.y - 60, alpha: 0, duration: 900 + Math.random() * 500, onComplete: () => b.destroy() });
    }
    this.floatText(640, 250, 'Cheirosinha!', '#7aa7e8');
  }

  private play() {
    if (!this.can()) return;
    this.busy = 1100;
    this.v.alegria = Math.min(100, this.v.alegria + 32);
    this.v.energia = Math.max(0, this.v.energia - 8);
    sfx('meow');
    const ball = this.img(820, 470, 'mg:bolinha_la', 1.2);
    this.tweens.add({ targets: ball, x: 700, y: 380, duration: 400, yoyo: true, repeat: 1, ease: 'Sine.easeOut', onComplete: () => ball.destroy() });
    this.hearts(640, 280, 3);
  }

  private sleep() {
    if (!this.can()) return;
    this.sleeping = 3500;
    sfx('magic');
    this.cat.setTexture(this.tex('mg:gata_dormindo'));
  }

  private sample() {
    if (this.ended) return;
    const vals = Object.values(this.v);
    this.samples.push(vals.reduce((a, b) => a + b, 0) / vals.length);
    if (this.sleeping > 0) this.floatText(700, 300, 'Z', '#9b7fd4', 28);
  }

  update(_t: number, dtRaw: number) {
    const dt = Math.min(dtRaw, 100) / 1000;
    if (!this.ended) {
      for (const n of Object.keys(DECAY) as Need[]) {
        if (n === 'energia' && this.sleeping > 0) this.v.energia = Math.min(100, this.v.energia + 22 * dt);
        else this.v[n] = Math.max(0, this.v[n] - DECAY[n] * dt);
      }
      this.busy = Math.max(0, this.busy - dt * 1000);
      if (this.sleeping > 0) {
        this.sleeping -= dt * 1000;
        if (this.sleeping <= 0) this.sleeping = 0;
      }
      if (this.sleeping <= 0) {
        const min = Math.min(...Object.values(this.v));
        const avg = Object.values(this.v).reduce((a, b) => a + b, 0) / 4;
        const mood = min < 25 ? 'triste' : avg > 70 ? 'feliz' : 'normal';
        const key = this.tex(`mg:gata_${mood}`);
        if (this.cat.texture.key !== key) this.cat.setTexture(key);
      }
    }
    const g = this.bars;
    g.clear();
    (Object.keys(LABEL) as Need[]).forEach((n, i) => {
      const y = 150 + i * 72;
      const v = this.v[n];
      g.fillStyle(0xeee6f6, 1);
      g.fillRoundedRect(70, y, 270, 20, 10);
      g.fillStyle(v < 25 ? 0xf2727a : COLOR[n], 1);
      g.fillRoundedRect(70, y, Math.max(12, 270 * (v / 100)), 20, 10);
    });
    const d = this.dirt;
    d.clear();
    if (this.v.limpeza < 45) {
      d.fillStyle(0x9a8070, 0.45);
      const k = (45 - this.v.limpeza) / 45;
      for (const [x, y] of [[600, 440], [690, 470], [650, 390], [710, 410], [585, 480]].slice(0, 1 + Math.round(k * 4))) d.fillCircle(x, y, 9);
    }
    this.setScore(`Cuide bem da Bolinha!`);
  }

  private end() {
    if (this.ended) return;
    const avg = this.samples.length ? this.samples.reduce((a, b) => a + b, 0) / this.samples.length : 50;
    const st = avg >= 72 ? 3 : avg >= 52 ? 2 : 1;
    this.finish(st, `Bolinha ficou ${Math.round(avg)}% feliz`);
  }
}
