import type Phaser from 'phaser';
import { PassarinhosGame } from './passarinhos';
import { DesfileGame } from './desfile';
import { PenteadoGame } from './penteado';
import { BoloGame } from './bolo';
import { JardimGame } from './jardim';
import { GatinhoGame } from './gatinho';
import { ConchasGame } from './conchas';
import { DancaGame } from './danca';
import { PalavrasGame } from './palavras';
import { ColheitaGame } from './colheita';
import { ArgolasGame } from './argolas';
import { PatinacaoGame } from './patinacao';
import { PinturaGame } from './pintura';
import { CristaisGame } from './cristais';
import { GrandeBaileGame } from './grandebaile';

/**
 * LISTA DE MINI GAMES
 * Para criar um novo: faça um arquivo com uma classe que estende MiniGameBase
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
  { id: 'penteado', name: 'Penteado da Cliente', scene: 'mg_penteado', cls: PenteadoGame,
    how: 'Olhe o penteado que a cliente quer. Escolha o penteado, a cor e o enfeite iguais e toque em "Pronto!". São 3 clientes.' },
  { id: 'bolo', name: 'Monte o Bolo', scene: 'mg_bolo', cls: BoloGame,
    how: 'Veja o pedido e toque nos sabores na ordem certa, de baixo para cima. Faça o máximo de bolos antes do tempo acabar!' },
  { id: 'jardim', name: 'Jardim Mágico', scene: 'mg_jardim', cls: JardimGame,
    how: 'Toque num canteiro para plantar, toque de novo para regar. Quando a flor abrir, toque para colher antes que ela murche!' },
  { id: 'gatinho', name: 'Cuidando da Bolinha', scene: 'mg_gatinho', cls: GatinhoGame,
    how: 'A gatinha Bolinha precisa de comida, banho, brincadeira e soneca. Fique de olho nas barrinhas e mantenha todas cheias!' },
  { id: 'conchas', name: 'Caça às Conchas', scene: 'mg_conchas', cls: ConchasGame,
    how: 'Toque na areia para a Larissa andar até lá. Pegue as conchinhas e fuja dos caranguejos!' },
  { id: 'danca', name: 'Ritmo da Dança', scene: 'mg_danca', cls: DancaGame,
    how: 'As setas descem pela pista. Toque no botão da mesma cor quando a seta chegar no círculo. Também dá para usar as setas do teclado.' },
  { id: 'palavras', name: 'Palavras Escondidas', scene: 'mg_palavras', cls: PalavrasGame,
    how: 'Encontre as palavras da lista no quadro de letras. Elas estão deitadas ou em pé. Toque na primeira e na última letra.' },
  { id: 'colheita', name: 'Colheita Rápida', scene: 'mg_colheita', cls: ColheitaGame,
    how: 'Mexa a cesta para pegar as frutas que caem. Cuidado com as abelhas!' },
  { id: 'argolas', name: 'Barraca das Argolas', scene: 'mg_argolas', cls: ArgolasGame,
    how: 'A setinha balança de um lado para o outro. Toque em "Lançar!" quando ela apontar para uma garrafinha. Você tem 10 argolas.' },
  { id: 'patinacao', name: 'Patinação no Gelo', scene: 'mg_patinacao', cls: PatinacaoGame,
    how: 'Toque nos botões (ou nos lados da tela) para trocar de faixa. Pegue as estrelas e desvie dos obstáculos!' },
  { id: 'pintura', name: 'Pinte o Quadro', scene: 'mg_pintura', cls: PinturaGame,
    how: 'Escolha uma cor e toque nas partes do quadro para pintar igualzinho ao modelo. São 3 quadros.' },
  { id: 'cristais', name: 'Cristais Mágicos', scene: 'mg_cristais', cls: CristaisGame,
    how: 'Troque dois cristais vizinhos para juntar 3 ou mais iguais em linha. Combos valem mais pontos!' },
  { id: 'baile', name: 'O Grande Baile', scene: 'mg_baile', cls: GrandeBaileGame,
    how: 'O desafio final tem 3 etapas: desfile de memória, dança no ritmo e uma pergunta sobre os lugares que você visitou. Brilhe!' },
];

export const MG_BY_ID: Record<string, MiniGameInfo> = Object.fromEntries(MINIGAMES.map((m) => [m.id, m]));

export function registerMiniGames(game: Phaser.Game) {
  for (const m of MINIGAMES) if (!game.scene.getScene(m.scene)) game.scene.add(m.scene, m.cls, false);
}
