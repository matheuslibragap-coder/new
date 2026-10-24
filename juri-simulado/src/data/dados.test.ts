import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import casoJson from "./caso.json";
import macetesJson from "./macetes.json";
import { validarDados } from "../schema/validar";

const { caso, macetes } = validarDados(casoJson, macetesJson);

describe("dados", () => {
  it("os dois JSONs passam no schema zod e nas referências cruzadas", () => {
    expect(caso.painel.resumo).toHaveLength(5);
  });

  it("todo item do mapa de provas e da linha do tempo tem fonte", () => {
    const itens = [...caso.provas.favorece, ...caso.provas.dificulta, ...caso.linhaFato, ...caso.linhaProcesso];
    for (const i of itens) expect(i.fonte.peca.trim(), i.id).not.toBe("");
  });

  it("todo macete tem os 7 campos preenchidos", () => {
    for (const m of macetes.macetes) {
      const campos = [m.titulo, m.dispositivos.join(), m.momento, m.pedido, m.formula, m.seNaoFizer, caso.macetes[m.id]?.aplicacao];
      for (const c of campos) expect(c?.trim(), m.id).toBeTruthy();
    }
  });

  it("nenhum texto do caso aparece no código da interface", () => {
    const termos = [
      caso.painel.processo,
      ...caso.painel.pessoas.map((p) => p.nome.split(" ")[0]),
      ...caso.painel.pessoas.flatMap((p) => (p.alcunha ? [p.alcunha] : [])),
    ];
    const arquivos: string[] = [];
    const varrer = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) varrer(p);
        else if (/\.(tsx?|css|html)$/.test(n) && !n.endsWith(".test.ts")) arquivos.push(p);
      }
    };
    varrer(join(__dirname, ".."));
    arquivos.push(join(__dirname, "../../index.html"));
    for (const a of arquivos) {
      const txt = readFileSync(a, "utf8");
      for (const t of termos) expect(txt.includes(t), `${a} contém “${t}”`).toBe(false);
    }
  });
});
