import { S, type Outfit, type Slot } from '../core/state';
import { CLOTHES, clothing, type ClothingItem } from '../data/clothes';

/** Regras para vestir: vestido/macacão substitui blusa+saia, fantasia cobre tudo etc. */
export const OPTIONAL_SLOTS: Slot[] = ['hat', 'glasses', 'bag', 'necklace', 'wings', 'costume', 'shoes'];

function firstOwned(slot: Slot, fallback: string): string {
  return CLOTHES.find((c) => c.slot === slot && S.ownedClothes.includes(c.id))?.id ?? fallback;
}

export function equip(o: Outfit, it: ClothingItem): Outfit {
  const n: Outfit = { ...o };
  switch (it.slot) {
    case 'full':
      n.full = it.id;
      delete n.top;
      delete n.bottom;
      delete n.costume;
      break;
    case 'top':
    case 'bottom':
      n[it.slot] = it.id;
      delete n.full;
      delete n.costume;
      if (!n.top) n.top = firstOwned('top', 'cam_coracao');
      if (!n.bottom) n.bottom = firstOwned('bottom', 'saia_rodada_rosa');
      break;
    case 'shoes':
      n.shoes = it.id;
      delete n.costume;
      break;
    default:
      (n as Record<string, string>)[it.slot] = it.id;
  }
  return n;
}

export function unequip(o: Outfit, slot: Slot): Outfit {
  if (!OPTIONAL_SLOTS.includes(slot)) return o;
  const n: Outfit = { ...o };
  delete (n as Record<string, unknown>)[slot];
  return n;
}

export function isWorn(o: Outfit, it: ClothingItem): boolean {
  return (o as Record<string, string | undefined>)[it.slot] === it.id;
}

export function toggle(o: Outfit, it: ClothingItem): Outfit {
  if (isWorn(o, it)) return unequip(o, it.slot);
  return equip(o, it);
}

export { clothing };
