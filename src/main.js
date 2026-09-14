import * as THREE from 'three';
import { World } from './world/World.js';
import { BlockType, BlockInfo } from './world/blocks.js';
import { FirstPersonController } from './player/FirstPersonController.js';
import { Inventory } from './player/Inventory.js';
import { HUD } from './ui/HUD.js';
import { CropManager, SEED_TO_CROP } from './farming/Crops.js';
import { FarmItemType } from './farming/items.js';
import { AnimalManager } from './farming/Animals.js';
import { fetchSantaMariaOsmData } from './osm/overpass.js';
import { parseOsmData } from './osm/parseOsm.js';
import { saveGame, loadGame, hasSave } from './storage/SaveManager.js';
import { SURFACE_Y } from './world/terrainGen.js';

const REACH = 6;
const AUTOSAVE_INTERVAL_MS = 30_000;

// ---------- Cena / renderer básicos (Fase 1) ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fd0ff);
scene.fog = new THREE.Fog(0x8fd0ff, 40, 130);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('app').appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x445566, 0.9);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.0);
sunLight.position.set(60, 100, 40);
scene.add(sunLight);

// ---------- Mundo / jogador ----------
const world = new World(scene);
const player = new FirstPersonController(camera, renderer.domElement, world);
scene.add(player.controls.getObject());

const inventory = new Inventory();
const hud = new HUD(inventory);
const crops = new CropManager(scene, world);
const animals = new AnimalManager(scene, world);

// Spawna o jogador no centro do mapa (x=0,z=0 = centro geográfico configurado),
// numa coluna com terreno já gerado (fallback plano até os dados OSM chegarem).
function spawnPlayerAt(x, z, y = null) {
  world.updateAroundPlayer(x, z);
  const groundY = y ?? world.getSurfaceHeight(Math.round(x), Math.round(z)) + 1;
  player.setPosition(x, groundY, z);
}
spawnPlayerAt(0, 0);

// ---------- Raycaster de interação (Fase 5/6/7) ----------
const raycaster = new THREE.Raycaster();
raycaster.far = REACH;
const centerNDC = new THREE.Vector2(0, 0);

function pickBlock() {
  raycaster.setFromCamera(centerNDC, camera);
  const chunkMeshes = [...world.chunks.values()].map((c) => c.mesh).filter(Boolean);
  const hits = raycaster.intersectObjects(chunkMeshes, false);
  if (!hits.length) return null;
  const hit = hits[0];
  const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  const point = hit.point.clone();
  const inside = point.clone().addScaledVector(normal, -0.5);
  const outside = point.clone().addScaledVector(normal, 0.5);
  return {
    distance: hit.distance,
    blockPos: [Math.floor(inside.x), Math.floor(inside.y), Math.floor(inside.z)],
    placePos: [Math.floor(outside.x), Math.floor(outside.y), Math.floor(outside.z)],
  };
}

function pickAnimal() {
  raycaster.setFromCamera(centerNDC, camera);
  const meshes = animals.getMeshes();
  const hits = raycaster.intersectObjects(meshes, false);
  if (!hits.length) return null;
  return animals.findByMesh(hits[0].object);
}

function playerAABBOverlaps(wx, wy, wz) {
  const p = player.position;
  const hw = 0.35;
  return (
    wx + 1 > p.x - hw && wx < p.x + hw &&
    wz + 1 > p.z - hw && wz < p.z + hw &&
    wy + 1 > p.y && wy < p.y + 1.8
  );
}

function breakBlock() {
  const pick = pickBlock();
  if (!pick) return;
  const [wx, wy, wz] = pick.blockPos;
  const type = world.getBlock(wx, wy, wz);
  if (type === BlockType.AIR) return;
  const info = BlockInfo[type];
  world.setBlock(wx, wy, wz, BlockType.AIR);
  const cropTile = crops.getCropAt(wx, wz);
  if (cropTile) crops.harvest(wx, wz); // remove planta se o solo embaixo for quebrado
  if (info?.collectible != null) {
    inventory.add(info.collectible, 1);
    hud.render();
  }
}

function tryHarvestOrPlantOrTillOrPlace() {
  const animal = pickAnimal();
  if (animal) {
    const result = animals.collect(animal);
    if (result) {
      inventory.add(result.produce, result.count);
      hud.render();
      hud.setStatus(`Coletado: ${result.count}x item da fazenda!`);
    }
    return;
  }

  const pick = pickBlock();
  if (!pick) return;
  const [wx, wy, wz] = pick.blockPos;
  const targetType = world.getBlock(wx, wy, wz);

  // 1) Colher plantação madura na superfície mirada.
  const cropEntry = crops.getCropAt(wx, wz);
  if (cropEntry) {
    const result = crops.harvest(wx, wz);
    if (result) {
      inventory.add(result.produce, result.count);
      hud.render();
    }
    return;
  }

  const active = inventory.getActive();

  // 2) Plantar semente sobre terra arável vazia.
  if (active.type != null && SEED_TO_CROP[active.type] && targetType === BlockType.TILLED_SOIL) {
    const cropKey = SEED_TO_CROP[active.type];
    if (crops.plant(wx, wy, wz, cropKey)) {
      inventory.consumeActive(1);
      hud.render();
    }
    return;
  }

  // 3) Preparar terra (enxada) sobre grama/terra.
  if (active.type === FarmItemType.HOE && (targetType === BlockType.GRASS || targetType === BlockType.DIRT)) {
    world.setBlock(wx, wy, wz, BlockType.TILLED_SOIL);
    return;
  }

  // 4) Colocar bloco do inventário na célula adjacente.
  if (active.type != null && BlockInfo[active.type] && active.type !== BlockType.AIR) {
    const [px, py, pz] = pick.placePos;
    if (world.getBlock(px, py, pz) === BlockType.AIR && !playerAABBOverlaps(px, py, pz)) {
      world.setBlock(px, py, pz, active.type);
      inventory.consumeActive(1);
      hud.render();
    }
  }
}

renderer.domElement.addEventListener('mousedown', (e) => {
  if (!player.controls.isLocked) return;
  if (e.button === 0) breakBlock();
  if (e.button === 2) tryHarvestOrPlantOrTillOrPlace();
});
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.replace('Digit', ''), 10);
    if (n >= 1 && n <= 8) {
      inventory.setActiveIndex(n - 1);
      hud.render();
    }
  }
});

// ---------- Pointer lock / pausa (Fase 1) ----------
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
player.controls.addEventListener('lock', () => pauseOverlay.classList.remove('visible'));
player.controls.addEventListener('unlock', () => pauseOverlay.classList.add('visible'));
resumeBtn.addEventListener('click', () => player.controls.lock());
renderer.domElement.addEventListener('click', () => {
  if (!player.controls.isLocked) player.controls.lock();
});

// ---------- Fluxo de carregamento inicial (tela + Overpass, Fase 2/3) ----------
const loadingEl = document.getElementById('loading');
const loadingStatusEl = document.getElementById('loadingStatus');
const startBtn = document.getElementById('startBtn');

async function loadOsmAndStart() {
  startBtn.disabled = true;
  startBtn.textContent = 'Carregando...';
  try {
    const { raw, projection } = await fetchSantaMariaOsmData((msg) => {
      loadingStatusEl.textContent = msg;
    });
    const osmData = parseOsmData(raw, projection);
    world.setOsmData(osmData);
    loadingStatusEl.textContent = 'Dados carregados! Gerando terreno...';
  } catch (err) {
    console.error('Erro ao buscar dados da Overpass API:', err);
    loadingStatusEl.textContent =
      'Não foi possível obter dados do OpenStreetMap agora (rede/API indisponível). Iniciando com terreno padrão.';
    await new Promise((r) => setTimeout(r, 1200));
  }

  applySaveOrDefaults();

  loadingEl.style.display = 'none';
  document.getElementById('crosshair').style.display = 'block';
  document.getElementById('topbar').style.display = 'block';
  document.getElementById('status').style.display = 'block';
  document.getElementById('hud').style.display = 'flex';
  hud.render();
  player.controls.lock();
}

function applySaveOrDefaults() {
  const save = hasSave() ? loadGame() : null;
  if (save) {
    world.loadModifications(save.modifiedBlocks);
    inventory.load(save.inventory);
    crops.loadFrom(save.crops);
    if (save.animals?.length) {
      animals.loadFrom(save.animals);
    } else {
      spawnDefaultAnimals();
    }
    spawnPlayerAt(save.player.x, save.player.z, save.player.y);
    camera.rotation.y = save.player.yaw ?? 0;
    loadingStatusEl.textContent = 'Save carregado do localStorage.';
  } else {
    spawnPlayerAt(0, 0);
    spawnDefaultAnimals();
  }
}

function spawnDefaultAnimals() {
  animals.spawn('chicken', 6, 3, { x: 6, z: 3, radius: 6 });
  animals.spawn('chicken', 8, 5, { x: 8, z: 5, radius: 6 });
  animals.spawn('cow', -6, 4, { x: -6, z: 4, radius: 8 });
  animals.spawn('cow', -9, -3, { x: -9, z: -3, radius: 8 });
}

startBtn.addEventListener('click', loadOsmAndStart);

// ---------- Autosave (Fase 8) ----------
function doSave() {
  saveGame({ player, world, inventory, crops, animals });
  hud.setStatus(`Jogo salvo às ${new Date().toLocaleTimeString('pt-BR')}`);
}
setInterval(doSave, AUTOSAVE_INTERVAL_MS);
window.addEventListener('beforeunload', doSave);
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyO' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    doSave();
  }
});

// ---------- Loop principal ----------
const clock = new THREE.Clock();
let statusAccum = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (player.controls.isLocked) {
    world.updateAroundPlayer(Math.round(player.position.x), Math.round(player.position.z));
    player.update(dt);
  }
  crops.update();
  animals.update(dt);

  statusAccum += dt;
  if (statusAccum > 0.5) {
    statusAccum = 0;
    const activeSlot = inventory.getActive();
    const activeName = activeSlot.type != null ? (BlockInfo[activeSlot.type]?.name ?? '') : '(vazio)';
    hud.setStatus(
      `Pos: ${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)}\n` +
        `Item ativo: ${activeName}\n` +
        `Chunks carregados: ${world.chunks.size}`
    );
  }

  renderer.render(scene, camera);
}
animate();

console.log('%cSanta Maria Voxel Farm', 'font-weight:bold;font-size:14px;color:#ffd23f;');
console.log('Dados de mapa © colaboradores do OpenStreetMap, licença ODbL. https://www.openstreetmap.org/copyright');
console.log(`Superfície do terreno em y=${SURFACE_Y}.`);
