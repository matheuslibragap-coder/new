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
  // ---------------------------------------------------------------- Salão de Beleza
  {
    id: 'salao_main', map: 'salao', giver: 'carol_cabeleireira', title: 'Clientes caprichosas', main: true,
    intro: 'Que bom que você veio! Tenho três clientes esperando e cada uma quer um penteado diferente. Me ajuda?',
    goalText: 'Jogue "Penteado da Cliente" e ganhe pelo menos 1 estrela.',
    done: 'Todas saíram lindas! A Confeitaria Doce Nuvem está te esperando.',
    reward: 110, goal: { type: 'minigame', game: 'penteado', stars: 1 },
  },
  {
    id: 'salao_side', map: 'salao', giver: 'carol_cabeleireira', title: 'Cabeça enfeitada', requires: ['salao_main'],
    intro: 'Uma tiara deixa qualquer penteado mais especial! Compre uma tiara na Loja e use no seu look.',
    goalText: 'Vista uma tiara.',
    done: 'Ficou um charme! Você é uma estrela da moda.',
    reward: 70, goal: { type: 'wear', cat: 'tiaras' },
  },
  // ---------------------------------------------------------------- Confeitaria
  {
    id: 'confeitaria_main', map: 'confeitaria', giver: 'chef_lu', title: 'Pedidos doces', main: true,
    intro: 'Chegou uma chuva de pedidos de bolo! Monte cada bolo com as camadas na ordem certa.',
    goalText: 'Jogue "Monte o Bolo" e ganhe pelo menos 1 estrela.',
    done: 'Que bolos perfeitos! O Parque das Flores abriu os portões para você.',
    reward: 115, goal: { type: 'minigame', game: 'bolo', stars: 1 },
  },
  {
    id: 'confeitaria_side', map: 'confeitaria', giver: 'chef_lu', title: 'Bolinho para a vovó', requires: ['confeitaria_main'],
    intro: 'Fiz um bolinho de presente para a Vovó Lina, lá na Praça Central. Você entrega para mim?',
    goalText: 'Leve o bolinho para a Vovó Lina na Praça Central.',
    done: 'Um bolinho da Chef Lu? Que delícia! Obrigada, Larissa, você é um amor!',
    reward: 80, goal: { type: 'talk', npc: 'vovo_lina' },
  },
  // ---------------------------------------------------------------- Parque das Flores
  {
    id: 'parque_main', map: 'parque', giver: 'jardineira_bia', title: 'Jardim encantado', main: true,
    intro: 'O Jardim Mágico precisa de alguém caprichosa! Plante, regue e colha as flores antes que murchem.',
    goalText: 'Jogue "Jardim Mágico" e ganhe pelo menos 1 estrela.',
    done: 'Que flores lindas! A Clínica dos Bichinhos quer te conhecer.',
    reward: 115, goal: { type: 'minigame', game: 'jardim', stars: 1 },
  },
  {
    id: 'parque_side', map: 'parque', giver: 'jardineira_bia', title: 'Flores fujonas', requires: ['parque_main'],
    intro: 'Três flores mágicas saíram passeando pelo parque! Elas brilham. Consegue encontrar?',
    goalText: 'Encontre 3 flores mágicas no Parque das Flores.',
    done: 'Você achou todas! Agora elas voltaram para o canteiro.',
    reward: 80, goal: { type: 'find', map: 'parque', count: 3 },
  },
  // ---------------------------------------------------------------- Clínica
  {
    id: 'clinica_main', map: 'clinica', giver: 'dra_ana', title: 'Cuidando da Bolinha', main: true,
    intro: 'A gatinha Bolinha precisa de alguém para cuidar dela hoje: comida, banho, brincadeira e soneca!',
    goalText: 'Jogue "Cuidando da Bolinha" e ganhe pelo menos 1 estrela.',
    done: 'A Bolinha está ronronando de felicidade! A Praia Coral está liberada.',
    reward: 120, goal: { type: 'minigame', game: 'gatinho', stars: 1 },
  },
  {
    id: 'clinica_side', map: 'clinica', giver: 'dra_ana', title: 'Cantinho do pet', requires: ['clinica_main'],
    intro: 'Todo bichinho merece um cantinho! Compre um móvel na Loja para deixar a sua casa ainda mais aconchegante.',
    goalText: 'Compre 1 móvel na Loja.',
    done: 'Que escolha linda! Sua casa vai ficar uma graça.',
    reward: 80, goal: { type: 'buyFurniture', count: 1 },
  },
  // ---------------------------------------------------------------- Praia
  {
    id: 'praia_main', map: 'praia', giver: 'surfista_mari', title: 'Tesouros da areia', main: true,
    intro: 'A maré trouxe um montão de conchinhas! Pegue o máximo que puder, mas cuidado com os caranguejos!',
    goalText: 'Jogue "Caça às Conchas" e ganhe pelo menos 1 estrela.',
    done: 'Que coleção incrível! Agora a fantasia de Sereia está na Loja e a Escola de Dança abriu!',
    reward: 125, goal: { type: 'minigame', game: 'conchas', stars: 1 },
  },
  {
    id: 'praia_side', map: 'praia', giver: 'surfista_mari', title: 'Estrelas-do-mar', requires: ['praia_main'],
    intro: 'Três estrelas-do-mar se esconderam pela praia. Elas brilham na areia! Me ajuda a achar?',
    goalText: 'Encontre 3 estrelas-do-mar na Praia Coral.',
    done: 'Achou todas! Vou devolvê-las com carinho para o mar.',
    reward: 85, goal: { type: 'find', map: 'praia', count: 3 },
  },
  // ---------------------------------------------------------------- Escola de Dança
  {
    id: 'danca_main', map: 'danca', giver: 'prof_lia', title: 'Coreografia nova', main: true,
    intro: 'Vamos ensaiar a coreografia do Grande Baile! Acerte os passinhos no ritmo da música.',
    goalText: 'Jogue "Ritmo da Dança" e ganhe pelo menos 1 estrela.',
    done: 'Você dança como uma estrela! A fantasia de Bailarina chegou na Loja, e a Biblioteca abriu.',
    reward: 125, goal: { type: 'minigame', game: 'danca', stars: 1 },
  },
  {
    id: 'danca_side', map: 'danca', giver: 'prof_lia', title: 'Pés de bailarina', requires: ['danca_main'],
    intro: 'Bailarinas usam sapatos delicados! Vista um sapato (sapatilha ou sapato de boneca).',
    goalText: 'Vista um sapato da categoria Sapatos.',
    done: 'Perfeito para dançar nas pontinhas!',
    reward: 80, goal: { type: 'wear', cat: 'sapatos' },
  },
  // ---------------------------------------------------------------- Biblioteca
  {
    id: 'biblioteca_main', map: 'biblioteca', giver: 'biblio_iris', title: 'Palavras mágicas', main: true,
    intro: 'O Livro Mágico escondeu palavras entre as letras! Encontre todas para ele voltar a brilhar.',
    goalText: 'Jogue "Palavras Escondidas" e ganhe pelo menos 1 estrela.',
    done: 'O livro brilhou de novo! A Fazendinha Feliz está te esperando.',
    reward: 130, goal: { type: 'minigame', game: 'palavras', stars: 1 },
  },
  {
    id: 'biblioteca_side', map: 'biblioteca', giver: 'biblio_iris', title: 'Livros perdidos', requires: ['biblioteca_main'],
    intro: 'Três livrinhos saíram das prateleiras! Eles brilham quando estão perdidos. Pode buscar?',
    goalText: 'Encontre 3 livros brilhantes na Biblioteca.',
    done: 'Todos de volta! Obrigada, pequena leitora.',
    reward: 85, goal: { type: 'find', map: 'biblioteca', count: 3 },
  },
  // ---------------------------------------------------------------- Fazendinha
  {
    id: 'fazenda_main', map: 'fazenda', giver: 'fazendeira_tina', title: 'Hora da colheita', main: true,
    intro: 'As frutas estão caindo das árvores! Pegue com a cesta, mas fuja das abelhas.',
    goalText: 'Jogue "Colheita Rápida" e ganhe pelo menos 1 estrela.',
    done: 'Que cesta cheia! O Parque de Diversões abriu para você.',
    reward: 130, goal: { type: 'minigame', game: 'colheita', stars: 1 },
  },
  {
    id: 'fazenda_side', map: 'fazenda', giver: 'fazendeira_tina', title: 'Ovos fresquinhos', requires: ['fazenda_main'],
    intro: 'A Chef Lu, da Confeitaria, pediu ovos fresquinhos para os bolos. Você leva para ela?',
    goalText: 'Leve os ovos para a Chef Lu na Confeitaria Doce Nuvem.',
    done: 'Ovos da fazendinha! Agora meus bolos vão ficar ainda mais fofinhos. Obrigada!',
    reward: 90, goal: { type: 'talk', npc: 'chef_lu' },
  },
  // ---------------------------------------------------------------- Parque de Diversões
  {
    id: 'diversoes_main', map: 'diversoes', giver: 'palhaca_lola', title: 'Mira certeira', main: true,
    intro: 'Na Barraca das Argolas, quem acerta as garrafinhas ganha prêmios! Vamos tentar?',
    goalText: 'Jogue "Barraca das Argolas" e ganhe pelo menos 1 estrela.',
    done: 'Que mira! A fantasia de Astronauta foi para a Loja, e a Pista de Gelo abriu!',
    reward: 135, goal: { type: 'minigame', game: 'argolas', stars: 1 },
  },
  {
    id: 'diversoes_side', map: 'diversoes', giver: 'palhaca_lola', title: 'Casa divertida', requires: ['diversoes_main'],
    intro: 'Uma casa divertida tem coisas novas sempre! Vá para a sua casa, toque em Decorar e coloque um móvel.',
    goalText: 'Coloque 1 móvel na sua casa (modo Decorar).',
    done: 'Ficou uma casa animada! Adorei.',
    reward: 90, goal: { type: 'placeFurniture', count: 1 },
  },
  // ---------------------------------------------------------------- Pista de Gelo
  {
    id: 'gelo_main', map: 'gelo', giver: 'patinadora_neve', title: 'Deslizando', main: true,
    intro: 'Calce os patins! Deslize pela pista, pegue as estrelas e desvie dos obstáculos.',
    goalText: 'Jogue "Patinação no Gelo" e ganhe pelo menos 1 estrela.',
    done: 'Você desliza como uma pluma! O Ateliê de Arte está aberto.',
    reward: 140, goal: { type: 'minigame', game: 'patinacao', stars: 1 },
  },
  {
    id: 'gelo_side', map: 'gelo', giver: 'patinadora_neve', title: 'Cabeça quentinha', requires: ['gelo_main'],
    intro: 'Brrr, que frio! Um chapéu ou gorro deixa a cabeça quentinha. Vista um da categoria Chapéus.',
    goalText: 'Vista um chapéu (categoria Chapéus).',
    done: 'Agora sim, pronta para o inverno!',
    reward: 90, goal: { type: 'wear', cat: 'chapeus' },
  },
  // ---------------------------------------------------------------- Ateliê
  {
    id: 'atelie_main', map: 'atelie', giver: 'artista_nico', title: 'Pequena artista', main: true,
    intro: 'Preciso de ajuda para pintar três quadros iguais aos modelos. Escolha as cores e capriche!',
    goalText: 'Jogue "Pinte o Quadro" e ganhe pelo menos 1 estrela.',
    done: 'Obras de arte! A Floresta dos Cristais abriu para você.',
    reward: 140, goal: { type: 'minigame', game: 'pintura', stars: 1 },
  },
  {
    id: 'atelie_side', map: 'atelie', giver: 'artista_nico', title: 'Um novo lar', requires: ['atelie_main'],
    intro: 'Toda artista sonha com um lugar inspirador! Que tal comprar uma casa nova na Loja?',
    goalText: 'Compre uma casa nova.',
    done: 'Uma casa nova! Imagine quantos quadros você vai pendurar lá.',
    reward: 150, goal: { type: 'buyHouse' },
  },
  // ---------------------------------------------------------------- Floresta dos Cristais
  {
    id: 'floresta_main', map: 'floresta', giver: 'fada_lume', title: 'Luz dos cristais', main: true,
    intro: 'Os cristais perderam o brilho! Junte três ou mais iguais para acender a magia de novo.',
    goalText: 'Jogue "Cristais Mágicos" e ganhe pelo menos 1 estrela.',
    done: 'A floresta brilha outra vez! A fantasia de Fada está na Loja, e o Castelo das Estrelas te espera!',
    reward: 145, goal: { type: 'minigame', game: 'cristais', stars: 1 },
  },
  {
    id: 'floresta_side', map: 'floresta', giver: 'fada_lume', title: 'Cristais perdidos', requires: ['floresta_main'],
    intro: 'Três cristaizinhos rolaram para longe. Eles brilham bem forte! Pode trazê-los?',
    goalText: 'Encontre 3 cristais brilhantes na Floresta.',
    done: 'Obrigada! Agora a floresta está completa.',
    reward: 90, goal: { type: 'find', map: 'floresta', count: 3 },
  },
  // ---------------------------------------------------------------- Castelo
  {
    id: 'castelo_main', map: 'castelo', giver: 'rainha_estela', title: 'O Grande Baile', main: true,
    intro: 'Larissa, você ajudou a cidade inteira! Agora é a hora do Grande Baile: desfile, dança e uma pergunta especial. Pronta?',
    goalText: 'Jogue "O Grande Baile" e complete as 3 etapas.',
    done: 'Você é a Estrela do Baile! Receba a Coroa de Estrela e a Fantasia Estrela Brilhante!',
    reward: 150, goal: { type: 'minigame', game: 'baile', stars: 1 },
  },
  {
    id: 'castelo_side', map: 'castelo', giver: 'rainha_estela', title: 'Realeza fashion', requires: ['castelo_main'],
    intro: 'Toda estrela do baile merece brilhar! Vista uma coroa no seu look.',
    goalText: 'Vista uma coroa.',
    done: 'Majestosa! A cidade inteira está orgulhosa de você.',
    reward: 100, goal: { type: 'wear', cat: 'coroas' },
  },
];

export const MISSION_BY_ID: Record<string, MissionDef> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
