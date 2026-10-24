import { CasoArquivo, type TCaso } from "./caso";
import { MacetesArquivo, type TMacetesArquivo } from "./macetes";

export interface Validado {
  caso: TCaso;
  macetes: TMacetesArquivo;
}

/**
 * Valida os dois JSONs com zod e confere as referências cruzadas:
 * todo artigo citado existe no cadastro, todo macete tem aplicação ao caso,
 * toda tese aponta para provas existentes e os ids não se repetem.
 * Lança um Error com a lista completa de problemas.
 */
export function validarDados(casoBruto: unknown, macetesBruto: unknown): Validado {
  const erros: string[] = [];

  const c = CasoArquivo.safeParse(casoBruto);
  const m = MacetesArquivo.safeParse(macetesBruto);
  if (!c.success) for (const i of c.error.issues) erros.push(`caso.json ${i.path.join(".")}: ${i.message}`);
  if (!m.success) for (const i of m.error.issues) erros.push(`macetes.json ${i.path.join(".")}: ${i.message}`);
  if (!c.success || !m.success) throw new Error(erros.join("\n"));

  const caso = c.data;
  const mac = m.data;

  const unicos = (nome: string, ids: string[]) => {
    const vistos = new Set<string>();
    for (const id of ids) {
      if (vistos.has(id)) erros.push(`${nome}: id repetido “${id}”`);
      vistos.add(id);
    }
  };

  unicos("dispositivos", mac.dispositivos.map((d) => d.id));
  unicos("fases", mac.fases.map((f) => f.id));
  unicos("macetes", mac.macetes.map((x) => x.id));
  unicos("linhaFato", caso.linhaFato.map((x) => x.id));
  unicos("linhaProcesso", caso.linhaProcesso.map((x) => x.id));
  unicos("provas", [...caso.provas.favorece, ...caso.provas.dificulta].map((x) => x.id));
  unicos("teses", caso.teses.map((x) => x.id));
  unicos("quesitos", caso.quesitacao.quesitos.map((x) => x.id));

  const disp = new Set(mac.dispositivos.map((d) => d.id));
  const confere = (onde: string, ids: string[]) => {
    for (const id of ids) if (!disp.has(id)) erros.push(`${onde}: dispositivo “${id}” não está cadastrado em macetes.json`);
  };

  const fases = new Set(mac.fases.map((f) => f.id));
  for (const x of mac.macetes) {
    if (!fases.has(x.fase)) erros.push(`macete ${x.id}: fase “${x.fase}” inexistente`);
    confere(`macete ${x.id}`, x.dispositivos);
    if (!caso.macetes[x.id]) erros.push(`macete ${x.id}: falta a aplicação ao caso em caso.json (macetes.${x.id})`);
  }
  const idsMacetes = new Set(mac.macetes.map((x) => x.id));
  for (const id of Object.keys(caso.macetes))
    if (!idsMacetes.has(id)) erros.push(`caso.json macetes.${id}: macete inexistente em macetes.json`);

  confere("painel.imputacaoAtual", caso.painel.imputacaoAtual.dispositivos);
  for (const e of caso.linhaProcesso) confere(`linhaProcesso ${e.id}`, e.dispositivos);
  for (const p of caso.pontosAtencao) confere(`pontoAtencao ${p.id}`, p.dispositivos);
  for (const f of caso.falasMP) confere(`falaMP ${f.id}`, f.dispositivos);
  for (const q of caso.quesitacao.quesitos) confere(`quesito ${q.id}`, q.dispositivos);
  for (const [k, r] of Object.entries(caso.quesitacao.resultados)) confere(`resultado ${k}`, r.dispositivos);

  const provas = new Set([...caso.provas.favorece, ...caso.provas.dificulta].map((p) => p.id));
  const teses = new Set(caso.teses.map((t) => t.id));
  for (const t of caso.teses) {
    confere(`tese ${t.id}`, t.dispositivos);
    for (const p of t.provas) if (!provas.has(p)) erros.push(`tese ${t.id}: prova “${p}” inexistente`);
    if (t.pai && !teses.has(t.pai)) erros.push(`tese ${t.id}: tese-pai “${t.pai}” inexistente`);
  }

  const tipos = new Set(caso.quesitacao.quesitos.map((q) => q.tipo));
  for (const t of ["materialidade", "autoria", "absolvicao", "diminuicao", "qualificadora"] as const)
    if (!tipos.has(t)) erros.push(`quesitação: falta quesito do tipo “${t}”`);

  if (erros.length) throw new Error(erros.join("\n"));
  return { caso, macetes: mac };
}
