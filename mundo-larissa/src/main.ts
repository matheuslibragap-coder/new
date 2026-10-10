import Phaser from 'phaser';
import './ui/ui.css';
import './art/index';
import { loadOverrides } from './art/registry';
import { sfx } from './core/audio';
import { checkUnlocks } from './core/progress';
import { loadGame, S } from './core/state';
import { WorldScene } from './scenes/WorldScene';
import { setHooks } from './ui/dom';
import { icon } from './ui/icons';
import { initUI } from './ui/index';

async function start() {
  await loadOverrides();
  loadGame();
  checkUnlocks();
  setHooks(sfx, (n) => icon(n));

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    transparent: true,
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    render: { antialias: true, pixelArt: false, roundPixels: false },
    input: { activePointers: 2 },
    scene: [WorldScene],
    banner: false,
    fps: { smoothStep: false },
  });
  // ajuda para testes automáticos: posição de um tile na tela
  Object.assign(window, {
    __game: game,
    __S: () => S,
    __tileScreen: (x: number, y: number) => {
      const sc = game.scene.getScene('world') as WorldScene;
      const cam = sc.cameras.main;
      const wx = (x - y) * 32;
      const wy = (x + y) * 16;
      return { x: (wx - cam.worldView.x) * cam.zoom, y: (wy - cam.worldView.y) * cam.zoom };
    },
  });
  initUI(game);
  document.getElementById('loading')?.remove();
}

start();
