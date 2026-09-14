// Converte a resposta bruta do Overpass (nodes + ways + relations) em
// features com coordenadas já projetadas em metros locais (x, z), prontas
// para rasterização em voxels (fase 3).

function indexNodes(elements) {
  const nodes = new Map();
  for (const el of elements) {
    if (el.type === 'node') nodes.set(el.id, el);
  }
  return nodes;
}

function wayToPoints(way, nodes, projection) {
  const pts = [];
  for (const nodeId of way.nodes ?? []) {
    const node = nodes.get(nodeId);
    if (!node) continue;
    pts.push(projection.project(node.lat, node.lon));
  }
  return pts;
}

function isClosedWay(way) {
  return way.nodes && way.nodes.length > 2 && way.nodes[0] === way.nodes[way.nodes.length - 1];
}

/**
 * @returns {{buildings: object[], highways: object[], landuse: object[], water: object[], pois: object[]}}
 */
export function parseOsmData(raw, projection) {
  const elements = raw.elements ?? [];
  const nodes = indexNodes(elements);

  const buildings = [];
  const highways = [];
  const landuse = [];
  const water = [];
  const pois = [];

  for (const el of elements) {
    if (el.type !== 'way') continue;
    const tags = el.tags ?? {};
    const points = wayToPoints(el, nodes, projection);
    if (points.length < 2) continue;

    if (tags.building) {
      if (isClosedWay(el)) {
        buildings.push({
          id: el.id,
          points,
          levels: tags['building:levels'] ? parseFloat(tags['building:levels']) : null,
          tags,
        });
      }
      continue;
    }

    if (tags.highway) {
      highways.push({
        id: el.id,
        points,
        highwayType: tags.highway,
        tags,
      });
      continue;
    }

    if (tags.natural === 'water' || tags.waterway) {
      water.push({ id: el.id, points, closed: isClosedWay(el), tags });
      continue;
    }

    if (tags.landuse) {
      if (isClosedWay(el)) {
        landuse.push({ id: el.id, points, landuseType: tags.landuse, tags });
      }
      continue;
    }

    if ((tags.amenity || tags.leisure) && isClosedWay(el)) {
      pois.push({
        id: el.id,
        points,
        kind: tags.amenity ?? tags.leisure,
        name: tags.name ?? null,
        tags,
      });
    }
  }

  // Nodes isolados marcados como amenity/leisure (ex.: bancos, lixeiras,
  // pontos de ônibus) viram POIs pontuais.
  for (const el of elements) {
    if (el.type !== 'node') continue;
    const tags = el.tags ?? {};
    if (tags.amenity || tags.leisure) {
      const { x, z } = projection.project(el.lat, el.lon);
      pois.push({ id: el.id, point: { x, z }, kind: tags.amenity ?? tags.leisure, name: tags.name ?? null, tags });
    }
  }

  console.log(
    `[OSM] Parseado: ${buildings.length} edificações, ${highways.length} vias, ` +
      `${landuse.length} áreas de uso do solo, ${water.length} corpos d'água, ${pois.length} POIs.`
  );

  return { buildings, highways, landuse, water, pois };
}
