/**
 * TROCA DE ARTE POR PNG
 * ---------------------
 * Todo sprite do jogo tem uma "chave" (ex.: 'obj:arvore', 'floor:grama', 'mg:passarinho').
 * Para trocar o desenho feito por código por uma imagem PNG, coloque o arquivo em
 * `public/assets/sprites/` e adicione uma linha aqui:
 *
 *   'obj:arvore': 'assets/sprites/arvore.png',
 *
 * A imagem deve ter o DOBRO do tamanho lógico do sprite (ART_SCALE = 2) e o mesmo
 * ponto de apoio (origem). Ative `?chaves` na URL para ver no console a lista de chaves usadas.
 */
export const PNG_OVERRIDES: Record<string, string> = {
  // 'obj:arvore': 'assets/sprites/arvore.png',
};
