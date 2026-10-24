import Phaser from 'phaser';
import { note, sfx } from '../core/audio';
import type { MiniGameBase } from './MiniGameBase';

/**
 * Pista de ritmo com 4 setas (usada na Escola de Dança e no Grande Baile).
 * As setas descem; toque no botão da coluna quando a seta passar pela linha.
 */
const LANES = 4;
const COLORS = [0xf7a8c8, 0x9fd3f7, 0x9fe3c9, 0xffe08a];
const MELODY = [523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33];

interface Note { lane: number; t: number; hit: boolean; missed: boolean; obj: Phaser.GameObjects.Container }

export class RhythmTrack {
  notes: Note[] = [];
  time = -2;
  hits = 0;
  perfect = 0;
  done = false;
  private beat = 0.5;
  private nextBeat = 0;
  private x0: number;
  private hitY = 540;
  private speed = 300;
  private gfx: Phaser.GameObjects.Graphics;
  private judge?: Phaser.GameObjects.Text;
  onHit?: (lane: number, good: boolean) => void;
  private objs: Phaser.GameObjects.GameObject[] = [];

  constructor(private sc: MiniGameBase, count: number, cx = 500, bpm = 112) {
    this.x0 = cx - 1.5 * 110;
    this.beat = 60 / bpm;
    this.gfx = sc.add.graphics();
    this.objs.push(this.gfx);
    let t = 0;
    let lastLane = -1;
    for (let i = 0; i < count; i++) {
      t += this.beat * (i > 6 && Math.random() < 0.3 ? 0.5 : i % 7 === 6 ? 2 : 1);
      let lane = Phaser.Math.Between(0, LANES - 1);
      if (lane === lastLane && Math.random() < 0.6) lane = (lane + 1) % LANES;
      lastLane = lane;
      this.notes.push({ lane, t, hit: false, missed: false, obj: this.arrow(lane) });
    }
    for (let l = 0; l < LANES; l++) {
      const btn = sc.button(this.laneX(l), 620, 96, 80, '', COLORS[l], () => this.press(l));
      const ar = this.arrowShape(l, 0xffffff);
      ar.setPosition(this.laneX(l), 620);
      ar.setDepth(btn.depth + 1);
      this.objs.push(btn, ar);
    }
    const keys: Record<string, number> = { LEFT: 0, UP: 1, DOWN: 2, RIGHT: 3 };
    for (const [k, l] of Object.entries(keys)) sc.input.keyboard?.on(`keydown-${k}`, () => this.press(l));
  }

  laneX(l: number) {
    return this.x0 + l * 110;
  }

  private arrowShape(lane: number, color: number) {
    const c = this.sc.add.container(0, 0);
    const g = this.sc.add.graphics();
    const rot = [Math.PI, -Math.PI / 2, Math.PI / 2, 0][lane];
    const pts = [[22, 0], [-4, -22], [-4, -10], [-20, -10], [-20, 10], [-4, 10], [-4, 22]].map(([x, y]) => new Phaser.Math.Vector2(x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)));
    g.fillStyle(color, 1);
    g.fillPoints(pts, true);
    g.lineStyle(4, 0x4a3657, 0.5);
    g.strokePoints(pts, true);
    c.add(g);
    return c;
  }

  private arrow(lane: number) {
    const c = this.arrowShape(lane, COLORS[lane]);
    c.setVisible(false);
    this.objs.push(c);
    return c;
  }

  press(lane: number) {
    if (this.done || this.sc.ended) return;
    let best: Note | null = null;
    let bd = Infinity;
    for (const n of this.notes) {
      if (n.hit || n.missed || n.lane !== lane) continue;
      const d = Math.abs((n.t - this.time) * this.speed);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    if (best && bd < 70) {
      best.hit = true;
      this.hits++;
      const perfect = bd < 30;
      if (perfect) this.perfect++;
      best.obj.setVisible(false);
      note(MELODY[this.hits % MELODY.length], 0.2);
      this.show(perfect ? 'Perfeito!' : 'Bom!', perfect ? '#e9739f' : '#7aa7e8', lane);
      this.onHit?.(lane, true);
    } else {
      sfx('tick');
    }
  }

  private show(s: string, color: string, lane: number) {
    this.judge?.destroy();
    this.judge = this.sc.text(this.laneX(lane), this.hitY - 70, s, { size: 26, bold: true, color, stroke: '#ffffff' }).setOrigin(0.5);
    this.sc.tweens.add({ targets: this.judge, y: this.hitY - 110, alpha: 0, duration: 600 });
  }

  update(dt: number) {
    if (this.done) return;
    this.time += dt;
    if (this.time >= this.nextBeat && this.time > 0) {
      sfx(Math.round(this.nextBeat / this.beat) % 2 ? 'hat' : 'drum');
      this.nextBeat += this.beat;
    }
    const g = this.gfx;
    g.clear();
    for (let l = 0; l < LANES; l++) {
      g.fillStyle(0xffffff, 0.45);
      g.fillRoundedRect(this.laneX(l) - 46, 90, 92, 480, 20);
    }
    g.lineStyle(6, 0xffffff, 1);
    g.lineBetween(this.x0 - 60, this.hitY, this.laneX(3) + 60, this.hitY);
    for (let l = 0; l < LANES; l++) {
      g.lineStyle(4, COLORS[l], 1);
      g.strokeCircle(this.laneX(l), this.hitY, 30);
    }
    for (const n of this.notes) {
      if (n.hit || n.missed) continue;
      const y = this.hitY - (n.t - this.time) * this.speed;
      if (y < 60) {
        n.obj.setVisible(false);
        continue;
      }
      n.obj.setVisible(true);
      n.obj.setPosition(this.laneX(n.lane), y);
      if (y > this.hitY + 70) {
        n.missed = true;
        n.obj.setVisible(false);
        this.show('Ops!', '#a99db8', n.lane);
        this.onHit?.(n.lane, false);
      }
    }
    if (this.notes.every((n) => n.hit || n.missed)) this.done = true;
  }

  accuracy() {
    return this.notes.length ? (this.hits + this.perfect * 0.25) / (this.notes.length * 1.25) : 0;
  }

  destroy() {
    this.objs.forEach((o) => o.destroy());
    this.judge?.destroy();
  }
}
