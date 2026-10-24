import { bus } from '../core/events';
import { changed, S, type HouseState, type PlacedFurniture } from '../core/state';
import { FURN_BY_ID, SURFACE_BY_ID, type FurnitureItem } from '../data/furniture';
import { HOUSE_BY_ID, type HouseDef } from '../data/houses';
import { getMap, setExtraMapResolver } from '../maps';
import { addObjProvider } from '../maps/objInfo';
import type { MapDef } from '../maps/types';

/** Estado das casas: móveis colocados, piso e parede de cada casa. */
export function houseState(id: string): HouseState {
  let st = S.houses[id];
  if (!st) {
    const def = HOUSE_BY_ID[id];
    st = {
      floor: def.floor,
      wall: def.wall,
      placed: def.starter.map((p) => ({ uid: S.nextUid++, id: p.id, x: p.x, y: p.y, flip: !!p.flip })),
    };
    S.houses[id] = st;
    for (const s of [def.floor, def.wall]) if (!S.ownedSurfaces.includes(s)) S.ownedSurfaces.push(s);
    changed('house');
  }
  return st;
}

export function isHouseMap(mapId: string) {
  return mapId.startsWith('casa:');
}

export function houseIdOf(mapId: string) {
  return mapId.slice(5);
}

/** Gera o mapa de uma casa a partir do estado salvo. */
function houseMap(def: HouseDef): MapDef {
  const st = houseState(def.id);
  const floorStyle = SURFACE_BY_ID[st.floor]?.style ?? 'madeira';
  const wallStyle = SURFACE_BY_ID[st.wall]?.style ?? 'parede_creme';
  const out = S.lastOutdoorMap && getMap(S.lastOutdoorMap) ? S.lastOutdoorMap : 'praca';
  return {
    id: `casa:${def.id}`,
    name: def.name,
    order: 100,
    desc: def.desc,
    indoor: true,
    size: def.size,
    color: '#f7a8c8',
    bg: def.bg,
    unlockCoins: 0,
    floor: { base: floorStyle },
    wall: wallStyle,
    wallObjects: def.windows,
    objects: st.placed.map((p) => ({ type: `mov:${p.id}`, x: p.x, y: p.y, flip: p.flip, uid: p.uid })),
    npcs: [],
    portals: [{ x: def.door[0], y: def.door[1], to: out, label: 'Sair' }],
    spawn: [def.door[0] - 1, def.door[1]],
  };
}

export function initHouses() {
  setExtraMapResolver((id) => {
    if (!isHouseMap(id)) return undefined;
    const def = HOUSE_BY_ID[houseIdOf(id)];
    return def ? houseMap(def) : undefined;
  });
  addObjProvider((type) => {
    if (!type.startsWith('mov:')) return null;
    const f = FURN_BY_ID[type.slice(4)];
    if (!f) return null;
    return {
      w: f.w,
      d: f.d,
      solid: f.kind === 'floor',
      flat: f.kind === 'rug',
      wall: f.kind === 'wall',
      artKey: f.kind === 'wall' ? `wobj:${f.id}` : `mov:${f.id}`,
    };
  });
}

// ------------------------------------------------------------------ regras de posicionamento
export function footprint(f: FurnitureItem, flip: boolean) {
  return flip ? { w: f.d, d: f.w } : { w: f.w, d: f.d };
}

/** Pode colocar o móvel `f` em (x, y)? (ignora o próprio uid ao mover) */
export function canPlace(houseId: string, f: FurnitureItem, x: number, y: number, flip: boolean, ignoreUid?: number): boolean {
  const def = HOUSE_BY_ID[houseId];
  const st = houseState(houseId);
  const [W, H] = def.size;
  if (f.kind === 'wall') {
    const side = flip ? 'R' : 'L';
    const i = side === 'L' ? y : x;
    if ((side === 'L' && x !== 0) || (side === 'R' && y !== 0)) return false;
    if (i < 0 || i >= (side === 'L' ? H : W)) return false;
    if (def.windows.some((w) => w.side === side && w.i === i)) return false;
    return !st.placed.some((p) => {
      if (p.uid === ignoreUid) return false;
      const pf = FURN_BY_ID[p.id];
      if (pf?.kind !== 'wall') return false;
      const ps = p.flip ? 'R' : 'L';
      return ps === side && (ps === 'L' ? p.y : p.x) === i;
    });
  }
  const fp = footprint(f, flip);
  if (x < 0 || y < 0 || x + fp.w > W || y + fp.d > H) return false;
  // a porta precisa ficar livre
  const [dx, dy] = def.door;
  if (dx >= x && dx < x + fp.w && dy >= y && dy < y + fp.d) return false;
  for (const p of st.placed) {
    if (p.uid === ignoreUid) continue;
    const pf = FURN_BY_ID[p.id];
    if (!pf || pf.kind === 'wall') continue;
    // tapetes só conflitam com tapetes; móveis só com móveis
    if ((pf.kind === 'rug') !== (f.kind === 'rug')) continue;
    const pp = footprint(pf, p.flip);
    const overlap = x < p.x + pp.w && x + fp.w > p.x && y < p.y + pp.d && y + fp.d > p.y;
    if (overlap) return false;
  }
  return true;
}

/** Procura um lugar livre perto do centro da casa. */
export function findSpot(houseId: string, f: FurnitureItem): { x: number; y: number; flip: boolean } | null {
  const def = HOUSE_BY_ID[houseId];
  const [W, H] = def.size;
  if (f.kind === 'wall') {
    for (let i = 0; i < Math.max(W, H); i++) {
      if (canPlace(houseId, f, 0, i, false)) return { x: 0, y: i, flip: false };
      if (canPlace(houseId, f, i, 0, true)) return { x: i, y: 0, flip: true };
    }
    return null;
  }
  const cx = Math.floor(W / 2);
  const cy = Math.floor(H / 2);
  for (let r = 0; r < Math.max(W, H); r++) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== r) continue;
        for (const flip of [false, true]) if (canPlace(houseId, f, x, y, flip)) return { x, y, flip };
      }
    }
  }
  return null;
}

export function placedOf(houseId: string, uid: number): PlacedFurniture | undefined {
  return houseState(houseId).placed.find((p) => p.uid === uid);
}

export function notifyDecor() {
  changed('decor');
  bus.emit('decor:changed');
}
