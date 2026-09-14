// Itens de fazenda (sementes, colheitas e produtos animais). Usam ids
// numéricos separados dos BlockType para não colidir no inventário genérico.
export const FarmItemType = {
  HOE: 200,
  SOY_SEED: 201,
  SOY: 202,
  CORN_SEED: 203,
  CORN: 204,
  WHEAT_SEED: 205,
  WHEAT: 206,
  VEGGIE_SEED: 207,
  VEGGIE: 208,
  EGG: 209,
  MILK: 210,
};

export const FarmItemInfo = {
  [FarmItemType.HOE]: { name: 'Enxada', color: 0xb0b0b0, tool: true },
  [FarmItemType.SOY_SEED]: { name: 'Semente de Soja', color: 0xc9b458 },
  [FarmItemType.SOY]: { name: 'Soja', color: 0xd8c76a },
  [FarmItemType.CORN_SEED]: { name: 'Semente de Milho', color: 0xe8d24a },
  [FarmItemType.CORN]: { name: 'Milho', color: 0xf5c542 },
  [FarmItemType.WHEAT_SEED]: { name: 'Semente de Trigo', color: 0xdcc06a },
  [FarmItemType.WHEAT]: { name: 'Trigo', color: 0xe8b923 },
  [FarmItemType.VEGGIE_SEED]: { name: 'Semente de Hortaliça', color: 0x8bc34a },
  [FarmItemType.VEGGIE]: { name: 'Hortaliça', color: 0x66bb6a },
  [FarmItemType.EGG]: { name: 'Ovo', color: 0xfff3d6 },
  [FarmItemType.MILK]: { name: 'Leite', color: 0xf7f7f2 },
};
