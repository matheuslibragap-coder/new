import { describe, expect, it } from "vitest";
import { linkWaMe, normalizarWhatsapp, reaisParaCentavos, validarCnpj, validarCpf } from "@/lib/documento";
import { preencherModelo, dataPorExtenso } from "@/lib/modelos-texto";
import { anonimizar } from "@/lib/anonimizar";
import { gerarIcs } from "@/lib/ics";

describe("utilitários", () => {
  it("CPF e CNPJ", () => {
    expect(validarCpf("529.982.247-25")).toBe(true);
    expect(validarCpf("529.982.247-24")).toBe(false);
    expect(validarCnpj("11.222.333/0001-81")).toBe(true);
    expect(validarCnpj("11.222.333/0001-82")).toBe(false);
  });
  it("WhatsApp", () => {
    expect(normalizarWhatsapp("(51) 99999-8888")).toBe("5551999998888");
    expect(linkWaMe("51999998888", "Olá, tudo bem?")).toBe("https://wa.me/5551999998888?text=Ol%C3%A1%2C%20tudo%20bem%3F");
  });
  it("valores", () => {
    expect(reaisParaCentavos("1.234,56")).toBe(123456);
    expect(reaisParaCentavos("1234.5")).toBe(123450);
  });
  it("modelos", () => {
    const r = preencherModelo("Eu, {{cliente_nome}}, em {{cidade}}.", { cliente_nome: "Ana" });
    expect(r.texto).toBe("Eu, Ana, em [CIDADE].");
    expect(r.faltantes).toEqual(["cidade"]);
    expect(dataPorExtenso("2026-10-01")).toBe("1º de outubro de 2026");
  });
  it("anonimização", () => {
    const r = anonimizar("JOÃO DA SILVA, brasileiro, CPF 529.982.247-25, e-mail joao@x.com, contra Banco Tal.", ["Banco Tal"]);
    expect(r.texto).toBe("[NOME], brasileiro, CPF [CPF], e-mail [E-MAIL], contra [NOME].");
  });
  it("ics", () => {
    const ics = gerarIcs("Agenda", [{ uid: "1@x", inicio: "2026-11-05T13:00:00.000Z", titulo: "Audiência, instrução", alarmesMinutos: [60] }]);
    expect(ics).toContain("DTSTART:20261105T130000Z");
    expect(ics).toContain("SUMMARY:Audiência\\, instrução");
    expect(ics).toContain("TRIGGER:-PT60M");
  });
});
