import { MAP_CENTER, BBOX_SIZE_METERS, OVERPASS_ENDPOINTS, OSM_CACHE_KEY } from '../config.js';
import { makeLocalProjection } from './projection.js';

// Converte um tamanho em metros num bounding box lat/lon aproximado ao redor
// do centro configurado (aproximação suficiente para poucas centenas de metros).
function bboxFromCenter(lat, lon, sizeMeters) {
  const half = sizeMeters / 2;
  const metersPerDegLat = (Math.PI / 180) * 6378137;
  const metersPerDegLon = metersPerDegLat * Math.cos((lat * Math.PI) / 180);
  const dLat = half / metersPerDegLat;
  const dLon = half / metersPerDegLon;
  return {
    south: lat - dLat,
    west: lon - dLon,
    north: lat + dLat,
    east: lon + dLon,
  };
}

function buildQuery(bbox) {
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  // Busca: edificações, vias, uso do solo, água e pontos de interesse
  // relevantes (praças/parques/UFSM), conforme escopo da fase 2.
  return `
    [out:json][timeout:25];
    (
      way["building"](${bboxStr});
      relation["building"](${bboxStr});

      way["highway"](${bboxStr});

      way["landuse"](${bboxStr});
      relation["landuse"](${bboxStr});

      way["natural"="water"](${bboxStr});
      relation["natural"="water"](${bboxStr});
      way["waterway"](${bboxStr});

      node["amenity"](${bboxStr});
      way["amenity"](${bboxStr});
      node["leisure"](${bboxStr});
      way["leisure"](${bboxStr});
    );
    out body;
    >;
    out skel qt;
  `;
}

async function fetchFromEndpoint(url, query) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: query,
  });
  if (!res.ok) {
    throw new Error(`Overpass respondeu ${res.status} em ${url}`);
  }
  return res.json();
}

function loadCache() {
  try {
    const raw = localStorage.getItem(OSM_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Falha ao ler cache OSM do localStorage:', err);
    return null;
  }
}

function saveCache(bboxKey, data) {
  try {
    localStorage.setItem(OSM_CACHE_KEY, JSON.stringify({ bboxKey, data, savedAt: Date.now() }));
  } catch (err) {
    console.warn('Falha ao salvar cache OSM no localStorage (talvez dados grandes demais):', err);
  }
}

/**
 * Busca dados do OpenStreetMap via Overpass API para a bounding box
 * configurada (fase 2) e loga no console, conforme critério de sucesso da
 * fase. Usa cache em localStorage para evitar bater na API a cada reload.
 */
export async function fetchSantaMariaOsmData(onStatus = () => {}) {
  const bbox = bboxFromCenter(MAP_CENTER.lat, MAP_CENTER.lon, BBOX_SIZE_METERS);
  const bboxKey = `${bbox.south.toFixed(6)},${bbox.west.toFixed(6)},${bbox.north.toFixed(6)},${bbox.east.toFixed(6)}`;

  const cached = loadCache();
  if (cached && cached.bboxKey === bboxKey) {
    onStatus('Usando dados OSM em cache (localStorage)...');
    console.log('[Overpass] Dados carregados do cache local para bbox', bboxKey);
    return { raw: cached.data, bbox, projection: makeLocalProjection(MAP_CENTER.lat, MAP_CENTER.lon) };
  }

  const query = buildQuery(bbox);
  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      onStatus(`Consultando Overpass API (${new URL(endpoint).hostname})...`);
      const data = await fetchFromEndpoint(endpoint, query);
      console.log(`[Overpass] Resposta recebida de ${endpoint} para bbox`, bbox);
      console.log(`[Overpass] Total de elementos:`, data.elements?.length ?? 0);
      console.log('[Overpass] Dados brutos:', data);
      saveCache(bboxKey, data);
      return { raw: data, bbox, projection: makeLocalProjection(MAP_CENTER.lat, MAP_CENTER.lon) };
    } catch (err) {
      console.warn(`[Overpass] Falha em ${endpoint}:`, err);
      lastError = err;
    }
  }
  throw lastError ?? new Error('Não foi possível consultar nenhum endpoint Overpass.');
}
