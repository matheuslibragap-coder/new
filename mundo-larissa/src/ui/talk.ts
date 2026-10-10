import { bus } from '../core/events';
import { sfx } from '../core/audio';
import { MG_BY_ID } from '../minigames/registry';
import { accept, complete, currentFor, progress, status, talkTargetFor } from '../missions/missions';
import type { NpcDef } from '../maps/types';
import { showDialog, type DialogButton } from './dialog';

/** O que acontece quando a Larissa conversa com alguém. */
export function talkTo(npc: NpcDef, mapId: string) {
  // 1) é o alvo de uma missão "converse com…"?
  const target = talkTargetFor(npc.id);
  if (target) {
    showDialog(npc, target.done, [{ label: 'Oba!', kind: 'primary', onClick: () => complete(target.id) }]);
    return;
  }
  const shopBtn: DialogButton[] = npc.shop
    ? [{ label: npc.shop === 'roupas' ? 'Ver roupas' : npc.shop === 'moveis' ? 'Ver móveis' : 'Ver casas', kind: 'lilac', icon: 'shop', onClick: () => bus.emit('ui:shop', npc.shop) }]
    : [];
  const m = currentFor(npc.id);
  if (!m) {
    const line = npc.lines[Math.floor(Math.random() * npc.lines.length)];
    showDialog(npc, line, [...shopBtn, { label: 'Tchau!', kind: 'primary' }]);
    return;
  }
  const st = status(m.id);
  if (st === 'available') {
    showDialog(npc, m.intro, [
      { label: 'Agora não' },
      { label: 'Vamos lá!', kind: 'primary', onClick: () => { sfx('star'); accept(m.id); } },
    ], m.goalText);
    return;
  }
  // ativa
  const btns: DialogButton[] = [...shopBtn];
  if (m.goal.type === 'minigame' && MG_BY_ID[m.goal.game]) {
    const g = m.goal.game;
    btns.push({ label: 'Jogar agora', kind: 'green', icon: 'play', onClick: () => bus.emit('minigame:open', g) });
  }
  btns.push({ label: 'Tá bom!', kind: 'primary' });
  const p = progress(m);
  const extra = p.total > 1 ? ` (${p.cur}/${p.total})` : '';
  showDialog(npc, `Você consegue, Larissa! ${m.goalText}${extra}`, btns, m.title);
  void mapId;
}
