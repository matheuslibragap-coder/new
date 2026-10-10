import { describe, expect, it } from "vitest";
import { atualizar, criteriosLei14905, type ValorIndice } from "@/lib/calculos/atualizacao";
import { avos, calcularRescisao, diasAvisoProporcional } from "@/lib/calculos/rescisao";
import { debitoPensao, pensaoMensal } from "@/lib/calculos/pensao";
import { calcularCumprimento } from "@/lib/calculos/cumprimento";

// Índices fictícios só para teste (não são dados oficiais)
const idx = (indice: ValorIndice["indice"], de: string, ate: string, valor: number): ValorIndice[] => {
  const out: ValorIndice[] = [];
  let [a, m] = de.split("-").map(Number);
  while (`${a}-${String(m).padStart(2, "0")}` <= ate) {
    out.push({ indice, competencia: `${a}-${String(m).padStart(2, "0")}`, valor });
    m++; if (m > 12) { m = 1; a++; }
  }
  return out;
};

describe("atualização monetária", () => {
  it("correção composta e juros simples de 1% a.m.", () => {
    const r = atualizar({
      valor: 1000, dataInicial: "2023-01-10", dataFinal: "2023-04-10",
      periodos: [{ ate: null, correcao: "INPC", juros: "simples_1_am" }],
      indices: idx("INPC", "2023-01", "2023-12", 1),
    });
    // 3 competências: jan, fev, mar
    expect(r.memoria).toHaveLength(3);
    expect(r.fatorCorrecao).toBeCloseTo(1.030301, 6);
    expect(r.valorCorrigido).toBe(1030.3);
    expect(r.percentualJuros).toBe(3);
    expect(r.total).toBe(1061.21);
  });

  it("Lei 14.905/2024: troca de critério e juros Selic menos IPCA com piso zero", () => {
    const r = atualizar({
      valor: 1000, dataInicial: "2024-07-01", dataFinal: "2024-11-01",
      periodos: criteriosLei14905("INPC", "simples_1_am"),
      indices: [
        ...idx("INPC", "2024-07", "2024-08", 0.5),
        ...idx("IPCA", "2024-09", "2024-10", 0.4),
        { indice: "SELIC", competencia: "2024-09", valor: 0.84 },
        { indice: "SELIC", competencia: "2024-10", valor: 0.3 },
      ],
    });
    expect(r.memoria.map((m) => m.juros)).toEqual(["simples_1_am", "simples_1_am", "selic_menos_ipca", "selic_menos_ipca"]);
    expect(r.memoria[2].taxaJuros).toBeCloseTo(0.44, 6);
    expect(r.memoria[3].taxaJuros).toBe(0);
  });

  it("acusa índice faltante em vez de supor valor", () => {
    expect(() => atualizar({ valor: 100, dataInicial: "2020-01-01", dataFinal: "2020-03-01", periodos: [{ ate: null, correcao: "IPCA", juros: "nenhum" }], indices: [] })).toThrow(/Índices não cadastrados/);
  });
});

describe("rescisão", () => {
  it("aviso proporcional", () => {
    expect(diasAvisoProporcional("2020-03-01", "2026-03-15")).toBe(48);
    expect(diasAvisoProporcional("1990-01-01", "2026-01-01")).toBe(90);
  });

  it("avos com fração de 15 dias", () => {
    expect(avos("2026-01-01", "2026-03-14")).toBe(2);
    expect(avos("2026-01-01", "2026-03-15")).toBe(3);
  });

  it("dispensa sem justa causa com aviso indenizado", () => {
    const r = calcularRescisao({ salario: 3000, admissao: "2024-02-01", desligamento: "2026-03-10", tipo: "sem_justa_causa", aviso: "indenizado", saldoFgts: 5000 });
    const v = Object.fromEntries(r.itens.map((i) => [i.descricao, i.valor]));
    expect(r.diasAviso).toBe(36);
    expect(v["Saldo de salário"]).toBe(1000);
    expect(v["Aviso prévio indenizado"]).toBe(3600);
    expect(r.dataProjetada).toBe("2026-04-15");
    expect(v["13º salário proporcional"]).toBe(1000); // 4/12 (jan a 15/abr)
    expect(r.itens.find((i) => i.descricao.startsWith("Multa de 40%"))).toBeTruthy();
  });

  it("justa causa não tem proporcionais nem multa", () => {
    const r = calcularRescisao({ salario: 3000, admissao: "2024-02-01", desligamento: "2026-03-10", tipo: "justa_causa", aviso: "dispensado", periodosFeriasVencidas: 1 });
    expect(r.itens.map((i) => i.descricao)).toEqual(["Saldo de salário", "Férias vencidas + 1/3"]);
    expect(r.total).toBe(5000);
  });
});

describe("pensão e cumprimento", () => {
  it("pensão sobre líquido", () => {
    expect(pensaoMensal({ base: "liquido", rendimentoBruto: 5000, descontosObrigatorios: 1000, percentual: 30 }).valor).toBe(1200);
  });

  it("débito de pensão ignora parcelas quitadas", () => {
    const r = debitoPensao({
      parcelas: [{ vencimento: "2026-01-10", devido: 1000, pago: 1000 }, { vencimento: "2026-02-10", devido: 1000, pago: 400 }],
      dataCalculo: "2026-04-10",
      criterios: [{ ate: null, correcao: "INPC", juros: "nenhum" }],
      indices: idx("INPC", "2026-01", "2026-12", 0),
    });
    expect(r.totalOriginal).toBe(600);
    expect(r.total).toBe(600);
  });

  it("multa e honorários do art. 523 sobre o saldo após pagamento parcial", () => {
    const r = calcularCumprimento({
      valorCondenacao: 10000, dataBase: "2026-01-01", dataCalculo: "2026-01-20",
      criterios: [{ ate: null, correcao: "nenhuma", juros: "nenhum" }], indices: [],
      aplicarMulta523: true, aplicarHonorarios523: true, pagamentoParcial: 4000,
    });
    expect(r.baseMultaHonorarios).toBe(6000);
    expect(r.multa).toBe(600);
    expect(r.honorarios523).toBe(600);
    expect(r.total).toBe(7200);
  });
});
