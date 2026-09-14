import { getItemInfo } from '../world/itemRegistry.js';

export class HUD {
  constructor(inventory) {
    this.inventory = inventory;
    this.hudEl = document.getElementById('hud');
    this.statusEl = document.getElementById('status');
    this.slotEls = [];
    this.buildHotbar();
  }

  buildHotbar() {
    this.hudEl.innerHTML = '';
    this.inventory.slots.forEach((_, i) => {
      const el = document.createElement('div');
      el.className = 'hotbar-slot';
      el.innerHTML = `<div class="swatch"></div><span class="count"></span>`;
      this.hudEl.appendChild(el);
      this.slotEls.push(el);
    });
  }

  render() {
    this.inventory.slots.forEach((slot, i) => {
      const el = this.slotEls[i];
      const swatch = el.querySelector('.swatch');
      const count = el.querySelector('.count');
      el.classList.toggle('active', i === this.inventory.activeIndex);
      if (slot.type != null && slot.count > 0) {
        const info = getItemInfo(slot.type);
        swatch.style.background = `#${info.color.toString(16).padStart(6, '0')}`;
        swatch.title = info.name;
        el.title = info.name;
        count.textContent = slot.count > 1 ? slot.count : '';
      } else {
        swatch.style.background = 'transparent';
        el.title = '';
        count.textContent = '';
      }
    });
  }

  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }
}
