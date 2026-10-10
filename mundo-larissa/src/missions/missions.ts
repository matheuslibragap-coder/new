import { addCoins, addXp } from '../core/economy';
import { bus } from '../core/events';
import { changed, S, stat } from '../core/state';
import { clothing } from '../data/clothes';
import { MISSION_BY_ID, MISSIONS, type MissionDef } from '../data/missions';
import { MAPS } from '../maps';

/** Motor de missões: aceitar, acompanhar o progresso e concluir. */
export type MStatus = 'locked' | 'available' | 'active' | 'done';

export function status(id: string): MStatus {
  const p = S.missions[id];
  if (p) return p.status;
  const m = MISSION_BY_ID[id];
  if (!m) return 'locked';
  if ((m.requires ?? []).some((r) => S.missions[r]?.status !== 'done')) return 'locked';
  if (!S.unlockedMaps.includes(m.map)) return 'locked';
  return 'available';
}

export function missionsOf(npcId: string): MissionDef[] {
  return MISSIONS.filter((m) => m.giver === npcId);
}

/** Próxima missão relevante de um NPC (ativa primeiro, depois disponível). */
export function currentFor(npcId: string): MissionDef | null {
  const list = missionsOf(npcId);
  return list.find((m) => status(m.id) === 'active') ?? list.find((m) => status(m.id) === 'available') ?? null;
}

/** Missão ativa de "conversar" que tem este NPC como alvo. */
export function talkTargetFor(npcId: string): MissionDef | null {
  return MISSIONS.find((m) => m.goal.type === 'talk' && m.goal.npc === npcId && status(m.id) === 'active') ?? null;
}

export function npcMarker(npcId: string): '!' | '?' | null {
  if (talkTargetFor(npcId)) return '?';
  const c = currentFor(npcId);
  if (c && status(c.id) === 'available') return '!';
  return null;
}

export function hiddenActive(mapId: string): boolean {
  return MISSIONS.some((m) => m.goal.type === 'find' && m.goal.map === mapId && status(m.id) === 'active');
}

function baseFor(m: MissionDef): number | undefined {
  switch (m.goal.type) {
    case 'buyClothes':
      return stat('clothesBought');
    case 'buyFurniture':
      return stat('furnitureBought');
    case 'placeFurniture':
      return stat('placed');
    default:
      return undefined;
  }
}

export function progress(m: MissionDef): { cur: number; total: number } {
  const g = m.goal;
  const base = S.missions[m.id]?.base ?? 0;
  switch (g.type) {
    case 'find': {
      const mp = MAPS.find((x) => x.id === g.map);
      const hid = mp?.hidden;
      const cur = hid ? hid.spots.filter((_, i) => S.found[`${hid.mission}:${i}`]).length : 0;
      return { cur, total: g.count };
    }
    case 'buyClothes':
      return { cur: Math.min(g.count, stat('clothesBought') - base), total: g.count };
    case 'buyFurniture':
      return { cur: Math.min(g.count, stat('furnitureBought') - base), total: g.count };
    case 'placeFurniture':
      return { cur: Math.min(g.count, stat('placed') - base), total: g.count };
    default:
      return { cur: 0, total: 1 };
  }
}

function satisfied(m: MissionDef): boolean {
  const g = m.goal;
  switch (g.type) {
    case 'find':
    case 'buyClothes':
    case 'buyFurniture':
    case 'placeFurniture': {
      const p = progress(m);
      return p.cur >= p.total;
    }
    case 'wear': {
      const o = S.outfit as Record<string, string | undefined>;
      return Object.values(o).some((id) => {
        const it = clothing(id);
        return !!it && (g.item ? it.id === g.item : it.cat === g.cat);
      });
    }
    case 'buyHouse':
      return S.ownedHouses.length > 1;
    case 'visit':
      return S.location.map === g.map;
    default:
      return false;
  }
}

export function accept(id: string) {
  const m = MISSION_BY_ID[id];
  if (!m || status(id) !== 'available') return;
  S.missions[id] = { status: 'active', base: baseFor(m) };
  changed('mission');
  bus.emit('mission:accepted', m);
  // algumas metas já podem estar cumpridas
  setTimeout(checkAll, 400);
}

export function complete(id: string) {
  const m = MISSION_BY_ID[id];
  if (!m || S.missions[id]?.status === 'done') return;
  S.missions[id] = { status: 'done' };
  changed('mission');
  bus.emit('mission:done', m);
  addCoins(m.reward, `missao:${id}`);
  addXp(m.main ? 80 : 50);
}

/** Verifica todas as missões ativas com metas "de estado". */
export function checkAll() {
  for (const [id, p] of Object.entries(S.missions)) {
    if (p.status !== 'active') continue;
    const m = MISSION_BY_ID[id];
    if (m && satisfied(m)) complete(id);
  }
}

export function activeMissions(): MissionDef[] {
  return MISSIONS.filter((m) => status(m.id) === 'active');
}

export function initMissions() {
  bus.on('minigame:result', (game: string, stars: number) => {
    for (const m of activeMissions()) if (m.goal.type === 'minigame' && m.goal.game === game && stars >= m.goal.stars) complete(m.id);
  });
  for (const ev of ['hidden:found', 'outfit:changed', 'purchase', 'decor:changed', 'map:entered']) bus.on(ev, () => setTimeout(checkAll, 300));
}

/** Quantas "estrelinhas da amizade" (missões principais concluídas). */
export function friendshipStars() {
  return MISSIONS.filter((m) => m.main && S.missions[m.id]?.status === 'done').length;
}
