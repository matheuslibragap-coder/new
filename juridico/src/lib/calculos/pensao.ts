/**
 * Pensão alimentícia: valor mensal por percentual e débito em atraso atualizado.
 * [VALIDAR COM ADVOGADO] A base de incidência depende do título judicial.
 */
import { arred, atualizar, type PeriodoCriterio, type ValorIndice } from "./atualizacao";

export type EntradaPensaoMensal = {
  base: "bruto" | "liquido" | "salario_minimo";
  rendimentoBruto?: number;
  descontosObrigatorios?: number; // INSS e IRRF, quando a base for líquida
  salarioMinimo?: number;
  percentual: number; // ex.: 30 = 30%
};

export function pensaoMensal(e: EntradaPensaoMensal): { baseCalculo: number; valor: number; descricao: string } {
  if (!(e.percentual > 0 && e.percentual <= 100)) throw new Error("Percentual inválido.");
  let baseCalculo = 0;
  let descricao = "";
  if (e.base === "salario_minimo") {
    if (!(e.salarioMinimo && e.salarioMinimo > 0)) throw new Error("Informe o valor do salário mínimo vigente.");
    baseCalculo = e.salarioMinimo;
    descricao = `${e.percentual}% do salário mínimo`;
  } else {
    if (!(e.rendimentoBruto && e.rendimentoBruto > 0)) throw new Error("Informe os rendimentos.");
    baseCalculo = e.base === "liquido" ? e.rendimentoBruto - (e.descontosObrigatorios || 0) : e.rendimentoBruto;
    descricao = `${e.percentual}% dos rendimentos ${e.base === "liquido" ? "líquidos (bruto menos descontos obrigatórios)" : "brutos"}`;
  }
  return { baseCalculo: arred(baseCalculo), valor: arred((baseCalculo * e.percentual) / 100), descricao };
}

export type ParcelaPensao = { vencimento: string; devido: number; pago: number };

export type EntradaDebitoPensao = {
  parcelas: ParcelaPensao[];
  dataCalculo: string;
  criterios: PeriodoCriterio[];
  indices: ValorIndice[];
};

export type LinhaDebito = ParcelaPensao & { saldo: number; corrigido: number; juros: number; total: number };

export function debitoPensao(e: EntradaDebitoPensao): { linhas: LinhaDebito[]; totalOriginal: number; total: number; observacoes: string[] } {
  if (e.parcelas.length === 0) throw new Error("Informe ao menos uma parcela.");
  const linhas: LinhaDebito[] = [];
  for (const p of [...e.parcelas].sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1))) {
    const saldo = arred(p.devido - (p.pago || 0));
    if (saldo <= 0) {
      linhas.push({ ...p, saldo: 0, corrigido: 0, juros: 0, total: 0 });
      continue;
    }
    const r = atualizar({ valor: saldo, dataInicial: p.vencimento, dataFinal: e.dataCalculo, periodos: e.criterios, indices: e.indices });
    linhas.push({ ...p, saldo, corrigido: r.valorCorrigido, juros: r.valorJuros, total: r.total });
  }
  const observacoes = [
    "Cada parcela é atualizada desde o seu vencimento, com juros desde o vencimento (mora ex re).",
    "Para a execução pelo rito da prisão, consideram-se as 3 prestações anteriores ao ajuizamento e as que vencerem no curso do processo (CPC art. 528 §7º; Súmula 309 do STJ).",
  ];
  return {
    linhas,
    totalOriginal: arred(linhas.reduce((s, l) => s + l.saldo, 0)),
    total: arred(linhas.reduce((s, l) => s + l.total, 0)),
    observacoes,
  };
}
