/**
 * A* em grade com 8 direções (sem "cortar quina" de obstáculos).
 * walkable(x, y) diz se dá para pisar no tile.
 */
export type Pt = { x: number; y: number };

export function findPath(
  w: number,
  h: number,
  walkable: (x: number, y: number) => boolean,
  start: Pt,
  goal: Pt,
): Pt[] | null {
  if (!walkable(goal.x, goal.y)) return null;
  if (start.x === goal.x && start.y === goal.y) return [];
  const idx = (x: number, y: number) => y * w + x;
  const g = new Float32Array(w * h).fill(Infinity);
  const f = new Float32Array(w * h).fill(Infinity);
  const from = new Int32Array(w * h).fill(-1);
  const closed = new Uint8Array(w * h);
  const open: number[] = [];
  const heur = (x: number, y: number) => {
    const dx = Math.abs(x - goal.x);
    const dy = Math.abs(y - goal.y);
    return Math.max(dx, dy) + 0.41 * Math.min(dx, dy);
  };
  const s = idx(start.x, start.y);
  g[s] = 0;
  f[s] = heur(start.x, start.y);
  open.push(s);
  const dirs = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41],
  ];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
    const cur = open[bi];
    open.splice(bi, 1);
    const cx = cur % w;
    const cy = (cur - cx) / w;
    if (cx === goal.x && cy === goal.y) {
      const path: Pt[] = [];
      let c = cur;
      while (c !== s) {
        path.push({ x: c % w, y: Math.floor(c / w) });
        c = from[c];
      }
      return path.reverse();
    }
    closed[cur] = 1;
    for (const [dx, dy, cost] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (!walkable(nx, ny)) continue;
      if (dx && dy && (!walkable(cx + dx, cy) || !walkable(cx, cy + dy))) continue;
      const ni = idx(nx, ny);
      if (closed[ni]) continue;
      const ng = g[cur] + cost;
      if (ng < g[ni]) {
        g[ni] = ng;
        f[ni] = ng + heur(nx, ny);
        from[ni] = cur;
        if (!open.includes(ni)) open.push(ni);
      }
    }
  }
  return null;
}

/** Tile livre mais próximo de (x, y), procurando em anéis. */
export function nearestWalkable(
  w: number,
  h: number,
  walkable: (x: number, y: number) => boolean,
  x: number,
  y: number,
  from?: Pt,
): Pt | null {
  for (let r = 0; r < Math.max(w, h); r++) {
    let best: Pt | null = null;
    let bestD = Infinity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || !walkable(nx, ny)) continue;
        const d = from ? Math.hypot(nx - from.x, ny - from.y) : Math.hypot(dx, dy);
        if (d < bestD) {
          bestD = d;
          best = { x: nx, y: ny };
        }
      }
    }
    if (best) return best;
  }
  return null;
}
