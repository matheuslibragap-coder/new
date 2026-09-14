import * as THREE from 'three';
import { BlockType } from '../world/blocks.js';
import { FarmItemType } from './items.js';

export const CROPS = {
  soy: { seed: FarmItemType.SOY_SEED, produce: FarmItemType.SOY, stages: 4, growTimeMs: 45_000, yieldCount: 3, baseColor: 0x5e8f45 },
  corn: { seed: FarmItemType.CORN_SEED, produce: FarmItemType.CORN, stages: 4, growTimeMs: 60_000, yieldCount: 2, baseColor: 0xd4c05a },
  wheat: { seed: FarmItemType.WHEAT_SEED, produce: FarmItemType.WHEAT, stages: 4, growTimeMs: 40_000, yieldCount: 3, baseColor: 0xdcc06a },
  veggie: { seed: FarmItemType.VEGGIE_SEED, produce: FarmItemType.VEGGIE, stages: 4, growTimeMs: 30_000, yieldCount: 2, baseColor: 0x66bb6a },
};

export const SEED_TO_CROP = Object.fromEntries(Object.entries(CROPS).map(([key, c]) => [c.seed, key]));

function tileKey(wx, wz) {
  return `${wx},${wz}`;
}

export class CropManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.crops = new Map(); // key "wx,wz" -> { cropKey, plantedAt, y, mesh, stage }
  }

  canPlant(wx, wy, wz) {
    const soil = this.world.getBlock(wx, wy, wz);
    return soil === BlockType.TILLED_SOIL && !this.crops.has(tileKey(wx, wz));
  }

  plant(wx, wy, wz, cropKey, plantedAt = Date.now()) {
    const def = CROPS[cropKey];
    if (!def) return false;
    if (!this.canPlant(wx, wy, wz)) return false;

    const geometry = new THREE.BoxGeometry(0.35, 0.2, 0.35);
    const material = new THREE.MeshLambertMaterial({ color: def.baseColor });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(wx + 0.5, wy + 1 + 0.1, wz + 0.5);
    this.scene.add(mesh);

    this.crops.set(tileKey(wx, wz), { cropKey, plantedAt, y: wy, mesh, stage: -1 });
    this.updateTile(tileKey(wx, wz));
    return true;
  }

  getCropAt(wx, wz) {
    return this.crops.get(tileKey(wx, wz)) ?? null;
  }

  isMature(entry) {
    const def = CROPS[entry.cropKey];
    return Date.now() - entry.plantedAt >= def.growTimeMs;
  }

  /** Tenta colher; retorna { produce, count } se colhido, senão null. */
  harvest(wx, wz) {
    const key = tileKey(wx, wz);
    const entry = this.crops.get(key);
    if (!entry) return null;
    if (!this.isMature(entry)) return null;
    const def = CROPS[entry.cropKey];
    this.scene.remove(entry.mesh);
    entry.mesh.geometry.dispose();
    entry.mesh.material.dispose();
    this.crops.delete(key);
    return { produce: def.produce, count: def.yieldCount };
  }

  updateTile(key) {
    const entry = this.crops.get(key);
    if (!entry) return;
    const def = CROPS[entry.cropKey];
    const elapsed = Date.now() - entry.plantedAt;
    const progress = Math.min(1, elapsed / def.growTimeMs);
    const stage = Math.min(def.stages - 1, Math.floor(progress * def.stages));
    if (stage !== entry.stage) {
      entry.stage = stage;
      const scale = 0.3 + 0.7 * (stage / (def.stages - 1));
      entry.mesh.scale.set(scale, scale, scale);
      entry.mesh.position.y = entry.y + 1 + (0.1 * scale);
      const brighten = 0.6 + 0.4 * (stage / (def.stages - 1));
      entry.mesh.material.color.setHex(def.baseColor).multiplyScalar(brighten);
      entry.mesh.material.emissive = new THREE.Color(stage === def.stages - 1 ? 0x222200 : 0x000000);
    }
  }

  update() {
    for (const key of this.crops.keys()) {
      this.updateTile(key);
    }
  }

  serialize() {
    return [...this.crops.entries()].map(([key, entry]) => {
      const [wx, wz] = key.split(',').map(Number);
      return { wx, wz, y: entry.y, cropKey: entry.cropKey, plantedAt: entry.plantedAt };
    });
  }

  loadFrom(list) {
    for (const c of list ?? []) {
      this.plant(c.wx, c.y, c.wz, c.cropKey, c.plantedAt);
    }
  }
}
