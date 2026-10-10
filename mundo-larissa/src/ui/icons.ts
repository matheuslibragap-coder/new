/** Ícones originais em SVG (desenhados por código, sem emojis nem imagens externas). */
const S = (body: string, vb = '0 0 48 48') =>
  `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;

const INK = '#4a3657';

export const ICONS: Record<string, string> = {
  coin: S(`<circle cx="24" cy="24" r="19" fill="#ffd45e" stroke="#c99a2e" stroke-width="3"/><circle cx="24" cy="24" r="12.5" fill="#ffe592" stroke="#e0b445" stroke-width="2"/><path d="M24 15 l2.6 5.6 6 .6 -4.5 4 1.3 6 -5.4-3.1 -5.4 3.1 1.3-6 -4.5-4 6-.6z" fill="#fff6c9" stroke="#d9a73a" stroke-width="1.5"/>`),
  star: S(`<path d="M24 4 l5.6 12 13 1.4 -9.7 8.8 2.8 12.9 -11.7-6.7 -11.7 6.7 2.8-12.9 -9.7-8.8 13-1.4z" fill="#ffd45e" stroke="#d9a73a" stroke-width="3"/>`),
  starEmpty: S(`<path d="M24 4 l5.6 12 13 1.4 -9.7 8.8 2.8 12.9 -11.7-6.7 -11.7 6.7 2.8-12.9 -9.7-8.8 13-1.4z" fill="#ece6f3" stroke="#c9bdd8" stroke-width="3"/>`),
  wardrobe: S(`<path d="M24 10 a4 4 0 1 1 4 4 c-2 0-4 1.5-4 4 v2" fill="none" stroke="${INK}" stroke-width="3"/><path d="M24 20 L6 33 c-2 1.5-1 4 1.5 4 h33 c2.5 0 3.5-2.5 1.5-4z" fill="#f7a8c8" stroke="${INK}" stroke-width="3"/>`),
  shop: S(`<path d="M9 16 h30 l-2.5 26 h-25z" fill="#c7a8f0" stroke="${INK}" stroke-width="3"/><path d="M17 20 v-6 a7 7 0 0 1 14 0 v6" fill="none" stroke="${INK}" stroke-width="3"/><path d="M24 26 l1.8 3.8 4.2.4-3.1 2.8 .9 4.1-3.8-2.2-3.8 2.2 .9-4.1-3.1-2.8 4.2-.4z" fill="#fff6c9"/>`),
  house: S(`<path d="M8 22 L24 8 L40 22" fill="none" stroke="${INK}" stroke-width="3"/><path d="M12 20 v20 h24 v-20" fill="#ffd8a8" stroke="${INK}" stroke-width="3"/><path d="M6 23 L24 7 L42 23" fill="none" stroke="#f2727a" stroke-width="4"/><rect x="20" y="28" width="8" height="12" rx="2" fill="#f7a8c8" stroke="${INK}" stroke-width="2.5"/>`),
  map: S(`<path d="M6 12 l11-4 14 4 11-4 v28 l-11 4 -14-4 -11 4z" fill="#bfe6a8" stroke="${INK}" stroke-width="3"/><path d="M17 8 v28 M31 12 v28" stroke="${INK}" stroke-width="2.5"/><circle cx="24" cy="21" r="4" fill="#f2727a" stroke="${INK}" stroke-width="2"/>`),
  missions: S(`<rect x="10" y="6" width="28" height="36" rx="5" fill="#fff3dc" stroke="${INK}" stroke-width="3"/><path d="M16 16 l3 3 5-6 M16 27 l3 3 5-6" fill="none" stroke="#5fae6b" stroke-width="3"/><path d="M28 17 h5 M28 28 h5" stroke="${INK}" stroke-width="3"/>`),
  sound: S(`<path d="M8 19 h7 l10-8 v26 l-10-8 h-7z" fill="#9fd3f7" stroke="${INK}" stroke-width="3"/><path d="M31 18 c3 3 3 9 0 12 M35 14 c5 5 5 15 0 20" fill="none" stroke="${INK}" stroke-width="3"/>`),
  mute: S(`<path d="M8 19 h7 l10-8 v26 l-10-8 h-7z" fill="#d9d2e3" stroke="${INK}" stroke-width="3"/><path d="M31 19 l10 10 M41 19 l-10 10" stroke="#f2727a" stroke-width="3.5"/>`),
  gear: S(`<circle cx="24" cy="24" r="14" fill="#c7a8f0" stroke="${INK}" stroke-width="3" stroke-dasharray="6 3"/><circle cx="24" cy="24" r="6" fill="#fff" stroke="${INK}" stroke-width="3"/>`),
  close: S(`<path d="M14 14 L34 34 M34 14 L14 34" stroke="${INK}" stroke-width="5"/>`),
  lock: S(`<rect x="11" y="21" width="26" height="20" rx="5" fill="#d9d2e3" stroke="${INK}" stroke-width="3"/><path d="M17 21 v-5 a7 7 0 0 1 14 0 v5" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="24" cy="31" r="3" fill="${INK}"/>`),
  check: S(`<circle cx="24" cy="24" r="18" fill="#9fe3c9" stroke="${INK}" stroke-width="3"/><path d="M15 24 l6 6 12-13" fill="none" stroke="${INK}" stroke-width="4"/>`),
  rotate: S(`<path d="M36 22 a13 13 0 1 1 -4-9" fill="none" stroke="${INK}" stroke-width="4"/><path d="M33 5 v9 h-9" fill="none" stroke="${INK}" stroke-width="4"/>`),
  box: S(`<path d="M8 16 l16-8 16 8 v18 l-16 8 -16-8z" fill="#e3b98c" stroke="${INK}" stroke-width="3"/><path d="M8 16 l16 8 16-8 M24 24 v18" fill="none" stroke="${INK}" stroke-width="3"/>`),
  play: S(`<circle cx="24" cy="24" r="19" fill="#f7a8c8" stroke="${INK}" stroke-width="3"/><path d="M19 15 l14 9 -14 9z" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`),
  back: S(`<path d="M30 10 L16 24 L30 38" fill="none" stroke="${INK}" stroke-width="5"/>`),
  heart: S(`<path d="M24 40 C6 28 8 12 17 11 c4 0 6 3 7 5 c1-2 3-5 7-5 c9 1 11 17 -7 29z" fill="#f7a8c8" stroke="${INK}" stroke-width="3"/>`),
  gift: S(`<rect x="8" y="20" width="32" height="20" rx="3" fill="#c7a8f0" stroke="${INK}" stroke-width="3"/><rect x="6" y="14" width="36" height="8" rx="3" fill="#f7a8c8" stroke="${INK}" stroke-width="3"/><path d="M24 14 v26" stroke="#ffd45e" stroke-width="4"/><path d="M24 14 c-6-9-14-4-8 0 M24 14 c6-9 14-4 8 0" fill="none" stroke="${INK}" stroke-width="3"/>`),
  trophy: S(`<path d="M15 8 h18 v10 a9 9 0 0 1 -18 0z" fill="#ffd45e" stroke="${INK}" stroke-width="3"/><path d="M15 12 h-6 c0 6 3 9 7 9 M33 12 h6 c0 6 -3 9 -7 9" fill="none" stroke="${INK}" stroke-width="3"/><path d="M24 27 v7 M16 40 h16 l-2-6 h-12z" fill="#ffd45e" stroke="${INK}" stroke-width="3"/>`),
  paint: S(`<path d="M24 6 c-10 0-18 7-18 17 s8 19 16 17 c4-1 1-6 4-8 s9 2 12-3 c3-6 -2-23 -14-23z" fill="#fff3dc" stroke="${INK}" stroke-width="3"/><circle cx="15" cy="20" r="3" fill="#f2727a"/><circle cx="23" cy="14" r="3" fill="#ffd45e"/><circle cx="32" cy="18" r="3" fill="#7aa7e8"/><circle cx="16" cy="30" r="3" fill="#8fd18a"/>`),
  floor: S(`<path d="M24 10 l18 9 -18 9 -18-9z" fill="#e8c39c" stroke="${INK}" stroke-width="3"/><path d="M6 19 v6 l18 9 18-9 v-6" fill="none" stroke="${INK}" stroke-width="3"/>`),
  wallpaper: S(`<rect x="8" y="6" width="32" height="36" rx="4" fill="#fde0ec" stroke="${INK}" stroke-width="3"/><path d="M16 6 v36 M24 6 v36 M32 6 v36" stroke="#f8c4da" stroke-width="3"/>`),
  sofa: S(`<rect x="8" y="16" width="32" height="14" rx="5" fill="#c7a8f0" stroke="${INK}" stroke-width="3"/><rect x="5" y="22" width="38" height="12" rx="5" fill="#f7a8c8" stroke="${INK}" stroke-width="3"/><path d="M10 34 v5 M38 34 v5" stroke="${INK}" stroke-width="3"/>`),
  done: S(`<path d="M12 25 l8 8 16-18" fill="none" stroke="#fff" stroke-width="6"/>`),
  plus: S(`<path d="M24 10 v28 M10 24 h28" stroke="${INK}" stroke-width="5"/>`),
  level: S(`<path d="M24 5 l16 7 v12 c0 10-7 16-16 19 c-9-3-16-9-16-19 v-12z" fill="#9fd3f7" stroke="${INK}" stroke-width="3"/>`),
  walk: S(`<circle cx="26" cy="9" r="5" fill="#f7a8c8" stroke="${INK}" stroke-width="2.5"/><path d="M24 16 l-5 12 6 3 -3 12 M24 16 l4 10 6 2 M19 28 l-6 6" fill="none" stroke="${INK}" stroke-width="3.5"/>`),
};

export function icon(name: string, cls = 'ic'): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = cls;
  s.innerHTML = ICONS[name] ?? '';
  return s;
}
