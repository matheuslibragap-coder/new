# Júri simulado: sistema de estudo para a defesa

Aplicação local para entender um processo do Tribunal do Júri em poucos minutos, estudar a
estratégia de defesa e consultar no plenário, pelo celular, os requerimentos e as técnicas
processuais. Não tem backend nem banco: todo o conteúdo vem de dois arquivos JSON.

## Como rodar

```bash
cd juri-simulado
npm install
npm run dev            # abre em http://localhost:5173
npm run dev:celular    # acessível pelo celular na mesma rede Wi-Fi (use o endereço "Network" que aparece)
```

Outros comandos:

| Comando | O que faz |
| --- | --- |
| `npm run validar` | Valida `caso.json` e `macetes.json` com o schema zod e confere as referências cruzadas |
| `npm test` | Testes (simulador de quesitação e integridade dos dados) |
| `npm run build` | Valida os dados, checa os tipos e gera `dist/` (dá para abrir `dist/index.html` sem servidor) |
| `npm run verificacao` | Regenera `docs/verificacao.md` a partir dos status gravados em `macetes.json` |

## Módulos

1. **Painel do caso**: partes, processo, vara, imputação, fase simulada, resumo em cinco linhas.
2. **Linha do tempo**: linha do fato (relatos) separada da linha do processo, com filtros por fase e impacto.
3. **Mapa de provas**: favorece × dificulta, com peso, fonte e resposta da defesa; comparação do relato da
   testemunha-chave fase a fase.
4. **Pontos de atenção**: risco, motivo e como neutralizar.
5. **Árvore de teses**: prioridade, fundamento, provas, quesito e tempo de fala; sustentação-modelo com versão revisada.
6. **Simulador de quesitação**: votos dos 7 jurados, regras de encerramento do art. 483 do CPP e faixa de pena abstrata.
7. **Macetes de plenário**: em ordem cronológica, cada um com artigos, momento, pedido, fórmula, consequência e
   aplicação ao caso.
8. **Modo plenário**: cronômetro dos debates (art. 477), requerimentos na ordem da sessão com "copiar" e checklist.

Artigos com a etiqueta **VERIFICAR** ainda não foram conferidos no texto oficial (ver `docs/verificacao.md`).
Toque no artigo para ver o resumo, o status e o link oficial.

## Onde está cada coisa

```
docs/estudo-caso.md        fonte única dos fatos do caso (nada entra no caso.json sem estar aqui)
docs/macetes-fonte.md      material de origem dos macetes
docs/verificacao.md        status de cada dispositivo citado (gerado)
src/data/caso.json         TODO o conteúdo do caso concreto
src/data/macetes.json      técnica genérica de plenário + cadastro de dispositivos legais
src/schema/                schemas zod e validação cruzada
src/lib/quesitacao.ts      regras do simulador (testadas em quesitacao.test.ts)
src/modulos/               telas
```

## Como trocar o caso (reaproveitar em outro júri)

A interface não contém texto de caso nenhum: um teste (`src/data/dados.test.ts`) falha se algum nome
ou número do processo aparecer no código. Para usar o sistema em outro júri:

1. **Escreva o novo `docs/estudo-caso.md`.** Ele é a fonte única dos fatos. O que não constar dele
   deve aparecer como `null` nos campos de data e folha (a tela mostra “não consta nos autos”).
2. **Substitua `src/data/caso.json`.** Mantenha a estrutura; os blocos são:
   - `meta` e `painel`: identificação, imputação atual (com ids de dispositivos), **exatamente 5 linhas** de resumo, pessoas;
   - `linhaFato` e `linhaProcesso`: cada evento com `fonte: { peca, folha }` e `impacto` (`favorece`/`prejudica`/`neutro`);
     as fases do processo são `inquerito`, `instrucao`, `primeira-fase`, `recursos`, `plenario`, `execucao`;
   - `provas.favorece` e `provas.dificulta` (estas com `respostaDefesa`);
   - `testemunhaChave`: nome e as linhas de comparação polícia × juízo × plenário (`semFase` quando a fase não é conhecida);
   - `pontosAtencao`, `principio`, `recomendacao`, `teses` (com `pai` para teses votadas no mesmo quesito, `provas` com
     ids do mapa e `minutos`);
   - `quesitacao`: os quesitos do caso (é obrigatório ter um de cada tipo: `materialidade`, `autoria`, `absolvicao`,
     `diminuicao`, `qualificadora`; `desclassificacao` é opcional) e os seis `resultados` com a pena abstrata;
   - `roteiros`, `criteriosJurados`, `falasMP`, `sustentacao`, `checklist`;
   - `macetes`: **uma entrada para cada macete de `macetes.json`**, com `aplicacao` ao caso e, se quiser, uma `formula`
     já preenchida para o caso (substitui a genérica no Modo plenário).
3. **Revise `src/data/macetes.json`** só se precisar: os macetes são genéricos. Se o novo caso citar um artigo
   que não está em `dispositivos`, cadastre-o lá (id, rótulo, resumo, link oficial, `status`).
4. **Rode `npm run validar`.** A validação aponta campo vazio, id repetido, artigo não cadastrado, macete sem
   aplicação, tese apontando para prova inexistente e quesito faltando.
5. **Rode `npm test` e `npm run verificacao`.**

Se o novo caso tiver mais de uma qualificadora ou causa de diminuição, o simulador precisará de ajuste em
`src/lib/quesitacao.ts` (hoje ele combina uma causa de diminuição e uma qualificadora).

## Conferência dos dispositivos

Cada dispositivo em `macetes.json` tem `status`:

- `confirmado`: conferido no texto oficial (Planalto ou STF);
- `fonte_secundaria`: conferido só em fonte secundária (aparece como VERIFICAR);
- `verificar`: não conferido (aparece como VERIFICAR).

Depois de conferir no link oficial, troque o status, atualize `fonteConsultada` com a data e rode `npm run verificacao`.
