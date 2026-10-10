/** Pequenos utilitários para montar a interface em HTML. */
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, any> = {},
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export const uiRoot = () => document.getElementById('ui')!;

let modalStack: HTMLElement[] = [];

export interface ModalOpts {
  title?: string;
  wide?: boolean;
  className?: string;
  onClose?: () => void;
  closable?: boolean;
}

/** Abre uma janela (modal) por cima do jogo. Devolve a função de fechar. */
export function openModal(content: HTMLElement, opts: ModalOpts = {}): () => void {
  const close = () => {
    if (!back.isConnected) return;
    back.classList.add('closing');
    setTimeout(() => back.remove(), 160);
    modalStack = modalStack.filter((m) => m !== back);
    document.body.classList.toggle('modal-open', modalStack.length > 0);
    opts.onClose?.();
  };
  const closeBtn = opts.closable === false ? null : h('button', { class: 'btn-close', 'aria-label': 'Fechar', onclick: () => { sfxHook?.('click'); close(); } }, iconHook?.('close') ?? '×');
  const box = h('div', { class: `modal ${opts.wide ? 'wide' : ''} ${opts.className ?? ''}` },
    opts.title ? h('div', { class: 'modal-head' }, h('h2', {}, opts.title), closeBtn) : closeBtn,
    h('div', { class: 'modal-body' }, content),
  );
  const back = h('div', { class: 'modal-back' }, box);
  back.addEventListener('pointerdown', (e) => {
    if (e.target === back && opts.closable !== false) close();
  });
  uiRoot().appendChild(back);
  modalStack.push(back);
  document.body.classList.add('modal-open');
  return close;
}

export function closeAllModals() {
  for (const m of [...modalStack]) m.remove();
  modalStack = [];
  document.body.classList.remove('modal-open');
}

export function anyModalOpen() {
  return modalStack.length > 0;
}

/** Mensagem rápida que some sozinha. */
export function toast(text: string, kind: 'info' | 'good' | 'warn' = 'info') {
  let wrap = document.getElementById('toasts');
  if (!wrap) {
    wrap = h('div', { id: 'toasts' });
    uiRoot().appendChild(wrap);
  }
  const t = h('div', { class: `toast ${kind}` }, text);
  wrap.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}

/** Pergunta com Sim/Não. */
export function confirmBox(text: string, yes: string, no: string, onYes: () => void, danger = false) {
  let close = () => {};
  const content = h('div', { class: 'confirm' },
    h('p', {}, text),
    h('div', { class: 'row center' },
      h('button', { class: 'btn', onclick: () => close() }, no),
      h('button', { class: `btn ${danger ? 'danger' : 'primary'}`, onclick: () => { close(); onYes(); } }, yes),
    ),
  );
  close = openModal(content, { className: 'small' });
}

// Ganchos preenchidos por outros módulos (evita importação circular).
export let sfxHook: ((name: string) => void) | null = null;
export let iconHook: ((name: string) => Node) | null = null;
export function setHooks(sfx: (name: string) => void, icon: (name: string) => Node) {
  sfxHook = sfx;
  iconHook = icon;
}
