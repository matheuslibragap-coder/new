import { sfx } from '../core/audio';
import { claimDaily, DAILY_REWARD, dailyPending } from '../core/economy';
import { flyCoins, confetti } from './celebrate';
import { h, openModal } from './dom';
import { icon } from './icons';

/** Presente diário: moedas crescentes por dias seguidos (até o 7º dia). */
export function checkDailyReward() {
  const p = dailyPending();
  if (!p) return;
  const day = Math.min(p.streak, DAILY_REWARD.length);
  const row = h('div', { class: 'row center', style: { gap: '8px' } }, ...DAILY_REWARD.map((v, i) => {
    const d = i + 1;
    const past = d < day;
    const today = d === day;
    return h('div', {
      class: `card ${today ? 'on' : ''}`,
      style: { minHeight: '0', width: '70px', padding: '6px 2px', opacity: past ? '0.55' : '1', cursor: 'default' },
    }, h('div', { style: { fontSize: '12px', fontWeight: 'bold' } }, `Dia ${d}`), icon(past ? 'check' : today ? 'gift' : 'coin'), h('div', { class: 'price' }, String(v)));
  }));
  const content = h('div', { class: 'result' },
    h('h2', { style: { margin: '0 0 6px' } }, 'Presente do dia!'),
    h('p', { style: { fontSize: '18px' } }, p.streak > 1 ? `Você voltou ${p.streak} dias seguidos! Que demais!` : 'Que bom ver você! Volte amanhã para ganhar mais.'),
    row,
    h('div', { class: 'gain', style: { marginTop: '12px' } }, icon('coin'), `+${p.coins}`),
    h('div', { class: 'row center', style: { marginTop: '12px' } },
      h('button', {
        class: 'btn primary', onclick: () => {
          const n = claimDaily();
          close();
          sfx('coins');
          confetti(40);
          setTimeout(() => flyCoins(n), 150);
        },
      }, icon('gift'), 'Pegar presente'),
    ),
  );
  const close = openModal(content, { closable: false, className: 'wide-small' });
}
