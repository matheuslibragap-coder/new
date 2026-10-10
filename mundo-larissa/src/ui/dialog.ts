import { bus } from '../core/events';
import { sfx } from '../core/audio';
import type { NpcDef } from '../maps/types';
import { npcOutfit } from '../scenes/WorldScene';
import { h, openModal } from './dom';
import { icon } from './icons';
import { artCanvas, dollCanvas } from './portrait';

export interface DialogButton {
  label: string;
  kind?: 'primary' | 'green' | 'lilac';
  icon?: string;
  onClick?: () => void;
}

/** Janela de conversa com um personagem. */
export function showDialog(npc: NpcDef | { name: string; look?: NpcDef['look']; animal?: string }, text: string, buttons: DialogButton[] = [], goal?: string) {
  sfx('pop');
  let close = () => {};
  const portrait = npc.animal
    ? artCanvas(`obj:${npc.animal}`, 110, 150)
    : dollCanvas(npcOutfit(npc.look), 110, 150, 'front', false, { y: 14, h: 70 });
  portrait.className = 'portrait';
  const btns = buttons.length ? buttons : [{ label: 'Tchau!', kind: 'primary' as const }];
  const content = h('div', { class: 'dialog' },
    portrait,
    h('div', { class: 'talk' },
      h('div', { class: 'who' }, npc.name),
      h('div', { class: 'say' }, text),
      goal ? h('div', { class: 'goal' }, icon('missions'), goal) : null,
      h('div', { class: 'actions' },
        ...btns.map((b) => h('button', {
          class: `btn ${b.kind ?? ''}`,
          onclick: () => {
            sfx('click');
            close();
            b.onClick?.();
          },
        }, b.icon ? icon(b.icon) : null, b.label)),
      ),
    ),
  );
  close = openModal(content, {});
  return close;
}

export { bus };
