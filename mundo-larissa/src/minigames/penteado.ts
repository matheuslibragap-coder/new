import Phaser from 'phaser';
import { ART_SCALE } from '../config';
import { dollTexture } from '../character/Character';
import { sfx } from '../core/audio';
import type { Outfit } from '../core/state';
import { MiniGameBase } from './MiniGameBase';

/** Mini game 3 — Penteado da Cliente: reproduza o penteado, a cor e o enfeite que a cliente pediu. */
const STYLES = ['cab_chiquinhas', 'cab_coque', 'cab_trancas', 'cab_chanel', 'cab_rabo', 'cab_cacheado', 'cab_coques', 'cab_longo'];
const COLORS = ['cor_loiro', 'cor_ruivo', 'cor_rosa', 'cor_lilas', 'cor_azul', 'cor_preto', 'cor_menta'];
const ACCS = ['laco_rosa', 'tiara_perola', 'coroa_flores', 'laco_azul', 'tiara_flores_rosa', 'bone_amarelo'];
const SKINS = ['pele1', 'pele2', 'pele3', 'pele4', 'pele5'];
const DRESSES = ['vest_rodado_azul', 'vest_babado_lilas', 'vest_rodado_rosa', 'vest_babado_menta'];

function pick<T>(arr: T[], n: number): T[] {
  return Phaser.Utils.Array.Shuffle(arr.slice()).slice(0, n);
}

export class PenteadoGame extends MiniGameBase {
  readonly gameId = 'penteado';
  readonly title = 'Penteado da Cliente';
  bgColors: [number, number] = [0xf3e7ff, 0xfde8f3];
  private client = 0;
  private total = 3;
  private matches = 0;
  private target!: Outfit;
  private choice: { style?: string; color?: string; acc?: string } = {};
  private opts: { style: string[]; color: string[]; acc: string[] } = { style: [], color: [], acc: [] };
  private wish!: Phaser.GameObjects.Image;
  private chair!: Phaser.GameObjects.Image;
  private rows: Phaser.GameObjects.Container[] = [];
  private base!: Outfit;

  constructor() {
    super('mg_penteado');
  }

  setup() {
    this.client = 0;
    this.matches = 0;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.8);
    g.fillRoundedRect(30, 90, 300, 420, 30);
    g.fillRoundedRect(350, 90, 260, 420, 30);
    g.fillStyle(0xfde3ef, 1);
    g.fillEllipse(480, 470, 200, 50);
    this.text(180, 118, 'A cliente quer:', { size: 22, bold: true, color: '#e9739f' }).setOrigin(0.5);
    this.text(480, 118, 'Seu trabalho:', { size: 22, bold: true, color: '#9b7fd4' }).setOrigin(0.5);
    this.wish = this.add.image(180, 490, '__DEFAULT').setOrigin(0.5, 0.96).setScale(3.4 / ART_SCALE);
    this.chair = this.add.image(480, 490, '__DEFAULT').setOrigin(0.5, 0.96).setScale(3.4 / ART_SCALE);
    this.button(480, 600, 240, 70, 'Pronto!', 0xffb9d6, () => this.check(), 30);
    this.countdown(75, () => this.end());
    this.nextClient();
  }

  private nextClient() {
    if (this.client >= this.total) return this.end();
    this.client++;
    this.setScore(`Cliente ${this.client}/${this.total}   Acertos: ${this.matches}`);
    this.opts = { style: pick(STYLES, 4), color: pick(COLORS, 4), acc: pick(ACCS, 4) };
    this.base = { skin: Phaser.Utils.Array.GetRandom(SKINS), hairStyle: 'cab_curtinho', hairColor: 'cor_castanho', full: Phaser.Utils.Array.GetRandom(DRESSES), shoes: 'sapatilha_rosa' };
    this.target = {
      ...this.base,
      hairStyle: Phaser.Utils.Array.GetRandom(this.opts.style),
      hairColor: Phaser.Utils.Array.GetRandom(this.opts.color),
      hat: Phaser.Utils.Array.GetRandom(this.opts.acc),
    };
    this.choice = {};
    this.wish.setTexture(this.tex(dollTexture(this, this.target, 'front', 0)));
    this.refreshChair();
    this.buildRows();
  }

  private current(): Outfit {
    return { ...this.base, hairStyle: this.choice.style ?? 'cab_curtinho', hairColor: this.choice.color ?? 'cor_castanho', hat: this.choice.acc };
  }

  private refreshChair() {
    this.chair.setTexture(this.tex(dollTexture(this, this.current(), 'front', 0)));
  }

  private buildRows() {
    this.rows.forEach((r) => r.destroy());
    this.rows = [];
    const defs: [keyof typeof this.opts, string][] = [['style', 'Penteado'], ['color', 'Cor'], ['acc', 'Enfeite']];
    defs.forEach(([kind, label], r) => {
      const y = 140 + r * 140;
      const c = this.add.container(0, 0);
      c.add(this.text(805, y - 30, label, { size: 20, bold: true }).setOrigin(0.5));
      this.opts[kind].forEach((id, i) => {
        const x = 670 + i * 90;
        const on = this.choice[kind] === id;
        const bg = this.add.graphics();
        bg.fillStyle(on ? 0xf7a8c8 : 0xffffff, 1);
        bg.fillRoundedRect(x - 40, y - 10, 80, 96, 16);
        bg.lineStyle(3, on ? 0xe9739f : 0xe8dff0, 1);
        bg.strokeRoundedRect(x - 40, y - 10, 80, 96, 16);
        const o: Outfit = { ...this.base, hairStyle: kind === 'style' ? id : 'cab_curtinho', hairColor: kind === 'color' ? id : kind === 'style' ? 'cor_castanho' : 'cor_preto', hat: kind === 'acc' ? id : undefined };
        if (kind === 'style') o.hairColor = 'cor_caramelo';
        const head = this.add.image(x, y + 82, this.tex(dollTexture(this, o, 'front', 0))).setOrigin(0.5, 0.75).setScale(1.4 / ART_SCALE);
        head.setCrop(0, 0, 128, 130);
        const zone = this.add.zone(x, y + 38, 80, 96).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          if (this.ended) return;
          this.choice[kind] = id;
          sfx('pop');
          this.refreshChair();
          this.buildRows();
        });
        c.add([bg, head, zone]);
      });
      this.rows.push(c);
    });
  }

  private check() {
    if (!this.choice.style || !this.choice.color || !this.choice.acc) {
      sfx('error');
      this.floatText(480, 300, 'Escolha os 3!', '#f2727a');
      return;
    }
    let m = 0;
    if (this.choice.style === this.target.hairStyle) m++;
    if (this.choice.color === this.target.hairColor) m++;
    if (this.choice.acc === this.target.hat) m++;
    this.matches += m;
    if (m === 3) {
      sfx('win');
      this.hearts(480, 250, 5);
      this.floatText(480, 230, 'Perfeito! Ela amou!', '#5fae6b', 34);
    } else {
      sfx(m >= 2 ? 'good' : 'error');
      this.floatText(480, 230, m === 2 ? 'Quase igual!' : 'Hmm, diferente…', m === 2 ? '#e9a03a' : '#f2727a', 30);
    }
    this.time.delayedCall(1200, () => this.nextClient());
  }

  private end() {
    if (this.ended) return;
    const max = this.total * 3;
    const st = this.matches >= max - 1 ? 3 : this.matches >= 5 ? 2 : 1;
    this.finish(st, `${this.matches} de ${max} acertos`);
  }
}
