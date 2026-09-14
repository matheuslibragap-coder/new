// Definição dos tipos de bloco (voxel) do mundo.
export const BlockType = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  TILLED_SOIL: 3, // terra arável preparada para plantio
  STONE: 4,
  WOOD: 5,
  BRICK: 6, // "tijolo reaproveitado" das construções da cidade
  ROAD: 7,
  SIDEWALK: 8,
  WATER: 9,
  SAND: 10,
  LEAVES: 11,
  PLANK: 12,
  ROOF: 13,
};

export const BlockInfo = {
  [BlockType.GRASS]: { name: 'Grama', color: 0x4caf50, solid: true, collectible: BlockType.DIRT },
  [BlockType.DIRT]: { name: 'Terra', color: 0x8d6e63, solid: true, collectible: BlockType.DIRT },
  [BlockType.TILLED_SOIL]: { name: 'Terra Arável', color: 0x6d4c41, solid: true, collectible: BlockType.DIRT },
  [BlockType.STONE]: { name: 'Pedra', color: 0x9e9e9e, solid: true, collectible: BlockType.STONE },
  [BlockType.WOOD]: { name: 'Madeira', color: 0x6d4c2f, solid: true, collectible: BlockType.WOOD },
  [BlockType.BRICK]: { name: 'Tijolo', color: 0xb5533c, solid: true, collectible: BlockType.BRICK },
  [BlockType.ROAD]: { name: 'Pavimento', color: 0x3b3b3f, solid: true, collectible: null },
  [BlockType.SIDEWALK]: { name: 'Calçada', color: 0xb0b0ac, solid: true, collectible: null },
  [BlockType.WATER]: { name: 'Água', color: 0x2f6fb5, solid: false, collectible: null },
  [BlockType.SAND]: { name: 'Areia', color: 0xe0c98f, solid: true, collectible: BlockType.SAND },
  [BlockType.LEAVES]: { name: 'Folhas', color: 0x357a38, solid: true, collectible: null },
  [BlockType.PLANK]: { name: 'Tábua', color: 0xa1795a, solid: true, collectible: BlockType.PLANK },
  [BlockType.ROOF]: { name: 'Telhado', color: 0x7a3b2e, solid: true, collectible: BlockType.BRICK },
};

export function isSolid(blockType) {
  if (blockType === BlockType.AIR) return false;
  return BlockInfo[blockType]?.solid ?? true;
}

export function getBlockColor(blockType) {
  return BlockInfo[blockType]?.color ?? 0xffffff;
}
