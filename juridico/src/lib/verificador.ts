/**
 * M9 Verificador de petição: análise local do texto.
 * A verificação de números CNJ no DataJud é feita no servidor (ver verificador-servidor.ts).
 * Regra de ouro: nunca afirmar que uma citação existe sem ter encontrado a fonte.
 */
import { extrairNumerosCnj, validarCnj, formatarCnj } from "./cnj";
import { identificarTribunal } from "./tribunais";

export type Gravidade = "ok" | "alerta" | "erro" | "nao_verificado";

export type Achado = {
  categoria: "processo" | "jurisprudencia" | "artigo" | "data" | "parte" | "formatacao";
  gravidade: Gravidade;
  trecho: string;
  mensagem: string;
  link?: string;
  indice?: number;
};

export type LeiRef = { sigla: string; nome: string; apelidos: string[]; ultimo_artigo: number };

export type CitacaoCnj = {
  digitos: string;
  formatado: string;
  bruto: string;
  indice: number;
  dvValido: boolean;
  tribunalPeloNumero: string | null;
  aliasDatajud: string | null;
  tribunalCitado: string | null;
  classeCitada: string | null;
  contexto: string;
};

export const AVISO_NAO_VERIFICADO = "NÃO VERIFICADO, confira no site do tribunal";

const CLASSES = [
  "Apelação Cível", "Apelação Criminal", "Apelação", "Agravo de Instrumento", "Agravo Interno", "Agravo Regimental",
  "Agravo de Petição", "Recurso Especial", "Recurso Extraordinário", "Recurso Ordinário", "Recurso de Revista",
  "Recurso Inominado", "Mandado de Segurança", "Habeas Corpus", "Embargos de Declaração", "Embargos de Divergência",
  "Ação Rescisória", "Conflito de Competência", "Reclamação", "Procedimento Comum", "Execução de Título Extrajudicial",
  "Cumprimento de Sentença", "Ação Trabalhista", "Reclamação Trabalhista", "Ação Civil Pública",
];

const TRIBUNAIS_RE = /\b(STF|STJ|TST|TSE|STM|TJ[A-Z]{2}|TJDFT|TRF\s?\d|TRT\s?\d{1,2}|TJ\/[A-Z]{2}|TRT-\d{1,2}|TRF-\d)\b/g;

export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizarSiglaTribunal(s: string): string {
  return s.toUpperCase().replace(/[\s\/-]/g, "").replace(/^TJ([A-Z]{2})$/, "TJ$1");
}

function janela(texto: string, i: number, raio = 160): string {
  return texto.slice(Math.max(0, i - raio), Math.min(texto.length, i + raio));
}

export function extrairCitacoesCnj(texto: string): CitacaoCnj[] {
  return extrairNumerosCnj(texto).map((n) => {
    const v = validarCnj(n.digitos);
    const trib = identificarTribunal(n.digitos.slice(13, 14), n.digitos.slice(14, 16));
    const ctx = janela(texto, n.indice);
    const tribs = [...ctx.matchAll(TRIBUNAIS_RE)].map((m) => normalizarSiglaTribunal(m[1]));
    const ctxNorm = normalizar(ctx);
    const classe = CLASSES.find((c) => ctxNorm.includes(normalizar(c))) ?? null;
    return {
      digitos: n.digitos,
      formatado: formatarCnj(n.digitos),
      bruto: n.bruto,
      indice: n.indice,
      dvValido: v.valido,
      tribunalPeloNumero: trib?.sigla ?? null,
      aliasDatajud: trib?.alias ?? null,
      tribunalCitado: tribs[0] ?? null,
      classeCitada: classe,
      contexto: ctx,
    };
  });
}

/** Links de busca nos sites oficiais. */
export function linkBusca(tribunal: string | null, termo: string): string {
  const q = encodeURIComponent(termo);
  switch ((tribunal || "").toUpperCase()) {
    case "STJ":
      return `https://scon.stj.jus.br/SCON/pesquisar.jsp?livre=${q}`;
    case "STF":
      return `https://jurisprudencia.stf.jus.br/pages/search?base=acordaos&queryString=${q}`;
    case "TST":
      return `https://jurisprudencia.tst.jus.br/?q=${q}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`site:jus.br "${termo}"`)}`;
  }
}

const RE_JURIS = new RegExp(
  String.raw`\b(AgInt\s+no\s+AREsp|AgInt\s+no\s+REsp|AgRg\s+no\s+AREsp|AgRg\s+no\s+REsp|EDcl\s+no\s+REsp|REsp|AREsp|RE|ARE|HC|RHC|RMS|MS|ADI|ADPF|ADC|Rcl|RR|AIRR|Ag-RR)\s*(?:n[º°o.]\s*)?(\d{1,3}(?:\.\d{3})+|\d{3,7})(?:\s*\/\s*([A-Z]{2}))?`,
  "g",
);
const STF_CLASSES = new Set(["RE", "ARE", "ADI", "ADPF", "ADC", "Rcl"]);
const TST_CLASSES = new Set(["RR", "AIRR", "Ag-RR"]);

export function extrairJurisprudencia(texto: string): Achado[] {
  const achados: Achado[] = [];
  for (const m of texto.matchAll(RE_JURIS)) {
    const classe = m[1].replace(/\s+/g, " ");
    const base = classe.split(" ").pop()!;
    const ctx = janela(texto, m.index ?? 0, 80);
    const tribCtx = [...ctx.matchAll(TRIBUNAIS_RE)].map((x) => normalizarSiglaTribunal(x[1]))[0];
    const tribunal = STF_CLASSES.has(base) ? "STF" : TST_CLASSES.has(base) ? "TST" : ["HC", "RHC", "MS", "RMS"].includes(base) ? tribCtx ?? "STJ" : "STJ";
    achados.push({
      categoria: "jurisprudencia",
      gravidade: "nao_verificado",
      trecho: m[0],
      mensagem: `${AVISO_NAO_VERIFICADO}. Precedente citado (${tribunal}) sem verificação automática disponível.`,
      link: linkBusca(tribunal, `${classe} ${m[2]}`),
      indice: m.index,
    });
  }
  for (const m of texto.matchAll(/\bS[úu]mula\s+(Vinculante\s+)?(?:n[º°o.]\s*)?(\d{1,4})\s*(?:d[oa]\s+)?(STF|STJ|TST|TSE)?/gi)) {
    const trib = m[1] ? "STF" : (m[3] || "").toUpperCase() || null;
    achados.push({
      categoria: "jurisprudencia",
      gravidade: "nao_verificado",
      trecho: m[0].trim(),
      mensagem: `${AVISO_NAO_VERIFICADO}. Confira o enunciado e se a súmula não foi cancelada.`,
      link: linkBusca(trib, m[0].trim()),
      indice: m.index,
    });
  }
  for (const m of texto.matchAll(/\bTema\s+(?:n[º°o.]\s*)?(\d{1,4})\s*(?:d[oa]\s+)?(STF|STJ|TST)?/gi)) {
    const trib = (m[2] || "").toUpperCase() || null;
    achados.push({
      categoria: "jurisprudencia",
      gravidade: "nao_verificado",
      trecho: m[0].trim(),
      mensagem: `${AVISO_NAO_VERIFICADO}. Confira a tese firmada e a situação do tema.`,
      link: linkBusca(trib, m[0].trim()),
      indice: m.index,
    });
  }
  // Ementas ou acórdãos citados sem número verificável
  for (const m of texto.matchAll(/\(([^()]{0,160}\b(?:Rel\.|Relator|julgad[oa] em|DJe)[^()]{0,160})\)/g)) {
    const temNumero = extrairNumerosCnj(m[1]).length > 0 || RE_JURIS.test(m[1]);
    RE_JURIS.lastIndex = 0;
    if (!temNumero) {
      const trib = [...m[1].matchAll(TRIBUNAIS_RE)].map((x) => normalizarSiglaTribunal(x[1]))[0] ?? null;
      achados.push({
        categoria: "jurisprudencia",
        gravidade: "nao_verificado",
        trecho: m[0].slice(0, 200),
        mensagem: `${AVISO_NAO_VERIFICADO}. Acórdão citado sem número de processo identificável.`,
        link: linkBusca(trib, m[1].slice(0, 80)),
        indice: m.index,
      });
    }
  }
  return achados;
}

function escaparRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
}

export function verificarArtigos(texto: string, leis: LeiRef[]): Achado[] {
  const achados: Achado[] = [];
  for (const lei of leis) {
    const apelidos = [...lei.apelidos].sort((a, b) => b.length - a.length).map(escaparRegex).join("|");
    const re = new RegExp(String.raw`\bart(?:igo)?s?\.?\s*(\d{1,2}(?:\.\d{3})|\d{1,4})(?:-[A-Z])?\b[^\n.;]{0,60}?\b(?:d[oa]|n[oa])\s+(?:${apelidos})(?![\w/])`, "gi");
    for (const m of texto.matchAll(re)) {
      const n = Number(m[1].replace(/\./g, ""));
      if (n < 1 || n > lei.ultimo_artigo) {
        achados.push({
          categoria: "artigo",
          gravidade: "erro",
          trecho: m[0],
          mensagem: `Numeração inválida: ${lei.nome} vai até o art. ${lei.ultimo_artigo.toLocaleString("pt-BR")}.`,
          indice: m.index,
        });
      }
    }
  }
  return achados;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function dataValida(d: number, m: number, a: number): boolean {
  const x = new Date(Date.UTC(a, m - 1, d));
  return x.getUTCFullYear() === a && x.getUTCMonth() === m - 1 && x.getUTCDate() === d;
}

export function verificarDatas(texto: string, hoje: string): Achado[] {
  const achados: Achado[] = [];
  const checar = (d: number, m: number, a: number, trecho: string, indice?: number) => {
    if (!dataValida(d, m, a)) {
      achados.push({ categoria: "data", gravidade: "erro", trecho, mensagem: "Data impossível.", indice });
      return;
    }
    const iso = `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (a < 1900) achados.push({ categoria: "data", gravidade: "alerta", trecho, mensagem: "Ano improvável.", indice });
    else if (iso > hoje) achados.push({ categoria: "data", gravidade: "alerta", trecho, mensagem: "Data futura. Confira se é intencional (ex.: audiência designada).", indice });
  };
  for (const m of texto.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)) checar(+m[1], +m[2], +m[3], m[0], m.index);
  const reExt = new RegExp(String.raw`\b(\d{1,2})º?\s+de\s+(${MESES.join("|")})\s+de\s+(\d{4})\b`, "gi");
  for (const m of texto.matchAll(reExt)) checar(+m[1], MESES.indexOf(m[2].toLowerCase()) + 1, +m[3], m[0], m.index);
  return achados;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

const PALAVRAS_NAO_NOME = new Set(["excelentissimo", "senhor", "senhora", "doutor", "doutora", "juiz", "juiza", "direito", "vara", "comarca", "estado", "tribunal", "justica", "acao", "fatos", "pedidos", "termos", "nestes", "pede", "deferimento", "ministerio", "publico", "civel", "trabalho", "federal", "regional", "excelencia"]);

export function extrairNomesPartes(texto: string): string[] {
  const nomes = new Set<string>();
  const papeis = "AUTORA?|RÉU|RÉ|REQUERENTE|REQUERID[OA]|RECLAMANTE|RECLAMAD[OA]|EXEQUENTE|EXECUTAD[OA]|APELANTE|APELAD[OA]|AGRAVANTE|AGRAVAD[OA]|IMPETRANTE|IMPETRAD[OA]|EMBARGANTE|EMBARGAD[OA]";
  const reNome = String.raw`([A-ZÀ-Ý][A-Za-zÀ-ÿ'.]+(?:\s+(?:d[aeo]s?|e|[A-ZÀ-Ý][A-Za-zÀ-ÿ'.]+)){1,6})`;
  for (const m of texto.matchAll(new RegExp(String.raw`\b(?:${papeis})\s*[:\-]\s*${reNome}`, "g"))) nomes.add(m[1].trim());
  for (const m of texto.matchAll(new RegExp(String.raw`${reNome},\s*(?:brasileir[oa]|nacionalidade|pessoa jurídica|inscrit[oa] no C[NP])`, "g"))) nomes.add(m[1].trim());
  return [...nomes].filter((n) => {
    const palavras = normalizar(n).split(" ");
    return palavras.length >= 2 && !palavras.some((p) => PALAVRAS_NAO_NOME.has(p));
  });
}

export function verificarPartes(texto: string): Achado[] {
  const nomes = extrairNomesPartes(texto);
  const achados: Achado[] = [];
  const visto = new Set<string>();
  for (let i = 0; i < nomes.length; i++) {
    for (let j = i + 1; j < nomes.length; j++) {
      const a = normalizar(nomes[i]), b = normalizar(nomes[j]);
      if (a === b) continue;
      const dist = levenshtein(a, b);
      const sim = 1 - dist / Math.max(a.length, b.length);
      const chave = [a, b].sort().join("|");
      if (sim >= 0.8 && !visto.has(chave)) {
        visto.add(chave);
        achados.push({ categoria: "parte", gravidade: "alerta", trecho: `${nomes[i]} / ${nomes[j]}`, mensagem: "Possível divergência na grafia do nome da parte." });
      }
    }
  }
  return achados;
}

export function verificarFormatacao(texto: string, cnjs: CitacaoCnj[]): Achado[] {
  const achados: Achado[] = [];
  const semMascara = cnjs.filter((c) => /^\d{20}$/.test(c.bruto));
  if (semMascara.length > 0 && semMascara.length < cnjs.length) {
    achados.push({ categoria: "formatacao", gravidade: "alerta", trecho: semMascara.map((c) => c.bruto).join(", "), mensagem: "Números de processo com e sem máscara no mesmo texto. Padronize no formato NNNNNNN-DD.AAAA.J.TR.OOOO." });
  }
  const espacos = texto.match(/[^\s] {2,}[^\s]/g);
  if (espacos && espacos.length > 0) achados.push({ categoria: "formatacao", gravidade: "alerta", trecho: `${espacos.length} ocorrência(s)`, mensagem: "Espaços duplos entre palavras." });
  for (const m of texto.matchAll(/R\$\s?\d[\d.]*,\d(?!\d)|R\$\d/g)) {
    achados.push({ categoria: "formatacao", gravidade: "alerta", trecho: m[0], mensagem: "Valor monetário fora do padrão (use R$ 1.234,56).", indice: m.index });
  }
  for (const m of texto.matchAll(/([,;:])\1|\s+[,.;:](?!\d)/g)) {
    achados.push({ categoria: "formatacao", gravidade: "alerta", trecho: JSON.stringify(m[0]), mensagem: "Pontuação duplicada ou espaço antes de pontuação.", indice: m.index });
  }
  const artAbrev = (texto.match(/\bart\.\s*\d/gi) || []).length;
  const artExt = (texto.match(/\bartigo\s+\d/gi) || []).length;
  if (artAbrev > 0 && artExt > 0) achados.push({ categoria: "formatacao", gravidade: "alerta", trecho: `"art." ${artAbrev}x e "artigo" ${artExt}x`, mensagem: "Citação de artigos sem padrão único." });
  return achados;
}

export type AnaliseLocal = { cnjs: CitacaoCnj[]; achados: Achado[] };

export function analisarTexto(texto: string, leis: LeiRef[], hoje: string): AnaliseLocal {
  const cnjs = extrairCitacoesCnj(texto);
  const achados: Achado[] = [];
  for (const c of cnjs) {
    if (!c.dvValido) {
      achados.push({ categoria: "processo", gravidade: "erro", trecho: c.bruto, mensagem: "Número CNJ com dígito verificador inválido: o processo citado não existe com essa numeração.", indice: c.indice });
    } else if (c.tribunalCitado && c.tribunalPeloNumero && normalizarSiglaTribunal(c.tribunalCitado) !== normalizarSiglaTribunal(c.tribunalPeloNumero)) {
      achados.push({ categoria: "processo", gravidade: "erro", trecho: c.bruto, mensagem: `O texto cita ${c.tribunalCitado}, mas o número pertence ao ${c.tribunalPeloNumero}.`, indice: c.indice });
    }
  }
  achados.push(...extrairJurisprudencia(texto));
  achados.push(...verificarArtigos(texto, leis));
  achados.push(...verificarDatas(texto, hoje));
  achados.push(...verificarPartes(texto));
  achados.push(...verificarFormatacao(texto, cnjs));
  return { cnjs, achados };
}
