import { describe, expect, it } from "vitest";
import { analisarTexto, AVISO_NAO_VERIFICADO } from "@/lib/verificador";
import { calcularDv } from "@/lib/cnj";

const leis = [
  { sigla: "CPC", nome: "Código de Processo Civil", apelidos: ["CPC", "CPC/15", "Código de Processo Civil"], ultimo_artigo: 1072 },
  { sigla: "CC", nome: "Código Civil", apelidos: ["CC", "Código Civil"], ultimo_artigo: 2046 },
];

const dv = calcularDv("5001234", "2025", "8", "21", "0001");
const valido = `5001234-${dv}.2025.8.21.0001`;

describe("verificador de petição", () => {
  it("aponta DV inválido e tribunal divergente", () => {
    const errado = `5001234-${String((+dv + 1) % 100).padStart(2, "0")}.2025.8.21.0001`;
    const r = analisarTexto(`Conforme decidido no TJSP, Apelação Cível ${valido}. Ver também ${errado}.`, leis, "2026-10-10");
    const msgs = r.achados.filter((a) => a.categoria === "processo").map((a) => a.mensagem);
    expect(msgs.some((m) => m.includes("dígito verificador"))).toBe(true);
    expect(msgs.some((m) => m.includes("TJRS"))).toBe(true);
    expect(r.cnjs[0].classeCitada).toBe("Apelação Cível");
  });

  it("marca jurisprudência sem número como não verificada", () => {
    const r = analisarTexto("Nesse sentido, REsp 1.234.567/RS e Súmula 7 do STJ. (TJRS, Rel. Des. Fulano, julgado em 10/05/2024)", leis, "2026-10-10");
    const juris = r.achados.filter((a) => a.categoria === "jurisprudencia");
    expect(juris).toHaveLength(3);
    expect(juris.every((j) => j.gravidade === "nao_verificado" && j.mensagem.startsWith(AVISO_NAO_VERIFICADO) && j.link)).toBe(true);
  });

  it("artigo com numeração inválida", () => {
    const r = analisarTexto("nos termos do art. 1.500 do CPC e do art. 186 do Código Civil", leis, "2026-10-10");
    const arts = r.achados.filter((a) => a.categoria === "artigo");
    expect(arts).toHaveLength(1);
    expect(arts[0].trecho).toContain("1.500");
  });

  it("datas impossíveis e futuras", () => {
    const r = analisarTexto("Em 31/02/2024 e em 30 de fevereiro de 2023, e audiência em 10/12/2027.", leis, "2026-10-10");
    const datas = r.achados.filter((a) => a.categoria === "data");
    expect(datas.filter((d) => d.gravidade === "erro")).toHaveLength(2);
    expect(datas.filter((d) => d.gravidade === "alerta")).toHaveLength(1);
  });

  it("nomes de parte divergentes", () => {
    const r = analisarTexto("AUTORA: Maria Aparecida dos Santos, brasileira. Em seguida, Maria Aparecida dos Sanots, brasileira, requer.", leis, "2026-10-10");
    expect(r.achados.some((a) => a.categoria === "parte")).toBe(true);
  });
});
