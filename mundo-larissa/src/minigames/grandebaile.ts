import Phaser from 'phaser';
import { ART_SCALE } from '../config';
import { dollTexture } from '../character/Character';
import { sfx } from '../core/audio';
import { S } from '../core/state';
import { DesfileGame } from './desfile';
import { RhythmTrack } from './rhythm';

/**
 * Mini game 15 — O Grande Baile (desafio final):
 *  1) Desfile (memória), 2) Dança (ritmo), 3) Pergunta sobre os lugares visitados.
 */
const QUIZ: { q: string; ok: string; wrong: string[] }[] = [
  { q: 'Onde a Larissa alimentou os passarinhos?', ok: 'Praça Central', wrong: ['Pista de Gelo', 'Biblioteca Encantada'] },
  { q: 'Onde a Larissa montou bolos deliciosos?', ok: 'Confeitaria Doce Nuvem', wrong: ['Fazendinha Feliz', 'Ateliê de Arte'] },
  { q: 'Onde mora a gatinha Bolinha?', ok: 'Clínica dos Bichinhos', wrong: ['Praia Coral', 'Shopping Estrela'] },
  { q: 'Onde a Larissa caçou conchinhas?', ok: 'Praia Coral', wrong: ['Parque das Flores', 'Castelo das Estrelas'] },
  { q: 'Onde ficam os livros encantados?', ok: 'Biblioteca Encantada', wrong: ['Salão de Beleza', 'Parque de Diversões'] },
  { q: 'Onde a Larissa colheu frutas na cesta?', ok: 'Fazendinha Feliz', wrong: ['Escola de Dança', 'Pista de Gelo'] },
  { q: 'Onde tem a barraca das argolas?', ok: 'Parque de Diversões', wrong: ['Floresta dos Cristais', 'Praça Central'] },
  { q: 'Onde a Larissa patinou?', ok: 'Pista de Gelo', wrong: ['Praia Coral', 'Confeitaria Doce Nuvem'] },
  { q: 'Onde a Larissa pintou quadros?', ok: 'Ateliê de Arte', wrong: ['Clínica dos Bichinhos', 'Shopping Estrela'] },
  { q: 'Onde brilham os cristais mágicos?', ok: 'Floresta dos Cristais', wrong: ['Fazendinha Feliz', 'Biblioteca Encantada'] },
  { q: 'Onde a Larissa fez penteados?', ok: 'Salão de Beleza', wrong: ['Parque das Flores', 'Escola de Dança'] },
  { q: 'Onde as flores do Jardim Mágico crescem?', ok: 'Parque das Flores', wrong: ['Pista de Gelo', 'Ateliê de Arte'] },
];

export class GrandeBaileGame extends DesfileGame {
  readonly gameId = 'baile';
  readonly title = 'O Grande Baile';
  bgColors: [number, number] = [0xd9d0f6, 0xfde8f3];
  private memScore = 0;
  private danceAcc = 0;
  private quizOk = 0;
  private track?: RhythmTrack;
  private stage: 'desfile' | 'danca' | 'quiz' = 'desfile';

  constructor() {
    super('mg_baile');
    this.maxLen = 4;
  }

  setup() {
    this.stage = 'desfile';
    this.memScore = 0;
    this.danceAcc = 0;
    this.quizOk = 0;
    this.track = undefined;
    this.onDone = (best) => {
      this.memScore = best / this.maxLen;
      this.time.delayedCall(600, () => this.startDance());
    };
    this.banner('1. Desfile!', 1000);
    super.setup();
  }

  protected updateScore() {
    if (this.stage === 'desfile') this.setScore(`Etapa 1 de 3: Desfile   Vidas: ${'♥'.repeat(this.lives)}`);
  }

  /** Remove os objetos da etapa anterior (mantém fundo e cabeçalho). */
  private clearStage() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    for (const o of [...this.children.list]) {
      const d = (o as unknown as { depth: number }).depth;
      if (d > -500 && d < 900) o.destroy();
    }
  }

  private startDance() {
    if (this.ended) return;
    this.clearStage();
    this.stage = 'danca';
    this.banner('2. Dança!', 1000);
    const dancer = this.add.image(150, 560, this.tex(dollTexture(this, S.outfit, 'front', 0))).setOrigin(0.5, 0.96).setScale(2.8 / ART_SCALE);
    this.track = new RhythmTrack(this, 18, 560, 104);
    this.track.onHit = (lane, good) => {
      if (!good) return;
      const poses: ['front' | 'side' | 'back', boolean][] = [['front', false], ['side', false], ['back', false], ['side', true]];
      const [d, m] = poses[lane];
      dancer.setTexture(this.tex(dollTexture(this, S.outfit, d, 1))).setFlipX(m);
    };
  }

  private startQuiz() {
    this.clearStage();
    this.track = undefined;
    this.stage = 'quiz';
    this.banner('3. Pergunta!', 1000);
    const qs = Phaser.Utils.Array.Shuffle(QUIZ.slice()).slice(0, 3);
    let i = 0;
    const ask = () => {
      this.clearStage();
      if (i >= qs.length) return this.done2();
      const q = qs[i];
      this.setScore(`Etapa 3 de 3: Pergunta ${i + 1} de 3`);
      this.text(500, 170, q.q, { size: 32, bold: true, wrap: 820 }).setOrigin(0.5);
      const opts = Phaser.Utils.Array.Shuffle([q.ok, ...q.wrong]);
      opts.forEach((o, k) => {
        this.button(500, 300 + k * 110, 600, 86, o, [0xfcd3e3, 0xd5ecfc, 0xd2f5e8][k], () => {
          if (o === q.ok) {
            this.quizOk++;
            sfx('star');
            this.floatText(500, 240, 'Certinho!', '#5fae6b', 36);
          } else {
            sfx('error');
            this.floatText(500, 240, `Era: ${q.ok}`, '#f2727a', 30);
          }
          i++;
          this.time.delayedCall(1100, ask);
        }, 26);
      });
    };
    this.time.delayedCall(1100, ask);
  }

  private done2() {
    const total = this.memScore + this.danceAcc + this.quizOk / 3;
    const st = total >= 2.4 ? 3 : total >= 1.5 ? 2 : 1;
    this.finish(st, 'Você brilhou no Grande Baile!');
  }

  update(_t: number, dtRaw: number) {
    if (this.ended || this.stage !== 'danca' || !this.track) return;
    this.track.update(Math.min(dtRaw, 100) / 1000);
    this.setScore(`Etapa 2 de 3: Dança   Acertos: ${this.track.hits}/${this.track.notes.length}`);
    if (this.track.done) {
      this.danceAcc = this.track.accuracy();
      this.track = undefined;
      this.time.delayedCall(500, () => this.startQuiz());
    }
  }
}
