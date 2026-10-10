import type { RegraSnapshot, ResultadoChecagem, Severidade } from "@/lib/tipos";
import { CODIGO_NAO_CATALOGADO, TEXTO_NAO_CATALOGADO } from "@/lib/textos";

export const PENALIDADE: Record<Severidade, number> = { verde: 0, amarelo: 6, vermelho: 18 };

export type ItemAuditado = {
  rotulo: string;
  texto: string;
  resultado: ResultadoChecagem;
};

export type Risco = {
  regra_codigo: string;
  titulo: string;
  dispositivo: string | null;
  severidade: Severidade;
  ocorrencias: number;
  exemplo_trecho: string;
  explicacao: string;
};

export type RelatorioAuditoria = {
  nota: number;
  classificacao_geral: Severidade;
  principais_riscos: Risco[];
  itens: ItemAuditado[];
};

/** Nota de 0 a 100: começa em 100 e desconta por achado, conforme a severidade. */
export function calcularNota(itens: ItemAuditado[]) {
  const desconto = itens
    .flatMap((i) => i.resultado.achados)
    .reduce((soma, a) => soma + PENALIDADE[a.severidade], 0);
  return Math.max(0, Math.min(100, 100 - desconto));
}

export function montarRelatorio(itens: ItemAuditado[], regras: RegraSnapshot[]): RelatorioAuditoria {
  const porCodigo = new Map(regras.map((r) => [r.codigo, r]));
  const grupos = new Map<string, Risco>();

  for (const item of itens) {
    for (const a of item.resultado.achados) {
      if (a.severidade === "verde") continue;
      const existente = grupos.get(a.regra_codigo);
      if (existente) {
        existente.ocorrencias += 1;
        continue;
      }
      const regra = porCodigo.get(a.regra_codigo);
      grupos.set(a.regra_codigo, {
        regra_codigo: a.regra_codigo,
        titulo: regra?.titulo ?? (a.regra_codigo === CODIGO_NAO_CATALOGADO ? TEXTO_NAO_CATALOGADO : a.regra_codigo),
        dispositivo: regra?.dispositivo ?? null,
        severidade: a.severidade,
        ocorrencias: 1,
        exemplo_trecho: a.trecho || `(${item.rotulo})`,
        explicacao: a.explicacao,
      });
    }
  }

  const peso = (r: Risco) => PENALIDADE[r.severidade] * r.ocorrencias;
  const principais = [...grupos.values()]
    .sort((a, b) => {
      if (a.severidade !== b.severidade) return a.severidade === "vermelho" ? -1 : 1;
      return peso(b) - peso(a);
    })
    .slice(0, 3);

  const severidades = itens.map((i) => i.resultado.classificacao_geral);
  const classificacao: Severidade = severidades.includes("vermelho")
    ? "vermelho"
    : severidades.includes("amarelo")
      ? "amarelo"
      : "verde";

  return { nota: calcularNota(itens), classificacao_geral: classificacao, principais_riscos: principais, itens };
}
