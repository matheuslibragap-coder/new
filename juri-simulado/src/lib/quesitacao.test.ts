import { describe, expect, it } from "vitest";
import casoJson from "../data/caso.json";
import macetesJson from "../data/macetes.json";
import { validarDados } from "../schema/validar";
import { apurar, apurarQuesito, ordemDosQuesitos, type Voto } from "./quesitacao";

const { caso } = validarDados(casoJson, macetesJson);
const q = caso.quesitacao;

const S = (n: number): Voto[] => [...Array(n).fill("sim"), ...Array(7 - n).fill("nao")];
const N = (n: number): Voto[] => [...Array(n).fill("nao"), ...Array(7 - n).fill("sim")];
const tudo = (sim: Partial<Record<string, Voto[]>>) => {
  const base: Record<string, Voto[]> = {};
  for (const x of q.quesitos) base[x.id] = S(7);
  return { ...base, ...sim } as Record<string, Voto[]>;
};

describe("apuração de um quesito", () => {
  it("para ao atingir 4 votos e não revela o resto", () => {
    const a = apurarQuesito(q.quesitos[0], ["sim", "nao", "sim", "sim", "sim", "nao", "nao"]);
    expect(a).toMatchObject({ decisao: "sim", sim: 4, nao: 1, apuradas: 5 });
  });
  it("reproduz o 2 SIM x 4 NÃO do júri real", () => {
    const a = apurarQuesito(q.quesitos[2], ["sim", "nao", "nao", "sim", "nao", "nao", "sim"]);
    expect(a).toMatchObject({ decisao: "nao", sim: 2, nao: 4, apuradas: 6 });
  });
  it("fica incompleto sem votos suficientes", () => {
    expect(apurarQuesito(q.quesitos[0], ["sim", "sim", null, "sim"]).decisao).toBe("incompleto");
  });
});

describe("ordem dos quesitos (art. 483)", () => {
  it("desclassificação após o III por padrão", () => {
    expect(ordemDosQuesitos(q, "apos-iii").map((x) => x.tipo)).toEqual([
      "materialidade", "autoria", "absolvicao", "desclassificacao", "diminuicao", "qualificadora",
    ]);
  });
  it("desclassificação após o II", () => {
    expect(ordemDosQuesitos(q, "apos-ii").map((x) => x.tipo).slice(2, 4)).toEqual(["desclassificacao", "absolvicao"]);
  });
  it("sem desclassificação", () => {
    expect(ordemDosQuesitos(q, "nenhuma").some((x) => x.tipo === "desclassificacao")).toBe(false);
  });
});

describe("resultado jurídico final", () => {
  it("cenário 1: NÃO à materialidade encerra com absolvição", () => {
    const r = apurar(q, "apos-iii", tudo({ q1: N(4) }));
    expect(r.resultado).toBe("absolvicao");
    expect(r.etapas).toHaveLength(1);
    expect(r.prejudicados).toHaveLength(5);
  });
  it("cenário 2: NÃO à autoria encerra com absolvição", () => {
    const r = apurar(q, "apos-iii", tudo({ q2: N(5) }));
    expect(r.resultado).toBe("absolvicao");
    expect(r.etapas.map((e) => e.quesito.id)).toEqual(["q1", "q2"]);
  });
  it("cenário 3: SIM ao quesito genérico absolve e encerra", () => {
    const r = apurar(q, "apos-iii", tudo({ q3: S(4) }));
    expect(r.resultado).toBe("absolvicao");
    expect(r.prejudicados.map((x) => x.id)).toEqual(["qd", "q4", "q5"]);
  });
  it("cenário 4: condenação e excesso culposo reconhecido = desclassificação", () => {
    const r = apurar(q, "apos-iii", tudo({ q3: N(4), qd: S(4) }));
    expect(r.resultado).toBe("desclassificacao");
    expect(q.resultados[r.resultado!].penaAbstrata).toMatch(/1 a 3 anos/);
  });
  it("cenário 5: júri real (privilégio e asfixia reconhecidos) = qualificado-privilegiado", () => {
    const r = apurar(q, "nenhuma", tudo({ q3: ["sim", "nao", "nao", "sim", "nao", "nao", "sim"], q4: S(5), q5: S(4) }));
    expect(r.resultado).toBe("qualificadoPrivilegiado");
    expect(q.resultados.qualificadoPrivilegiado.penaAbstrata).toMatch(/8 a 25 anos/);
  });
  it("cenário 6: só a asfixia = homicídio qualificado", () => {
    expect(apurar(q, "apos-iii", tudo({ q3: N(4), qd: N(4), q4: N(4), q5: S(4) })).resultado).toBe("qualificado");
  });
  it("cenário 7: só o privilégio = homicídio privilegiado", () => {
    expect(apurar(q, "apos-iii", tudo({ q3: N(4), qd: N(4), q4: S(4), q5: N(4) })).resultado).toBe("privilegiado");
  });
  it("cenário 8: nada reconhecido = homicídio simples", () => {
    expect(apurar(q, "apos-iii", tudo({ q3: N(4), qd: N(4), q4: N(4), q5: N(4) })).resultado).toBe("simples");
  });
  it("cenário 9: desclassificação após o II encerra antes do genérico", () => {
    const r = apurar(q, "apos-ii", tudo({ qd: S(4) }));
    expect(r.resultado).toBe("desclassificacao");
    expect(r.etapas.map((e) => e.quesito.id)).toEqual(["q1", "q2", "qd"]);
  });
  it("cenário 10: votos faltando deixam a apuração pendente", () => {
    const r = apurar(q, "apos-iii", tudo({ q3: [null, null, null, null, null, null, null] }));
    expect(r.resultado).toBeNull();
    expect(r.pendente?.id).toBe("q3");
  });
});
