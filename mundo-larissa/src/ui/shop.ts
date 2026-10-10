import { equip } from '../character/outfit';
import { sfx } from '../core/audio';
import { canAfford, spend } from '../core/economy';
import { bus } from '../core/events';
import { bumpStat, changed, S } from '../core/state';
import { CAT_INFO, CLOTHES, GROUPS, type ClothCat, type ClothingItem } from '../data/clothes';
import { status } from '../missions/missions';
import { confetti } from './celebrate';
import { h, openModal, toast } from './dom';
import { icon } from './icons';
import { itemThumb } from './thumbs';
import { DollPreview, turnButtons } from './wardrobe';

/** Abas extras da loja (móveis, casas, pisos…) registradas por outros módulos. */
export interface ShopTab {
  id: string;
  name: string;
  icon: string;
  render: (host: HTMLElement, closeShop: () => void) => void;
}
const extraTabs: ShopTab[] = [];
export function addShopTab(t: ShopTab) {
  extraTabs.push(t);
}

export function priceTag(n: number) {
  return h('div', { class: 'price' }, icon('coin'), String(n));
}

function clothingLocked(it: ClothingItem) {
  return !!it.unlockMission && status(it.unlockMission) !== 'done';
}

export function buyClothing(it: ClothingItem, after?: () => void) {
  const owned = S.ownedClothes.includes(it.id);
  const locked = clothingLocked(it);
  const preview = new DollPreview(equip({ ...S.outfit }, it), 150, 240);
  preview.canvas.style.width = '150px';
  preview.canvas.style.height = '240px';
  const missing = it.price - S.coins;
  const content = h('div', {},
    h('div', { class: 'buybox' },
      h('div', { class: 'col', style: { alignItems: 'center' } }, preview.canvas, turnButtons(preview)),
      h('div', { class: 'info' },
        h('h3', {}, it.name),
        h('div', {}, CAT_INFO[it.cat].name),
        h('div', { class: 'bigprice' }, icon('coin'), String(it.price)),
        locked ? h('p', {}, it.unlockText ?? 'Ainda bloqueado.') : null,
        owned ? h('p', { class: 'owned' }, 'Você já tem!') : null,
        !owned && !locked && missing > 0 ? h('p', {}, `Faltam ${missing} moedas. Jogue mini games e faça missões para ganhar mais!`) : null,
        h('div', { class: 'row' },
          !owned && !locked
            ? h('button', {
                class: 'btn primary', disabled: !canAfford(it.price),
                onclick: () => {
                  if (!spend(it.price)) return;
                  S.ownedClothes.push(it.id);
                  bumpStat('clothesBought');
                  changed('buy');
                  bus.emit('purchase', 'roupa', it.id);
                  confetti(40);
                  sfx('fanfare');
                  close();
                  askWear(it);
                  after?.();
                },
              }, icon('shop'), 'Comprar')
            : null,
          owned
            ? h('button', { class: 'btn green', onclick: () => { wearNow(it); close(); } }, 'Vestir agora')
            : null,
        ),
      ),
    ),
  );
  const close = openModal(content, { title: 'Provador', onClose: () => preview.stop() });
}

function wearNow(it: ClothingItem) {
  S.outfit = equip(S.outfit, it);
  changed('outfit');
  bus.emit('outfit:changed');
  toast(`Vestindo: ${it.name}`, 'good');
}

function askWear(it: ClothingItem) {
  const content = h('div', { class: 'result' },
    h('img', { src: itemThumb(it), style: { width: '110px', height: '110px' } }),
    h('h2', {}, 'Comprado!'),
    h('p', { style: { fontSize: '19px' } }, `${it.name} já está no seu guarda-roupa.`),
    h('div', { class: 'row center' },
      h('button', { class: 'btn', onclick: () => c() }, 'Depois'),
      h('button', { class: 'btn primary', onclick: () => { wearNow(it); c(); } }, 'Vestir agora'),
    ),
  );
  const c = openModal(content, { className: 'small' });
}

/** Loja: roupas (+ abas registradas por outros módulos). */
export function openShop(tab = 'roupas', startCat?: ClothCat) {
  let current = tab;
  let group = startCat ? GROUPS.find((g) => g.cats.includes(startCat))!.id : GROUPS[0].id;
  let cat: ClothCat = startCat ?? GROUPS[0].cats[0];
  const topTabs = h('div', { class: 'tabs' });
  const body = h('div', { class: 'shop' });
  const coinsInfo = h('div', { class: 'pill' }, icon('coin'), String(S.coins));

  const renderClothes = () => {
    const tabs = h('div', { class: 'tabs' }, ...GROUPS.map((g) => h('button', {
      class: `tab ${g.id === group ? 'on' : ''}`, onclick: () => { group = g.id; cat = g.cats[0]; sfx('click'); render(); },
    }, g.name)));
    const gr = GROUPS.find((g) => g.id === group)!;
    const subs = h('div', { class: 'tabs' }, ...gr.cats.map((c) => h('button', {
      class: `tab sub ${c === cat ? 'on' : ''}`, onclick: () => { cat = c; sfx('click'); render(); },
    }, CAT_INFO[c].name)));
    const items = CLOTHES.filter((it) => it.cat === cat && (!it.exclusive || S.ownedClothes.includes(it.id)));
    const grid = h('div', { class: 'grid' }, ...items.map((it) => {
      const owned = S.ownedClothes.includes(it.id);
      const locked = clothingLocked(it);
      return h('div', { class: `card ${locked ? 'locked' : ''}`, onclick: () => { sfx('click'); buyClothing(it, render); } },
        locked ? h('span', { class: 'tag' }, icon('lock')) : owned ? h('span', { class: 'tag' }, icon('check')) : null,
        h('img', { src: itemThumb(it), alt: it.name }),
        h('div', { class: 'nm' }, it.name),
        owned ? h('div', { class: 'owned' }, 'Comprado') : it.price === 0 ? h('div', { class: 'owned' }, 'Grátis') : priceTag(it.price));
    }));
    body.replaceChildren(tabs, subs, grid);
  };

  const render = () => {
    coinsInfo.lastChild!.textContent = String(S.coins);
    const all = [{ id: 'roupas', name: 'Roupas', icon: 'wardrobe' }, ...extraTabs];
    topTabs.replaceChildren(...all.map((t) => h('button', {
      class: `tab ${t.id === current ? 'on' : ''}`, onclick: () => { current = t.id; sfx('click'); render(); },
    }, icon(t.icon), t.name)));
    if (current === 'roupas') renderClothes();
    else extraTabs.find((t) => t.id === current)?.render(body, () => close());
  };
  const off = bus.on('state:changed', () => {
    coinsInfo.lastChild!.textContent = String(S.coins);
  });
  const content = h('div', { class: 'shop' }, h('div', { class: 'shophead' }, topTabs, coinsInfo), body);
  render();
  const off2 = bus.on('shop:rerender', render);
  const close = openModal(content, { title: 'Loja', wide: true, onClose: () => { off(); off2(); } });
}
