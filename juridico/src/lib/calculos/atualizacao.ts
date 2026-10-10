/**
 * Atualização monetária e juros com critérios selecionáveis por período.
 *
 * Método (padrão de tabelas práticas, [VALIDAR COM ADVOGADO]):
 * - competências mensais do mês da data inicial até o mês anterior ao da data final;
 * - correção: produto de (1 + variação mensal do índice);
 * - juros simples: soma das taxas mensais a partir do mês de início dos juros,
 *   aplicada sobre o valor corrigido final;
 * - Lei 14.905/2024 (CC arts. 389 e 406): correção pelo IPCA e juros pela Selic deduzido
 *   o IPCA; resultado negativo de juros no mês é considerado zero (art. 406 §3º).
 */

export type CodigoIndice = "IPCA" | "IPCA-E" | "INPC" | "SELIC" | "TR";
export type Correcao = CodigoIndice | "nenhuma";
export type Juros = "nenhum" | "simples_1_am" | "simples_0_5_am" | "selic" | "selic_menos_ipca";

export const ROTULO_JUROS: Record<Juros, string> = {
  nenhum: "Sem juros",
  simples_1_am: "Juros simples de 1% ao mês",
  simples_0_5_am: "Juros simples de 0,5% ao mês",
  selic: "Taxa Selic (engloba correção e juros)",
  selic_menos_ipca: "Selic deduzido o IPCA (Lei 14.905/2024)",
};

export type PeriodoCriterio = {
  /** último dia do período (inclusive). Nulo = até o fim do cálculo. */
  ate: string | null;
  correcao: Correcao;
  juros: Juros;
};

export type ValorIndice = { indice: CodigoIndice; competencia: string; valor: number }; // competencia AAAA-MM

export type EntradaAtualizacao = {
  valor: number;
  dataInicial: string; // data do débito (início da correção)
  dataFinal: string; // data do cálculo
  dataInicioJuros?: string | null; // ex.: citação; padrão = data inicial
  periodos: PeriodoCriterio[];
  indices: ValorIndice[];
  desconsiderarDeflacao?: boolean;
};

export type LinhaMemoria = {
  competencia: string;
  correcao: Correcao;
  variacao: number | null;
  fatorAcumulado: number;
  juros: Juros;
  taxaJuros: number;
  jurosAcumulado: number;
};

export type ResultadoAtualizacao = {
  valorOriginal: number;
  fatorCorrecao: number;
  valorCorrigido: number;
  percentualJuros: number;
  valorJuros: number;
  total: number;
  memoria: LinhaMemoria[];
  observacoes: string[];
};

export const DATA_LEI_14905 = "2024-08-30";

/** Critérios prontos: regra do Código Civil após a Lei 14.905/2024, mantendo o critério anterior até 29/08/2024. */
export function criteriosLei14905(correcaoAnterior: Correcao = "INPC", jurosAnterior: Juros = "simples_1_am"): PeriodoCriterio[] {
  return [
    { ate: "2024-08-29", correcao: correcaoAnterior, juros: jurosAnterior },
    { ate: null, correcao: "IPCA", juros: "selic_menos_ipca" },
  ];
}

export function arred(v: number, casas = 2): number {
  const f = 10 ** casas;
  return Math.round((v + Number.EPSILON) * f) / f;
}

function competencias(dataInicial: string, dataFinal: string): string[] {
  const out: string[] = [];
  let [a, m] = dataInicial.slice(0, 7).split("-").map(Number);
  const fim = dataFinal.slice(0, 7);
  for (let guarda = 0; guarda < 1200; guarda++) {
    const c = `${a}-${String(m).padStart(2, "0")}`;
    if (c >= fim) break;
    out.push(c);
    m++;
    if (m > 12) { m = 1; a++; }
  }
  return out;
}

function criterioDoMes(periodos: PeriodoCriterio[], competencia: string): PeriodoCriterio {
  const inicioMes = `${competencia}-01`;
  const ordenados = [...periodos].sort((x, y) => (x.ate ?? "9999") < (y.ate ?? "9999") ? -1 : 1);
  return ordenados.find((p) => p.ate === null || inicioMes <= p.ate) ?? ordenados[ordenados.length - 1];
}

export function atualizar(e: EntradaAtualizacao): ResultadoAtualizacao {
  if (!(e.valor > 0)) throw new Error("Informe um valor positivo.");
  if (e.dataFinal < e.dataInicial) throw new Error("A data final deve ser posterior à data inicial.");
  if (e.periodos.length === 0) throw new Error("Informe ao menos um critério.");

  const mapa = new Map<string, number>();
  for (const i of e.indices) mapa.set(`${i.indice}|${i.competencia}`, Number(i.valor));
  const faltantes = new Set<string>();
  const obter = (indice: CodigoIndice, comp: string) => {
    const v = mapa.get(`${indice}|${comp}`);
    if (v === undefined) faltantes.add(`${indice} ${comp.split("-").reverse().join("/")}`);
    return v ?? 0;
  };

  const inicioJuros = (e.dataInicioJuros || e.dataInicial).slice(0, 7);
  let fator = 1;
  let jurosPct = 0;
  const memoria: LinhaMemoria[] = [];
  const observacoes: string[] = [];

  for (const comp of competencias(e.dataInicial, e.dataFinal)) {
    const crit = criterioDoMes(e.periodos, comp);
    let variacao: number | null = null;
    if (crit.correcao !== "nenhuma" && crit.juros !== "selic") {
      variacao = obter(crit.correcao, comp);
      const aplicada = e.desconsiderarDeflacao && variacao < 0 ? 0 : variacao;
      fator *= 1 + aplicada / 100;
    }
    let taxa = 0;
    if (comp >= inicioJuros) {
      if (crit.juros === "simples_1_am") taxa = 1;
      else if (crit.juros === "simples_0_5_am") taxa = 0.5;
      else if (crit.juros === "selic") taxa = obter("SELIC", comp);
      else if (crit.juros === "selic_menos_ipca") taxa = Math.max(0, obter("SELIC", comp) - obter("IPCA", comp));
    }
    jurosPct += taxa;
    memoria.push({ competencia: comp, correcao: crit.juros === "selic" ? "nenhuma" : crit.correcao, variacao, fatorAcumulado: fator, juros: crit.juros, taxaJuros: taxa, jurosAcumulado: jurosPct });
  }

  if (faltantes.size > 0) {
    throw new Error(`Índices não cadastrados: ${[...faltantes].slice(0, 12).join(", ")}${faltantes.size > 12 ? "..." : ""}. Importe-os no painel admin.`);
  }
  if (memoria.some((l) => l.juros === "selic")) observacoes.push("Nos meses com Selic, a taxa engloba correção monetária e juros; não há correção separada.");

  const valorCorrigido = e.valor * fator;
  const valorJuros = valorCorrigido * (jurosPct / 100);
  return {
    valorOriginal: e.valor,
    fatorCorrecao: fator,
    valorCorrigido: arred(valorCorrigido),
    percentualJuros: jurosPct,
    valorJuros: arred(valorJuros),
    total: arred(valorCorrigido + valorJuros),
    memoria,
    observacoes,
  };
}

/** Índices que um cálculo precisa (para buscar só o necessário no banco). */
export function indicesNecessarios(periodos: PeriodoCriterio[]): CodigoIndice[] {
  const s = new Set<CodigoIndice>();
  for (const p of periodos) {
    if (p.correcao !== "nenhuma") s.add(p.correcao);
    if (p.juros === "selic" || p.juros === "selic_menos_ipca") s.add("SELIC");
    if (p.juros === "selic_menos_ipca") s.add("IPCA");
  }
  return [...s];
}
