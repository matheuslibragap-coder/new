import { describe, expect, it } from "vitest";
import { gerarPdf } from "@/lib/pdf";
import { gerarPdfDocumento } from "@/lib/documento-pdf";
import { extrairTexto } from "@/lib/extrair-texto";

describe("PDF", () => {
  it("gera memória de cálculo com acentos, tabela e quebra de página, e o texto é extraível", async () => {
    const linhas = Array.from({ length: 120 }, (_, i) => [`${i + 1}`, "Correção ção ÁÉÍ", "R$ 1.000,00"]);
    const pdf = await gerarPdf({ titulo: "Memória — teste", blocos: [{ tipo: "titulo", texto: "Memória de cálculo" }, { tipo: "tabela", colunas: ["N", "Desc", "Valor"], linhas }] });
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
    const texto = await extrairTexto("x.pdf", pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer);
    expect(texto).toContain("Memória de cálculo");
    expect(texto).toContain("Cálculo automatizado. Confira antes de usar.");
    expect(texto).toMatch(/Página 2 de \d/);
  });

  it("contrato sem aviso de cálculo", async () => {
    const pdf = await gerarPdfDocumento("Contrato", "CONTRATO DE HONORÁRIOS\n\nCláusula 1ª. Objeto.", "Escritório X");
    const texto = await extrairTexto("c.pdf", pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer);
    expect(texto).toContain("Cláusula 1ª");
    expect(texto).not.toContain("Cálculo automatizado");
  });
});
