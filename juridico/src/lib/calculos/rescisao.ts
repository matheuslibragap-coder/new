/**
 * Verbas rescisórias trabalhistas (estimativa, valores brutos). [VALIDAR COM ADVOGADO]
 * Não calcula descontos de INSS e IRRF nem verbas previstas em norma coletiva.
 */
import { arred } from "./atualizacao";

export type TipoRescisao = "sem_justa_causa" | "pedido_demissao" | "justa_causa" | "acordo" | "termino_contrato";
export type Aviso = "indenizado" | "trabalhado" | "dispensado" | "descontado";

export const ROTULO_RESCISAO: Record<TipoRescisao, string> = {
  sem_justa_causa: "Dispensa sem justa causa",
  pedido_demissao: "Pedido de demissão",
  justa_causa: "Dispensa por justa causa",
  acordo: "Acordo entre as partes (CLT art. 484-A)",
  termino_contrato: "Término do contrato por prazo determinado",
};

export type EntradaRescisao = {
  salario: number;
  mediaVariaveis?: number;
  admissao: string;
  desligamento: string; // último dia trabalhado
  tipo: TipoRescisao;
  aviso: Aviso;
  periodosFeriasVencidas?: number;
  periodosFeriasEmDobro?: number; // vencidas além do período concessivo (CLT art. 137)
  saldoFgts?: number; // saldo para fins rescisórios informado no extrato
};

export type ItemVerba = { descricao: string; valor: number; fundamento: string; detalhe?: string; informativo?: boolean };

export type ResultadoRescisao = {
  itens: ItemVerba[];
  total: number;
  diasAviso: number;
  dataProjetada: string;
  observacoes: string[];
};

function d(s: string) {
  const [a, m, dd] = s.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, dd));
}
function iso(x: Date) {
  return x.toISOString().slice(0, 10);
}
function somar(s: string, n: number) {
  const x = d(s);
  x.setUTCDate(x.getUTCDate() + n);
  return iso(x);
}

/** Anos completos entre duas datas. */
export function anosCompletos(inicio: string, fim: string): number {
  const a = d(inicio), b = d(fim);
  let anos = b.getUTCFullYear() - a.getUTCFullYear();
  if (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate())) anos--;
  return Math.max(0, anos);
}

/** Aviso prévio proporcional (Lei 12.506/2011): 30 dias + 3 por ano completo, até 90. */
export function diasAvisoProporcional(admissao: string, desligamento: string): number {
  return Math.min(90, 30 + 3 * anosCompletos(admissao, desligamento));
}

/**
 * Meses (avos) entre duas datas inclusivas, contando a fração igual ou superior a 15 dias como mês
 * (Lei 4.090/1962 art. 1º §2º; CLT art. 146 parágrafo único).
 */
export function avos(inicio: string, fim: string): number {
  if (fim < inicio) return 0;
  let meses = 0;
  let cursor = inicio;
  for (let guarda = 0; guarda < 400; guarda++) {
    const c = d(cursor);
    const proximo = iso(new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate())));
    const fimDoMes = somar(proximo, -1);
    if (fimDoMes <= fim) {
      meses++;
      cursor = proximo;
    } else {
      const dias = Math.round((d(fim).getTime() - d(cursor).getTime()) / 86400000) + 1;
      if (dias >= 15) meses++;
      break;
    }
  }
  return meses;
}

export function calcularRescisao(e: EntradaRescisao): ResultadoRescisao {
  if (!(e.salario > 0)) throw new Error("Informe o salário.");
  if (e.desligamento < e.admissao) throw new Error("A data de desligamento deve ser posterior à admissão.");

  const base = e.salario + (e.mediaVariaveis || 0);
  const diaria = base / 30;
  const itens: ItemVerba[] = [];
  const obs: string[] = [];
  const t = e.tipo;

  // Saldo de salário
  const diasMes = Math.min(30, d(e.desligamento).getUTCDate());
  itens.push({ descricao: "Saldo de salário", valor: arred(diaria * diasMes), fundamento: "CLT art. 462", detalhe: `${diasMes} dia(s)` });

  // Aviso prévio
  const diasAviso = diasAvisoProporcional(e.admissao, e.desligamento);
  let projecao = 0;
  if ((t === "sem_justa_causa" || t === "acordo") && e.aviso === "indenizado") {
    const fator = t === "acordo" ? 0.5 : 1;
    itens.push({
      descricao: t === "acordo" ? "Aviso prévio indenizado (metade)" : "Aviso prévio indenizado",
      valor: arred(diaria * diasAviso * fator),
      fundamento: t === "acordo" ? "CLT art. 484-A, I, a; Lei 12.506/2011" : "CLT art. 487 §1º; Lei 12.506/2011",
      detalhe: `${diasAviso} dias`,
    });
    projecao = diasAviso;
  } else if (t === "sem_justa_causa" && e.aviso === "trabalhado" && diasAviso > 30) {
    itens.push({ descricao: "Aviso prévio proporcional indenizado (dias além de 30)", valor: arred(diaria * (diasAviso - 30)), fundamento: "Lei 12.506/2011", detalhe: `${diasAviso - 30} dias` });
    projecao = diasAviso - 30;
  } else if (t === "pedido_demissao" && e.aviso === "descontado") {
    itens.push({ descricao: "Desconto do aviso prévio não cumprido", valor: arred(-diaria * 30), fundamento: "CLT art. 487 §2º", detalhe: "30 dias" });
  }
  const dataProjetada = somar(e.desligamento, projecao);
  if (projecao > 0) obs.push(`O aviso indenizado projeta o contrato até ${dataProjetada.split("-").reverse().join("/")} (CLT art. 487 §1º; OJ 82 da SDI-1 do TST).`);

  // 13º proporcional
  if (t !== "justa_causa") {
    const inicioAno = `${dataProjetada.slice(0, 4)}-01-01`;
    const meses = avos(e.admissao > inicioAno ? e.admissao : inicioAno, dataProjetada);
    itens.push({ descricao: "13º salário proporcional", valor: arred((base * meses) / 12), fundamento: "Lei 4.090/1962; Lei 4.749/1965", detalhe: `${meses}/12 avos` });
  }

  // Férias vencidas
  const vencidas = Math.max(0, e.periodosFeriasVencidas || 0);
  const dobro = Math.min(vencidas, Math.max(0, e.periodosFeriasEmDobro || 0));
  if (vencidas > 0) {
    const simples = vencidas - dobro;
    if (simples > 0) itens.push({ descricao: "Férias vencidas + 1/3", valor: arred(base * simples * (4 / 3)), fundamento: "CLT art. 146; CF art. 7º, XVII", detalhe: `${simples} período(s)` });
    if (dobro > 0) itens.push({ descricao: "Férias vencidas em dobro + 1/3", valor: arred(base * dobro * 2 * (4 / 3)), fundamento: "CLT art. 137", detalhe: `${dobro} período(s)` });
  }

  // Férias proporcionais
  if (t !== "justa_causa") {
    const anos = anosCompletos(e.admissao, dataProjetada);
    const a = d(e.admissao);
    const inicioPeriodo = iso(new Date(Date.UTC(a.getUTCFullYear() + anos, a.getUTCMonth(), a.getUTCDate())));
    const meses = Math.min(12, avos(inicioPeriodo, dataProjetada));
    itens.push({ descricao: "Férias proporcionais + 1/3", valor: arred(((base * meses) / 12) * (4 / 3)), fundamento: "CLT art. 146 parágrafo único; Súmulas 171 e 261 do TST", detalhe: `${meses}/12 avos` });
  } else {
    obs.push("Na justa causa, não são devidos 13º e férias proporcionais pela CLT; há discussão sobre a Convenção 132 da OIT.");
  }

  // FGTS
  const saldo = e.saldoFgts || 0;
  const somaFgtsVerbas = itens
    .filter((i) => i.descricao.startsWith("Saldo de salário") || i.descricao.startsWith("Aviso prévio") || i.descricao.startsWith("13º"))
    .reduce((s, i) => s + Math.max(0, i.valor), 0);
  const depositoRescisorio = arred(somaFgtsVerbas * 0.08);
  if (t !== "pedido_demissao" && t !== "justa_causa") {
    itens.push({ descricao: "FGTS sobre verbas rescisórias (8%)", valor: depositoRescisorio, fundamento: "Lei 8.036/1990 art. 15", detalhe: "Depositado na conta vinculada (não entra no total)", informativo: true });
  }
  if ((t === "sem_justa_causa" || t === "acordo") && saldo + depositoRescisorio > 0) {
    const pct = t === "acordo" ? 0.2 : 0.4;
    itens.push({
      descricao: `Multa de ${pct * 100}% do FGTS`,
      valor: arred((saldo + depositoRescisorio) * pct),
      fundamento: t === "acordo" ? "CLT art. 484-A, I, b" : "Lei 8.036/1990 art. 18 §1º",
      detalhe: "Sobre o saldo informado mais os depósitos rescisórios",
    });
  }
  if ((t === "sem_justa_causa" || t === "acordo") && !saldo) obs.push("Informe o saldo do FGTS para calcular a multa completa.");
  if (t === "acordo") obs.push("No acordo, o empregado saca até 80% do FGTS e não tem direito ao seguro-desemprego (CLT art. 484-A §§ 1º e 2º).");

  obs.push("Valores brutos, sem descontos de INSS e IRRF e sem verbas de norma coletiva.");
  return { itens, total: arred(itens.filter((i) => !i.informativo).reduce((s, i) => s + i.valor, 0)), diasAviso, dataProjetada, observacoes: obs };
}
