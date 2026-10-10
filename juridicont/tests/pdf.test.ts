import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { gerarPdfRegistro, hashRegistro } from "@/lib/pdf";

const dados = {
  id: "0b6c1e2a-0000-4000-8000-000000000001",
  criado_em: "2026-10-10T15:00:00Z",
  tipo_conteudo: "legenda",
  texto: "Ganhe sua causa! 🚀 Ação de revisão — 100% de êxito. Conheça nossa atuação em São João.",
  tem_imagem: true,
  classificacao: "vermelho" as const,
  resultado: {
    classificacao_geral: "vermelho" as const,
    achados: [
      {
        regra_codigo: "PROMESSA_RESULTADO",
        trecho: "100% de êxito",
        severidade: "vermelho" as const,
        explicacao: "Promete resultado. ".repeat(30),
        sugestao_reescrita: "Cada caso é analisado individualmente.",
      },
      { regra_codigo: "NAO_CATALOGADO", trecho: "", severidade: "amarelo" as const, explicacao: "Possível risco", sugestao_reescrita: "" },
    ],
    versao_reescrita_completa: "Entenda como funciona a ação de revisão.",
    texto_extraido_imagem: "R$ 50.000,00",
    elementos_visuais: ["Carro de luxo ao fundo"],
  },
  regras_versao: 10,
  regras_snapshot: [
    { codigo: "PROMESSA_RESULTADO", titulo: "Promessa de resultado", dispositivo: "Provimento 205/2021, art. 6º, parágrafo único", severidade_padrao: "vermelho" as const },
  ],
  modelo: "claude-opus-5-5",
  usuario: { nome: "Dra. Ana Souza", email: "ana@exemplo.com" },
};

describe("pdf", () => {
  it("gera um PDF válido com acentos e emojis", async () => {
    const bytes = await gerarPdfRegistro(dados);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });
  it("hash é estável e muda com o conteúdo", () => {
    expect(hashRegistro(dados)).toBe(hashRegistro({ ...dados }));
    expect(hashRegistro(dados)).not.toBe(hashRegistro({ ...dados, texto: "outro" }));
  });
});
