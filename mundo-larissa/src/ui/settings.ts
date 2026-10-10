import { sfx } from '../core/audio';
import { bus } from '../core/events';
import { changed, resetGame, S } from '../core/state';
import { confirmBox, h, openModal } from './dom';
import { icon } from './icons';

/** Ajustes: som, tela cheia e "Recomeçar jogo" (com confirmação). */
export function openSettings() {
  const content = h('div', { class: 'col' },
    h('button', {
      class: 'btn', onclick: () => {
        S.muted = !S.muted;
        changed('muted');
        sfx('click');
        close();
        openSettings();
      },
    }, icon(S.muted ? 'mute' : 'sound'), S.muted ? 'Ligar o som' : 'Desligar o som'),
    document.fullscreenEnabled
      ? h('button', {
          class: 'btn', onclick: () => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen().catch(() => {});
          },
        }, 'Tela cheia')
      : null,
    h('button', {
      class: 'btn danger', onclick: () => {
        confirmBox('Tem certeza? Todas as moedas, roupas, casas e missões serão apagadas.', 'Sim, apagar', 'Não', () => {
          confirmBox('Última chance! Quer mesmo começar tudo de novo?', 'Recomeçar', 'Cancelar', () => {
            resetGame();
            location.reload();
          }, true);
        }, true);
      },
    }, 'Recomeçar jogo'),
    h('p', { class: 'note', style: { fontSize: '14px', textAlign: 'center', color: '#7a6690' } },
      'O Mundo da Larissa funciona sem internet. O progresso fica salvo só neste aparelho. Sem anúncios, sem compras de verdade e sem coleta de dados.'),
  );
  const close = openModal(content, { title: 'Ajustes', className: 'small' });
  void bus;
}
