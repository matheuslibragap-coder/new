import { sfx } from '../core/audio';
import { changed, S } from '../core/state';
import { h, openModal } from './dom';
import { icon } from './icons';
import { dollCanvas } from './portrait';

/** Boas-vindas no primeiro acesso. */
export function showWelcome(then: () => void) {
  if (S.flags.welcome) return then();
  const pic = dollCanvas(S.outfit, 120, 190);
  const content = h('div', { class: 'result' },
    h('div', { class: 'levelup' }, 'Bem-vinda ao Mundo da Larissa!'),
    pic,
    h('div', { class: 'mg-intro' }, h('div', { class: 'how' },
      'Toque no chão para a Larissa andar. Toque nas pessoas para conversar. ',
      'Quem tem um balão amarelo "!" tem uma missão para você!')),
    h('p', { style: { fontSize: '17px' } }, 'Comece falando com a Vovó Lina, aqui na Praça Central.'),
    h('button', {
      class: 'btn primary', onclick: () => {
        S.flags.welcome = true;
        changed('flags');
        sfx('star');
        close();
        setTimeout(then, 300);
      },
    }, icon('play'), 'Vamos brincar!'),
  );
  const close = openModal(content, { closable: false, className: 'small' });
}
