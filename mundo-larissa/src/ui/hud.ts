import { sfx } from '../core/audio';
import { levelInfo } from '../core/economy';
import { bus } from '../core/events';
import { changed, S } from '../core/state';
import { h, uiRoot } from './dom';
import { icon, ICONS } from './icons';

/** Barra superior: moedas, nível e botões grandes. */
export function buildHud() {
  const coinsTxt = h('span', {}, String(S.coins));
  const coins = h('div', { class: 'pill coins', title: 'Moedas' }, icon('coin'), coinsTxt);
  const lvTxt = h('span', {}, '');
  const xpFill = h('div', {});
  const level = h('div', { class: 'pill level', title: 'Nível' }, h('div', { class: 'lv' }, icon('level'), lvTxt), h('div', { class: 'xpbar' }, xpFill));
  const btn = (ic: string, label: string, ev: string, cls = '') =>
    h('button', { class: `hud-btn ${cls}`, onclick: () => { sfx('click'); bus.emit(ev); } }, icon(ic), h('span', { class: 'lbl' }, label));
  const missionsBtn = btn('missions', 'Missões', 'ui:missions');
  const soundIc = icon(S.muted ? 'mute' : 'sound');
  const soundBtn = h('button', {
    class: 'hud-btn small', title: 'Som',
    onclick: () => {
      S.muted = !S.muted;
      soundIc.innerHTML = ICONS[S.muted ? 'mute' : 'sound'];
      changed('muted');
      sfx('click');
    },
  }, soundIc);
  const hud = h('div', { id: 'hud' },
    coins, level, h('div', { class: 'hud-spacer' }),
    btn('wardrobe', 'Guarda-Roupa', 'ui:wardrobe'),
    btn('shop', 'Loja', 'ui:shop'),
    btn('house', 'Minha Casa', 'ui:house'),
    btn('map', 'Mapa', 'ui:citymap'),
    missionsBtn,
    soundBtn,
    h('button', { class: 'hud-btn small', title: 'Ajustes', onclick: () => { sfx('click'); bus.emit('ui:settings'); } }, icon('gear')),
  );
  const mapname = h('div', { id: 'mapname' }, '');
  uiRoot().append(hud, mapname);

  let shown = S.coins;
  const refresh = () => {
    if (S.coins !== shown) {
      coins.classList.remove('bump');
      void coins.offsetWidth;
      coins.classList.add('bump');
      shown = S.coins;
    }
    coinsTxt.textContent = String(S.coins);
    const li = levelInfo();
    lvTxt.textContent = `Nível ${li.level}`;
    xpFill.style.width = `${Math.round(li.progress * 100)}%`;
  };
  refresh();
  bus.on('state:changed', refresh);
  bus.on('map:entered', (m: { name: string }) => {
    mapname.textContent = m.name;
    mapname.style.opacity = '1';
  });
}
