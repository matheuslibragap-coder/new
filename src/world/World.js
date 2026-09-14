import * as THREE from 'three';
import { Chunk } from './Chunk.js';
import { generateChunkVoxels } from './terrainGen.js';
import { CHUNK_SIZE, CHUNK_HEIGHT, RENDER_DISTANCE_CHUNKS } from '../config.js';
import { BlockType, isSolid } from './blocks.js';

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.osmData = null; // definido depois que a Overpass API responder
    this.material = new THREE.MeshLambertMaterial({ vertexColors: true });
    // Edições do jogador persistidas entre regenerações de chunk / saves.
    // chave "wx,wy,wz" -> blockType
    this.modifiedBlocks = new Map();
    this.lastPlayerChunk = null;
  }

  setOsmData(osmData) {
    this.osmData = osmData;
    // Regenera chunks já carregados para refletir os novos dados reais.
    for (const chunk of this.chunks.values()) {
      this.generateChunk(chunk);
      chunk.buildMesh(this.material);
    }
  }

  worldToChunkCoords(wx, wz) {
    return [Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE)];
  }

  getOrCreateChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      this.generateChunk(chunk);
      this.chunks.set(key, chunk);
      const mesh = chunk.buildMesh(this.material);
      this.scene.add(mesh);
    }
    return chunk;
  }

  generateChunk(chunk) {
    generateChunkVoxels(chunk, this.osmData);
    this.applyModificationsToChunk(chunk);
  }

  applyModificationsToChunk(chunk) {
    const minWX = chunk.cx * CHUNK_SIZE;
    const minWZ = chunk.cz * CHUNK_SIZE;
    for (const [key, type] of this.modifiedBlocks) {
      const [wx, wy, wz] = key.split(',').map(Number);
      const lx = wx - minWX;
      const lz = wz - minWZ;
      if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && wy >= 0 && wy < CHUNK_HEIGHT) {
        chunk.setBlockLocal(lx, wy, lz, type);
      }
    }
  }

  /** Carrega/descarrega chunks ao redor da posição do jogador (em blocos). */
  updateAroundPlayer(playerWorldX, playerWorldZ) {
    const [pcx, pcz] = this.worldToChunkCoords(playerWorldX, playerWorldZ);
    const key = chunkKey(pcx, pcz);
    if (this.lastPlayerChunk === key) return;
    this.lastPlayerChunk = key;

    const needed = new Set();
    for (let dx = -RENDER_DISTANCE_CHUNKS; dx <= RENDER_DISTANCE_CHUNKS; dx++) {
      for (let dz = -RENDER_DISTANCE_CHUNKS; dz <= RENDER_DISTANCE_CHUNKS; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        needed.add(chunkKey(cx, cz));
        this.getOrCreateChunk(cx, cz);
      }
    }

    for (const [key, chunk] of [...this.chunks.entries()]) {
      if (!needed.has(key)) {
        this.scene.remove(chunk.mesh);
        chunk.dispose();
        this.chunks.delete(key);
      }
    }
  }

  getChunkAt(wx, wz) {
    const [cx, cz] = this.worldToChunkCoords(wx, wz);
    return this.chunks.get(chunkKey(cx, cz)) ?? null;
  }

  getBlock(wx, wy, wz) {
    if (wy < 0) return BlockType.STONE;
    if (wy >= CHUNK_HEIGHT) return BlockType.AIR;
    const chunk = this.getChunkAt(wx, wz);
    if (!chunk) return BlockType.AIR;
    const lx = wx - chunk.cx * CHUNK_SIZE;
    const lz = wz - chunk.cz * CHUNK_SIZE;
    return chunk.getBlockLocal(lx, Math.floor(wy), lz);
  }

  isSolidAt(wx, wy, wz) {
    return isSolid(this.getBlock(wx, wy, wz));
  }

  /** Coloca ou quebra um bloco, persiste como modificação e reconstrói a mesh do chunk. */
  setBlock(wx, wy, wz, type) {
    const chunk = this.getChunkAt(wx, wz);
    if (!chunk) return false;
    const lx = wx - chunk.cx * CHUNK_SIZE;
    const lz = wz - chunk.cz * CHUNK_SIZE;
    chunk.setBlockLocal(lx, wy, lz, type);
    this.modifiedBlocks.set(`${wx},${wy},${wz}`, type);
    chunk.buildMesh(this.material);
    return true;
  }

  /** Altura do bloco sólido mais alto numa coluna (para spawn/física). */
  getSurfaceHeight(wx, wz) {
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      if (this.isSolidAt(wx, y, wz)) return y;
    }
    return 0;
  }

  serializeModifications() {
    return [...this.modifiedBlocks.entries()];
  }

  loadModifications(entries) {
    this.modifiedBlocks = new Map(entries ?? []);
    for (const chunk of this.chunks.values()) {
      this.generateChunk(chunk);
      chunk.buildMesh(this.material);
    }
  }
}
