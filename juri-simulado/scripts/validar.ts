import { readFileSync } from "node:fs";
import { validarDados } from "../src/schema/validar";

const ler = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));

try {
  const { caso, macetes } = validarDados(ler("../src/data/caso.json"), ler("../src/data/macetes.json"));
  const pend = macetes.dispositivos.filter((d) => d.status !== "confirmado").length;
  console.log(
    `OK: caso.json e macetes.json válidos. ` +
      `${macetes.macetes.length} macetes, ${macetes.dispositivos.length} dispositivos (${pend} com VERIFICAR), ` +
      `${caso.linhaFato.length + caso.linhaProcesso.length} eventos, ` +
      `${caso.provas.favorece.length + caso.provas.dificulta.length} provas, ${caso.teses.length} teses.`,
  );
} catch (e) {
  console.error("Falha na validação dos dados:\n" + (e as Error).message);
  process.exit(1);
}
