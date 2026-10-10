/**
 * Cumprimento de sentença (obrigação de pagar quantia): valor atualizado, multa de 10% e
 * honorários de 10% (CPC art. 523 §1º), com pagamento parcial (art. 523 §2º).
 * [VALIDAR COM ADVOGADO]
 */
import { arred, atualizar, type PeriodoCriterio, type ValorIndice, type ResultadoAtualizacao } from "./atualizacao";

export type EntradaCumprimento = {
  valorCondenacao: number;
  dataBase: string;
  dataInicioJuros?: string | null;
  dataCalculo: string;
  criterios: PeriodoCriterio[];
  indices: ValorIndice[];
  honorariosConhecimentoPct?: number; // honorários sucumbenciais fixados na sentença
  aplicarMulta523: boolean;
  aplicarHonorarios523: boolean;
  pagamentoParcial?: number; // valor pago voluntariamente no prazo de 15 dias
  custas?: number;
};

export type ResultadoCumprimento = {
  atualizacao: ResultadoAtualizacao;
  principalAtualizado: number;
  honorariosConhecimento: number;
  subtotal: number;
  baseMultaHonorarios: number;
  multa: number;
  honorarios523: number;
  custas: number;
  total: number;
  observacoes: string[];
};

export function calcularCumprimento(e: EntradaCumprimento): ResultadoCumprimento {
  const atualizacao = atualizar({
    valor: e.valorCondenacao,
    dataInicial: e.dataBase,
    dataFinal: e.dataCalculo,
    dataInicioJuros: e.dataInicioJuros,
    periodos: e.criterios,
    indices: e.indices,
  });
  const principal = atualizacao.total;
  const honorariosConhecimento = arred((principal * (e.honorariosConhecimentoPct || 0)) / 100);
  const subtotal = arred(principal + honorariosConhecimento);
  const pago = Math.max(0, e.pagamentoParcial || 0);
  const base = arred(Math.max(0, subtotal - pago));
  const multa = e.aplicarMulta523 ? arred(base * 0.1) : 0;
  const honorarios523 = e.aplicarHonorarios523 ? arred(base * 0.1) : 0;
  const custas = arred(e.custas || 0);
  const obs: string[] = [];
  if (pago > 0) obs.push("Pagamento parcial no prazo: multa e honorários incidem sobre o restante (CPC art. 523 §2º).");
  if (e.aplicarMulta523 || e.aplicarHonorarios523) obs.push("Multa e honorários do art. 523 §1º só incidem se não houver pagamento voluntário em 15 dias úteis após a intimação.");
  return {
    atualizacao,
    principalAtualizado: principal,
    honorariosConhecimento,
    subtotal,
    baseMultaHonorarios: base,
    multa,
    honorarios523,
    custas,
    total: arred(base + multa + honorarios523 + custas),
    observacoes: obs,
  };
}
