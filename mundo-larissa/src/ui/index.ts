import type Phaser from 'phaser';
import { bus } from '../core/events';
import type { NpcDef } from '../maps/types';
import { initMissions } from '../missions/missions';
import { registerMiniGames } from '../minigames/registry';
import { initCelebrations } from './celebrate';
import { closeAllModals } from './dom';
import { buildHud } from './hud';
import { initMinigameUI } from './minigameUI';
import { openMissions } from './missionsPanel';
import { openSettings } from './settings';
import { openShop } from './shop';
import { talkTo } from './talk';
import { initDecorPanel } from './decorPanel';
import { initHomeShop } from './homeShop';
import { openHouses } from './housesPanel';
import { openCityMap } from './cityMap';
import { initFinale } from './finale';
import { checkDailyReward } from './daily';
import { showWelcome } from './welcome';
import { openWardrobe } from './wardrobe';

/** Liga a interface HTML aos eventos do jogo. */
export function initUI(game: Phaser.Game) {
  initHomeShop();
  initDecorPanel();
  registerMiniGames(game);
  initMissions();
  buildHud();
  initCelebrations();
  initMinigameUI(game);
  bus.on('npc:talk', (npc: NpcDef, mapId: string) => talkTo(npc, mapId));
  bus.on('ui:wardrobe', openWardrobe);
  bus.on('ui:shop', (tab?: string, cat?: never) => openShop(typeof tab === 'string' ? tab : 'roupas', cat));
  bus.on('ui:missions', openMissions);
  bus.on('ui:settings', openSettings);
  bus.on('ui:house', openHouses);
  bus.on('world:travel', () => closeAllModals());
  bus.on('ui:citymap', openCityMap);
  initFinale();
  setTimeout(() => showWelcome(checkDailyReward), 700);
}
