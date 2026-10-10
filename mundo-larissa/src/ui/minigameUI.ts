import type Phaser from 'phaser';
import { sfx } from '../core/audio';
import { playsToday, rewardMinigame, STAR_REWARD } from '../core/economy';
import { bus } from '../core/events';
import { S } from '../core/state';
import { FULL_REWARD_PLAYS } from '../config';
import { MG_BY_ID } from '../minigames/registry';
import { flyCoins, confetti } from './celebrate';
import { closeAllModals, h, openModal } from './dom';
import { icon } from './icons';

/** Tela de introdução, início e resultado dos mini games. */
export function initMinigameUI(game: Phaser.Game) {
  const open = (id: string) => {
    const info = MG_BY_ID[id];
    if (!info) return;
    closeAllModals();
    const plays = playsToday(id);
    const best = S.bestStars[id] ?? 0;
    const content = h('div', { class: 'mg-intro' },
      h('div', { class: 'how' }, info.how),
      h('div', { class: 'row center' },
        h('span', {}, 'Recorde: '),
        ...[1, 2, 3].map((i) => icon(i <= best ? 'star' : 'starEmpty')),
      ),
      h('p', { class: 'note', style: { fontSize: '15px' } },
        plays < FULL_REWARD_PLAYS
          ? `Prêmio: até ${STAR_REWARD[3]} moedas (partida ${plays + 1} de ${FULL_REWARD_PLAYS} com prêmio cheio hoje)`
          : 'Você já jogou bastante hoje: o prêmio fica menor, mas ainda vale moedinhas!'),
      h('div', { class: 'row center' },
        h('button', { class: 'btn', onclick: () => close() }, 'Voltar'),
        h('button', { class: 'btn primary', onclick: () => { close(); start(id); } }, icon('play'), 'Jogar!'),
      ),
    );
    const close = openModal(content, { title: info.name, className: 'small' });
  };

  const start = (id: string) => {
    const info = MG_BY_ID[id];
    sfx('magic');
    document.body.classList.add('in-minigame');
    if (game.scene.isActive('world')) game.scene.pause('world');
    game.scene.run(info.scene);
  };

  const backToWorld = () => {
    document.body.classList.remove('in-minigame');
    if (game.scene.isPaused('world')) game.scene.resume('world');
  };

  bus.on('minigame:open', open);
  bus.on('minigame:quit', backToWorld);
  bus.on('minigame:finished', (id: string, stars: number, detail: string) => {
    backToWorld();
    const r = rewardMinigame(id, stars);
    const info = MG_BY_ID[id];
    if (stars >= 3) confetti(60);
    const content = h('div', { class: 'result' },
      h('div', { class: 'stars' }, ...[1, 2, 3].map((i) => {
        const s = icon(i <= stars ? 'star' : 'starEmpty');
        s.style.animationDelay = `${i * 0.18}s`;
        return s;
      })),
      detail ? h('p', { style: { fontSize: '19px' } }, detail) : null,
      h('div', { class: 'gain' }, icon('coin'), `+${r.coins}`),
      r.best ? h('p', { class: 'note' }, 'Novo recorde!') : null,
      r.reduced ? h('p', { class: 'note' }, 'Prêmio menor: você já jogou este mini game 3 vezes hoje.') : null,
      h('div', { class: 'row center', style: { marginTop: '12px' } },
        h('button', { class: 'btn', onclick: () => { close(); } }, 'Voltar ao passeio'),
        h('button', { class: 'btn primary', onclick: () => { close(); open(id); } }, 'Jogar de novo'),
      ),
    );
    const close = openModal(content, { title: info.name, className: 'small' });
    setTimeout(() => {
      [1, 2, 3].forEach((i) => i <= stars && setTimeout(() => sfx('star'), i * 180));
      if (r.coins) flyCoins(r.coins);
    }, 200);
  });
}
