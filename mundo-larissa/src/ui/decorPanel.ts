import { artDataUrl } from '../art/registry';
import { sfx } from '../core/audio';
import { bus } from '../core/events';
import { S } from '../core/state';
import { FURN_BY_ID, FURNITURE, SURFACES } from '../data/furniture';
import { HOUSE_BY_ID } from '../data/houses';
import { decor } from '../houses/decor';
import { houseIdOf, houseState, isHouseMap } from '../houses/houses';
import { h, uiRoot } from './dom';
import { icon } from './icons';

/** Painel de baixo do modo decoração + botão "Decorar" quando a Larissa está em casa. */
export function initDecorPanel() {
  let tab: 'moveis' | 'pisos' | 'paredes' = 'moveis';
  let inHouse = false;
  const decorBtn = h('button', {
    class: 'btn primary', id: 'decorbtn',
    style: { position: 'absolute', right: '16px', bottom: '16px', display: 'none' },
    onclick: () => { sfx('click'); decor.enter(); },
  }, icon('sofa'), 'Decorar');
  const panel = h('div', { id: 'decor', style: { display: 'none' } });
  uiRoot().append(decorBtn, panel);

  const furnThumb = (id: string) => {
    const f = FURN_BY_ID[id];
    return artDataUrl(f.kind === 'wall' ? `wobj:${id}:L` : `mov:${id}`, 64, 64);
  };

  const render = () => {
    const hid = decor.houseId;
    const st = houseState(hid);
    const sel = decor.selected !== null;
    const bar = h('div', { class: 'bar' },
      h('strong', { style: { fontSize: '16px' } }, HOUSE_BY_ID[hid]?.name ?? ''),
      ...(['moveis', 'pisos', 'paredes'] as const).map((t) => h('button', {
        class: `tab ${tab === t ? 'on' : ''}`, onclick: () => { tab = t; sfx('click'); render(); },
      }, icon(t === 'moveis' ? 'sofa' : t === 'pisos' ? 'floor' : 'wallpaper'), t === 'moveis' ? 'Móveis' : t === 'pisos' ? 'Pisos' : 'Paredes')),
      h('div', { style: { flex: '1' } }),
      h('button', { class: 'btn', disabled: !sel, onclick: () => decor.rotate() }, icon('rotate'), 'Girar'),
      h('button', { class: 'btn', disabled: !sel, onclick: () => decor.store() }, icon('box'), 'Guardar'),
      h('button', { class: 'btn lilac', onclick: () => bus.emit('ui:shop', tab === 'moveis' ? 'moveis' : 'pisos') }, icon('shop'), 'Loja'),
      h('button', { class: 'btn green', onclick: () => { sfx('star'); decor.exit(); } }, icon('check'), 'Pronto'),
    );
    let strip: HTMLElement;
    if (tab === 'moveis') {
      const inv = FURNITURE.filter((f) => (S.furnitureInv[f.id] ?? 0) > 0);
      strip = h('div', { class: 'strip' },
        ...(inv.length
          ? inv.map((f) => h('div', { class: 'card', title: f.name, onclick: () => decor.placeNew(f.id) },
              h('span', { class: 'cnt' }, `${S.furnitureInv[f.id]}`),
              h('img', { src: furnThumb(f.id), alt: f.name }),
              h('div', { class: 'nm' }, f.name)))
          : [h('div', { class: 'empty' }, 'Nenhum móvel guardado. Compre móveis na Loja!')]),
      );
    } else {
      const kind = tab === 'pisos' ? 'floor' : 'wall';
      const cur = kind === 'floor' ? st.floor : st.wall;
      const list = SURFACES.filter((s) => s.kind === kind && S.ownedSurfaces.includes(s.id));
      strip = h('div', { class: 'strip' }, ...list.map((s) => h('div', {
        class: `card ${s.id === cur ? 'on' : ''}`, onclick: () => decor.setSurface(kind, s.id),
      }, h('img', { src: artDataUrl(`swatch:${kind}:${s.style}`, 64, 64) }), h('div', { class: 'nm' }, s.name))));
    }
    const hint = h('div', { class: 'hint' }, tab === 'moveis'
      ? 'Toque num móvel da lista para colocar. Arraste os móveis para mudar de lugar. Toque num móvel e depois no chão para levá-lo até lá.'
      : 'Toque para trocar. Compre mais na Loja, na aba Pisos e Paredes.');
    panel.replaceChildren(bar, strip, hint);
  };

  const update = () => {
    panel.style.display = decor.on ? 'flex' : 'none';
    decorBtn.style.display = !decor.on && inHouse ? 'inline-flex' : 'none';
    if (decor.on) render();
  };

  bus.on('map:entered', (m: { id: string }) => {
    inHouse = isHouseMap(m.id);
    update();
    if (inHouse) void houseIdOf(m.id);
  });
  bus.on('decor:mode', update);
  bus.on('decor:select', () => decor.on && render());
  bus.on('state:changed', (kind: string) => {
    if (decor.on && (kind === 'decor' || kind === 'buy' || kind === 'coins')) render();
  });
}
