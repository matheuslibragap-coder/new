/**
 * Motor de contagem de prazos processuais.
 *
 * Função pura: recebe a regra (tabela regras_prazo) e os feriados (tabela feriados)
 * e devolve a data final com a memória de cálculo dia a dia. Nenhuma regra jurídica
 * fica fixa aqui; tudo vem dos parâmetros.
 */

export type TipoFeriado = "feriado" | "suspensao" | "recesso" | "expediente_reduzido";

export type Feriado = {
  data: string; // AAAA-MM-DD
  descricao: string;
  tipo: TipoFeriado;
  abrangencia: "nacional" | "estadual" | "comarca";
  uf?: string | null;
  tribunal?: string | null;
  comarca?: string | null;
  ativo?: boolean;
};

export type RegraPrazo = {
  codigo: string;
  nome: string;
  contagem: "uteis" | "corridos";
  exclui_dia_inicio: boolean;
  suspensao_inicio: string | null; // MM-DD
  suspensao_fim: string | null; // MM-DD
  dje_publicacao_dia_util_seguinte: boolean;
  portal_dias_ciencia_ficta: number;
  inicio_e_fim_em_dia_util: boolean;
  permite_dobra: boolean;
  fundamentacao: string;
};

export type TipoEvento =
  | "disponibilizacao_dje" // data de disponibilização no Diário de Justiça Eletrônico
  | "intimacao_portal" // disponibilização no portal sem consulta (ciência ficta)
  | "ciencia"; // intimação pessoal, consulta no portal, juntada etc.

export const ROTULO_EVENTO: Record<TipoEvento, string> = {
  disponibilizacao_dje: "Disponibilização no Diário de Justiça Eletrônico",
  intimacao_portal: "Disponibilização no portal, sem consulta (ciência ficta)",
  ciencia: "Intimação ou ciência efetiva (consulta no portal, intimação pessoal, juntada)",
};

export type Contexto = { tribunal?: string | null; uf?: string | null; comarca?: string | null };

export type EntradaPrazo = {
  dataEvento: string;
  tipoEvento: TipoEvento;
  dias: number;
  emDobro?: boolean;
  regra: RegraPrazo;
  feriados: Feriado[];
  contexto?: Contexto;
};

export type SituacaoDia = "evento" | "publicacao" | "ciencia" | "contado" | "pulado" | "vencimento";

export type DiaMemoria = {
  data: string;
  diaSemana: string;
  situacao: SituacaoDia;
  contagem?: number;
  motivo: string;
};

export type ResultadoPrazo = {
  dataFinal: string;
  dataMarco: string; // data considerada como intimação/publicação
  dataInicioContagem: string;
  diasConsiderados: number;
  memoria: DiaMemoria[];
  observacoes: string[];
  fundamentacao: string;
};

const DIAS_SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const LIMITE_DIAS = 3 * 366;

export function normalizarTexto(s: string | null | undefined): string {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function paraData(s: string): Date {
  const [a, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}
function paraIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function somarDias(s: string, n: number): string {
  const d = paraData(s);
  d.setUTCDate(d.getUTCDate() + n);
  return paraIso(d);
}
export function diaSemana(s: string): string {
  return DIAS_SEMANA[paraData(s).getUTCDay()];
}
export function formatarDataBr(s: string): string {
  const [a, m, d] = s.split("-");
  return `${d}/${m}/${a}`;
}

/** Feriados aplicáveis ao processo: nacionais, estaduais da UF e da comarca, respeitando o tribunal. */
export function filtrarFeriados(feriados: Feriado[], ctx: Contexto = {}): Feriado[] {
  const trib = (ctx.tribunal || "").toUpperCase();
  const uf = (ctx.uf || "").toUpperCase();
  const comarca = normalizarTexto(ctx.comarca);
  return feriados.filter((f) => {
    if (f.ativo === false) return false;
    if (f.tribunal && f.tribunal.toUpperCase() !== trib) return false;
    if (f.abrangencia === "nacional") return true;
    if (f.abrangencia === "estadual") return !!uf && (f.uf || "").toUpperCase() === uf;
    if (f.abrangencia === "comarca") return !!comarca && normalizarTexto(f.comarca) === comarca;
    return false;
  });
}

class Calendario {
  private porData = new Map<string, Feriado[]>();
  constructor(feriados: Feriado[], private regra: RegraPrazo) {
    for (const f of feriados) {
      const lista = this.porData.get(f.data) ?? [];
      lista.push(f);
      this.porData.set(f.data, lista);
    }
  }

  /** Motivo de o dia não ter expediente forense (fim de semana, feriado, recesso, suspensão). */
  semExpediente(d: string): string | null {
    const dow = paraData(d).getUTCDay();
    if (dow === 0) return "Domingo";
    if (dow === 6) return "Sábado";
    const f = (this.porData.get(d) ?? []).find((x) => x.tipo !== "expediente_reduzido");
    if (f) return `${rotuloTipo(f.tipo)}: ${f.descricao}`;
    return null;
  }

  expedienteReduzido(d: string): string | null {
    const f = (this.porData.get(d) ?? []).find((x) => x.tipo === "expediente_reduzido");
    return f ? `Expediente reduzido: ${f.descricao}` : null;
  }

  /** Suspensão anual de prazos definida na regra (ex.: 20/12 a 20/1). */
  suspensaoAnual(d: string): string | null {
    const { suspensao_inicio: ini, suspensao_fim: fim } = this.regra;
    if (!ini || !fim) return null;
    const md = d.slice(5);
    const dentro = ini <= fim ? md >= ini && md <= fim : md >= ini || md <= fim;
    return dentro ? `Suspensão de prazos de ${ini.split("-").reverse().join("/")} a ${fim.split("-").reverse().join("/")}` : null;
  }

  diaUtil(d: string): boolean {
    return this.semExpediente(d) === null;
  }
}

function rotuloTipo(t: TipoFeriado): string {
  return { feriado: "Feriado", suspensao: "Suspensão de expediente", recesso: "Recesso", expediente_reduzido: "Expediente reduzido" }[t];
}

export function calcularPrazo(entrada: EntradaPrazo): ResultadoPrazo {
  const { regra, tipoEvento } = entrada;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.dataEvento)) throw new Error("Data do evento inválida.");
  if (!Number.isInteger(entrada.dias) || entrada.dias <= 0 || entrada.dias > 365) throw new Error("Prazo em dias inválido.");

  const feriados = filtrarFeriados(entrada.feriados, entrada.contexto);
  const cal = new Calendario(feriados, regra);
  const memoria: DiaMemoria[] = [];
  const observacoes: string[] = [];
  const add = (data: string, situacao: SituacaoDia, motivo: string, contagem?: number) =>
    memoria.push({ data, diaSemana: diaSemana(data), situacao, motivo, contagem });

  const dobra = !!entrada.emDobro && regra.permite_dobra;
  if (entrada.emDobro && !regra.permite_dobra) observacoes.push("A regra selecionada não prevê prazo em dobro; o prazo foi contado de forma simples.");
  const dias = dobra ? entrada.dias * 2 : entrada.dias;
  if (dobra) observacoes.push(`Prazo em dobro aplicado: ${entrada.dias} x 2 = ${dias} dias.`);

  // 1. Marco inicial (data em que se considera feita a intimação/publicação)
  let marco = entrada.dataEvento;
  add(marco, "evento", ROTULO_EVENTO[tipoEvento]);

  const avancarAteUtil = (de: string, rotuloPulo: string): string => {
    let d = de;
    let guarda = 0;
    while (!cal.diaUtil(d)) {
      add(d, "pulado", `${cal.semExpediente(d)} (${rotuloPulo})`);
      d = somarDias(d, 1);
      if (++guarda > LIMITE_DIAS) throw new Error("Calendário sem dias úteis no período.");
    }
    return d;
  };

  if (tipoEvento === "disponibilizacao_dje") {
    if (regra.dje_publicacao_dia_util_seguinte) {
      const pub = avancarAteUtil(somarDias(marco, 1), "não é dia de publicação");
      add(pub, "publicacao", "Data da publicação: primeiro dia útil seguinte à disponibilização");
      marco = pub;
    }
  } else if (tipoEvento === "intimacao_portal") {
    const n = regra.portal_dias_ciencia_ficta;
    const ficta = somarDias(marco, n);
    let d = ficta;
    if (!cal.diaUtil(d)) {
      add(d, "pulado", `${cal.semExpediente(d)} (${n}º dia corrido cai em dia sem expediente)`);
      d = avancarAteUtil(somarDias(d, 1), "aguardando dia útil");
    }
    add(d, "ciencia", `Ciência ficta: ${n} dias corridos após a disponibilização, sem consulta`);
    marco = d;
  } else {
    if (!cal.diaUtil(marco)) {
      const d = avancarAteUtil(somarDias(marco, 1), "ciência em dia sem expediente");
      add(d, "ciencia", "Ciência considerada no primeiro dia útil seguinte");
      marco = d;
    }
  }

  // 2. Contagem
  let d = regra.exclui_dia_inicio ? somarDias(marco, 1) : marco;
  let contados = 0;
  let inicioContagem: string | null = null;
  let final: string | null = null;
  let guarda = 0;

  if (regra.contagem === "uteis") {
    while (final === null) {
      if (++guarda > LIMITE_DIAS) throw new Error("Não foi possível concluir a contagem.");
      const semExp = cal.semExpediente(d);
      const susp = cal.suspensaoAnual(d);
      const reduzido = cal.expedienteReduzido(d);
      if (semExp) add(d, "pulado", semExp);
      else if (susp) add(d, "pulado", susp);
      else if (reduzido && (contados === 0 || contados === dias - 1)) {
        add(d, "pulado", `${reduzido}. Início e vencimento são prorrogados (CPC art. 224 §1º)`);
      } else {
        contados++;
        if (!inicioContagem) inicioContagem = d;
        if (contados === dias) {
          add(d, "vencimento", `Dia ${contados} de ${dias}: vencimento`, contados);
          final = d;
        } else {
          add(d, "contado", `Dia útil ${contados} de ${dias}`, contados);
        }
      }
      d = somarDias(d, 1);
    }
  } else {
    // Dias corridos e contínuos
    if (regra.inicio_e_fim_em_dia_util) {
      while (!cal.diaUtil(d) || cal.expedienteReduzido(d)) {
        if (++guarda > LIMITE_DIAS) throw new Error("Não foi possível concluir a contagem.");
        add(d, "pulado", `${cal.semExpediente(d) ?? cal.expedienteReduzido(d)} (o prazo só começa em dia útil)`);
        d = somarDias(d, 1);
      }
    }
    inicioContagem = d;
    for (let i = 1; i <= dias; i++) {
      const motivo = cal.semExpediente(d);
      if (i === dias) break;
      add(d, "contado", motivo ? `Dia ${i} de ${dias} (contado: prazo contínuo; ${motivo})` : `Dia ${i} de ${dias}`, i);
      d = somarDias(d, 1);
    }
    // d é o último dia do prazo
    if (regra.inicio_e_fim_em_dia_util) {
      while (!cal.diaUtil(d) || cal.expedienteReduzido(d)) {
        if (++guarda > LIMITE_DIAS) throw new Error("Não foi possível concluir a contagem.");
        add(d, "pulado", `${cal.semExpediente(d) ?? cal.expedienteReduzido(d)} (vencimento prorrogado para o próximo dia útil)`);
        d = somarDias(d, 1);
      }
    }
    add(d, "vencimento", `Vencimento (${dias} dias corridos)`, dias);
    final = d;
  }

  if (feriados.some((f) => (f as Feriado & { validado?: boolean }).validado === false && f.data >= entrada.dataEvento && f.data <= final)) {
    observacoes.push("Há feriados no período ainda não validados no cadastro. Confira o calendário oficial do tribunal.");
  }

  return {
    dataFinal: final,
    dataMarco: marco,
    dataInicioContagem: inicioContagem ?? final,
    diasConsiderados: dias,
    memoria,
    observacoes,
    fundamentacao: regra.fundamentacao,
  };
}

/** Diferença em dias corridos entre duas datas AAAA-MM-DD (b - a). */
export function diferencaDias(a: string, b: string): number {
  return Math.round((paraData(b).getTime() - paraData(a).getTime()) / 86400000);
}

/** Data de hoje no fuso de Brasília, AAAA-MM-DD. */
export function hojeBrasilia(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}
