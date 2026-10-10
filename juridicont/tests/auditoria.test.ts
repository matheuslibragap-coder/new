import { describe, expect, it } from "vitest";
import { calcularNota, montarRelatorio, type ItemAuditado } from "@/lib/auditoria";
import type { Achado, RegraSnapshot } from "@/lib/tipos";

const regras: RegraSnapshot[] = [
  { codigo: "PROMESSA_RESULTADO", titulo: "Promessa", dispositivo: "art. 6º", severidade_padrao: "vermelho" },
  { codigo: "OSTENTACAO", titulo: "Ostentação", dispositivo: "art. 6º", severidade_padrao: "amarelo" },
  { codigo: "COMPARACAO_COLEGAS", titulo: "Comparação", dispositivo: "[CONFERIR]", severidade_padrao: "amarelo" },
  { codigo: "CAPTACAO_MERCANTILIZACAO", titulo: "Captação", dispositivo: "x", severidade_padrao: "vermelho" },
];

const a = (regra_codigo: string, severidade: "amarelo" | "vermelho"): Achado => ({
  regra_codigo,
  severidade,
  trecho: "t",
  explicacao: "e",
  sugestao_reescrita: "s",
});

const item = (rotulo: string, achados: Achado[]): ItemAuditado => ({
  rotulo,
  texto: "x",
  resultado: {
    classificacao_geral: achados.some((x) => x.severidade === "vermelho") ? "vermelho" : achados.length ? "amarelo" : "verde",
    achados,
    versao_reescrita_completa: null,
  },
});

describe("auditoria", () => {
  it("nota 100 sem achados", () => {
    expect(calcularNota([item("Bio", [])])).toBe(100);
  });

  it("desconta por severidade e não fica negativa", () => {
    expect(calcularNota([item("Bio", [a("PROMESSA_RESULTADO", "vermelho"), a("OSTENTACAO", "amarelo")])])).toBe(76);
    const muitos = Array.from({ length: 10 }, () => a("PROMESSA_RESULTADO", "vermelho"));
    expect(calcularNota([item("Post 1", muitos)])).toBe(0);
  });

  it("lista no máximo 3 riscos, vermelhos primeiro", () => {
    const r = montarRelatorio(
      [
        item("Bio", [a("OSTENTACAO", "amarelo"), a("COMPARACAO_COLEGAS", "amarelo")]),
        item("Post 1", [a("OSTENTACAO", "amarelo"), a("PROMESSA_RESULTADO", "vermelho")]),
        item("Post 2", [a("CAPTACAO_MERCANTILIZACAO", "vermelho")]),
      ],
      regras,
    );
    expect(r.principais_riscos).toHaveLength(3);
    expect(r.principais_riscos.slice(0, 2).every((x) => x.severidade === "vermelho")).toBe(true);
    expect(r.principais_riscos[2].regra_codigo).toBe("OSTENTACAO");
    expect(r.principais_riscos[2].ocorrencias).toBe(2);
    expect(r.classificacao_geral).toBe("vermelho");
  });
});
