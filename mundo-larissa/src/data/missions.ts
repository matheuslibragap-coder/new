import type { ClothCat } from './clothes';

/**
 * MISSÕES
 * Cada mapa tem uma missão principal (id "<mapa>_main") que libera o próximo mapa,
 * e missões extras. Para criar uma missão nova: adicione um objeto nesta lista e coloque o id
 * no campo `missions` de um NPC do mapa.
 */
export type Goal =
  | { type: 'minigame'; game: string; stars: number }
  | { type: 'talk'; npc: string }
  | { type: 'find'; map: string; count: number }
  | { type: 'wear'; cat?: ClothCat; item?: string }
  | { type: 'buyClothes'; count: number }
  | { type: 'buyFurniture'; count: number }
  | { type: 'placeFurniture'; count: number }
  | { type: 'buyHouse' }
  | { type: 'visit'; map: string };

export interface MissionDef {
  id: string;
  map: string;
  giver: string;
  title: string;
  /** Fala do NPC ao oferecer a missão. */
  intro: string;
  /** O que fazer (aparece na lista de missões). */
  goalText: string;
  /** Fala ao concluir. */
  done: string;
  reward: number;
  goal: Goal;
  main?: boolean;
  requires?: string[];
}

export const MISSIONS: MissionDef[] = [
  // ---------------------------------------------------------------- Praça Central
  {
    id: 'praca_tutorial', map: 'praca', giver: 'vovo_lina', title: 'Primeiro passeio',
    intro: 'Oi, Larissa! Para passear, é só tocar no chão. Para conversar, toque nas pessoas. Vá dar um oi para o Théo, o menino de boné azul!',
    goalText: 'Converse com o Théo na Praça Central.',
    done: 'Oi, Larissa! A Vovó Lina te mandou? Que legal! Você já sabe passear!',
    reward: 50, goal: { type: 'talk', npc: 'theo' },
  },
  {
    id: 'praca_main', map: 'praca', giver: 'vovo_lina', title: 'Passarinhos famintos', main: true, requires: ['praca_tutorial'],
    intro: 'Os passarinhos da praça estão com fome! Vá até o comedouro com a estrelinha brilhante e alimente todos eles.',
    goalText: 'Jogue "Alimente os Passarinhos" e ganhe pelo menos 1 estrela.',
    done: 'Que barriguinhas cheias! Obrigada, Larissa. Agora o Shopping Estrela está aberto para você! Use a seta brilhante.',
    reward: 100, goal: { type: 'minigame', game: 'passarinhos', stars: 1 },
  },
  {
    id: 'praca_side', map: 'praca', giver: 'theo', title: 'As penas coloridas',
    intro: 'Eu estava colecionando penas coloridas e o vento espalhou 3 pela praça! Elas brilham. Me ajuda a achar?',
    goalText: 'Encontre 3 penas brilhantes na Praça Central.',
    done: 'Você achou todas! Minha coleção está completa. Valeu!',
    reward: 60, goal: { type: 'find', map: 'praca', count: 3 },
  },
  // ---------------------------------------------------------------- Shopping Estrela
  {
    id: 'shopping_main', map: 'shopping', giver: 'duda_estilista', title: 'Show na passarela', main: true,
    intro: 'Larissa! Preciso de ajuda com o desfile. Suba na passarela e repita a sequência de looks das modelos!',
    goalText: 'Jogue "Desfile da Memória" e ganhe pelo menos 1 estrela.',
    done: 'Que desfile maravilhoso! O Salão de Beleza também quer conhecer você.',
    reward: 110, goal: { type: 'minigame', game: 'desfile', stars: 1 },
  },
  {
    id: 'shopping_side', map: 'shopping', giver: 'duda_estilista', title: 'Estreia fashion', requires: ['shopping_main'],
    intro: 'Toda estilista ama estrear roupa nova! Compre uma peça na loja da Mel (ou no botão Loja) para o seu guarda-roupa.',
    goalText: 'Compre 1 roupa nova.',
    done: 'Ficou a sua cara! Não esqueça de vestir no Guarda-Roupa.',
    reward: 70, goal: { type: 'buyClothes', count: 1 },
  },
];

export const MISSION_BY_ID: Record<string, MissionDef> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
