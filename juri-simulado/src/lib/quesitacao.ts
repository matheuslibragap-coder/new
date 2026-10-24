import type { TQuesitacao, TQuesito } from "../schema/caso";

export type Voto = "sim" | "nao" | null;
export type Posicao = "apos-ii" | "apos-iii" | "nenhuma";
export type ChaveResultado = keyof TQuesitacao["resultados"];

export interface ApuracaoQuesito {
  quesito: TQuesito;
  sim: number;
  nao: number;
  /** Quantas cédulas foram abertas até a maioria ser atingida. */
  apuradas: number;
  decisao: "sim" | "nao" | "incompleto";
}

export interface ResultadoApuracao {
  etapas: ApuracaoQuesito[];
  /** Quesitos que não chegaram a ser votados porque a votação encerrou antes. */
  prejudicados: TQuesito[];
  /** Quesito que ainda precisa de votos para a apuração seguir. */
  pendente: TQuesito | null;
  resultado: ChaveResultado | null;
  motivo: string;
}

/**
 * Apura um quesito abrindo as cédulas na ordem e parando assim que um dos
 * lados atinge a maioria (o resto não é revelado, para preservar o sigilo).
 */
export function apurarQuesito(quesito: TQuesito, votos: Voto[], maioria = 4): ApuracaoQuesito {
  let sim = 0;
  let nao = 0;
  let apuradas = 0;
  for (const v of votos) {
    if (v === null) break;
    apuradas++;
    if (v === "sim") sim++;
    else nao++;
    if (sim >= maioria) return { quesito, sim, nao, apuradas, decisao: "sim" };
    if (nao >= maioria) return { quesito, sim, nao, apuradas, decisao: "nao" };
  }
  return { quesito, sim, nao, apuradas, decisao: "incompleto" };
}

/** Ordem de votação conforme o art. 483 do CPP e a posição escolhida para a desclassificação. */
export function ordemDosQuesitos(q: TQuesitacao, posicao: Posicao): TQuesito[] {
  const por = (t: TQuesito["tipo"]) => q.quesitos.filter((x) => x.tipo === t);
  const descl = posicao === "nenhuma" ? [] : por("desclassificacao");
  const base = [...por("materialidade"), ...por("autoria")];
  const meio = posicao === "apos-ii" ? [...descl, ...por("absolvicao")] : [...por("absolvicao"), ...descl];
  return [...base, ...meio, ...por("diminuicao"), ...por("qualificadora")];
}

export function apurar(
  q: TQuesitacao,
  posicao: Posicao,
  votos: Record<string, Voto[]>,
): ResultadoApuracao {
  const ordem = ordemDosQuesitos(q, posicao);
  const etapas: ApuracaoQuesito[] = [];
  let diminuicao = false;
  let qualificadora = false;

  const fim = (i: number, resultado: ChaveResultado | null, motivo: string, pendente: TQuesito | null = null) => ({
    etapas,
    prejudicados: ordem.slice(i + 1),
    pendente,
    resultado,
    motivo,
  });

  for (let i = 0; i < ordem.length; i++) {
    const quesito = ordem[i];
    const a = apurarQuesito(quesito, votos[quesito.id] ?? [], q.maioria);
    etapas.push(a);
    if (a.decisao === "incompleto") {
      return fim(i, null, `Faltam votos no quesito “${quesito.rotulo}” para formar a maioria de ${q.maioria}.`, quesito);
    }
    const sim = a.decisao === "sim";
    switch (quesito.tipo) {
      case "materialidade":
      case "autoria":
        if (!sim)
          return fim(i, "absolvicao", `Mais de 3 jurados responderam NÃO ao quesito “${quesito.rotulo}”: a votação se encerra com absolvição (art. 483, §1º).`);
        break;
      case "absolvicao":
        if (sim)
          return fim(i, "absolvicao", "A maioria respondeu SIM ao quesito genérico: o acusado está absolvido (art. 483, §2º).");
        break;
      case "desclassificacao":
        if (sim)
          return fim(i, "desclassificacao", "A maioria reconheceu a desclassificação: a votação se encerra e o juiz presidente profere a sentença (arts. 483, §4º, e 492, §1º).");
        break;
      case "diminuicao":
        diminuicao = sim;
        break;
      case "qualificadora":
        qualificadora = sim;
        break;
    }
  }

  const resultado: ChaveResultado =
    diminuicao && qualificadora ? "qualificadoPrivilegiado" : qualificadora ? "qualificado" : diminuicao ? "privilegiado" : "simples";
  const partes = [
    "A maioria condenou no quesito genérico",
    diminuicao ? "reconheceu a causa de diminuição" : "negou a causa de diminuição",
    qualificadora ? "e reconheceu a qualificadora" : "e negou a qualificadora",
  ];
  return fim(ordem.length - 1, resultado, partes.join(", ") + " (art. 483, §3º).");
}
