import type { Pattern } from '../art/draw';
import type { Slot } from '../core/state';

/**
 * CATÁLOGO DE ROUPAS
 * ------------------
 * Para adicionar uma roupa nova, copie uma linha de `variants(...)` e mude id, nome, cores e preço.
 * O campo `style` escolhe o desenho (veja src/art/doll/*.ts). Cores em hexadecimal.
 */
export type ClothCat =
  | 'vestidos' | 'blusas' | 'camisetas' | 'saias' | 'calcas' | 'shorts' | 'macacoes'
  | 'sapatos' | 'tenis' | 'botas' | 'sandalias'
  | 'chapeus' | 'bones' | 'tiaras' | 'lacos' | 'coroas'
  | 'oculos' | 'bolsas' | 'colares' | 'asas'
  | 'penteados' | 'cabelo' | 'pele' | 'fantasias';

export interface ClothingItem {
  id: string;
  name: string;
  cat: ClothCat;
  slot: Slot;
  style: string;
  c1: string;
  c2?: string;
  pat?: Pattern;
  price: number;
  /** Desbloqueio: só aparece para compra depois de concluir esta missão. */
  unlockMission?: string;
  unlockText?: string;
  /** Item exclusivo: não é vendido, só ganho como prêmio. */
  exclusive?: boolean;
}

export const CAT_INFO: Record<ClothCat, { name: string; group: string }> = {
  vestidos: { name: 'Vestidos', group: 'roupas' },
  blusas: { name: 'Blusas', group: 'roupas' },
  camisetas: { name: 'Camisetas', group: 'roupas' },
  saias: { name: 'Saias', group: 'roupas' },
  calcas: { name: 'Calças', group: 'roupas' },
  shorts: { name: 'Shorts', group: 'roupas' },
  macacoes: { name: 'Macacões', group: 'roupas' },
  sapatos: { name: 'Sapatos', group: 'calcados' },
  tenis: { name: 'Tênis', group: 'calcados' },
  botas: { name: 'Botas', group: 'calcados' },
  sandalias: { name: 'Sandálias', group: 'calcados' },
  chapeus: { name: 'Chapéus', group: 'cabeca' },
  bones: { name: 'Bonés', group: 'cabeca' },
  tiaras: { name: 'Tiaras', group: 'cabeca' },
  lacos: { name: 'Laços', group: 'cabeca' },
  coroas: { name: 'Coroas', group: 'cabeca' },
  oculos: { name: 'Óculos', group: 'acessorios' },
  bolsas: { name: 'Bolsas', group: 'acessorios' },
  colares: { name: 'Colares', group: 'acessorios' },
  asas: { name: 'Asas', group: 'acessorios' },
  penteados: { name: 'Penteados', group: 'cabelo' },
  cabelo: { name: 'Cor do cabelo', group: 'cabelo' },
  pele: { name: 'Tom de pele', group: 'cabelo' },
  fantasias: { name: 'Fantasias', group: 'fantasias' },
};

export const GROUPS: { id: string; name: string; cats: ClothCat[] }[] = [
  { id: 'roupas', name: 'Roupas', cats: ['vestidos', 'blusas', 'camisetas', 'saias', 'calcas', 'shorts', 'macacoes'] },
  { id: 'calcados', name: 'Calçados', cats: ['sapatos', 'tenis', 'botas', 'sandalias'] },
  { id: 'cabeca', name: 'Cabeça', cats: ['chapeus', 'bones', 'tiaras', 'lacos', 'coroas'] },
  { id: 'acessorios', name: 'Acessórios', cats: ['oculos', 'bolsas', 'colares', 'asas'] },
  { id: 'cabelo', name: 'Cabelo', cats: ['penteados', 'cabelo', 'pele'] },
  { id: 'fantasias', name: 'Fantasias', cats: ['fantasias'] },
];

const SLOT_OF: Record<ClothCat, Slot> = {
  vestidos: 'full', macacoes: 'full', blusas: 'top', camisetas: 'top', saias: 'bottom', calcas: 'bottom', shorts: 'bottom',
  sapatos: 'shoes', tenis: 'shoes', botas: 'shoes', sandalias: 'shoes',
  chapeus: 'hat', bones: 'hat', tiaras: 'hat', lacos: 'hat', coroas: 'hat',
  oculos: 'glasses', bolsas: 'bag', colares: 'necklace', asas: 'wings',
  penteados: 'hairStyle', cabelo: 'hairColor', pele: 'skin', fantasias: 'costume',
};

type V = [id: string, name: string, c1: string, c2: string | undefined, pat: Pattern | undefined, price: number];

const ALL: ClothingItem[] = [];

function variants(cat: ClothCat, style: string, list: V[], extra: Partial<ClothingItem> = {}) {
  for (const [id, name, c1, c2, pat, price] of list) {
    ALL.push({ id, name, cat, slot: SLOT_OF[cat], style, c1, c2, pat, price, ...extra });
  }
}

// ---------------------------------------------------------------- Roupas
variants('vestidos', 'vestido_rodado', [
  ['vest_rodado_rosa', 'Vestido Rodado Rosa', '#f7a8c8', '#ffffff', 'dots', 70],
  ['vest_rodado_azul', 'Vestido Rodado Céu', '#9fd3f7', '#ffffff', 'hearts', 80],
]);
variants('vestidos', 'vestido_babado', [
  ['vest_babado_lilas', 'Vestido de Babados Lilás', '#c7a8f0', '#f3ecff', 'none', 110],
  ['vest_babado_menta', 'Vestido de Babados Menta', '#9fe3c9', '#fff3dc', 'flowers', 120],
]);
variants('vestidos', 'vestido_longo', [
  ['vest_longo_amarelo', 'Vestido Longo Sol', '#ffe08a', '#ffffff', 'flowers', 160],
  ['vest_longo_coral', 'Vestido Longo Coral', '#ff8f87', '#ffd3d0', 'stars', 180],
]);
variants('blusas', 'blusa', [
  ['blusa_branca', 'Blusa Branquinha', '#fffaf7', '#f7a8c8', 'none', 35],
  ['blusa_rosa', 'Blusa Rosa de Gola', '#fcd3e3', '#ffffff', 'dots', 45],
  ['blusa_amarela', 'Blusa Amarelinha', '#fff2c4', '#9fd3f7', 'none', 45],
]);
variants('blusas', 'blusa_manga', [
  ['blusa_manga_lilas', 'Blusa de Manga Lilás', '#e4d6fa', '#c7a8f0', 'stripes', 60],
  ['blusa_manga_menta', 'Blusa de Manga Menta', '#d2f5e8', '#ffffff', 'hearts', 65],
  ['blusa_manga_xadrez', 'Blusa Xadrez', '#ffc29f', '#fff3dc', 'check', 75],
]);
variants('camisetas', 'camiseta', [
  ['cam_coracao', 'Camiseta Coração', '#ffffff', '#f2727a', 'none', 25],
  ['cam_estrela', 'Camiseta Estrela', '#9fd3f7', '#ffe08a', 'none', 30],
  ['cam_flor', 'Camiseta Flor', '#d2f5e8', '#f7a8c8', 'none', 30],
  ['cam_arcoiris', 'Camiseta Arco-íris', '#fff2c4', '#c7a8f0', 'none', 40],
  ['cam_gatinho', 'Camiseta Gatinho', '#fcd3e3', '#4a3657', 'none', 45],
  ['cam_lua', 'Camiseta Lua', '#c7a8f0', '#fff2c4', 'none', 45],
]);
variants('saias', 'saia_rodada', [
  ['saia_rodada_rosa', 'Saia Rodada Rosa', '#f7a8c8', '#ffffff', 'none', 30],
  ['saia_rodada_azul', 'Saia Rodada Azul', '#9fd3f7', '#ffffff', 'dots', 40],
]);
variants('saias', 'saia_pregas', [
  ['saia_pregas_xadrez', 'Saia Xadrez', '#f2727a', '#ffd3d0', 'check', 50],
  ['saia_pregas_lilas', 'Saia de Pregas Lilás', '#c7a8f0', '#ffffff', 'none', 50],
]);
variants('saias', 'saia_tutu', [
  ['saia_tutu_rosa', 'Saia de Tule Rosa', '#fcd3e3', '#f7a8c8', 'glitter', 70],
  ['saia_tutu_menta', 'Saia de Tule Menta', '#d2f5e8', '#9fe3c9', 'glitter', 70],
]);
variants('calcas', 'calca', [
  ['calca_jeans', 'Calça Jeans', '#8fb3e3', '#ffffff', 'none', 45],
  ['calca_rosa', 'Calça Rosa', '#f7a8c8', '#ffffff', 'none', 45],
  ['calca_branca', 'Calça Branca', '#fffaf7', '#ffffff', 'none', 50],
]);
variants('calcas', 'legging', [
  ['legging_estrela', 'Legging de Estrelas', '#9b7fd4', '#fff2c4', 'stars', 55],
  ['legging_coracao', 'Legging de Corações', '#ff8f87', '#ffffff', 'hearts', 55],
  ['legging_menta', 'Legging Menta', '#9fe3c9', '#ffffff', 'dots', 50],
]);
variants('shorts', 'short', [
  ['short_jeans', 'Short Jeans', '#8fb3e3', '#ffffff', 'none', 30],
  ['short_amarelo', 'Short Amarelo', '#ffe08a', '#ffffff', 'none', 30],
  ['short_listrado', 'Short Listrado', '#9fd3f7', '#ffffff', 'stripes', 40],
]);
variants('shorts', 'short_barra', [
  ['short_barra_rosa', 'Short com Barra Rosa', '#f7a8c8', '#ffffff', 'none', 40],
  ['short_barra_lilas', 'Short com Barra Lilás', '#c7a8f0', '#fff3dc', 'dots', 45],
  ['short_barra_coral', 'Short com Barra Coral', '#ff8f87', '#fff3dc', 'none', 45],
]);
variants('macacoes', 'macacao_calca', [
  ['mac_jeans', 'Macacão Jeans', '#8fb3e3', '#ffffff', 'none', 80],
  ['mac_rosa', 'Macacão Rosa', '#f7a8c8', '#fff2c4', 'none', 90],
  ['mac_lilas', 'Macacão Lilás', '#c7a8f0', '#d2f5e8', 'none', 95],
]);
variants('macacoes', 'macacao_short', [
  ['mac_short_amarelo', 'Jardineira Amarela', '#ffe08a', '#ffffff', 'none', 70],
  ['mac_short_menta', 'Jardineira Menta', '#9fe3c9', '#fcd3e3', 'none', 75],
  ['mac_short_coral', 'Jardineira Coral', '#ff8f87', '#ffffff', 'dots', 80],
]);

// ---------------------------------------------------------------- Calçados
variants('sapatos', 'sapatilha', [
  ['sapatilha_rosa', 'Sapatilha Rosa', '#f7a8c8', '#ffffff', undefined, 30],
  ['sapatilha_dourada', 'Sapatilha Dourada', '#f2c14e', '#ffffff', undefined, 45],
  ['sapatilha_azul', 'Sapatilha Azul', '#9fd3f7', '#ffffff', undefined, 30],
]);
variants('sapatos', 'boneca', [
  ['boneca_vermelho', 'Sapato de Boneca Vermelho', '#f2727a', '#ffffff', undefined, 40],
  ['boneca_lilas', 'Sapato de Boneca Lilás', '#c7a8f0', '#ffffff', undefined, 40],
  ['boneca_branco', 'Sapato de Boneca Branco', '#fffaf7', '#f7a8c8', undefined, 45],
]);
variants('tenis', 'tenis', [
  ['tenis_rosa', 'Tênis Rosa', '#f7a8c8', '#ffffff', undefined, 25],
  ['tenis_azul', 'Tênis Azul', '#9fd3f7', '#ffffff', undefined, 35],
  ['tenis_menta', 'Tênis Menta', '#9fe3c9', '#ffffff', undefined, 35],
  ['tenis_lilas', 'Tênis Lilás', '#c7a8f0', '#ffffff', undefined, 35],
  ['tenis_amarelo', 'Tênis Amarelo', '#ffe08a', '#ffffff', undefined, 40],
  ['tenis_brilho', 'Tênis de Brilho', '#fcd3e3', '#f2c14e', undefined, 60],
]);
variants('botas', 'bota', [
  ['bota_marrom', 'Botinha Caramelo', '#c99d77', '#fff3dc', undefined, 50],
  ['bota_rosa', 'Botinha Rosa', '#f7a8c8', '#ffffff', undefined, 55],
  ['bota_branca', 'Botinha Branca', '#fffaf7', '#c7a8f0', undefined, 55],
]);
variants('botas', 'bota_cano', [
  ['bota_cano_lilas', 'Bota Alta Lilás', '#c7a8f0', '#ffffff', undefined, 75],
  ['bota_cano_vermelha', 'Bota Alta Vermelha', '#f2727a', '#ffffff', undefined, 80],
  ['bota_chuva', 'Galocha Amarela', '#ffe08a', '#ffffff', undefined, 60],
]);
variants('sandalias', 'sandalia', [
  ['sandalia_rosa', 'Sandália Rosa', '#f7a8c8', '#ffffff', undefined, 25],
  ['sandalia_azul', 'Sandália Azul', '#9fd3f7', '#ffffff', undefined, 25],
  ['sandalia_dourada', 'Sandália Dourada', '#f2c14e', '#ffffff', undefined, 40],
  ['sandalia_flor', 'Sandália de Florzinha', '#9fe3c9', '#f7a8c8', undefined, 45],
  ['sandalia_coral', 'Sandália Coral', '#ff8f87', '#ffffff', undefined, 30],
  ['sandalia_lilas', 'Sandália Lilás', '#c7a8f0', '#fff2c4', undefined, 30],
]);

// ---------------------------------------------------------------- Cabeça
variants('chapeus', 'chapeu_sol', [
  ['chapeu_palha', 'Chapéu de Palha', '#f3d69d', '#f7a8c8', undefined, 50],
  ['chapeu_rosa', 'Chapéu Rosa', '#f7a8c8', '#ffffff', undefined, 60],
]);
variants('chapeus', 'gorro', [
  ['gorro_lilas', 'Gorro Lilás', '#c7a8f0', '#ffffff', undefined, 40],
  ['gorro_vermelho', 'Gorro Vermelho', '#f2727a', '#ffffff', undefined, 40],
]);
variants('chapeus', 'chapeu_festa', [
  ['chapeu_festa_azul', 'Chapéu de Festa Azul', '#9fd3f7', '#ffe08a', 'dots', 35],
  ['chapeu_festa_rosa', 'Chapéu de Festa Rosa', '#f7a8c8', '#ffffff', 'stars', 35],
]);
variants('bones', 'bone', [
  ['bone_rosa', 'Boné Rosa', '#f7a8c8', '#ffffff', undefined, 30],
  ['bone_azul', 'Boné Azul', '#9fd3f7', '#ffffff', undefined, 30],
  ['bone_menta', 'Boné Menta', '#9fe3c9', '#ffffff', undefined, 30],
  ['bone_amarelo', 'Boné Amarelo', '#ffe08a', '#f2727a', undefined, 35],
  ['bone_lilas', 'Boné Lilás', '#c7a8f0', '#fff2c4', undefined, 35],
  ['bone_estrela', 'Boné Estrela', '#4f6fb5', '#ffe08a', undefined, 50],
]);
variants('tiaras', 'tiara', [
  ['tiara_rosa', 'Tiara Rosa', '#f7a8c8', '#ffffff', undefined, 25],
  ['tiara_perola', 'Tiara de Pérolas', '#fffaf7', '#f7a8c8', undefined, 45],
]);
variants('tiaras', 'tiara_flores', [
  ['tiara_flores_rosa', 'Tiara de Flores', '#9fe3c9', '#f7a8c8', undefined, 55],
  ['tiara_flores_amarela', 'Tiara de Margaridas', '#9fe3c9', '#ffffff', undefined, 55],
]);
variants('tiaras', 'tiara_orelhas', [
  ['tiara_gatinha', 'Tiara Orelhinha de Gato', '#4a3657', '#f7a8c8', undefined, 60],
  ['tiara_coelhinha', 'Tiara Orelhinha de Coelho', '#ffffff', '#fcd3e3', undefined, 60],
]);
variants('lacos', 'laco', [
  ['laco_rosa', 'Laço Rosa', '#f7a8c8', '#ffffff', 'none', 20],
  ['laco_vermelho', 'Laço Vermelho', '#f2727a', '#ffffff', 'none', 25],
  ['laco_azul', 'Laço Azul', '#9fd3f7', '#ffffff', 'dots', 30],
  ['laco_lilas', 'Laço Lilás', '#c7a8f0', '#ffffff', 'none', 25],
  ['laco_amarelo', 'Laço Amarelo', '#ffe08a', '#ffffff', 'dots', 30],
  ['laco_grande', 'Laço Gigante', '#fcd3e3', '#f7a8c8', 'hearts', 50],
]);
variants('coroas', 'coroa', [
  ['coroa_dourada', 'Coroa Dourada', '#f2c14e', '#f2727a', undefined, 150],
  ['coroa_prata', 'Coroa Prateada', '#d9d2e3', '#9fd3f7', undefined, 150],
  ['coroa_rosa', 'Coroa Rosa', '#f7a8c8', '#ffffff', undefined, 180],
  ['coroa_cristal', 'Coroa de Cristal', '#d5ecfc', '#c7a8f0', undefined, 220],
  ['coroa_flores', 'Coroa de Flores', '#9fe3c9', '#f7a8c8', undefined, 140],
]);
variants('coroas', 'coroa_estrela', [
  ['coroa_estrela', 'Coroa de Estrela', '#ffe08a', '#ffffff', undefined, 0],
], { exclusive: true });

// ---------------------------------------------------------------- Acessórios
variants('oculos', 'oculos_redondo', [
  ['oculos_redondo_rosa', 'Óculos Redondo Rosa', '#f7a8c8', '#e3f4ff', undefined, 35],
  ['oculos_redondo_lilas', 'Óculos Redondo Lilás', '#9b7fd4', '#e3f4ff', undefined, 35],
]);
variants('oculos', 'oculos_coracao', [
  ['oculos_coracao_vermelho', 'Óculos de Coração', '#f2727a', '#ffd3e3', undefined, 50],
  ['oculos_coracao_rosa', 'Óculos de Coração Rosa', '#f7a8c8', '#ffeaf3', undefined, 50],
]);
variants('oculos', 'oculos_estrela', [
  ['oculos_estrela_dourado', 'Óculos de Estrela', '#f2c14e', '#fff2c4', undefined, 60],
  ['oculos_estrela_azul', 'Óculos de Estrela Azul', '#7aa7e8', '#d5ecfc', undefined, 60],
]);
variants('bolsas', 'bolsa', [
  ['bolsa_rosa', 'Bolsinha Rosa', '#f7a8c8', '#ffffff', undefined, 40],
  ['bolsa_amarela', 'Bolsinha Amarela', '#ffe08a', '#ffffff', undefined, 40],
]);
variants('bolsas', 'bolsa_coracao', [
  ['bolsa_coracao', 'Bolsa de Coração', '#f2727a', '#ffffff', undefined, 60],
  ['bolsa_coracao_lilas', 'Bolsa de Coração Lilás', '#c7a8f0', '#ffffff', undefined, 60],
]);
variants('bolsas', 'mochila', [
  ['mochila_azul', 'Mochila Azul', '#9fd3f7', '#ffe08a', undefined, 70],
  ['mochila_menta', 'Mochila Menta', '#9fe3c9', '#f7a8c8', undefined, 70],
]);
variants('colares', 'colar_perolas', [
  ['colar_perolas', 'Colar de Pérolas', '#fffaf7', '#ffffff', undefined, 50],
  ['colar_perolas_rosa', 'Colar de Pérolas Rosa', '#fcd3e3', '#ffffff', undefined, 55],
]);
variants('colares', 'colar_coracao', [
  ['colar_coracao', 'Colar de Coração', '#f2c14e', '#f2727a', undefined, 45],
  ['colar_coracao_prata', 'Colar de Coração Prata', '#d9d2e3', '#c7a8f0', undefined, 45],
]);
variants('colares', 'colar_estrela', [
  ['colar_estrela', 'Colar de Estrela', '#f2c14e', '#ffe08a', undefined, 55],
  ['colar_estrela_azul', 'Colar de Estrela Azul', '#d9d2e3', '#9fd3f7', undefined, 55],
]);
variants('asas', 'asas_fada', [
  ['asas_fada_rosa', 'Asas de Fada Rosa', '#fcd3e3', '#f7a8c8', undefined, 180],
  ['asas_fada_azul', 'Asas de Fada Azul', '#d5ecfc', '#9fd3f7', undefined, 180],
  ['asas_fada_dourada', 'Asas de Fada Douradas', '#fff2c4', '#f2c14e', undefined, 260],
]);
variants('asas', 'asas_borboleta', [
  ['asas_borboleta_lilas', 'Asas de Borboleta Lilás', '#c7a8f0', '#fff2c4', undefined, 200],
  ['asas_borboleta_laranja', 'Asas de Borboleta Laranja', '#ffc29f', '#ffffff', undefined, 200],
  ['asas_borboleta_arcoiris', 'Asas Arco-íris', '#9fe3c9', '#f7a8c8', undefined, 300],
]);

// ---------------------------------------------------------------- Cabelo e pele
const HAIR_STYLES: [string, string, number][] = [
  ['cab_longo', 'Cabelo Longo', 0],
  ['cab_chiquinhas', 'Maria-Chiquinha', 40],
  ['cab_coque', 'Coque de Bailarina', 50],
  ['cab_cacheado', 'Cachos Volumosos', 60],
  ['cab_rabo', 'Rabo de Cavalo', 40],
  ['cab_trancas', 'Tranças', 70],
  ['cab_chanel', 'Chanel Curtinho', 50],
  ['cab_curtinho', 'Curtinho', 40],
  ['cab_coques', 'Dois Coquinhos', 60],
];
for (const [id, name, price] of HAIR_STYLES) {
  ALL.push({ id, name, cat: 'penteados', slot: 'hairStyle', style: id.replace('cab_', ''), c1: '#7a4a2a', price });
}

export const HAIR_COLORS: [string, string, string, number][] = [
  ['cor_castanho', 'Castanho', '#8a5534', 0],
  ['cor_preto', 'Preto', '#3e2c3c', 30],
  ['cor_loiro', 'Loiro', '#f2cf6b', 30],
  ['cor_ruivo', 'Ruivo', '#de7a43', 30],
  ['cor_caramelo', 'Caramelo', '#c4895a', 30],
  ['cor_rosa', 'Rosa Chiclete', '#f49ac1', 80],
  ['cor_lilas', 'Lilás Mágico', '#b79cf0', 80],
  ['cor_azul', 'Azul Sereia', '#86c2f0', 90],
  ['cor_menta', 'Verde Menta', '#86dcc0', 90],
];
for (const [id, name, c, price] of HAIR_COLORS) {
  ALL.push({ id, name, cat: 'cabelo', slot: 'hairColor', style: 'cor', c1: c, price });
}

export const SKINS: [string, string, string][] = [
  ['pele1', 'Pele 1', '#fde0cf'],
  ['pele2', 'Pele 2', '#f2c3a0'],
  ['pele3', 'Pele 3', '#d9a07a'],
  ['pele4', 'Pele 4', '#b07650'],
  ['pele5', 'Pele 5', '#7d4f35'],
];
for (const [id, name, c] of SKINS) {
  ALL.push({ id, name, cat: 'pele', slot: 'skin', style: 'pele', c1: c, price: 0 });
}

// ---------------------------------------------------------------- Fantasias
variants('fantasias', 'sereia', [['fant_sereia', 'Fantasia de Sereia', '#86dcc0', '#c7a8f0', 'none', 550]], {
  unlockMission: 'praia_main', unlockText: 'Ajude na Praia Coral para liberar',
});
variants('fantasias', 'princesa', [['fant_princesa', 'Fantasia de Princesa', '#f7a8c8', '#fff2c4', 'none', 600]], {
  unlockMission: 'salao_main', unlockText: 'Ajude no Salão de Beleza para liberar',
});
variants('fantasias', 'astronauta', [['fant_astronauta', 'Fantasia de Astronauta', '#f4f6fb', '#9b7fd4', 'none', 700]], {
  unlockMission: 'diversoes_main', unlockText: 'Ajude no Parque de Diversões para liberar',
});
variants('fantasias', 'bailarina', [['fant_bailarina', 'Fantasia de Bailarina', '#fcd3e3', '#ffffff', 'none', 450]], {
  unlockMission: 'danca_main', unlockText: 'Ajude na Escola de Dança para liberar',
});
variants('fantasias', 'fada', [['fant_fada', 'Fantasia de Fada', '#c9f2c7', '#f7a8c8', 'none', 650]], {
  unlockMission: 'floresta_main', unlockText: 'Ajude na Floresta dos Cristais para liberar',
});
variants('fantasias', 'estrela', [['fant_estrela', 'Fantasia Estrela Brilhante', '#fff2c4', '#b79cf0', 'stars', 0]], {
  exclusive: true, unlockText: 'Prêmio do Grande Baile',
});

export const CLOTHES: ClothingItem[] = ALL;
export const CLOTHES_BY_ID: Record<string, ClothingItem> = Object.fromEntries(ALL.map((i) => [i.id, i]));

export function clothing(id?: string): ClothingItem | undefined {
  return id ? CLOTHES_BY_ID[id] : undefined;
}

export function hairColorHex(id: string): string {
  return CLOTHES_BY_ID[id]?.c1 ?? '#8a5534';
}

export function skinHex(id: string): string {
  return CLOTHES_BY_ID[id]?.c1 ?? '#d9a07a';
}
