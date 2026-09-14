import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_HEIGHT } from '../config.js';
import { isSolid } from './blocks.js';
import { buildChunkGeometry } from './ChunkMesher.js';

export class Chunk {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.sizeX = CHUNK_SIZE;
    this.sizeY = CHUNK_HEIGHT;
    this.sizeZ = CHUNK_SIZE;
    this.blocks = new Uint8Array(this.sizeX * this.sizeY * this.sizeZ);
    this.mesh = null;
    this.dirty = true;
    // Estado de fazenda: chave "lx,y,lz" -> { type, plantedAt, stage }
    this.crops = new Map();
  }

  index(x, y, z) {
    return (x * this.sizeZ + z) * this.sizeY + y;
  }

  inBounds(x, y, z) {
    return x >= 0 && x < this.sizeX && y >= 0 && y < this.sizeY && z >= 0 && z < this.sizeZ;
  }

  getBlockLocal(x, y, z) {
    if (!this.inBounds(x, y, z)) return 0;
    return this.blocks[this.index(x, y, z)];
  }

  setBlockLocal(x, y, z, type) {
    if (!this.inBounds(x, y, z)) return;
    this.blocks[this.index(x, y, z)] = type;
    this.dirty = true;
  }

  isSolidLocal(x, y, z) {
    if (y < 0) return true; // bedrock implícito
    if (!this.inBounds(x, y, z)) return false; // vizinho de outro chunk: tratado como ar
    return isSolid(this.blocks[this.index(x, y, z)]);
  }

  worldToLocal(wx, wy, wz) {
    return [wx - this.cx * this.sizeX, wy, wz - this.cz * this.sizeZ];
  }

  buildMesh(material) {
    if (this.mesh) {
      this.mesh.geometry.dispose();
    }
    const geometry = buildChunkGeometry(this);
    if (!this.mesh) {
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(this.cx * this.sizeX, 0, this.cz * this.sizeZ);
      this.mesh.matrixAutoUpdate = false;
      this.mesh.updateMatrix();
    } else {
      this.mesh.geometry = geometry;
    }
    this.dirty = false;
    return this.mesh;
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
  }
}
