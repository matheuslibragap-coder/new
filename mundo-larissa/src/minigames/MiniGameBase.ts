import Phaser from 'phaser';
import { ART_SCALE, FONT } from '../config';
import { artImage, ensureTex, getArt } from '../art/registry';
import { sfx } from '../core/audio';
import { bus } from '../core/events';

export const MW = 1000;
export const MH = 680;

export interface TxtStyle {
  size?: number;
  color?: string;
  bold?: boolean;
  stroke?: string;
  align?: string;
  wrap?: number;
}

/**
 * Base de todos os mini games. Cada mini game é uma cena do Phaser que desenha numa área
 * fixa de 1000 x 680 (a câmera ajusta o zoom para caber em qualquer tela).
 * Ao terminar, chame `this.finish(estrelas)`.
 */
export abstract class MiniGameBase extends Phaser.Scene {
  abstract readonly gameId: string;
  abstract readonly title: string;
  bgColors: [number, number] = [0xfde8f3, 0xe6f3fc];
  ended = false;
  private timerEvt?: Phaser.Time.TimerEvent;
  timeText?: Phaser.GameObjects.Text;
  scoreText?: Phaser.GameObjects.Text;

  create() {
    this.ended = false;
    const cam = this.cameras.main;
    const fit = () => {
      const z = Math.min(this.scale.width / MW, this.scale.height / MH);
      cam.setZoom(z);
      cam.centerOn(MW / 2, MH / 2);
    };
    fit();
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => this.scale.off('resize', fit));
    // fundo cobrindo a tela inteira
    const g = this.add.graphics().setDepth(-1000);
    g.fillGradientStyle(this.bgColors[0], this.bgColors[0], this.bgColors[1], this.bgColors[1], 1);
    g.fillRect(-3000, -300, MW + 6000, MH + 600);
    g.fillStyle(this.bgColors[0], 1);
    g.fillRect(-3000, -3000, MW + 6000, 2700);
    g.fillStyle(this.bgColors[1], 1);
    g.fillRect(-3000, MH + 300, MW + 6000, 2700);
    // cabeçalho
    const head = this.add.graphics().setDepth(900);
    head.fillStyle(0xffffff, 0.92);
    head.fillRoundedRect(10, 8, MW - 20, 56, 22);
    this.text(30, 36, this.title, { size: 26, bold: true, color: '#e9739f' }).setOrigin(0, 0.5).setDepth(901);
    this.scoreText = this.text(MW / 2 + 120, 36, '', { size: 22, bold: true }).setOrigin(0.5).setDepth(901);
    this.timeText = this.text(MW - 190, 36, '', { size: 22, bold: true }).setOrigin(0.5).setDepth(901);
    this.button(MW - 70, 36, 100, 44, 'Sair', 0xffd3d3, () => this.quit()).setDepth(902);
    this.setup();
  }

  abstract setup(): void;

  text(x: number, y: number, s: string, st: TxtStyle = {}) {
    return this.add.text(x, y, s, {
      fontFamily: FONT,
      fontSize: `${st.size ?? 22}px`,
      color: st.color ?? '#4a3657',
      fontStyle: st.bold ? 'bold' : 'normal',
      stroke: st.stroke,
      strokeThickness: st.stroke ? 5 : 0,
      align: st.align ?? 'center',
      wordWrap: st.wrap ? { width: st.wrap } : undefined,
      resolution: 2,
    });
  }

  img(x: number, y: number, key: string, scale = 1) {
    const im = artImage(this, x, y, key);
    im.setScale(scale / ART_SCALE);
    return im;
  }

  tex(key: string) {
    ensureTex(this, key);
    return key;
  }

  artSize(key: string) {
    return getArt(key);
  }

  /** Botão arredondado grande. */
  button(x: number, y: number, w: number, h: number, label: string, color: number, cb: () => void, size = 22) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const draw = (pressed: boolean) => {
      g.clear();
      g.fillStyle(0x4a3657, 0.18);
      g.fillRoundedRect(-w / 2, -h / 2 + (pressed ? 1 : 5), w, h, Math.min(20, h / 2));
      g.fillStyle(color, 1);
      g.fillRoundedRect(-w / 2, -h / 2 + (pressed ? 4 : 0), w, h, Math.min(20, h / 2));
      g.lineStyle(3, 0xffffff, 0.9);
      g.strokeRoundedRect(-w / 2, -h / 2 + (pressed ? 4 : 0), w, h, Math.min(20, h / 2));
    };
    draw(false);
    const t = this.text(0, 0, label, { size, bold: true });
    t.setOrigin(0.5);
    c.add([g, t]);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      draw(true);
      t.y = 4;
    });
    const up = () => {
      draw(false);
      t.y = 0;
    };
    c.on('pointerout', up);
    c.on('pointerup', () => {
      up();
      if (!this.ended) cb();
    });
    return c;
  }

  /** Cronômetro regressivo mostrado no cabeçalho. */
  countdown(seconds: number, onEnd: () => void) {
    let left = seconds;
    this.timeText?.setText(`Tempo: ${left}`);
    this.timerEvt = this.time.addEvent({
      delay: 1000,
      repeat: seconds - 1,
      callback: () => {
        left--;
        this.timeText?.setText(`Tempo: ${left}`);
        if (left <= 5 && left > 0) sfx('tick');
        if (left <= 0 && !this.ended) onEnd();
      },
    });
  }

  setScore(s: string) {
    this.scoreText?.setText(s);
  }

  /** Texto que sobe e some ("+1", "Muito bem!"). */
  floatText(x: number, y: number, s: string, color = '#e9739f', size = 30) {
    const t = this.text(x, y, s, { size, bold: true, color, stroke: '#ffffff' }).setOrigin(0.5).setDepth(800);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  /** Mensagem central grande (ex.: "Rodada 2", "Prepare-se!"). */
  banner(s: string, dur = 1100) {
    const t = this.text(MW / 2, MH / 2, s, { size: 54, bold: true, color: '#e9739f', stroke: '#ffffff' }).setOrigin(0.5).setDepth(850).setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, delay: dur, duration: 300, onComplete: () => t.destroy() });
  }

  hearts(x: number, y: number, n = 3) {
    for (let i = 0; i < n; i++) {
      const im = this.img(x + (Math.random() - 0.5) * 40, y, 'ui:heart', 1.2).setDepth(700);
      this.tweens.add({ targets: im, y: y - 50 - Math.random() * 30, alpha: 0, duration: 900 + Math.random() * 300, onComplete: () => im.destroy() });
    }
  }

  /** Termina a partida com 0 a 3 estrelas. */
  finish(stars: number, detail = '') {
    if (this.ended) return;
    this.ended = true;
    this.timerEvt?.remove();
    sfx(stars >= 2 ? 'win' : 'good');
    this.banner(stars >= 3 ? 'Incrível!' : stars >= 2 ? 'Muito bem!' : 'Boa!', 900);
    this.time.delayedCall(1300, () => {
      bus.emit('minigame:finished', this.gameId, Math.max(0, Math.min(3, stars)), detail);
      this.scene.stop();
    });
  }

  quit() {
    if (this.ended) return;
    this.ended = true;
    bus.emit('minigame:quit', this.gameId);
    this.scene.stop();
  }
}
