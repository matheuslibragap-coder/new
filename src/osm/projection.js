// Projeção plana local (tangente à Terra no ponto central) para converter
// lat/long em metros. Para uma área de poucos km² isso é equivalente em
// precisão a uma projeção UTM, sem a complexidade de zonas/fusos.
const EARTH_RADIUS = 6378137; // metros (WGS84)

export function makeLocalProjection(centerLat, centerLon) {
  const latRad = (centerLat * Math.PI) / 180;
  const metersPerDegLat = (Math.PI / 180) * EARTH_RADIUS;
  const metersPerDegLon = (Math.PI / 180) * EARTH_RADIUS * Math.cos(latRad);

  return {
    // Retorna {x, z} em metros relativos ao centro. x = leste, z = sul
    // (para bater com o eixo Z do Three.js crescendo "para frente/baixo na
    // tela" quando a câmera olha para -Z por padrão, invertendo o norte).
    project(lat, lon) {
      const x = (lon - centerLon) * metersPerDegLon;
      const z = -(lat - centerLat) * metersPerDegLat;
      return { x, z };
    },
    unproject(x, z) {
      const lon = centerLon + x / metersPerDegLon;
      const lat = centerLat - z / metersPerDegLat;
      return { lat, lon };
    },
  };
}
