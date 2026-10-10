import Phaser from 'phaser';
import { ART_SCALE } from '../config';
import { dollTexture } from '../character/Character';
import { note, sfx } from '../core/audio';
import type { Outfit } from '../core/state';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 2 — Desfile da Memória: repita a sequência de looks que brilham na passarela. */
export const RUNWAY_LOOKS: Outfit[] = [
  { skin: 'pele2', hairStyle: 'cab_coque', hairColor: 'cor_loiro', full: 'vest_rodado_rosa', shoes: 'sapatilha_rosa', hat: 'tiara_perola' },
  { skin: 'pele4', hairStyle: 'cab_cacheado', hairColor: 'cor_preto', top: 'cam_estrela', bottom: 'calca_jeans', shoes: 'tenis_azul', hat: 'bone_azul' },
  { skin: 'pele3', hairStyle: 'cab_trancas', hairColor: 'cor_ruivo', full: 'vest_babado_menta', shoes: 'bota_branca', hat: 'chapeu_palha' },
  { skin: 'pele5', hairStyle: 'cab_chiquinhas', hairColor: 'cor_lilas', top: 'blusa_amarela', bottom: 'saia_tutu_rosa', shoes: 'sandalia_dourada', wings: 'asas_fada_rosa' },
];
const PAD_COLORS = [0xf7a8c8, 0x9fd3f7, 0x9fe3c9, 0xffe08a];
const NOTES = [523.25, 659.25, 783.99, 1046.5];

export class DesfileGame extends MiniGameBase {
  readonly gameId = 'desfile';
  readonly title = 'Desfile da Memória';
  bgColors: [number, number] = [0xf3e6ff, 0xfde8f3];
  protected seq: number[] = [];
  protected pos = 0;
  protected lives = 2;
  protected best = 0;
  protected busy = true;
  protected models: Phaser.GameObjects.Image[] = [];
  protected pads: Phaser.GameObjects.Graphics[] = [];
  protected info!: Phaser.GameObjects.Text;
  /** número máximo de rodadas */
  protected maxLen = 7;
  protected onDone?: (best: number) => void;

  constructor(key = 'mg_desfile') {
    super(key);
  }

  setup() {
    this.seq = [];
    this.lives = 2;
    this.best = 0;
    this.models = [];
    this.pads = [];
    this.buildStage();
    this.info = this.text(500, 130, '', { size: 28, bold: true }).setOrigin(0.5);
    this.updateScore();
    this.time.delayedCall(900, () => this.nextRound());
  }

  protected buildStage() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.7);
    g.fillRoundedRect(60, 470, 880, 60, 30);
    // holofotes
    for (let i = 0; i < 4; i++) {
      const x = 200 + i * 200;
      const pad = this.add.graphics();
      this.pads.push(pad);
      this.drawPad(i, false);
      const m = this.add.image(x, 480, this.tex(dollTexture(this, RUNWAY_LOOKS[i], 'front', 0))).setOrigin(0.5, 0.96).setScale(2.9 / ART_SCALE);
      m.setInteractive({ useHandCursor: true, pixelPerfect: false });
      m.on('pointerdown', () => this.pick(i));
      this.models.push(m);
      void x;
    }
  }

  protected drawPad(i: number, lit: boolean) {
    const x = 200 + i * 200;
    const g = this.pads[i];
    g.clear();
    if (lit) {
      g.fillStyle(0xfff7c4, 0.55);
      g.fillTriangle(x - 20, 140, x + 20, 140, x + 95, 490);
      g.fillTriangle(x - 20, 140, x - 95, 490, x + 95, 490);
    }
    g.fillStyle(PAD_COLORS[i], 1);
    g.fillEllipse(x, 488, 150, 44);
    g.lineStyle(4, 0xffffff, 1);
    g.strokeEllipse(x, 488, 150, 44);
  }

  protected updateScore() {
    this.setScore(`Rodada: ${this.seq.length}   Vidas: ${'♥'.repeat(this.lives)}`);
  }

  protected flash(i: number, dur = 420) {
    this.drawPad(i, true);
    note(NOTES[i], 0.3);
    const m = this.models[i];
    this.tweens.add({ targets: m, y: 460, yoyo: true, duration: dur / 2, ease: 'Quad.easeOut' });
    this.time.delayedCall(dur, () => this.drawPad(i, false));
  }

  protected nextRound() {
    if (this.ended) return;
    if (this.seq.length >= this.maxLen) {
      this.done();
      return;
    }
    this.seq.push(Math.floor(Math.random() * 4));
    this.pos = 0;
    this.busy = true;
    this.updateScore();
    this.info.setText('Olhe com atenção…');
    const step = Math.max(380, 650 - this.seq.length * 35);
    this.seq.forEach((v, k) => this.time.delayedCall(400 + k * step, () => this.flash(v, step * 0.75)));
    this.time.delayedCall(400 + this.seq.length * step + 100, () => {
      this.busy = false;
      this.info.setText('Sua vez! Toque nas modelos na mesma ordem.');
    });
  }

  protected pick(i: number) {
    if (this.busy || this.ended) return;
    this.flash(i, 300);
    if (i === this.seq[this.pos]) {
      this.pos++;
      if (this.pos >= this.seq.length) {
        this.best = this.seq.length;
        this.busy = true;
        sfx('good');
        this.floatText(500, 220, 'Arrasou!', '#5fae6b', 40);
        this.time.delayedCall(900, () => this.nextRound());
      }
    } else {
      this.lives--;
      sfx('error');
      this.busy = true;
      this.cameras.main.shake(200, 0.004);
      this.updateScore();
      if (this.lives <= 0) {
        this.info.setText('Fim do desfile!');
        this.time.delayedCall(700, () => this.done());
      } else {
        this.info.setText('Ops! Vamos ver de novo…');
        this.seq.pop();
        this.time.delayedCall(1100, () => this.nextRound());
      }
    }
  }

  protected done() {
    if (this.onDone) return this.onDone(this.best);
    const st = this.best >= 6 ? 3 : this.best >= 4 ? 2 : 1;
    this.finish(st, `Sequência de ${this.best} looks`);
  }
}
