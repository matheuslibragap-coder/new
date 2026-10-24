import { artDataUrl } from '../art/registry';
import { sfx } from '../core/audio';
import { canAfford, spend } from '../core/economy';
import { bus } from '../core/events';
import { bumpStat, changed, S } from '../core/state';
import { FURN_CATS, FURNITURE, SURFACES, type FurnCat, type FurnitureItem, type Surface } from '../data/furniture';
import { HOUSES, type HouseDef } from '../data/houses';
import { houseState } from '../houses/houses';
import { confetti } from './celebrate';
import { h, openModal, toast } from './dom';
import { icon } from './icons';
import { addShopTab, priceTag } from './shop';

/** Abas da loja: Móveis, Casas e Pisos e Paredes. */
export function furnThumb(f: FurnitureItem, size = 88) {
  return artDataUrl(f.kind === 'wall' ? `wobj:${f.id}:L` : `mov:${f.id}`, size, size);
}

function buyBox(title: string, img: string, name: string, price: number, extra: HTMLElement | null, onBuy: () => void, owned = false) {
  const missing = price - S.coins;
  const content = h('div', { class: 'buybox' },
    h('img', { src: img }),
    h('div', { class: 'info' },
      h('h3', {}, name),
      extra,
      h('div', { class: 'bigprice' }, icon('coin'), String(price)),
      owned ? h('p', {}, 'Você já tem!') : null,
      !owned && missing > 0 ? h('p', {}, `Faltam ${missing} moedas. Jogue mini games e faça missões!`) : null,
      !owned
        ? h('button', {
            class: 'btn primary', disabled: !canAfford(price),
            onclick: () => {
              if (!spend(price)) return;
              close();
              confetti(40);
              sfx('fanfare');
              onBuy();
              bus.emit('shop:rerender');
            },
          }, icon('shop'), 'Comprar')
        : null,
    ),
  );
  const close = openModal(content, { title });
}

export function buyFurniture(f: FurnitureItem) {
  const have = (S.furnitureInv[f.id] ?? 0) + Object.values(S.houses).reduce((n, st) => n + st.placed.filter((p) => p.id === f.id).length, 0);
  buyBox('Móvel', furnThumb(f, 140), f.name, f.price, h('div', {}, have ? `Você tem ${have}. Pode comprar mais!` : f.kind === 'wall' ? 'Vai na parede' : f.kind === 'rug' ? 'Tapete' : FURN_CATS.find((c) => c.id === f.cat)!.name), () => {
    S.furnitureInv[f.id] = (S.furnitureInv[f.id] ?? 0) + 1;
    bumpStat('furnitureBought');
    changed('buy');
    bus.emit('purchase', 'movel', f.id);
    toast(`${f.name} foi para o seu inventário! Em casa, toque em Decorar.`, 'good');
  });
}

export function buyHouse(hd: HouseDef) {
  const owned = S.ownedHouses.includes(hd.id);
  buyBox('Casa', artDataUrl(`house:${hd.id}`, 140, 160), hd.name, hd.price, h('p', {}, hd.desc, h('br'), `Tamanho: ${hd.size[0]} x ${hd.size[1]}`), () => {
    S.ownedHouses.push(hd.id);
    houseState(hd.id);
    bumpStat('housesBought');
    changed('buy');
    bus.emit('purchase', 'casa', hd.id);
    const content = h('div', { class: 'result' },
      h('img', { src: artDataUrl(`house:${hd.id}`, 160, 160), style: { width: '160px' } }),
      h('h2', {}, 'Casa nova!'),
      h('p', { style: { fontSize: '19px' } }, `${hd.name} agora é sua!`),
      h('div', { class: 'row center' },
        h('button', { class: 'btn', onclick: () => c() }, 'Depois'),
        h('button', {
          class: 'btn primary', onclick: () => {
            S.currentHouse = hd.id;
            changed('house');
            c();
            bus.emit('world:travel', 'casa');
          },
        }, icon('house'), 'Morar e ir para lá'),
      ),
    );
    const c = openModal(content, { className: 'small' });
  }, owned);
}

export function buySurface(sf: Surface) {
  buyBox(sf.kind === 'floor' ? 'Piso' : 'Papel de parede', artDataUrl(`swatch:${sf.kind}:${sf.style}`, 140, 140), sf.name, sf.price, null, () => {
    S.ownedSurfaces.push(sf.id);
    changed('buy');
    bus.emit('purchase', 'superficie', sf.id);
    toast('Comprado! Use no modo Decorar da sua casa.', 'good');
  }, S.ownedSurfaces.includes(sf.id));
}

export function initHomeShop() {
  let cat: FurnCat = 'camas';
  addShopTab({
    id: 'moveis', name: 'Móveis', icon: 'sofa',
    render: (host) => {
      const tabs = h('div', { class: 'tabs' }, ...FURN_CATS.map((c) => h('button', {
        class: `tab sub ${c.id === cat ? 'on' : ''}`, onclick: () => { cat = c.id; sfx('click'); bus.emit('shop:rerender'); },
      }, c.name)));
      const grid = h('div', { class: 'grid' }, ...FURNITURE.filter((f) => f.cat === cat).map((f) => {
        const n = S.furnitureInv[f.id] ?? 0;
        return h('div', { class: 'card', onclick: () => { sfx('click'); buyFurniture(f); } },
          n ? h('span', { class: 'cnt' }, `${n} guardado${n > 1 ? 's' : ''}`) : null,
          h('img', { src: furnThumb(f), alt: f.name }),
          h('div', { class: 'nm' }, f.name),
          priceTag(f.price));
      }));
      host.replaceChildren(tabs, grid);
    },
  });
  addShopTab({
    id: 'casas', name: 'Casas', icon: 'house',
    render: (host) => {
      const grid = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' } }, ...HOUSES.filter((x) => x.price > 0).map((hd) => {
        const owned = S.ownedHouses.includes(hd.id);
        return h('div', { class: 'card house-card', onclick: () => { sfx('click'); buyHouse(hd); } },
          owned ? h('span', { class: 'tag' }, icon('check')) : null,
          h('img', { src: artDataUrl(`house:${hd.id}`, 150, 120), alt: hd.name }),
          h('div', { class: 'nm' }, hd.name),
          owned ? h('div', { class: 'owned' }, 'É sua!') : priceTag(hd.price));
      }));
      host.replaceChildren(grid);
    },
  });
  addShopTab({
    id: 'pisos', name: 'Pisos e Paredes', icon: 'wallpaper',
    render: (host) => {
      const sec = (kind: 'floor' | 'wall', title: string) => [
        h('div', { class: 'section-title' }, title),
        h('div', { class: 'grid' }, ...SURFACES.filter((s) => s.kind === kind && !s.houseOnly).map((sf) => {
          const owned = S.ownedSurfaces.includes(sf.id);
          return h('div', { class: 'card', onclick: () => { sfx('click'); buySurface(sf); } },
            owned ? h('span', { class: 'tag' }, icon('check')) : null,
            h('img', { src: artDataUrl(`swatch:${kind}:${sf.style}`, 88, 88) }),
            h('div', { class: 'nm' }, sf.name),
            owned ? h('div', { class: 'owned' }, 'Comprado') : sf.price === 0 ? h('div', { class: 'owned' }, 'Grátis') : priceTag(sf.price));
        })),
      ];
      host.replaceChildren(h('div', { style: { overflow: 'auto', flex: '1' } }, ...sec('floor', 'Pisos'), ...sec('wall', 'Papéis de parede')));
    },
  });
}
