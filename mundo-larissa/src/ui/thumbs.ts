import { DOLL_H } from '../art/doll/skeleton';
import { equip } from '../character/outfit';
import { S, type Outfit, type Slot } from '../core/state';
import type { ClothingItem } from '../data/clothes';
import { dollCanvas } from './portrait';

/** Miniaturas das roupas: a boneca vestindo só aquela peça, recortada na parte certa. */
const CROP: Partial<Record<Slot, { y: number; h: number }>> = {
  hat: { y: 2, h: 56 },
  glasses: { y: 16, h: 40 },
  hairStyle: { y: 8, h: 70 },
  hairColor: { y: 8, h: 70 },
  skin: { y: 8, h: 92 },
  shoes: { y: 74, h: 28 },
  top: { y: 44, h: 42 },
  bottom: { y: 58, h: 44 },
  full: { y: 42, h: 60 },
  necklace: { y: 42, h: 28 },
  bag: { y: 44, h: 46 },
  wings: { y: 30, h: 66 },
  costume: { y: 4, h: DOLL_H - 4 },
};

const cache = new Map<string, string>();

export function baseMannequin(): Outfit {
  return { skin: S.outfit.skin, hairStyle: S.outfit.hairStyle, hairColor: S.outfit.hairColor };
}

export function itemThumb(it: ClothingItem): string {
  const k = `${it.id}|${S.outfit.skin}|${S.outfit.hairStyle}|${S.outfit.hairColor}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let o = baseMannequin();
  if (it.slot === 'hat' || it.slot === 'glasses') o.hairStyle = S.outfit.hairStyle;
  if (it.slot === 'top') o.bottom = undefined;
  o = { ...equip(o, it) };
  if (it.slot === 'top') delete o.bottom;
  if (it.slot === 'bottom') delete o.top;
  const crop = CROP[it.slot] ?? { y: 0, h: DOLL_H };
  const cv = dollCanvas(o, 88, 88, 'front', false, crop);
  const url = cv.toDataURL();
  cache.set(k, url);
  return url;
}
