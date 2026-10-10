import type Phaser from 'phaser';
import { bus } from '../core/events';
import type { NpcDef } from '../maps/types';
import { showDialog } from './dialog';
import { toast } from './dom';
import { buildHud } from './hud';

/** Liga a interface HTML aos eventos do jogo. */
export function initUI(game: Phaser.Game) {
  buildHud();
  bus.on('npc:talk', (npc: NpcDef) => {
    const line = npc.lines[Math.floor(Math.random() * npc.lines.length)];
    showDialog(npc, line);
  });
  bus.on('minigame:open', (id: string) => toast(`Mini game: ${id}`));
  for (const ev of ['ui:wardrobe', 'ui:shop', 'ui:house', 'ui:citymap', 'ui:missions', 'ui:settings']) {
    bus.on(ev, () => toast('Em breve!'));
  }
  void game;
}
