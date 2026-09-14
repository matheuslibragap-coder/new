import { BlockType } from './blocks.js';
import { pointInPolygon, polygonBounds, distToPolyline } from './raster.js';
import { HIGHWAY_WIDTHS, DEFAULT_BUILDING_HEIGHT, METERS_PER_LEVEL } from '../config.js';

// Nível Y do topo do terreno "natural" (grama/terra andável). Abaixo disso
// existem camadas de pedra/terra mineráveis; acima disso o mundo é ar, exceto
// onde há edificações extrudadas.
export const SURFACE_Y = 4;

const PARK_LANDUSE = new Set(['forest', 'grass', 'meadow', 'recreation_ground', 'greenfield', 'village_green']);
const PARK_LEISURE = new Set(['park', 'garden', 'nature_reserve', 'pitch']);

function boundsIntersectChunk(bounds, minWX, maxWX, minWZ, maxWZ) {
  return bounds.maxX >= minWX && bounds.minX <= maxWX && bounds.maxZ >= minWZ && bounds.minZ <= maxWZ;
}

function prefilterByBounds(features, minWX, maxWX, minWZ, maxWZ) {
  const out = [];
  for (const f of features) {
    const pts = f.points ?? (f.point ? [f.point] : []);
    if (!pts.length) continue;
    const bounds = polygonBounds(pts);
    // Expande um pouco para vias (podem ter largura) e para segurança.
    if (boundsIntersectChunk(bounds, minWX - 8, maxWX + 8, minWZ - 8, maxWZ + 8)) {
      out.push({ feature: f, bounds });
    }
  }
  return out;
}

/**
 * Preenche o array de blocos do chunk a partir dos dados OSM (se houver) e
 * de terreno procedural padrão (grama editável) caso contrário/fora da bbox.
 */
export function generateChunkVoxels(chunk, osmData) {
  const { cx, cz, sizeX, sizeZ } = chunk;
  const minWX = cx * sizeX;
  const maxWX = minWX + sizeX - 1;
  const minWZ = cz * sizeZ;
  const maxWZ = minWZ + sizeZ - 1;

  const buildings = osmData ? prefilterByBounds(osmData.buildings, minWX, maxWX, minWZ, maxWZ) : [];
  const highways = osmData ? prefilterByBounds(osmData.highways, minWX, maxWX, minWZ, maxWZ) : [];
  const landuse = osmData ? prefilterByBounds(osmData.landuse, minWX, maxWX, minWZ, maxWZ) : [];
  const water = osmData ? prefilterByBounds(osmData.water, minWX, maxWX, minWZ, maxWZ) : [];
  const pois = osmData ? prefilterByBounds(osmData.pois, minWX, maxWX, minWZ, maxWZ) : [];

  for (let lx = 0; lx < sizeX; lx++) {
    const wx = minWX + lx;
    for (let lz = 0; lz < sizeZ; lz++) {
      const wz = minWZ + lz;

      // Camadas base: pedra mineravel, terra, grama de superfície.
      chunk.setBlockLocal(lx, 0, lz, BlockType.STONE);
      chunk.setBlockLocal(lx, 1, lz, BlockType.STONE);
      chunk.setBlockLocal(lx, 2, lz, BlockType.DIRT);
      chunk.setBlockLocal(lx, 3, lz, BlockType.DIRT);
      let surfaceType = BlockType.GRASS;

      // 1) Uso do solo (parques/matas -> grama; o resto fica com o padrão
      //    editável, incluindo residencial/comercial, conforme escopo).
      for (const { feature, bounds } of landuse) {
        if (wx < bounds.minX || wx > bounds.maxX || wz < bounds.minZ || wz > bounds.maxZ) continue;
        if (pointInPolygon(wx + 0.5, wz + 0.5, feature.points)) {
          if (PARK_LANDUSE.has(feature.landuseType)) surfaceType = BlockType.GRASS;
        }
      }
      for (const { feature, bounds } of pois) {
        if (!feature.points) continue;
        if (wx < bounds.minX || wx > bounds.maxX || wz < bounds.minZ || wz > bounds.maxZ) continue;
        if (PARK_LEISURE.has(feature.kind) && pointInPolygon(wx + 0.5, wz + 0.5, feature.points)) {
          surfaceType = BlockType.GRASS;
        }
      }

      // 2) Água (rios/lagos): sobrepõe uso do solo.
      let isWater = false;
      for (const { feature, bounds } of water) {
        if (feature.points.length < 2) continue;
        if (feature.closed) {
          if (wx < bounds.minX || wx > bounds.maxX || wz < bounds.minZ || wz > bounds.maxZ) continue;
          if (pointInPolygon(wx + 0.5, wz + 0.5, feature.points)) isWater = true;
        } else {
          const d = distToPolyline(wx + 0.5, wz + 0.5, feature.points);
          if (d <= 2) isWater = true;
        }
        if (isWater) break;
      }
      if (isWater) surfaceType = BlockType.WATER;

      // 3) Vias: sobrepõe água/uso do solo (ruas ficam acima do nível da água
      //    na prática só quando não coincidem).
      let isRoad = false;
      let roadIsSidewalk = false;
      for (const { feature, bounds } of highways) {
        const halfWidth = (HIGHWAY_WIDTHS[feature.highwayType] ?? HIGHWAY_WIDTHS.default) / 2;
        if (
          wx < bounds.minX - halfWidth ||
          wx > bounds.maxX + halfWidth ||
          wz < bounds.minZ - halfWidth ||
          wz > bounds.maxZ + halfWidth
        ) {
          continue;
        }
        const d = distToPolyline(wx + 0.5, wz + 0.5, feature.points);
        if (d <= halfWidth) {
          isRoad = true;
          roadIsSidewalk = ['footway', 'path', 'pedestrian', 'steps', 'cycleway'].includes(feature.highwayType);
          break;
        }
      }
      if (isRoad) surfaceType = roadIsSidewalk ? BlockType.SIDEWALK : BlockType.ROAD;

      chunk.setBlockLocal(lx, SURFACE_Y, lz, surfaceType);

      // 4) Edificações: extrudam para cima da superfície, sobrepondo tudo.
      let building = null;
      for (const { feature, bounds } of buildings) {
        if (wx < bounds.minX || wx > bounds.maxX || wz < bounds.minZ || wz > bounds.maxZ) continue;
        if (pointInPolygon(wx + 0.5, wz + 0.5, feature.points)) {
          building = feature;
          break;
        }
      }
      if (building) {
        const heightBlocks = building.levels
          ? Math.max(3, Math.round(building.levels * METERS_PER_LEVEL))
          : DEFAULT_BUILDING_HEIGHT;
        for (let h = 1; h <= heightBlocks; h++) {
          const y = SURFACE_Y + h;
          if (y >= chunk.sizeY) break;
          chunk.setBlockLocal(lx, y, lz, h === heightBlocks ? BlockType.ROOF : BlockType.BRICK);
        }
      }
    }
  }

  // 5) Árvores decorativas simples em POIs de parque/praça (pontuais).
  for (const { feature } of pois) {
    if (!feature.point) continue;
    if (!PARK_LEISURE.has(feature.kind)) continue;
    const lx = Math.round(feature.point.x - minWX);
    const lz = Math.round(feature.point.z - minWZ);
    if (lx < 1 || lx >= sizeX - 1 || lz < 1 || lz >= sizeZ - 1) continue;
    placeTree(chunk, lx, lz);
  }
}

function placeTree(chunk, lx, lz) {
  const trunkHeight = 4;
  for (let h = 1; h <= trunkHeight; h++) {
    chunk.setBlockLocal(lx, SURFACE_Y + h, lz, BlockType.WOOD);
  }
  const topY = SURFACE_Y + trunkHeight;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = 0; dy <= 1; dy++) {
        chunk.setBlockLocal(lx + dx, topY + dy, lz + dz, BlockType.LEAVES);
      }
    }
  }
  chunk.setBlockLocal(lx, topY + 2, lz, BlockType.LEAVES);
}

/** Gera terreno plano procedural padrão (sem dados OSM) para chunks fora da bbox carregada. */
export function generateFallbackChunk(chunk) {
  generateChunkVoxels(chunk, null);
}
