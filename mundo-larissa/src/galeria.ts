import './art/index';
import { getArt } from './art/registry';
import { OBJECTS } from './art/objects';
import { FLOORS, WALLS } from './art/tiles';
import { CLOTHES } from './data/clothes';
import { DEFAULT_OUTFIT, type Outfit } from './core/state';
import { drawDollTo } from './art/doll/compose';
import { DOLL_H, DOLL_W, type Dir } from './art/doll/skeleton';

/** Página de desenvolvimento: mostra todos os sprites e suas chaves. */
const root = document.getElementById('root')!;

function section(title: string) {
  const h = document.createElement('h2');
  h.textContent = title;
  root.appendChild(h);
  const g = document.createElement('div');
  g.className = 'grid';
  root.appendChild(g);
  return g;
}

function cell(grid: HTMLElement, key: string, label = key) {
  const a = getArt(key);
  const c = document.createElement('div');
  c.className = 'cell';
  const cv = document.createElement('canvas');
  cv.width = a.source.width;
  cv.height = a.source.height;
  cv.style.width = `${a.w}px`;
  cv.style.height = `${a.h}px`;
  cv.getContext('2d')!.drawImage(a.source, 0, 0);
  c.appendChild(cv);
  c.appendChild(document.createTextNode(label));
  grid.appendChild(c);
}

function dollCell(grid: HTMLElement, o: Outfit, label: string, dirs: [Dir, number, boolean][] = [['front', 0, false], ['side', 0, false], ['back', 0, false], ['side', 1, true], ['front', 1, false]]) {
  const c = document.createElement('div');
  c.className = 'cell';
  const s = 1.6;
  const cv = document.createElement('canvas');
  cv.width = DOLL_W * s * dirs.length * 2;
  cv.height = DOLL_H * s * 2;
  cv.style.width = `${(cv.width / 2)}px`;
  cv.style.height = `${cv.height / 2}px`;
  const ctx = cv.getContext('2d')!;
  dirs.forEach(([d, f, m], i) => drawDollTo(ctx, o, d, f, i * DOLL_W * s * 2, 0, s * 2, m));
  c.appendChild(cv);
  c.appendChild(document.createTextNode(label));
  grid.appendChild(c);
}

const dolls = section('Larissa (frente, lado, costas, passo)');
dollCell(dolls, DEFAULT_OUTFIT, 'roupa inicial');
for (const it of CLOTHES) {
  if (it.slot === 'skin') continue;
  const o: Outfit = { ...DEFAULT_OUTFIT };
  if (it.slot === 'full') { delete o.top; delete o.bottom; }
  if (it.slot === 'top' || it.slot === 'bottom') delete o.full;
  (o as Record<string, string>)[it.slot] = it.id;
  if (it.slot === 'hat' || it.slot === 'hairStyle') delete o.hat;
  if (it.slot === 'hat') o.hat = it.id;
  dollCell(dolls, o, `${it.name} (${it.id})`);
}
const fl = section('Pisos (floor:<tipo>:<variação>)');
for (const f of Object.keys(FLOORS)) cell(fl, `floor:${f}:0`);
const wl = section('Paredes (wall:<estilo>:L / R)');
for (const w of Object.keys(WALLS)) {
  cell(wl, `wall:${w}:L`);
  cell(wl, `wall:${w}:R`);
}
const ob = section('Objetos dos mapas (obj:<nome>)');
for (const o of Object.keys(OBJECTS)) cell(ob, `obj:${o}`);
