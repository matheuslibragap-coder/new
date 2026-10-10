import { describe, expect, it } from "vitest";
import { validarResposta, segmentarTexto, sanitizarTexto, esquemaJsonChecagem, ErroValidacao } from "@/lib/ia/validacao";
import type { RegraSnapshot } from "@/lib/tipos";

const regras: RegraSnapshot[] = [
  { codigo: "PROMESSA_RESULTADO", titulo: "Promessa", dispositivo: "Prov. 205, art. 6º", severidade_padrao: "vermelho" },
  { codigo: "OSTENTACAO", titulo: "Ostentação", dispositivo: "Prov. 205, art. 6º", severidade_padrao: "amarelo" },
];

const achado = (regra_codigo: string, severidade = "vermelho", trecho = "ganhe sua causa") => ({
  regra_codigo,
  trecho,
  severidade,
  explicacao: "Promete resultado.",
  sugestao_reescrita: "Entenda seus direitos.",
});

describe("validarResposta", () => {
  it("aceita resposta verde sem achados e anula a reescrita", () => {
    const { resultado, descartados } = validarResposta(
      { classificacao_geral: "verde", achados: [], versao_reescrita_completa: "algo" },
      regras,
    );
    expect(resultado.classificacao_geral).toBe("verde");
    expect(resultado.versao_reescrita_completa).toBeNull();
    expect(descartados).toHaveLength(0);
  });

  it("descarta achado com regra inexistente e registra", () => {
    const { resultado, descartados } = validarResposta(
      {
        classificacao_geral: "vermelho",
        achados: [achado("PROMESSA_RESULTADO"), achado("ART_34_INVENTADO")],
        versao_reescrita_completa: "Texto novo",
      },
      regras,
    );
    expect(resultado.achados.map((a) => a.regra_codigo)).toEqual(["PROMESSA_RESULTADO"]);
    expect(descartados).toHaveLength(1);
    expect(resultado.classificacao_geral).toBe("vermelho");
  });

  it("vira amarelo não catalogado quando todos os achados são descartados", () => {
    const { resultado } = validarResposta(
      { classificacao_geral: "vermelho", achados: [achado("INVENTADA")], versao_reescrita_completa: "x" },
      regras,
    );
    expect(resultado.classificacao_geral).toBe("amarelo");
    expect(resultado.achados[0].regra_codigo).toBe("NAO_CATALOGADO");
    expect(resultado.achados[0].explicacao).toContain("Possível risco não catalogado");
  });

  it("força amarelo e prefixo em achados não catalogados", () => {
    const { resultado } = validarResposta(
      { classificacao_geral: "vermelho", achados: [achado("NAO_CATALOGADO", "vermelho")], versao_reescrita_completa: "x" },
      regras,
    );
    expect(resultado.achados[0].severidade).toBe("amarelo");
    expect(resultado.achados[0].explicacao.startsWith("Possível risco não catalogado, revise com cautela.")).toBe(true);
    expect(resultado.classificacao_geral).toBe("amarelo");
  });

  it("aplica a severidade padrão da regra cadastrada", () => {
    const { resultado } = validarResposta(
      { classificacao_geral: "vermelho", achados: [achado("OSTENTACAO", "vermelho", "carro")], versao_reescrita_completa: "x" },
      regras,
    );
    expect(resultado.achados[0].severidade).toBe("amarelo");
    expect(resultado.classificacao_geral).toBe("amarelo");
  });

  it("rejeita JSON fora do formato", () => {
    expect(() => validarResposta({ classificacao_geral: "azul" }, regras)).toThrow(ErroValidacao);
  });

  it("remove travessões do texto do modelo", () => {
    expect(sanitizarTexto("Atenção — revise")).toBe("Atenção, revise");
    const { resultado } = validarResposta(
      { classificacao_geral: "vermelho", achados: [achado("PROMESSA_RESULTADO")], versao_reescrita_completa: "Olá — mundo" },
      regras,
    );
    expect(resultado.versao_reescrita_completa).not.toContain("—");
  });
});

describe("esquemaJsonChecagem", () => {
  it("limita regra_codigo aos códigos ativos e NAO_CATALOGADO", () => {
    const schema = esquemaJsonChecagem(["A", "B"]) as {
      properties: { achados: { items: { properties: { regra_codigo: { enum: string[] } } } } };
    };
    expect(schema.properties.achados.items.properties.regra_codigo.enum).toEqual(["A", "B", "NAO_CATALOGADO"]);
  });
});

describe("segmentarTexto", () => {
  it("marca o trecho sem diferenciar maiúsculas", () => {
    const seg = segmentarTexto("Ganhe sua causa agora", [{ trecho: "ganhe sua causa", severidade: "vermelho" }]);
    expect(seg).toEqual([
      { texto: "Ganhe sua causa", severidade: "vermelho" },
      { texto: " agora", severidade: null },
    ]);
  });
  it("pior severidade vence na sobreposição", () => {
    const seg = segmentarTexto("abc def", [
      { trecho: "abc def", severidade: "amarelo" },
      { trecho: "def", severidade: "vermelho" },
    ]);
    expect(seg).toEqual([
      { texto: "abc ", severidade: "amarelo" },
      { texto: "def", severidade: "vermelho" },
    ]);
  });
  it("sem achados devolve o texto inteiro", () => {
    expect(segmentarTexto("oi", [])).toEqual([{ texto: "oi", severidade: null }]);
  });
});
