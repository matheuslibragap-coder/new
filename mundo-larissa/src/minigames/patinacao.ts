import Phaser from 'phaser';
import { ART_SCALE } from '../config';
import { dollTexture } from '../character/Character';
import { sfx } from '../core/audio';
import { S } from '../core/state';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 12 — Patinação: deslize pela pista, troque de faixa, pegue estrelas e desvie dos obstáculos. */
const LANE_X = [330, 500, 670];

interface Thing { img: Phaser.GameObjects.Image; lane: number; star: boolean; done: boolean }

export class PatinacaoGame extends MiniGameBase {
  readonly gameId = 'patinacao';
  readonly title = 'Patinação no Gelo';
  bgColors: [number, number] = [0xdff3ff, 0xf7fbff];
  private lane = 1;
  private skater!: Phaser.GameObjects.Image;
  private things: Thing[] = [];
  private stars = 0;
  private bumps = 0;
  private speed = 280;
  private spawnT = 0;
  private elapsed = 0;
  private lines!: Phaser.GameObjects.Graphics;
  private scroll = 0;
  private inv = 0;

  constructor() {
    super('mg_patinacao');
  }

  setup() {
    this.lane = 1;
    this.things = [];
    this.stars = 0;
    this.bumps = 0;
    this.elapsed = 0;
    const g = this.add.graphics();
    g.fillStyle(0xe8f6ff, 1);
    g.fillRoundedRect(220, 70, 560, 700, 40);
    g.lineStyle(6, 0xffffff, 1);
    g.strokeRoundedRect(220, 70, 560, 700, 40);
    this.lines = this.add.graphics();
    this.skater = this.add.image(LANE_X[1], 610, this.tex(dollTexture(this, S.outfit, 'back', 0))).setOrigin(0.5, 0.95).setScale(1.6 / ART_SCALE).setDepth(20);
    this.button(110, 560, 160, 110, '◀', 0xbfe3fb, () => this.moveLane(-1), 48);
    this.button(890, 560, 160, 110, '▶', 0xbfe3fb, () => this.moveLane(1), 48);
    this.input.keyboard?.on('keydown-LEFT', () => this.moveLane(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.moveLane(1));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: unknown[]) => {
      if (over.length) return;
      this.moveLane(p.worldX < this.skater.x ? -1 : 1);
    });
    this.updateScore();
    this.countdown(45, () => this.end());
  }

  private moveLane(d: number) {
    if (this.ended) return;
    const n = Phaser.Math.Clamp(this.lane + d, 0, 2);
    if (n === this.lane) return;
    this.lane = n;
    sfx('whoosh');
    this.tweens.add({ targets: this.skater, x: LANE_X[n], duration: 140, ease: 'Quad.easeOut' });
    this.skater.setTexture(this.tex(dollTexture(this, S.outfit, 'side', 1))).setFlipX(d < 0);
    this.time.delayedCall(220, () => this.skater.setTexture(this.tex(dollTexture(this, S.outfit, 'back', 0))).setFlipX(false));
  }

  private updateScore() {
    this.setScore(`Estrelas: ${this.stars}   Tombos: ${this.bumps}`);
  }

  private spawn() {
    const lanes = Phaser.Utils.Array.Shuffle([0, 1, 2]);
    const nObs = this.elapsed > 15 && Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < 3; i++) {
      const lane = lanes[i];
      if (i < nObs) {
        const key = Phaser.Utils.Array.GetRandom(['obj:cone', 'obj:boneco_neve', 'obj:pedra']);
        const img = this.add.image(LANE_X[lane], 40, this.tex(key)).setOrigin(0.5, 0.9).setScale(1.2 / ART_SCALE);
        this.things.push({ img, lane, star: false, done: false });
      } else if (i === nObs && Math.random() < 0.85) {
        const img = this.img(LANE_X[lane], 40, 'ui:star', 1.6);
        this.things.push({ img, lane, star: true, done: false });
      }
    }
  }

  update(_t: number, dtRaw: number) {
    const dt = Math.min(dtRaw, 100) / 1000;
    const g = this.lines;
    g.clear();
    g.lineStyle(4, 0xc9e4f5, 1);
    this.scroll = (this.scroll + this.speed * dt) % 80;
    for (const x of [415, 585]) for (let y = 60 + this.scroll; y < 760; y += 80) g.lineBetween(x, y, x, y + 40);
    if (this.ended) return;
    this.elapsed += dt;
    this.speed = 280 + this.elapsed * 6;
    this.inv = Math.max(0, this.inv - dt);
    this.skater.setAlpha(this.inv > 0 && Math.floor(this.elapsed * 10) % 2 ? 0.4 : 1);
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Math.max(0.7, 1.4 - this.elapsed * 0.015);
      this.spawn();
    }
    for (const t of [...this.things]) {
      t.img.y += this.speed * dt;
      t.img.setDepth(t.img.y);
      if (!t.done && t.lane === this.lane && t.img.y > 570 && t.img.y < 640) {
        t.done = true;
        if (t.star) {
          this.stars++;
          sfx('coin');
          this.floatText(t.img.x, 520, '+1', '#e9a03a', 28);
          t.img.destroy();
        } else if (this.inv <= 0) {
          this.bumps++;
          this.inv = 1.2;
          sfx('error');
          this.cameras.main.shake(180, 0.006);
          this.floatText(t.img.x, 500, 'Opa!', '#f2727a', 28);
        }
        this.updateScore();
      }
      if (t.img.y > 760 || !t.img.active) {
        t.img.destroy();
        this.things.splice(this.things.indexOf(t), 1);
      }
    }
  }

  private end() {
    if (this.ended) return;
    const score = this.stars - this.bumps * 2;
    const st = score >= 18 ? 3 : score >= 9 ? 2 : 1;
    this.finish(st, `${this.stars} estrelas e ${this.bumps} tombos`);
  }
}
