import { equip } from '../character/outfit';
import { sfx } from '../core/audio';
import { bus } from '../core/events';
import { changed, S } from '../core/state';
import { CLOTHES_BY_ID } from '../data/clothes';
import { confetti } from './celebrate';
import { closeAllModals, h, openModal } from './dom';
import { icon } from './icons';
import { dollCanvas } from './portrait';

/** Prêmio do Grande Baile: Coroa de Estrela + Fantasia Estrela Brilhante. */
export function initFinale() {
  bus.on('minigame:result', (game: string, stars: number) => {
    if (game !== 'baile' || stars < 1) return;
    if (S.ownedClothes.includes('coroa_estrela') && S.ownedClothes.includes('fant_estrela')) return;
    for (const id of ['coroa_estrela', 'fant_estrela']) if (!S.ownedClothes.includes(id)) S.ownedClothes.push(id);
    S.flags.estrelaDoBaile = true;
    changed('finale');
    setTimeout(() => showPrize(), 1800);
  });
}

function showPrize() {
  closeAllModals();
  sfx('fanfare');
  confetti(140);
  const look = equip(equip({ ...S.outfit }, CLOTHES_BY_ID.fant_estrela), CLOTHES_BY_ID.coroa_estrela);
  const pic = dollCanvas(look, 160, 240);
  const content = h('div', { class: 'result' },
    h('div', { class: 'levelup' }, 'Larissa é a Estrela do Baile!'),
    pic,
    h('p', { style: { fontSize: '19px' } }, 'Você ganhou a Coroa de Estrela e a Fantasia Estrela Brilhante! Elas já estão no seu guarda-roupa.'),
    h('p', { class: 'note' }, 'Continue jogando: ainda tem roupas, móveis e casas para colecionar!'),
    h('div', { class: 'row center' },
      h('button', { class: 'btn', onclick: () => close() }, 'Depois'),
      h('button', {
        class: 'btn primary', onclick: () => {
          S.outfit = look;
          changed('outfit');
          bus.emit('outfit:changed');
          close();
        },
      }, icon('heart'), 'Vestir agora!'),
    ),
  );
  const close = openModal(content, { className: 'small' });
}
