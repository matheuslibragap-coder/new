import { SAVE_KEY } from '../config.js';

export function saveGame({ player, world, inventory, crops, animals }) {
  const data = {
    version: 1,
    savedAt: Date.now(),
    player: {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z,
      yaw: player.camera.rotation.y,
    },
    modifiedBlocks: world.serializeModifications(),
    inventory: inventory.serialize(),
    crops: crops.serialize(),
    animals: animals.serialize(),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn('Falha ao salvar jogo no localStorage:', err);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Falha ao carregar save do localStorage:', err);
    return null;
  }
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) != null;
}
