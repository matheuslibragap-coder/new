import { MISSIONS } from '../data/missions';
import { getMap, MAPS } from '../maps';
import { friendshipStars, progress, status } from '../missions/missions';
import { h, openModal } from './dom';
import { icon } from './icons';

function npcName(id: string): string {
  for (const m of MAPS) {
    const n = m.npcs.find((x) => x.id === id);
    if (n) return n.name;
  }
  return id;
}

/** Lista de missões: em andamento, disponíveis e concluídas. */
export function openMissions() {
  const stars = friendshipStars();
  const total = MAPS.length;
  const item = (id: string) => {
    const m = MISSIONS.find((x) => x.id === id)!;
    const st = status(id);
    const p = progress(m);
    const where = getMap(m.map)?.name ?? '';
    return h('div', { class: `mitem ${st === 'done' ? 'done' : ''}` },
      icon(st === 'done' ? 'check' : m.main ? 'star' : 'missions'),
      h('div', {},
        h('div', { class: 't' }, m.title, m.main ? ' (principal)' : ''),
        h('div', { class: 'd' }, st === 'available' ? `Fale com ${npcName(m.giver)} — ${where}` : `${m.goalText}${p.total > 1 && st === 'active' ? ` (${p.cur}/${p.total})` : ''}`),
        st !== 'available' ? h('div', { class: 'd' }, where) : null,
      ),
      h('div', { class: 'rw' }, icon('coin'), String(m.reward)),
    );
  };
  const ids = (s: string) => MISSIONS.filter((m) => status(m.id) === s).map((m) => m.id);
  const active = ids('active');
  const avail = ids('available');
  const done = ids('done');
  const content = h('div', {},
    h('div', { class: 'mitem' },
      icon('trophy'),
      h('div', {},
        h('div', { class: 't' }, `Estrelinhas da Amizade: ${stars} de ${total}`),
        h('div', { class: 'd' }, 'Ajude as pessoas de cada lugar para ganhar estrelinhas e ir ao Grande Baile!'),
      ),
    ),
    h('div', { class: 'section-title' }, 'Fazendo agora'),
    h('div', { class: 'mlist' }, ...(active.length ? active.map(item) : [h('div', { class: 'd' }, 'Nenhuma missão agora. Procure quem tem um balão "!" em cima da cabeça!')])),
    avail.length ? h('div', { class: 'section-title' }, 'Esperando por você') : null,
    h('div', { class: 'mlist' }, ...avail.map(item)),
    done.length ? h('div', { class: 'section-title' }, `Concluídas (${done.length})`) : null,
    h('div', { class: 'mlist' }, ...done.map(item)),
  );
  openModal(content, { title: 'Missões' });
}
