import * as THREE from 'three';
import { getBlockColor } from './blocks.js';

// Direções das 6 faces: [dx, dy, dz, ...4 cantos relativos ao voxel (0..1)]
const FACES = [
  { dir: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], shade: 0.75 }, // +X
  { dir: [-1, 0, 0], corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], shade: 0.75 }, // -X
  { dir: [0, 1, 0], corners: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], shade: 1.0 }, // +Y (topo)
  { dir: [0, -1, 0], corners: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]], shade: 0.5 }, // -Y (baixo)
  { dir: [0, 0, 1], corners: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], shade: 0.85 }, // +Z
  { dir: [0, 0, -1], corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], shade: 0.6 }, // -Z
];

const tmpColor = new THREE.Color();

/**
 * Constrói uma BufferGeometry para o chunk usando culling de faces internas
 * (não gera face se o vizinho também for sólido). Vizinhos fora do chunk são
 * tratados como ar (pequenas costuras visuais nas bordas são aceitáveis
 * nesta fase; a prioridade é performance e simplicidade).
 */
export function buildChunkGeometry(chunk) {
  const { sizeX, sizeY, sizeZ } = chunk;
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];
  let vertexCount = 0;

  const getBlock = (x, y, z) => chunk.getBlockLocal(x, y, z);
  const solidAt = (x, y, z) => chunk.isSolidLocal(x, y, z);

  for (let x = 0; x < sizeX; x++) {
    for (let z = 0; z < sizeZ; z++) {
      for (let y = 0; y < sizeY; y++) {
        const block = getBlock(x, y, z);
        if (block === 0) continue; // AIR

        for (const face of FACES) {
          const [dx, dy, dz] = face.dir;
          if (solidAt(x + dx, y + dy, z + dz)) continue;

          const color = getBlockColor(block);
          tmpColor.setHex(color).multiplyScalar(face.shade);

          const startIndex = vertexCount;
          for (const corner of face.corners) {
            positions.push(x + corner[0], y + corner[1], z + corner[2]);
            normals.push(dx, dy, dz);
            colors.push(tmpColor.r, tmpColor.g, tmpColor.b);
            vertexCount++;
          }
          indices.push(startIndex, startIndex + 1, startIndex + 2, startIndex, startIndex + 2, startIndex + 3);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}
