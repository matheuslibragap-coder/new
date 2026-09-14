# Santa Maria Voxel Farm

Jogo web inspirado em Minecraft (construção em voxels) combinado com
mecânicas de mini fazenda, ambientado numa recriação do centro real de
Santa Maria — RS, gerada a partir de dados abertos do OpenStreetMap.

## Stack

- [Three.js](https://threejs.org/) para renderização 3D (WebGL)
- [Vite](https://vitejs.dev/) como bundler/dev server
- JavaScript (ES modules), sem backend — estado salvo em `localStorage`

## Rodando localmente

```bash
npm install
npm run dev
```

Abra o endereço impresso pelo Vite (por padrão `http://localhost:5173`).
Clique em "Carregar mundo e jogar" na tela inicial.

## Como jogar

- **WASD**: mover · **Espaço**: pular · **Shift**: correr
- **Botão esquerdo do mouse**: quebrar bloco
- **Botão direito do mouse**: colocar bloco / arar terra (com a enxada) /
  plantar semente / colher plantação madura / coletar de animal
- **1-8**: selecionar item da hotbar
- **Esc**: pausar (libera o cursor do mouse)

## Dados geográficos

Os dados de edificações, vias, uso do solo, água e pontos de interesse são
obtidos da [Overpass API](https://overpass-api.de/) (OpenStreetMap) para uma
bounding box de 300m x 300m no centro de Santa Maria, próxima à Av. Rio
Branco / Catedral Metropolitana e à Praça Saldanha Marinho (Theatro Treze de
Maio). A área pode ser ajustada em `src/config.js` (`MAP_CENTER` e
`BBOX_SIZE_METERS`) — amplie com cautela para não sobrecarregar a Overpass
API nem gerar geometria excessiva no navegador.

Caso a Overpass API esteja indisponível (rede, limite de uso), o jogo cai
automaticamente para um terreno plano gerado proceduralmente, sem travar.

**Atribuição obrigatória:** Dados de mapa © colaboradores do OpenStreetMap,
licença [ODbL](https://www.openstreetmap.org/copyright). O aviso aparece na
tela inicial do jogo.

## Arquitetura

```
src/
  config.js           parâmetros do mundo (bbox, tamanho de chunk, etc.)
  main.js             ponto de entrada: cena, loop, interação, save/load
  osm/
    overpass.js       consulta a Overpass API (com cache em localStorage)
    parseOsm.js        converte elementos OSM em features com coords projetadas
    projection.js      projeção local lat/long -> metros
  world/
    blocks.js          tipos de bloco
    raster.js           point-in-polygon / distância a polilinha
    terrainGen.js       rasteriza features OSM em voxels por chunk
    Chunk.js            dados de voxel + mesh de um chunk
    ChunkMesher.js       construção da geometria (culling de faces)
    World.js            gerenciador de chunks sob demanda
    itemRegistry.js      registro unificado de itens (blocos + fazenda)
  player/
    FirstPersonController.js  movimento em 1ª pessoa + colisão AABB
    Inventory.js               inventário/hotbar
  farming/
    items.js            itens de fazenda (sementes, colheitas, ovo, leite)
    Crops.js             plantio/crescimento/colheita
    Animals.js           galinhas e vacas com IA simples
  storage/
    SaveManager.js       persistência em localStorage
  ui/
    HUD.js               hotbar e status na tela
```

## Escala e chunks

1 metro do mundo real = 1 bloco (1m³). O mundo é gerado em chunks de
16x16 blocos (altura máx. 48 blocos), carregados sob demanda num raio ao
redor do jogador — não pré-gera a cidade inteira.
