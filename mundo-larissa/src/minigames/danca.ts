import Phaser from 'phaser';
import { ART_SCALE } from '../config';
import { dollTexture } from '../character/Character';
import { S } from '../core/state';
import { MiniGameBase } from './MiniGameBase';
import { RhythmTrack } from './rhythm';

/** Mini game 8 — Ritmo da Dança: acerte as setas no tempo da música. */
export class DancaGame extends MiniGameBase {
  readonly gameId = 'danca';
  readonly title = 'Ritmo da Dança';
  bgColors: [number, number] = [0xfde6f3, 0xe6e0fb];
  private track!: RhythmTrack;
  private dancer!: Phaser.GameObjects.Image;
  private poses: ['front' | 'side' | 'back', boolean][] = [['front', false], ['side', false], ['back', false], ['side', true]];

  constructor() {
    super('mg_danca');
  }

  setup() {
    this.dancer = this.add.image(150, 560, this.tex(dollTexture(this, S.outfit, 'front', 0))).setOrigin(0.5, 0.96).setScale(2.8 / ART_SCALE);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.7);
    g.fillEllipse(150, 565, 200, 40);
    g.setDepth(-1);
    this.track = new RhythmTrack(this, 36, 560);
    this.track.onHit = (lane, good) => {
      if (!good) return;
      const [d, m] = this.poses[lane];
      this.dancer.setTexture(this.tex(dollTexture(this, S.outfit, d, 1 + (lane % 2)))).setFlipX(m);
      this.tweens.add({ targets: this.dancer, y: 545, yoyo: true, duration: 120 });
    };
    this.banner('Prepare-se!', 900);
  }

  update(_t: number, dtRaw: number) {
    if (this.ended) return;
    this.track.update(Math.min(dtRaw, 100) / 1000);
    this.setScore(`Acertos: ${this.track.hits}/${this.track.notes.length}`);
    if (this.track.done) {
      const a = this.track.accuracy();
      const st = a >= 0.8 ? 3 : a >= 0.55 ? 2 : 1;
      this.finish(st, `${this.track.hits} de ${this.track.notes.length} passos certos`);
    }
  }
}
