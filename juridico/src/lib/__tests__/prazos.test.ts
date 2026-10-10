import { describe, expect, it } from "vitest";
import { calcularPrazo } from "@/lib/prazos/motor";
import { CIVEL, FERIADOS, PENAL } from "./fixtures";

const tjrs = { tribunal: "TJRS", uf: "RS", comarca: "Porto Alegre" };

describe("motor de prazos: cível (CPC)", () => {
  it("DJe: publicação no dia útil seguinte e início no dia útil após a publicação", () => {
    const r = calcularPrazo({ dataEvento: "2026-03-02", tipoEvento: "disponibilizacao_dje", dias: 15, regra: CIVEL, feriados: FERIADOS, contexto: tjrs });
    expect(r.dataMarco).toBe("2026-03-03");
    expect(r.dataInicioContagem).toBe("2026-03-04");
    expect(r.dataFinal).toBe("2026-03-24");
    expect(r.memoria.filter((m) => m.situacao === "contado" || m.situacao === "vencimento")).toHaveLength(15);
  });

  it("pula carnaval do TJRS e prorroga o início na quarta-feira de cinzas", () => {
    const r = calcularPrazo({ dataEvento: "2026-02-13", tipoEvento: "disponibilizacao_dje", dias: 5, regra: CIVEL, feriados: FERIADOS, contexto: tjrs });
    expect(r.dataMarco).toBe("2026-02-18");
    expect(r.dataFinal).toBe("2026-02-25");
  });

  it("feriado de outro tribunal não se aplica", () => {
    const r = calcularPrazo({ dataEvento: "2026-02-13", tipoEvento: "disponibilizacao_dje", dias: 5, regra: CIVEL, feriados: FERIADOS, contexto: { tribunal: "TRT4", uf: "RS" } });
    expect(r.dataMarco).toBe("2026-02-16");
    expect(r.dataFinal).toBe("2026-02-23");
  });

  it("suspensão de 20/12 a 20/1 (art. 220)", () => {
    const r = calcularPrazo({ dataEvento: "2026-12-17", tipoEvento: "disponibilizacao_dje", dias: 5, regra: CIVEL, feriados: FERIADOS, contexto: tjrs });
    expect(r.dataMarco).toBe("2026-12-18");
    expect(r.dataInicioContagem).toBe("2027-01-21");
    expect(r.dataFinal).toBe("2027-01-27");
    expect(r.memoria.some((m) => m.data === "2027-01-15" && m.situacao === "pulado" && m.motivo.includes("Suspensão"))).toBe(true);
  });

  it("intimação eletrônica por portal: ciência ficta em 10 dias corridos", () => {
    const r = calcularPrazo({ dataEvento: "2026-03-02", tipoEvento: "intimacao_portal", dias: 5, regra: CIVEL, feriados: FERIADOS, contexto: tjrs });
    expect(r.dataMarco).toBe("2026-03-12");
    expect(r.dataFinal).toBe("2026-03-19");
  });

  it("ciência ficta em sábado vai para o primeiro dia útil", () => {
    const r = calcularPrazo({ dataEvento: "2026-03-04", tipoEvento: "intimacao_portal", dias: 5, regra: CIVEL, feriados: FERIADOS, contexto: tjrs });
    expect(r.dataMarco).toBe("2026-03-16");
    expect(r.dataFinal).toBe("2026-03-23");
  });

  it("prazo em dobro", () => {
    const r = calcularPrazo({ dataEvento: "2026-03-02", tipoEvento: "ciencia", dias: 15, emDobro: true, regra: CIVEL, feriados: FERIADOS, contexto: tjrs });
    expect(r.diasConsiderados).toBe(30);
    expect(r.dataFinal).toBe("2026-04-14"); // Sexta-feira Santa (03/04) pulada
  });

  it("feriado municipal só vale para a comarca", () => {
    const poa = calcularPrazo({ dataEvento: "2026-01-30", tipoEvento: "ciencia", dias: 1, regra: CIVEL, feriados: FERIADOS, contexto: tjrs });
    const outra = calcularPrazo({ dataEvento: "2026-01-30", tipoEvento: "ciencia", dias: 1, regra: CIVEL, feriados: FERIADOS, contexto: { ...tjrs, comarca: "Canoas" } });
    expect(poa.dataFinal).toBe("2026-02-03");
    expect(outra.dataFinal).toBe("2026-02-02");
  });
});

describe("motor de prazos: penal (CPP)", () => {
  it("intimação na sexta: começa na segunda (Súmula 310 STF)", () => {
    const r = calcularPrazo({ dataEvento: "2026-03-06", tipoEvento: "ciencia", dias: 5, regra: PENAL, feriados: FERIADOS });
    expect(r.dataInicioContagem).toBe("2026-03-09");
    expect(r.dataFinal).toBe("2026-03-13");
  });

  it("vencimento no sábado prorroga para segunda", () => {
    const r = calcularPrazo({ dataEvento: "2026-03-02", tipoEvento: "ciencia", dias: 5, regra: PENAL, feriados: FERIADOS });
    expect(r.dataFinal).toBe("2026-03-09");
  });

  it("conta feriado no meio do prazo", () => {
    const r = calcularPrazo({ dataEvento: "2026-03-31", tipoEvento: "ciencia", dias: 5, regra: PENAL, feriados: FERIADOS });
    // 01/04 a 05/04; 05/04 é domingo: prorroga para 06/04
    expect(r.dataFinal).toBe("2026-04-06");
  });
});

describe("validações", () => {
  it("rejeita dias inválidos", () => {
    expect(() => calcularPrazo({ dataEvento: "2026-03-02", tipoEvento: "ciencia", dias: 0, regra: CIVEL, feriados: [] })).toThrow();
  });
});
