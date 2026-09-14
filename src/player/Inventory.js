import { BlockInfo, BlockType } from '../world/blocks.js';
import { FarmItemType } from '../farming/items.js';

const HOTBAR_SIZE = 8;

export class Inventory {
  constructor() {
    this.slots = Array.from({ length: HOTBAR_SIZE }, () => ({ type: null, count: 0 }));
    this.activeIndex = 0;
    // Alguns itens iniciais para já poder construir e plantar.
    this.add(BlockType.DIRT, 16);
    this.add(BlockType.WOOD, 8);
    this.add(FarmItemType.HOE, 1);
    this.add(FarmItemType.SOY_SEED, 5);
    this.add(FarmItemType.CORN_SEED, 5);
    this.add(FarmItemType.WHEAT_SEED, 5);
    this.add(FarmItemType.VEGGIE_SEED, 5);
  }

  add(type, count = 1) {
    if (type == null || count <= 0) return;
    for (const slot of this.slots) {
      if (slot.type === type) {
        slot.count += count;
        return;
      }
    }
    for (const slot of this.slots) {
      if (slot.type === null) {
        slot.type = type;
        slot.count = count;
        return;
      }
    }
    // Inventário cheio: descarta silenciosamente (MVP).
  }

  getActive() {
    return this.slots[this.activeIndex];
  }

  consumeActive(count = 1) {
    const slot = this.getActive();
    if (!slot.type || slot.count < count) return false;
    slot.count -= count;
    if (slot.count <= 0) {
      slot.type = null;
      slot.count = 0;
    }
    return true;
  }

  setActiveIndex(i) {
    if (i >= 0 && i < this.slots.length) this.activeIndex = i;
  }

  serialize() {
    return { slots: this.slots.map((s) => ({ ...s })), activeIndex: this.activeIndex };
  }

  load(data) {
    if (!data) return;
    this.slots = data.slots ?? this.slots;
    this.activeIndex = data.activeIndex ?? 0;
  }
}

export { BlockInfo };
