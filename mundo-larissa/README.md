# O Mundo da Larissa

Jogo para navegador, em português do Brasil, para meninas de 6 a 10 anos. A jogadora veste a
Larissa, passeia por 15 lugares em visão isométrica, cumpre missões, joga 15 mini games, ganha
moedas e compra roupas, móveis e casas.

- 100% offline: sem login, sem chat, sem anúncios, sem compras com dinheiro real, sem coleta de dados.
- Toda a arte é original e desenhada por código (Canvas 2D), sem imagens externas.
- Funciona com mouse e com toque, em telas a partir de 768 px de largura.
- O progresso é salvo automaticamente no `localStorage` do aparelho.

## Como rodar

Precisa do [Node.js](https://nodejs.org) 18 ou mais novo.

```bash
cd mundo-larissa
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:5173).
Para testar num tablet na mesma rede Wi-Fi, use o endereço "Network" mostrado pelo Vite.

Outros comandos:

| Comando             | O que faz                                                     |
|---------------------|---------------------------------------------------------------|
| `npm run build`     | Confere os tipos e gera a versão final na pasta `dist/`       |
| `npm run preview`   | Abre a versão final gerada pelo build                         |
| `npm run typecheck` | Só confere os tipos do TypeScript                             |

A pasta `dist/` pode ser publicada em qualquer hospedagem de site estático.

A página `http://localhost:5173/galeria.html` (só no modo dev) mostra todos os sprites do jogo e a
chave de cada um. Ela ajuda a conferir a arte e a trocar desenhos por PNG.

## Como jogar

- **Andar:** toque ou clique no chão. A Larissa desvia dos obstáculos sozinha.
- **Conversar:** toque nas pessoas. Quem tem um balão amarelo **!** tem uma missão; **?** quer
  receber um recado.
- **Mini games:** toque no objeto com a estrelinha dourada flutuando.
- **Trocar de lugar:** use os círculos brilhantes com seta ou o botão **Mapa**.
- **Barra de cima:** moedas, nível, Guarda-Roupa, Loja, Minha Casa, Mapa da Cidade, Missões,
  som e Ajustes (onde fica o botão **Recomeçar jogo**, que pede confirmação duas vezes).

## Organização do código

```
src/
  main.ts              início: carrega o save e cria o jogo
  config.ts            constantes gerais (tamanho do tile, velocidade, prêmios)
  core/                estado e save, economia, progressão, sons (Web Audio), eventos
  engine/              engine isométrica (coordenadas, profundidade) e A*
  art/                 TODA a arte, desenhada por código
    registry.ts        registro de sprites (chaves) + troca por PNG
    overrides.ts       lista de PNGs que substituem desenhos
    tiles.ts           pisos e paredes
    objects.ts         objetos de cenário dos mapas
    wallArt.ts         janelas, quadros e espelhos de parede
    furniture.ts       móveis
    houseArt.ts        fachadas das casas
    doll/              a Larissa em camadas (esqueleto, corpo, cabelo, roupas, fantasias)
  character/           personagem no mundo (caminhada) e regras de vestir
  data/                catálogos: roupas, móveis, casas, missões
  maps/                um arquivo por mapa (m01_praca.ts … m15_castelo.ts)
  missions/            motor de missões
  minigames/           um arquivo por mini game + base comum
  houses/              casas e modo decoração
  scenes/WorldScene.ts cena principal (mapa isométrico)
  ui/                  interface em HTML: barra, guarda-roupa, loja, mapa da cidade…
```

## Como adicionar coisas novas

### Uma roupa nova

Abra `src/data/clothes.ts` e acrescente uma linha numa chamada `variants(...)`:

```ts
variants('vestidos', 'vestido_rodado', [
  ['vest_rodado_lilas', 'Vestido Rodado Lilás', '#c7a8f0', '#ffffff', 'stars', 90],
  //  id único           nome na loja           cor 1      cor 2      estampa   preço
]);
```

O segundo argumento (`'vestido_rodado'`) é o **estilo**, ou seja, o desenho usado. Os estilos
existentes ficam em `src/art/doll/items.ts` (roupas, calçados, chapéus e acessórios) e
`src/art/doll/costumes.ts` (fantasias). Para criar um desenho novo, escreva uma função nesses
arquivos usando os pontos do esqueleto (`src/art/doll/skeleton.ts`). Assim a roupa aparece certa
nas 4 direções e na caminhada.

Estampas disponíveis: `none`, `dots`, `stripes`, `hearts`, `stars`, `flowers`, `check`, `glitter`.

Para bloquear um item até uma missão, use `unlockMission: 'id_da_missao'`. Para criar um prêmio
que não é vendido, use `exclusive: true`.

### Um móvel novo

1. Em `src/data/furniture.ts`, acrescente o item na categoria (id, nome, preço, largura, profundidade).
2. Em `src/art/furniture.ts`, crie o desenho com o mesmo id em `ART` (use `g.box`, `g.cyl`,
   `g.ball`…). Quadros de parede usam a arte de `src/art/wallArt.ts`.

### Um mapa novo

1. Copie um arquivo de `src/maps/` (por exemplo `m05_parque.ts`) e mude id, nome, tamanho, piso,
   objetos, NPCs, portais e mini game.
2. Importe o mapa em `src/maps/index.ts` e coloque na lista `MAPS`. O campo `order` define a ordem
   de desbloqueio. O mapa é liberado pela missão `<mapa anterior>_main` ou por `unlockCoins`.
3. Coloque um portal ligando o novo mapa a um mapa existente (campo `portals`).
4. Para aparecer no Mapa da Cidade, acrescente uma posição em `POS` (`src/ui/cityMap.ts`).

Objetos de cenário disponíveis: veja `src/art/objects.ts` ou a página `galeria.html`.

### Uma missão nova

Em `src/data/missions.ts`, crie um objeto com `id`, `map`, `giver` (id do NPC), falas e a meta
(`goal`). Depois coloque o id da missão no campo `missions` do NPC no arquivo do mapa.

Metas possíveis: `minigame`, `talk` (levar recado), `find` (achar itens brilhantes, usando o campo
`hidden` do mapa), `wear`, `buyClothes`, `buyFurniture`, `placeFurniture`, `buyHouse`, `visit`.

### Um mini game novo

1. Crie `src/minigames/meujogo.ts` com uma classe que estende `MiniGameBase`. Desenhe numa área de
   1000 x 680 e chame `this.finish(estrelas)` no final (de 1 a 3 estrelas).
2. Registre o jogo em `src/minigames/registry.ts`.
3. No mapa, aponte `minigame: { id: 'meujogo', x, y, obj: 'nome_do_objeto' }`.

### Trocar um desenho por uma imagem PNG

Cada sprite tem uma chave, por exemplo `obj:arvore`, `floor:grama:0`, `mov:sofa_lilas`,
`mg:passaro0` ou `doll:item:vest_rodado_rosa:front:0`. Para ver as chaves:

- abra `galeria.html`, ou
- rode o jogo com `?chaves` no fim do endereço (http://localhost:5173/?chaves): o console lista
  cada chave usada.

Coloque o PNG em `public/assets/sprites/` e registre em `src/art/overrides.ts`:

```ts
export const PNG_OVERRIDES: Record<string, string> = {
  'obj:arvore': 'assets/sprites/arvore.png',
};
```

A imagem deve ter o **dobro** do tamanho lógico do sprite (a arte é desenhada em escala 2) e o
mesmo ponto de apoio. A galeria mostra o tamanho de cada sprite. A Larissa é montada em camadas, e
cada camada (corpo, cabelo, cada roupa, em cada direção e quadro) pode ser trocada separadamente.
O lado esquerdo é sempre o espelho do lado direito (`side`).

## Economia e balanceamento

| Fonte                  | Moedas                                                        |
|------------------------|---------------------------------------------------------------|
| Mini game              | 1 estrela = 15, 2 = 30, 3 = 50 (metade depois de 3 partidas no dia, por jogo) |
| Missão principal       | 100 a 150                                                     |
| Missão extra           | 50 a 150                                                      |
| Subir de nível         | 60 + 15 × nível                                               |
| Presente diário        | 30, 40, 55, 70, 85, 100, 130 (dias seguidos)                  |

| Conteúdo               | Preços            | Total          |
|------------------------|-------------------|----------------|
| 142 roupas, acessórios e cabelos | 0 a 300 | cerca de 8.500 |
| 5 fantasias            | 450 a 700         | 2.950          |
| 46 móveis              | 15 a 400          | 4.700          |
| 14 pisos e paredes     | 40 a 120          | 880            |
| 5 casas                | 500 a 4.000       | 9.500          |

Ritmo esperado: a jogadora ganha cerca de 35 a 45 moedas por minuto (mini games, missões e
bônus), então compra algo novo a cada 5 a 10 minutos. Os 15 lugares são liberados em mais ou menos
1 a 2 horas pelas missões principais (ou pelo total de moedas, se ela preferir só jogar mini
games). Comprar todas as roupas, móveis e casas leva algumas horas a mais. Os valores ficam em
`src/core/economy.ts`, `src/config.ts` e nos catálogos de `src/data/`.

## Créditos e privacidade

Personagens, nomes, arte e sons são originais, criados para este jogo. O jogo não envia nenhum
dado para a internet: o save fica apenas no navegador do aparelho.
