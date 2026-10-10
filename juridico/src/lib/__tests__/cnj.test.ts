import { describe, expect, it } from "vitest";
import { calcularDv, extrairNumerosCnj, formatarCnj, validarCnj } from "@/lib/cnj";
import { identificarTribunal } from "@/lib/tribunais";

describe("número CNJ", () => {
  const dv = calcularDv("5001234", "2026", "8", "21", "0001");
  const numero = `5001234${dv}2026821` + "0001";

  it("valida dígito verificador", () => {
    expect(validarCnj(numero).valido).toBe(true);
    expect(validarCnj(formatarCnj(numero)).valido).toBe(true);
  });

  it("rejeita dígito errado e tamanho errado", () => {
    const errado = numero.slice(0, 7) + String((Number(dv) + 1) % 100).padStart(2, "0") + numero.slice(9);
    expect(validarCnj(errado).valido).toBe(false);
    expect(validarCnj("123").valido).toBe(false);
  });

  it("formata e extrai de texto", () => {
    const f = formatarCnj(numero);
    expect(f).toMatch(/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/);
    expect(extrairNumerosCnj(`Processo ${f} e também ${numero}.`)).toHaveLength(2);
  });

  it("identifica tribunais pelo J.TR", () => {
    expect(identificarTribunal("8", "21")).toMatchObject({ sigla: "TJRS", alias: "tjrs", uf: "RS" });
    expect(identificarTribunal("5", "04")).toMatchObject({ sigla: "TRT4", alias: "trt4", uf: "RS" });
    expect(identificarTribunal("8", "07")).toMatchObject({ sigla: "TJDFT", alias: "tjdft" });
    expect(identificarTribunal("4", "04")).toMatchObject({ sigla: "TRF4", alias: "trf4" });
    expect(identificarTribunal("6", "26")).toMatchObject({ sigla: "TRE-SP", alias: "tre-sp" });
    expect(identificarTribunal("1", "00")?.alias).toBeNull();
  });
});
