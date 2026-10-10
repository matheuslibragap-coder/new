import { sfx } from '../core/audio';
import { bus } from '../core/events';
import type { MissionDef } from '../data/missions';
import { h, openModal, toast } from './dom';
import { icon, ICONS } from './icons';

/** Moedinhas voando até o contador. */
export function flyCoins(n: number, from?: { x: number; y: number }) {
  const target = document.querySelector('#hud .coins') as HTMLElement | null;
  if (!target) return;
  const r = target.getBoundingClientRect();
  const tx = r.left + 24;
  const ty = r.top + 24;
  const fx = from?.x ?? window.innerWidth / 2;
  const fy = from?.y ?? window.innerHeight / 2;
  const count = Math.min(12, Math.max(3, Math.round(n / 10)));
  for (let i = 0; i < count; i++) {
    const c = h('div', { class: 'flycoin', html: ICONS.coin });
    const ox = (Math.random() - 0.5) * 120;
    const oy = (Math.random() - 0.5) * 80;
    c.style.left = `${fx + ox}px`;
    c.style.top = `${fy + oy}px`;
    document.body.appendChild(c);
    setTimeout(() => {
      c.style.transform = `translate(${tx - fx - ox}px, ${ty - fy - oy}px) scale(0.6)`;
      c.style.opacity = '0.4';
    }, 40 + i * 50);
    setTimeout(() => {
      c.remove();
      if (i % 3 === 0) sfx('coin');
    }, 900 + i * 50);
  }
}

export function confetti(n = 60) {
  const cols = ['#f7a8c8', '#c7a8f0', '#9fe3c9', '#9fd3f7', '#ffe08a', '#ff8f87'];
  for (let i = 0; i < n; i++) {
    const c = h('div', { class: 'confetti' });
    c.style.left = `${Math.random() * 100}vw`;
    c.style.top = `${-20 - Math.random() * 100}px`;
    c.style.background = cols[i % cols.length];
    c.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    c.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3800);
  }
}

export function initCelebrations() {
  bus.on('coins:gained', (n: number, reason: string) => {
    if (reason.startsWith('mg:')) return; // o resultado do mini game já mostra
    flyCoins(n);
  });
  bus.on('mission:done', (m: MissionDef) => {
    sfx('fanfare');
    confetti(m.main ? 90 : 50);
    const content = h('div', { class: 'result' },
      h('div', { class: 'stars' }, icon(m.main ? 'trophy' : 'check')),
      h('h2', {}, 'Missão concluída!'),
      h('p', { style: { fontSize: '20px' } }, m.title),
      h('div', { class: 'gain' }, icon('coin'), `+${m.reward}`),
      m.main ? h('p', { class: 'note' }, 'Você ganhou uma Estrelinha da Amizade!') : null,
      h('div', { class: 'row center', style: { marginTop: '14px' } }, h('button', { class: 'btn primary', onclick: () => close() }, 'Oba!')),
    );
    const close = openModal(content, { className: 'small' });
    setTimeout(() => flyCoins(m.reward), 300);
  });
  bus.on('level:up', (lv: number, bonus: number) => {
    setTimeout(() => {
      sfx('levelup');
      confetti(40);
      toast(`Nível ${lv}! Bônus de ${bonus} moedas!`, 'good');
    }, 600);
  });
  bus.on('map:unlocked', (_id: string) => {
    /* o aviso aparece quando a missão é concluída */
  });
}
