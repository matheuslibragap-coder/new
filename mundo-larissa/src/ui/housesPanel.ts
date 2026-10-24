import { artDataUrl } from '../art/registry';
import { sfx } from '../core/audio';
import { bus } from '../core/events';
import { changed, S } from '../core/state';
import { HOUSES } from '../data/houses';
import { decor } from '../houses/decor';
import { h, openModal, toast } from './dom';
import { icon } from './icons';

/** Tela "Minha Casa": escolher a casa atual, viajar e decorar. */
export function openHouses() {
  const owned = HOUSES.filter((x) => S.ownedHouses.includes(x.id));
  const cards = owned.map((hd) => {
    const cur = S.currentHouse === hd.id;
    return h('div', { class: `card house-card ${cur ? 'on' : ''}`, style: { cursor: 'default' } },
      cur ? h('span', { class: 'tag' }, icon('heart')) : null,
      h('img', { src: artDataUrl(`house:${hd.id}`, 150, 120), alt: hd.name }),
      h('div', { class: 'nm' }, hd.name),
      cur ? h('div', { class: 'owned' }, 'Casa atual') : null,
      h('div', { class: 'col', style: { width: '100%' } },
        !cur ? h('button', {
          class: 'btn', style: { fontSize: '15px', minHeight: '42px', padding: '6px' },
          onclick: () => { S.currentHouse = hd.id; changed('house'); sfx('star'); toast(`Agora você mora em: ${hd.name}`, 'good'); close(); openHouses(); },
        }, 'Morar aqui') : null,
        h('button', {
          class: 'btn primary', style: { fontSize: '15px', minHeight: '42px', padding: '6px' },
          onclick: () => { close(); S.currentHouse = hd.id; changed('house'); bus.emit('world:travel', 'casa'); },
        }, icon('walk'), 'Ir para lá'),
      ),
    );
  });
  const inHouse = S.location.map.startsWith('casa:');
  const content = h('div', {},
    h('p', { style: { fontSize: '17px', marginTop: 0 } }, 'Escolha sua casa atual, visite e decore do seu jeito!'),
    h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' } }, ...cards),
    h('div', { class: 'row center', style: { marginTop: '16px' } },
      inHouse ? h('button', { class: 'btn green', onclick: () => { close(); decor.enter(); } }, icon('sofa'), 'Decorar esta casa') : null,
      h('button', { class: 'btn lilac', onclick: () => { close(); bus.emit('ui:shop', 'casas'); } }, icon('shop'), 'Comprar casas'),
      h('button', { class: 'btn lilac', onclick: () => { close(); bus.emit('ui:shop', 'moveis'); } }, icon('sofa'), 'Comprar móveis'),
    ),
  );
  const close = openModal(content, { title: 'Minha Casa', wide: true });
}
