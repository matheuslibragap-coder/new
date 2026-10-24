import { readFileSync, writeFileSync } from "node:fs";
import { validarDados } from "../src/schema/validar";

const ler = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const { caso, macetes } = validarDados(ler("../src/data/caso.json"), ler("../src/data/macetes.json"));

const STATUS: Record<string, string> = {
  confirmado: "CONFIRMADO",
  fonte_secundaria: "VERIFICAR (só fonte secundária)",
  verificar: "VERIFICAR",
};

// Onde cada dispositivo é citado.
const usos = new Map<string, string[]>();
const marca = (ids: string[], onde: string) => {
  for (const id of ids) usos.set(id, [...(usos.get(id) ?? []), onde]);
};
for (const m of macetes.macetes) marca(m.dispositivos, `macete “${m.titulo}”`);
for (const t of caso.teses) marca(t.dispositivos, `tese “${t.titulo}”`);
for (const q of caso.quesitacao.quesitos) marca(q.dispositivos, `quesito ${q.rotulo}`);
for (const [, r] of Object.entries(caso.quesitacao.resultados)) marca(r.dispositivos, `resultado “${r.rotulo}”`);
for (const p of caso.pontosAtencao) marca(p.dispositivos, `ponto “${p.titulo}”`);
for (const e of caso.linhaProcesso) marca(e.dispositivos, `evento “${e.titulo}”`);
marca(caso.painel.imputacaoAtual.dispositivos, "painel (imputação)");

const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const linhas = macetes.dispositivos.map((d) => {
  const u = [...new Set(usos.get(d.id) ?? [])];
  return `| ${esc(d.rotulo)} | ${STATUS[d.status]} | ${esc(d.fonteConsultada)} [link](${d.fonteOficial}) | ${esc(d.observacao ?? "")} | ${u.length} |`;
});

const total = macetes.dispositivos.length;
const conf = macetes.dispositivos.filter((d) => d.status === "confirmado").length;
const sec = macetes.dispositivos.filter((d) => d.status === "fonte_secundaria").length;

const md = `# Verificação dos dispositivos citados

> Gerado por \`npm run verificacao\` a partir de \`src/data/macetes.json\`. Não edite à mão:
> altere o campo \`status\` / \`fonteConsultada\` no JSON e rode o comando de novo.

**Resumo:** ${total} dispositivos. ${conf} confirmados no texto oficial, ${sec} só em fonte secundária,
${total - conf - sec} sem conferência. Tudo que não está CONFIRMADO aparece com a etiqueta VERIFICAR na interface.

**Por que há tantos VERIFICAR:** em 24/10/2026 a rede deste ambiente bloqueou o acesso a
planalto.gov.br e stf.jus.br (e também a Senado, LexML e JusBrasil). A redação foi registrada
conforme conhecimento prévio e o arquivo de macetes, e precisa ser conferida no link oficial de cada linha.

## Como conferir

1. Abra o link oficial da linha.
2. Confira número, parágrafo, inciso e redação vigente (atenção a trechos revogados, riscados no Planalto).
3. Em \`src/data/macetes.json\`, troque \`status\` para \`confirmado\` e atualize \`fonteConsultada\` com a data.
4. Rode \`npm run verificacao\`.

## Dispositivos

| Dispositivo | Status | Fonte consultada | Observação | Citações |
| --- | --- | --- | --- | --- |
${linhas.join("\n")}
`;

writeFileSync(new URL("../docs/verificacao.md", import.meta.url), md);
console.log(`docs/verificacao.md gerado: ${total} dispositivos, todos com status.`);
