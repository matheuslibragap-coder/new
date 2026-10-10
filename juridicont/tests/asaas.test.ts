import { describe, expect, it } from "vitest";
import { documentoValido, limparDocumento } from "@/lib/asaas";

describe("documento", () => {
  it("valida CPF", () => {
    expect(documentoValido(limparDocumento("529.982.247-25"))).toBe(true);
    expect(documentoValido("52998224724")).toBe(false);
    expect(documentoValido("11111111111")).toBe(false);
  });
  it("aceita CNPJ com 14 dígitos", () => {
    expect(documentoValido(limparDocumento("11.222.333/0001-81"))).toBe(true);
    expect(documentoValido("123")).toBe(false);
  });
});
