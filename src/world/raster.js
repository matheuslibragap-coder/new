// Utilitários geométricos para rasterizar polígonos/linhas OSM em uma grade
// de voxels (colunas x,z em metros inteiros).

// Ray casting clássico point-in-polygon.
export function pointInPolygon(x, z, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, zi = points[i].z;
    const xj = points[j].x, zj = points[j].z;
    const intersect =
      zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polygonBounds(points) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  return { minX, maxX, minZ, maxZ };
}

// Distância de um ponto (px,pz) ao segmento (ax,az)-(bx,bz).
export function distToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  let t = lenSq > 0 ? ((px - ax) * dx + (pz - az) * dz) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cz = az + t * dz;
  return Math.hypot(px - cx, pz - cz);
}

// Distância mínima de um ponto a uma polilinha (lista de pontos {x,z}).
export function distToPolyline(px, pz, points) {
  let min = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const d = distToSegment(px, pz, points[i].x, points[i].z, points[i + 1].x, points[i + 1].z);
    if (d < min) min = d;
  }
  return min;
}
