import Phaser from 'phaser';
import { sfx } from '../core/audio';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 5 — Jardim Mágico: plante, regue e colha as flores antes que murchem. */
type Stage = 'vazio' | 'semente' | 'crescendo' | 'flor' | 'murcha';
interface Plot { stage: Stage; t: number; color: number; x: number; y: number }

const FLOWER_COLORS = [0xf7a8c8, 0xc7a8f0, 0xffe08a, 0xff8f87, 0x9fd3f7, 0xffffff];
const GROW = 2600;
const BLOOM = 4200;

export class JardimGame extends MiniGameBase {
  readonly gameId = 'jardim';
  readonly title = 'Jardim Mágico';
  bgColors: [number, number] = [0xd9f5d0, 0xf4fbe9];
  private plots: Plot[] = [];
  private gfx!: Phaser.GameObjects.Graphics;
  private flowers = 0;

  constructor() {
    super('mg_jardim');
  }

  setup() {
    this.flowers = 0;
    this.plots = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = 330 + c * 170;
      const y = 200 + r * 150;
      this.plots.push({ stage: 'vazio', t: 0, color: 0, x, y });
      const z = this.add.zone(x, y, 150, 130).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => this.tap(r * 3 + c));
    }
    this.gfx = this.add.graphics();
    this.text(500, 640, 'Toque: plantar → regar → colher! Colha antes de murchar.', { size: 20, bold: true }).setOrigin(0.5);
    this.setScore('Flores: 0');
    this.countdown(60, () => this.end());
  }

  private tap(i: number) {
    if (this.ended) return;
    const p = this.plots[i];
    switch (p.stage) {
      case 'vazio':
        p.stage = 'semente';
        p.color = Phaser.Utils.Array.GetRandom(FLOWER_COLORS);
        sfx('pop');
        break;
      case 'semente':
        p.stage = 'crescendo';
        p.t = 0;
        sfx('splash');
        this.floatText(p.x, p.y - 40, 'Regou!', '#7aa7e8', 24);
        break;
      case 'flor':
        p.stage = 'vazio';
        this.flowers++;
        this.setScore(`Flores: ${this.flowers}`);
        sfx('star');
        this.hearts(p.x, p.y - 30, 2);
        this.floatText(p.x, p.y - 50, '+1', '#e9739f');
        break;
      case 'murcha':
        p.stage = 'vazio';
        sfx('whoosh');
        break;
      default:
        sfx('tick');
    }
  }

  update(_t: number, dtRaw: number) {
    const dt = Math.min(dtRaw, 100);
    if (!this.ended) {
      for (const p of this.plots) {
        if (p.stage === 'crescendo') {
          p.t += dt;
          if (p.t >= GROW) {
            p.stage = 'flor';
            p.t = 0;
            sfx('magic');
          }
        } else if (p.stage === 'flor') {
          p.t += dt;
          if (p.t >= BLOOM) {
            p.stage = 'murcha';
            sfx('error');
          }
        }
      }
    }
    this.draw();
  }

  private draw() {
    const g = this.gfx;
    g.clear();
    for (const p of this.plots) {
      // canteiro
      g.fillStyle(0x4a3657, 0.15);
      g.fillEllipse(p.x, p.y + 30, 150, 60);
      g.fillStyle(0xb98458, 1);
      g.fillEllipse(p.x, p.y + 24, 140, 56);
      g.fillStyle(0xa0683f, 1);
      g.fillEllipse(p.x, p.y + 22, 110, 38);
      const y = p.y + 18;
      if (p.stage === 'semente') {
        g.fillStyle(0xe3b98c, 1);
        g.fillEllipse(p.x, y, 16, 10);
        // gotinha pedindo água
        g.fillStyle(0x7ab8ee, 1);
        g.fillCircle(p.x + 30, y - 46, 12);
        g.fillTriangle(p.x + 19, y - 50, p.x + 41, y - 50, p.x + 30, y - 70);
      } else if (p.stage === 'crescendo') {
        const k = p.t / GROW;
        g.lineStyle(5, 0x5fae6b);
        g.lineBetween(p.x, y, p.x, y - 20 - 40 * k);
        g.fillStyle(0x8fd18a, 1);
        g.fillEllipse(p.x - 10, y - 20 - 20 * k, 18, 9);
        g.fillEllipse(p.x + 10, y - 26 - 22 * k, 18, 9);
      } else if (p.stage === 'flor' || p.stage === 'murcha') {
        const wilt = p.stage === 'murcha';
        const k = wilt ? 1 : Math.min(1, p.t / 300);
        const top = y - 64;
        g.lineStyle(5, wilt ? 0x9a8a60 : 0x5fae6b);
        g.lineBetween(p.x, y, p.x + (wilt ? 14 : 0), top + (wilt ? 20 : 0));
        const fx = p.x + (wilt ? 18 : 0);
        const fy = top + (wilt ? 26 : 0);
        const col = wilt ? 0xb8a9a0 : p.color;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          g.fillStyle(col, 1);
          g.fillCircle(fx + Math.cos(a) * 14 * k, fy + Math.sin(a) * 14 * k, 11 * k);
        }
        g.fillStyle(wilt ? 0x8a7a70 : 0xffd45e, 1);
        g.fillCircle(fx, fy, 9 * k);
        if (!wilt) {
          // barrinha do tempo antes de murchar
          const left = 1 - p.t / BLOOM;
          g.fillStyle(0xffffff, 1);
          g.fillRoundedRect(p.x - 40, p.y + 56, 80, 10, 5);
          g.fillStyle(left > 0.35 ? 0x9fe3c9 : 0xff8f87, 1);
          g.fillRoundedRect(p.x - 40, p.y + 56, 80 * left, 10, 5);
        }
      }
    }
  }

  private end() {
    if (this.ended) return;
    const st = this.flowers >= 10 ? 3 : this.flowers >= 5 ? 2 : 1;
    this.finish(st, `${this.flowers} flores colhidas`);
  }
}
