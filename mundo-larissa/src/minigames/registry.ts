import type Phaser from 'phaser';
import { PassarinhosGame } from './passarinhos';
import { DesfileGame } from './desfile';

/**
 * LISTA DE MINI GAMES
 * Para criar um novo: faça um arquivo com uma classe que estende MiniGameBase,
 * e adicione uma linha aqui (id, nome, explicação, classe e chave da cena).
 */
export interface MiniGameInfo {
  id: string;
  name: string;
  how: string;
  scene: string;
  cls: new () => Phaser.Scene;
}

export const MINIGAMES: MiniGameInfo[] = [
  { id: 'passarinhos', name: 'Alimente os Passarinhos', scene: 'mg_passarinhos', cls: PassarinhosGame,
    how: 'Um coração vai e volta na barrinha. Toque em "Jogar sementes!" quando ele estiver na faixa verde para alimentar o passarinho com fome.' },
  { id: 'desfile', name: 'Desfile da Memória', scene: 'mg_desfile', cls: DesfileGame,
    how: 'As modelos vão brilhar uma de cada vez. Depois, toque nelas na mesma ordem! A sequência fica maior a cada rodada.' },
];

export const MG_BY_ID: Record<string, MiniGameInfo> = Object.fromEntries(MINIGAMES.map((m) => [m.id, m]));

export function registerMiniGames(game: Phaser.Game) {
  for (const m of MINIGAMES) if (!game.scene.getScene(m.scene)) game.scene.add(m.scene, m.cls, false);
}
