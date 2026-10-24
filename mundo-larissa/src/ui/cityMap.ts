import { sfx } from '../core/audio';
import { bus } from '../core/events';
import { isUnlocked, unlockText } from '../core/progress';
import { S } from '../core/state';
import { HOUSE_BY_ID } from '../data/houses';
import { MAPS } from '../maps';
import { MG_BY_ID } from '../minigames/registry';
import { friendshipStars } from '../missions/missions';
import { h, openModal } from './dom';
import { icon } from './icons';

/** Posições dos 15 lugares no Mapa da Cidade (em % da área). */
const POS: [number, number][] = [
  [10, 80], [22, 64], [12, 44], [24, 26], [38, 14], [44, 36], [36, 58], [50, 74],
  [64, 62], [60, 40], [70, 20], [84, 14], [90, 36], [80, 56], [88, 80],
];

/** Mapa da Cidade: todos os lugares, bloqueados em cinza, e a casa atual. */
export function openCityMap() {
  const wrap = h('div', { class: 'citymap' });
  const pts = POS.map(([x, y]) => `${x},${y}`).join(' ');
  wrap.innerHTML = `<svg class="paths" viewBox="0 0 100 100" preserveAspectRatio="none">
    <polyline points="${pts}" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${pts}" fill="none" stroke="#f3d6b0" stroke-width="1.6" stroke-dasharray="2 1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="6" cy="20" r="5" fill="#bfe6a8" opacity="0.7"/><circle cx="56" cy="90" r="7" fill="#9fd8f5" opacity="0.6"/>
    <circle cx="96" cy="60" r="4" fill="#bfe6a8" opacity="0.7"/><circle cx="30" cy="92" r="4" fill="#bfe6a8" opacity="0.7"/>
  </svg>`;
  const here = S.location.map;
  MAPS.forEach((m, i) => {
    const [x, y] = POS[i] ?? [50, 50];
    const open = isUnlocked(m.id);
    const done = S.missions[`${m.id}_main`]?.status === 'done';
    const pin = h('button', {
      class: `pin ${open ? '' : 'locked'} ${here === m.id ? 'here' : ''}`,
      style: { left: `${x}%`, top: `${y}%` },
      onclick: () => { sfx('click'); info(m.id); },
    },
    h('div', { class: 'dot', style: { background: m.color } }, open ? (done ? icon('star') : String(m.order)) : icon('lock')),
    h('div', { class: 'lbl' }, m.name));
    wrap.appendChild(pin);
  });
  // casa atual
  const house = HOUSE_BY_ID[S.currentHouse];
  wrap.appendChild(h('button', {
    class: `pin ${here.startsWith('casa:') ? 'here' : ''}`, style: { left: '50%', top: '52%' },
    onclick: () => { sfx('click'); close(); bus.emit('world:travel', 'casa'); },
  }, h('div', { class: 'dot', style: { background: '#fff' } }, icon('house')), h('div', { class: 'lbl' }, `Minha Casa (${house?.name ?? ''})`)));

  const content = h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' } },
    h('div', { class: 'row' }, icon('trophy'), h('strong', {}, `Estrelinhas da Amizade: ${friendshipStars()} de ${MAPS.length}`),
      h('span', { style: { color: '#7a6690' } }, '— toque num lugar para ver e viajar')),
    wrap,
  );
  const close = openModal(content, { title: 'Mapa da Cidade', wide: true });

  function info(id: string) {
    const m = MAPS.find((x) => x.id === id)!;
    const open = isUnlocked(id);
    const mg = m.minigame ? MG_BY_ID[m.minigame.id] : undefined;
    const best = mg ? S.bestStars[mg.id] ?? 0 : 0;
    const c = h('div', { class: 'result' },
      h('p', { style: { fontSize: '19px' } }, m.desc),
      mg ? h('div', { class: 'row center' }, h('span', {}, `Mini game: ${mg.name}`), ...[1, 2, 3].map((k) => icon(k <= best ? 'star' : 'starEmpty'))) : null,
      open ? null : h('p', { style: { fontSize: '18px', color: '#c2577f' } }, icon('lock'), ' ', unlockText(id)),
      h('div', { class: 'row center', style: { marginTop: '10px' } },
        h('button', { class: 'btn', onclick: () => cl() }, 'Voltar'),
        open ? h('button', { class: 'btn primary', onclick: () => { cl(); close(); bus.emit('world:travel', id); } }, icon('walk'), 'Ir para lá') : null,
      ),
    );
    const cl = openModal(c, { title: m.name, className: 'small' });
  }
}
