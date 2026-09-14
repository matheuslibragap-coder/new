# assets/

Este jogo não depende de nenhum arquivo de imagem: todos os sprites (herói,
inimigos, chefe, coletáveis, prédios) são desenhados em tempo real no
`<canvas>` a partir de pequenas grades de pixels definidas em `script.js`
(veja a seção "SPRITES PIXEL-ART"). Isso mantém o jogo rodando 100% offline
com um único `index.html`, sem passo de build e sem requisições externas.

Se quiser trocar por sprites desenhados/pixel art de verdade no futuro,
basta colocar os arquivos aqui e substituir as chamadas a `drawPixelGrid(...)`
por `ctx.drawImage(...)`.
