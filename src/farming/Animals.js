import * as THREE from 'three';
import { FarmItemType } from './items.js';

const ANIMAL_DEFS = {
  chicken: { size: [0.5, 0.5, 0.6], color: 0xffffff, produce: FarmItemType.EGG, produceTimeMs: 25_000, speed: 0.8 },
  cow: { size: [1.1, 1.2, 1.8], color: 0x5a4632, produce: FarmItemType.MILK, produceTimeMs: 40_000, speed: 0.6 },
};

let nextId = 1;

export class AnimalManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.animals = [];
  }

  spawn(kind, x, z, home = { x, z, radius: 8 }) {
    const def = ANIMAL_DEFS[kind];
    if (!def) return null;
    const y = this.world.getSurfaceHeight(Math.round(x), Math.round(z)) + 1;
    const geometry = new THREE.BoxGeometry(def.size[0], def.size[1], def.size[2]);
    const material = new THREE.MeshLambertMaterial({ color: def.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    const animal = {
      id: nextId++,
      kind,
      mesh,
      home,
      dir: new THREE.Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize(),
      wanderTimer: Math.random() * 3,
      readyAt: Date.now() + def.produceTimeMs,
      indicator: this.makeIndicator(mesh, def),
    };
    this.animals.push(animal);
    return animal;
  }

  makeIndicator(parentMesh, def) {
    const geo = new THREE.SphereGeometry(0.08, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: def.produce === FarmItemType.EGG ? 0xfff3d6 : 0xf7f7f2 });
    const indicator = new THREE.Mesh(geo, mat);
    indicator.position.set(0, def === ANIMAL_DEFS.cow ? 0.9 : 0.5, 0);
    indicator.visible = false;
    parentMesh.add(indicator);
    return indicator;
  }

  update(dt) {
    const now = Date.now();
    for (const a of this.animals) {
      const def = ANIMAL_DEFS[a.kind];
      a.wanderTimer -= dt;
      if (a.wanderTimer <= 0) {
        a.wanderTimer = 2 + Math.random() * 3;
        a.dir.set(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
      }
      const speed = def.speed;
      let nx = a.mesh.position.x + a.dir.x * speed * dt;
      let nz = a.mesh.position.z + a.dir.y * speed * dt;
      const dx = nx - a.home.x, dz = nz - a.home.z;
      if (Math.hypot(dx, dz) > a.home.radius) {
        a.dir.set(-dx, -dz).normalize();
        nx = a.mesh.position.x + a.dir.x * speed * dt;
        nz = a.mesh.position.z + a.dir.y * speed * dt;
      }
      const ny = this.world.getSurfaceHeight(Math.round(nx), Math.round(nz)) + 1;
      a.mesh.position.set(nx, ny, nz);
      a.mesh.rotation.y = Math.atan2(a.dir.x, a.dir.y);

      a.indicator.visible = now >= a.readyAt;
    }
  }

  /** Tenta coletar o produto do animal (mira via raycast em main.js). Retorna item coletado ou null. */
  collect(animal) {
    const def = ANIMAL_DEFS[animal.kind];
    if (Date.now() < animal.readyAt) return null;
    animal.readyAt = Date.now() + def.produceTimeMs;
    animal.indicator.visible = false;
    return { produce: def.produce, count: 1 };
  }

  getMeshes() {
    return this.animals.map((a) => a.mesh);
  }

  findByMesh(mesh) {
    return this.animals.find((a) => a.mesh === mesh) ?? null;
  }

  serialize() {
    return this.animals.map((a) => ({
      kind: a.kind,
      x: a.mesh.position.x,
      z: a.mesh.position.z,
      home: a.home,
      readyAt: a.readyAt,
    }));
  }

  loadFrom(list) {
    for (const s of list ?? []) {
      const a = this.spawn(s.kind, s.x, s.z, s.home);
      if (a) a.readyAt = s.readyAt;
    }
  }
}
