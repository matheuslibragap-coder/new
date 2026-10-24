/**
 * CATÁLOGO DE MÓVEIS
 * kind: 'floor' (no chão, bloqueia), 'rug' (tapete, dá para pisar e pôr móveis em cima),
 *       'wall' (na parede). w x d = quantos tiles ocupa.
 * A arte de cada móvel fica em src/art/furniture.ts (mesmo id).
 */
export type FurnCat = 'camas' | 'sofas' | 'mesas' | 'luminarias' | 'plantas' | 'tapetes' | 'quadros' | 'brinquedos' | 'pet';

export interface FurnitureItem {
  id: string;
  name: string;
  cat: FurnCat;
  price: number;
  w: number;
  d: number;
  kind: 'floor' | 'rug' | 'wall';
}

export const FURN_CATS: { id: FurnCat; name: string }[] = [
  { id: 'camas', name: 'Camas' },
  { id: 'sofas', name: 'Sofás' },
  { id: 'mesas', name: 'Mesas' },
  { id: 'luminarias', name: 'Luminárias' },
  { id: 'plantas', name: 'Plantas' },
  { id: 'tapetes', name: 'Tapetes' },
  { id: 'quadros', name: 'Quadros' },
  { id: 'brinquedos', name: 'Brinquedos' },
  { id: 'pet', name: 'Itens de Pet' },
];

type F = [id: string, name: string, price: number, w: number, d: number];
const ALL: FurnitureItem[] = [];
function add(cat: FurnCat, kind: FurnitureItem['kind'], list: F[]) {
  for (const [id, name, price, w, d] of list) ALL.push({ id, name, cat, price, w, d, kind });
}

add('camas', 'floor', [
  ['cama_simples', 'Cama Fofinha', 80, 1, 2],
  ['cama_estrela', 'Cama de Estrelas', 150, 1, 2],
  ['cama_nuvem', 'Cama Nuvem', 260, 2, 2],
  ['beliche', 'Beliche Divertido', 320, 1, 2],
  ['cama_dossel', 'Cama de Princesa', 400, 2, 2],
]);
add('sofas', 'floor', [
  ['pufe', 'Pufe Menta', 35, 1, 1],
  ['poltrona_rosa', 'Poltrona Rosa', 60, 1, 1],
  ['sofa_lilas', 'Sofá Lilás', 140, 2, 1],
  ['sofa_nuvem', 'Sofá Nuvem', 220, 2, 1],
  ['namoradeira', 'Sofá Coração', 260, 2, 1],
]);
add('mesas', 'floor', [
  ['mesinha', 'Mesinha de Centro', 45, 1, 1],
  ['mesa_redonda', 'Mesa Redonda', 70, 1, 1],
  ['mesa_cha', 'Mesa de Chá', 90, 1, 1],
  ['escrivaninha', 'Escrivaninha', 120, 2, 1],
  ['penteadeira_casa', 'Penteadeira', 180, 1, 1],
]);
add('luminarias', 'floor', [
  ['abajur', 'Abajur', 35, 1, 1],
  ['luminaria_pe', 'Luminária de Pé', 60, 1, 1],
  ['luminaria_estrela', 'Luminária Estrela', 90, 1, 1],
  ['luminaria_lua', 'Luminária Lua', 110, 1, 1],
  ['lampiao_fadas', 'Pote de Vaga-lumes', 140, 1, 1],
]);
add('plantas', 'floor', [
  ['vaso_flor', 'Vaso de Flor', 20, 1, 1],
  ['cacto_fofo', 'Cacto Fofo', 25, 1, 1],
  ['samambaia', 'Samambaia', 30, 1, 1],
  ['girassois', 'Girassóis', 40, 1, 1],
  ['arvorezinha', 'Arvorezinha', 70, 1, 1],
]);
add('tapetes', 'rug', [
  ['tapete_redondo', 'Tapete Redondo', 40, 2, 2],
  ['tapete_listrado', 'Tapete Listrado', 50, 2, 2],
  ['tapete_nuvem', 'Tapete Nuvem', 70, 2, 2],
  ['tapete_coracao', 'Tapete Coração', 80, 2, 2],
  ['tapete_arcoiris', 'Tapete Arco-íris', 90, 2, 3],
]);
add('quadros', 'wall', [
  ['quadro_flor', 'Quadro de Flor', 30, 1, 1],
  ['relogio', 'Relógio', 40, 1, 1],
  ['quadro_gato', 'Quadro de Gatinho', 45, 1, 1],
  ['quadro_arcoiris', 'Quadro Arco-íris', 55, 1, 1],
  ['espelho', 'Espelho Dourado', 80, 1, 1],
  ['estrelas', 'Estrelinhas de Parede', 35, 1, 1],
]);
add('brinquedos', 'floor', [
  ['ursinho', 'Ursinho de Pelúcia', 40, 1, 1],
  ['bau_brinquedos', 'Baú de Brinquedos', 70, 1, 1],
  ['cavalinho', 'Cavalinho de Balanço', 120, 1, 1],
  ['casinha_boneca', 'Casinha de Bonecas', 150, 1, 1],
  ['piano', 'Pianinho', 200, 2, 1],
]);
add('pet', 'floor', [
  ['potinho', 'Potinho de Ração', 15, 1, 1],
  ['caminha_casa', 'Caminha de Pet', 50, 1, 1],
  ['arranhador_casa', 'Arranhador', 90, 1, 1],
  ['aquario', 'Aquário', 140, 1, 1],
  ['casinha_pet', 'Casinha de Pet', 160, 1, 1],
]);

export const FURNITURE = ALL;
export const FURN_BY_ID: Record<string, FurnitureItem> = Object.fromEntries(ALL.map((f) => [f.id, f]));

// ---------------------------------------------------------------- pisos e papéis de parede
export interface Surface {
  id: string;
  name: string;
  kind: 'floor' | 'wall';
  /** tipo de piso (src/art/tiles.ts FLOORS) ou estilo de parede (WALLS) */
  style: string;
  price: number;
  /** só vem junto com uma casa (não é vendido separado) */
  houseOnly?: boolean;
}

export const SURFACES: Surface[] = [
  { id: 'piso_madeira', name: 'Madeira Clara', kind: 'floor', style: 'madeira', price: 0 },
  { id: 'piso_madeira_escura', name: 'Madeira Escura', kind: 'floor', style: 'madeira_escura', price: 40 },
  { id: 'piso_ladrilho', name: 'Ladrilho Menta', kind: 'floor', style: 'ladrilho', price: 40 },
  { id: 'piso_xadrez', name: 'Xadrez Rosa', kind: 'floor', style: 'xadrez_rosa', price: 50 },
  { id: 'piso_carpete', name: 'Carpete Lilás', kind: 'floor', style: 'carpete_lilas', price: 50 },
  { id: 'piso_nuvem', name: 'Piso de Nuvem', kind: 'floor', style: 'nuvem', price: 80 },
  { id: 'piso_estrelado', name: 'Piso Estrelado', kind: 'floor', style: 'estrelado', price: 90 },
  { id: 'piso_arcoiris', name: 'Piso Arco-íris', kind: 'floor', style: 'arcoiris', price: 120 },
  { id: 'parede_creme', name: 'Creme Liso', kind: 'wall', style: 'parede_creme', price: 0 },
  { id: 'parede_listras', name: 'Listras Rosa', kind: 'wall', style: 'parede_listras', price: 40 },
  { id: 'parede_bolinhas', name: 'Bolinhas Azuis', kind: 'wall', style: 'parede_bolinhas', price: 40 },
  { id: 'parede_xadrez', name: 'Xadrez Amarelo', kind: 'wall', style: 'parede_xadrez', price: 50 },
  { id: 'parede_coracoes', name: 'Corações', kind: 'wall', style: 'parede_coracoes', price: 60 },
  { id: 'parede_flores', name: 'Florzinhas', kind: 'wall', style: 'parede_flores', price: 60 },
  { id: 'parede_estrelas', name: 'Céu de Estrelas', kind: 'wall', style: 'parede_estrelas', price: 80 },
  { id: 'parede_nuvens', name: 'Nuvens', kind: 'wall', style: 'parede_nuvens', price: 80 },
  { id: 'piso_marmore', name: 'Mármore', kind: 'floor', style: 'marmore', price: 0, houseOnly: true },
  { id: 'piso_areia', name: 'Areia Fofinha', kind: 'floor', style: 'areia', price: 0, houseOnly: true },
  { id: 'parede_madeira', name: 'Madeira de Chalé', kind: 'wall', style: 'parede_madeira', price: 0, houseOnly: true },
  { id: 'parede_castelo', name: 'Pedra de Castelo', kind: 'wall', style: 'parede_castelo', price: 0, houseOnly: true },
];
export const SURFACE_BY_ID: Record<string, Surface> = Object.fromEntries(SURFACES.map((s) => [s.id, s]));
