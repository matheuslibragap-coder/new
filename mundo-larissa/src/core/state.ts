import { SAVE_KEY } from '../config';
import { bus } from './events';

export type Slot =
  | 'skin' | 'hairStyle' | 'hairColor'
  | 'top' | 'bottom' | 'full' | 'shoes'
  | 'hat' | 'glasses' | 'bag' | 'necklace' | 'wings' | 'costume';

/** Roupa atual: para cada camada, o id do item (ou vazio). */
export type Outfit = Partial<Record<Slot, string>> & { skin: string; hairStyle: string; hairColor: string };

export interface PlacedFurniture {
  uid: number;
  id: string;
  x: number;
  y: number;
  flip: boolean;
}

export interface HouseState {
  placed: PlacedFurniture[];
  floor: string;
  wall: string;
}

export interface MissionProgress {
  status: 'active' | 'done';
}

export interface SaveData {
  version: 1;
  coins: number;
  totalEarned: number;
  xp: number;
  ownedClothes: string[];
  outfit: Outfit;
  ownedHouses: string[];
  currentHouse: string;
  houses: Record<string, HouseState>;
  furnitureInv: Record<string, number>;
  ownedSurfaces: string[];
  nextUid: number;
  missions: Record<string, MissionProgress>;
  unlockedMaps: string[];
  visitedMaps: string[];
  plays: { date: string; counts: Record<string, number> };
  bestStars: Record<string, number>;
  daily: { lastDate: string; streak: number };
  muted: boolean;
  location: { map: string; x: number; y: number };
  lastOutdoorMap: string;
  found: Record<string, boolean>;
  flags: Record<string, boolean>;
}

export const DEFAULT_OUTFIT: Outfit = {
  skin: 'pele3',
  hairStyle: 'cab_longo',
  hairColor: 'cor_castanho',
  top: 'cam_coracao',
  bottom: 'saia_rodada_rosa',
  shoes: 'tenis_rosa',
  hat: 'laco_rosa',
};

export const STARTER_CLOTHES = [
  'pele1', 'pele2', 'pele3', 'pele4', 'pele5',
  'cab_longo', 'cor_castanho', 'cam_coracao', 'saia_rodada_rosa', 'tenis_rosa', 'laco_rosa',
];

export function defaultSave(): SaveData {
  return {
    version: 1,
    coins: 60,
    totalEarned: 0,
    xp: 0,
    ownedClothes: [...STARTER_CLOTHES],
    outfit: { ...DEFAULT_OUTFIT },
    ownedHouses: ['quartinho'],
    currentHouse: 'quartinho',
    houses: {},
    furnitureInv: {},
    ownedSurfaces: ['piso_madeira', 'parede_creme'],
    nextUid: 1,
    missions: {},
    unlockedMaps: ['praca'],
    visitedMaps: [],
    plays: { date: '', counts: {} },
    bestStars: {},
    daily: { lastDate: '', streak: 0 },
    muted: false,
    location: { map: 'praca', x: -1, y: -1 },
    lastOutdoorMap: 'praca',
    found: {},
    flags: {},
  };
}

/** Estado atual do jogo (fonte única da verdade). */
export let S: SaveData = defaultSave();

let saveTimer: number | undefined;

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as Partial<SaveData>;
    // Mescla com o padrão para tolerar saves de versões antigas.
    S = { ...defaultSave(), ...data } as SaveData;
    S.outfit = { ...DEFAULT_OUTFIT, ...(data.outfit || {}) } as Outfit;
    return true;
  } catch (e) {
    console.warn('Não foi possível ler o save, começando do zero.', e);
    S = defaultSave();
    return false;
  }
}

export function saveNow() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  } catch (e) {
    console.warn('Não foi possível salvar.', e);
  }
}

/** Marca o estado como alterado: avisa a interface e agenda o save automático. */
export function changed(kind = 'state') {
  bus.emit('state:changed', kind);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveNow, 250);
}

export function resetGame() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignora */
  }
  S = defaultSave();
  saveNow();
}

window.addEventListener('beforeunload', saveNow);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveNow();
});

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
