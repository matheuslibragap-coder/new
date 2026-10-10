import { drawDollTo } from '../art/doll/compose';
import { DOLL_H, DOLL_W, type Dir } from '../art/doll/skeleton';
import { isWorn, toggle } from '../character/outfit';
import { sfx } from '../core/audio';
import { bus } from '../core/events';
import { changed, S, type Outfit } from '../core/state';
import { CAT_INFO, CLOTHES, GROUPS, type ClothCat } from '../data/clothes';
import { h, openModal, toast } from './dom';
import { confetti } from './celebrate';
import { icon } from './icons';
import { itemThumb } from './thumbs';

/** Animação da prévia: gira e anda. */
export class DollPreview {
  canvas: HTMLCanvasElement;
  outfit: Outfit;
  view: { dir: Dir; mirror: boolean } = { dir: 'front', mirror: false };
  walking = false;
  private t = 0;
  private raf = 0;
  constructor(o: Outfit, cssW = 200, cssH = 325) {
    this.outfit = o;
    this.canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = cssW * dpr;
    this.canvas.height = cssH * dpr;
    this.loop();
  }
  draw() {
    const ctx = this.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const s = Math.min(this.canvas.width / DOLL_W, this.canvas.height / (DOLL_H - 8));
    const frame = this.walking ? [1, 0, 2, 0][Math.floor(this.t / 8) % 4] : 0;
    // sombra
    ctx.fillStyle = 'rgba(74,54,87,0.15)';
    ctx.beginPath();
    ctx.ellipse(this.canvas.width / 2, (DOLL_H - 6) * s, 15 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    drawDollTo(ctx, this.outfit, this.view.dir, frame, (this.canvas.width - DOLL_W * s) / 2, -6 * s, s, this.view.mirror);
  }
  private loop = () => {
    if (!this.canvas.isConnected && this.t > 5) return;
    this.t++;
    if (this.walking || this.t < 3 || this.t % 30 === 0) this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };
  set(o: Outfit) {
    this.outfit = o;
    this.draw();
  }
  stop() {
    cancelAnimationFrame(this.raf);
  }
}

export function turnButtons(p: DollPreview) {
  const views: { dir: Dir; mirror: boolean; label: string }[] = [
    { dir: 'front', mirror: false, label: 'Frente' },
    { dir: 'side', mirror: false, label: 'Lado' },
    { dir: 'back', mirror: false, label: 'Costas' },
    { dir: 'side', mirror: true, label: 'Outro lado' },
  ];
  let i = 0;
  const walkBtn = h('button', {
    title: 'Andar',
    onclick: () => {
      p.walking = !p.walking;
      walkBtn.style.background = p.walking ? '#fde3ef' : '';
      p.draw();
    },
  }, icon('walk'));
  return h('div', { class: 'turn' },
    h('button', { title: 'Girar', onclick: () => { i = (i + 3) % 4; p.view = views[i]; p.draw(); sfx('click'); } }, '◀'),
    walkBtn,
    h('button', { title: 'Girar', onclick: () => { i = (i + 1) % 4; p.view = views[i]; p.draw(); sfx('click'); } }, '▶'),
  );
}

/** Tela "Meu Guarda-Roupa". */
export function openWardrobe() {
  let draft: Outfit = { ...S.outfit };
  const preview = new DollPreview(draft);
  const firstOwned = CLOTHES.find((it) => S.ownedClothes.includes(it.id) && it.slot !== 'skin')!;
  let cat: ClothCat = firstOwned.cat;
  let group = GROUPS.find((g) => g.cats.includes(cat))!.id;
  const grid = h('div', { class: 'grid' });
  const tabs = h('div', { class: 'tabs' });
  const subtabs = h('div', { class: 'tabs' });

  const renderTabs = () => {
    tabs.replaceChildren(...GROUPS.map((g) => h('button', {
      class: `tab ${g.id === group ? 'on' : ''}`,
      onclick: () => {
        group = g.id;
        cat = g.cats.find((c) => CLOTHES.some((it) => it.cat === c && S.ownedClothes.includes(it.id))) ?? g.cats[0];
        sfx('click');
        render();
      },
    }, g.name)));
    const gr = GROUPS.find((g) => g.id === group)!;
    subtabs.replaceChildren(...gr.cats.map((c) => {
      const owned = CLOTHES.filter((it) => it.cat === c && S.ownedClothes.includes(it.id)).length;
      return h('button', { class: `tab sub ${c === cat ? 'on' : ''}`, onclick: () => { cat = c; sfx('click'); render(); } }, `${CAT_INFO[c].name} (${owned})`);
    }));
  };

  const renderGrid = () => {
    const items = CLOTHES.filter((it) => it.cat === cat && S.ownedClothes.includes(it.id));
    const cards = items.map((it) => h('div', {
      class: `card ${isWorn(draft, it) ? 'on' : ''}`,
      onclick: () => {
        draft = toggle(draft, it);
        sfx('pop');
        preview.set(draft);
        renderGrid();
      },
    },
    isWorn(draft, it) ? h('span', { class: 'tag' }, icon('check')) : null,
    h('img', { src: itemThumb(it), alt: it.name }),
    h('div', { class: 'nm' }, it.name)));
    cards.push(h('div', { class: 'card', onclick: () => { close(); bus.emit('ui:shop', 'roupas', cat); } },
      h('div', { style: { height: '88px', display: 'flex', alignItems: 'center' } }, icon('shop')),
      h('div', { class: 'nm' }, 'Comprar mais na Loja')));
    grid.replaceChildren(...cards);
  };

  const render = () => {
    renderTabs();
    renderGrid();
  };

  const save = () => {
    S.outfit = { ...draft };
    changed('outfit');
    bus.emit('outfit:changed');
    sfx('star');
    confetti(30);
    toast('Look salvo! Você está linda!', 'good');
    close();
  };

  preview.canvas.style.width = '200px';
  preview.canvas.style.height = '325px';
  const content = h('div', { class: 'wardrobe' },
    h('div', { class: 'preview' },
      preview.canvas,
      turnButtons(preview),
      h('div', { class: 'col' },
        h('button', { class: 'btn primary', onclick: save }, icon('heart'), 'Salvar look'),
        h('button', { class: 'btn', onclick: () => { draft = { ...S.outfit }; preview.set(draft); renderGrid(); sfx('click'); } }, 'Desfazer'),
      ),
    ),
    h('div', { class: 'side' }, tabs, subtabs, grid),
  );
  render();
  const close = openModal(content, {
    title: 'Meu Guarda-Roupa',
    wide: true,
    onClose: () => preview.stop(),
  });
}
