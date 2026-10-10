import { MAPS, getMap, prevMap } from '../maps';
import { bus } from './events';
import { changed, S } from './state';

/**
 * PROGRESSÃO
 * Um mapa é liberado quando a missão principal do mapa anterior (id "<mapa>_main") é concluída
 * OU quando a jogadora já ganhou `unlockCoins` moedas no total.
 */
export function isUnlocked(mapId: string): boolean {
  if (mapId.startsWith('casa')) return true;
  return S.unlockedMaps.includes(mapId);
}

export function unlockText(mapId: string): string {
  const m = getMap(mapId);
  const p = prevMap(mapId);
  if (!m || !p) return '';
  return `Complete a missão principal em ${p.name} ou junte ${m.unlockCoins} moedas no total.`;
}

/** Verifica e libera mapas novos. Devolve os mapas liberados agora. */
export function checkUnlocks(): string[] {
  const fresh: string[] = [];
  for (const m of MAPS) {
    if (S.unlockedMaps.includes(m.id)) continue;
    const p = prevMap(m.id);
    const byMission = p ? S.missions[`${p.id}_main`]?.status === 'done' : true;
    const byCoins = S.totalEarned >= m.unlockCoins;
    if (byMission || byCoins) {
      S.unlockedMaps.push(m.id);
      fresh.push(m.id);
    }
  }
  if (fresh.length) {
    changed('unlock');
    for (const id of fresh) bus.emit('map:unlocked', id);
  }
  return fresh;
}
