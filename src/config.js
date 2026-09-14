// Configuração central do mundo voxel de Santa Maria - RS.

// Centro do bounding box inicial: Centro de Santa Maria, próximo à Av. Rio
// Branco / Catedral Metropolitana e à Praça Saldanha Marinho (Theatro Treze
// de Maio). Fonte: OpenStreetMap / geocodificação pública do bairro Centro.
export const MAP_CENTER = {
  lat: -29.6865,
  lon: -53.8061,
};

// Tamanho do bounding box inicial (fase 2/3): 300m x 300m, conforme escopo.
// Pode ser ampliado depois que o pipeline de chunks estiver estável.
export const BBOX_SIZE_METERS = 300;

// 1 bloco = 1 metro cúbico.
export const BLOCK_SIZE = 1;

// Tamanho do chunk em blocos (X/Z), estilo Minecraft.
export const CHUNK_SIZE = 16;

// Altura máxima de um chunk em blocos (y = 0 é o nível do chão editável).
export const CHUNK_HEIGHT = 48;

// Raio de chunks carregados ao redor do jogador.
export const RENDER_DISTANCE_CHUNKS = 4;

// Altura padrão de prédio (em blocos/metros) quando building:levels não existe.
export const DEFAULT_BUILDING_HEIGHT = 9; // ~3 andares de 3m
export const METERS_PER_LEVEL = 3;

// Largura de vias por tipo de highway (em blocos/metros).
export const HIGHWAY_WIDTHS = {
  motorway: 12,
  trunk: 10,
  primary: 9,
  secondary: 8,
  tertiary: 7,
  residential: 6,
  living_street: 5,
  unclassified: 6,
  service: 4,
  pedestrian: 4,
  footway: 2,
  path: 1.5,
  cycleway: 2,
  steps: 2,
  default: 5,
};

export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export const SAVE_KEY = 'santa-maria-voxel-farm-save-v1';
export const OSM_CACHE_KEY = 'santa-maria-voxel-farm-osm-cache-v1';
