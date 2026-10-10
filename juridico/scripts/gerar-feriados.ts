/**
 * Gera o SQL de carga inicial de feriados (TJRS e TRT4) para os anos informados.
 * Uso: npx tsx scripts/gerar-feriados.ts 2026 2027 > supabase/migrations/0008_seed_feriados.sql
 *
 * Todas as linhas entram com validado = false. Um administrador precisa conferir cada
 * data contra o calendário oficial do tribunal antes de marcar como validada.
 */

type Linha = {
  data: string;
  descricao: string;
  abrangencia: "nacional" | "estadual" | "comarca";
  uf?: string;
  tribunal?: string;
  comarca?: string;
  tipo: "feriado" | "suspensao" | "recesso" | "expediente_reduzido";
  fonte: string;
};

function pascoa(ano: number): Date {
  // Algoritmo de Meeus/Jones/Butcher (calendário gregoriano)
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const somar = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const fixo = (ano: number, mes: number, dia: number) => `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

const FONTE_LEI_662 = "https://www.planalto.gov.br/ccivil_03/leis/l0662.htm";
const FONTE_LEI_6802 = "https://www.planalto.gov.br/ccivil_03/leis/l6802.htm";
const FONTE_LEI_14759 = "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14759.htm";
const FONTE_LEI_9093 = "https://www.planalto.gov.br/ccivil_03/leis/l9093.htm";
const FONTE_LEI_5010 = "https://www.planalto.gov.br/ccivil_03/leis/l5010.htm";
const FONTE_CNJ_244 = "https://atos.cnj.jus.br/atos/detalhar/2332";
const FONTE_TJRS = "https://www.tjrs.jus.br/novo/institucional/calendario/ [CONFERIR ato do ano]";
const FONTE_TRT4 = "https://www.trt4.jus.br/portais/trt4/calendario [CONFERIR ato do ano]";

function gerar(ano: number): Linha[] {
  const p = pascoa(ano);
  const l: Linha[] = [];
  const nac = (data: string, descricao: string, fonte: string) =>
    l.push({ data, descricao, abrangencia: "nacional", tipo: "feriado", fonte });

  // Nacionais
  nac(fixo(ano, 1, 1), "Confraternização Universal", FONTE_LEI_662);
  nac(fixo(ano, 4, 21), "Tiradentes", FONTE_LEI_662);
  nac(fixo(ano, 5, 1), "Dia do Trabalho", FONTE_LEI_662);
  nac(fixo(ano, 9, 7), "Independência do Brasil", FONTE_LEI_662);
  nac(fixo(ano, 10, 12), "Nossa Senhora Aparecida", FONTE_LEI_6802);
  nac(fixo(ano, 11, 2), "Finados", FONTE_LEI_662);
  nac(fixo(ano, 11, 15), "Proclamação da República", FONTE_LEI_662);
  nac(fixo(ano, 11, 20), "Dia Nacional de Zumbi e da Consciência Negra", FONTE_LEI_14759);
  nac(fixo(ano, 12, 25), "Natal", FONTE_LEI_662);
  nac(iso(somar(p, -2)), "Sexta-feira Santa", FONTE_LEI_9093);

  // Estadual RS
  l.push({ data: fixo(ano, 9, 20), descricao: "Revolução Farroupilha (data magna do RS)", abrangencia: "estadual", uf: "RS", tipo: "feriado", fonte: "https://www.al.rs.gov.br/legis (Lei estadual 4.850/1964) [CONFERIR]" });

  // TJRS (forense estadual) [CONFERIR]
  const tj = (data: string, descricao: string, tipo: Linha["tipo"], fonte = FONTE_TJRS) =>
    l.push({ data, descricao, abrangencia: "estadual", uf: "RS", tribunal: "TJRS", tipo, fonte });
  tj(iso(somar(p, -48)), "Carnaval (segunda-feira) [CONFERIR]", "feriado");
  tj(iso(somar(p, -47)), "Carnaval (terça-feira) [CONFERIR]", "feriado");
  tj(iso(somar(p, -46)), "Quarta-feira de Cinzas: expediente iniciado após a hora normal (CPC art. 224 §1º) [CONFERIR]", "expediente_reduzido");
  tj(iso(somar(p, -3)), "Quinta-feira Santa [CONFERIR]", "feriado");
  tj(iso(somar(p, 60)), "Corpus Christi [CONFERIR]", "feriado");
  tj(fixo(ano, 12, 8), "Dia da Justiça [CONFERIR]", "feriado");
  // Recesso forense (Res. CNJ 244/2016): 20/12 a 6/1
  for (let d = new Date(Date.UTC(ano, 11, 20)); d <= new Date(Date.UTC(ano + 1, 0, 6)); d = somar(d, 1)) {
    tj(iso(d), "Recesso forense (Res. CNJ 244/2016) [CONFERIR]", "recesso", FONTE_CNJ_244);
  }

  // Comarca de Porto Alegre (feriados municipais) [CONFERIR]
  l.push({ data: fixo(ano, 2, 2), descricao: "Nossa Senhora dos Navegantes (Porto Alegre) [CONFERIR]", abrangencia: "comarca", uf: "RS", comarca: "porto alegre", tipo: "feriado", fonte: "Lei municipal de Porto Alegre [CONFERIR]" });

  // TRT4: Lei 5.010/1966, art. 62 (aplicada à Justiça do Trabalho) [CONFERIR]
  const trt = (data: string, descricao: string, tipo: Linha["tipo"] = "feriado") =>
    l.push({ data, descricao, abrangencia: "estadual", uf: "RS", tribunal: "TRT4", tipo, fonte: `${FONTE_LEI_5010} e ${FONTE_TRT4}` });
  trt(iso(somar(p, -48)), "Carnaval (segunda-feira), Lei 5.010/66 art. 62 III");
  trt(iso(somar(p, -47)), "Carnaval (terça-feira), Lei 5.010/66 art. 62 III");
  trt(iso(somar(p, -46)), "Quarta-feira de Cinzas: expediente reduzido [CONFERIR]", "expediente_reduzido");
  for (let k = -4; k <= 0; k++) {
    if (k === -2) continue; // sexta-feira santa já é nacional
    trt(iso(somar(p, k)), "Semana Santa, Lei 5.010/66 art. 62 II");
  }
  trt(iso(somar(p, 60)), "Corpus Christi [CONFERIR]");
  trt(fixo(ano, 8, 11), "Dia dos Cursos Jurídicos, Lei 5.010/66 art. 62 IV");
  trt(fixo(ano, 11, 1), "Dia de Todos os Santos, Lei 5.010/66 art. 62 IV");
  trt(fixo(ano, 12, 8), "Dia da Justiça, Lei 5.010/66 art. 62 IV");
  for (let d = new Date(Date.UTC(ano, 11, 20)); d <= new Date(Date.UTC(ano + 1, 0, 6)); d = somar(d, 1)) {
    trt(iso(d), "Recesso, Lei 5.010/66 art. 62 I", "recesso");
  }
  return l;
}

const q = (v?: string) => (v === undefined ? "null" : `'${v.replace(/'/g, "''")}'`);

const anos = process.argv.slice(2).map(Number).filter(Boolean);
if (anos.length === 0) anos.push(new Date().getFullYear(), new Date().getFullYear() + 1);

// O recesso de dezembro do ano anterior invade janeiro do primeiro ano: inclui só esses dias.
const inicio = `${anos[0]}-01-01`;
const linhas = [...gerar(anos[0] - 1).filter((r) => r.data >= inicio), ...anos.flatMap(gerar)];
const out: string[] = [];
out.push("-- Gerado por scripts/gerar-feriados.ts. Conferir cada data no painel admin antes de validar.");
out.push("insert into public.feriados (data, descricao, abrangencia, uf, tribunal, comarca, tipo, fonte, validado) values");
out.push(
  linhas
    .map((r) => `  ('${r.data}', ${q(r.descricao)}, '${r.abrangencia}', ${q(r.uf)}, ${q(r.tribunal)}, ${q(r.comarca)}, '${r.tipo}', ${q(r.fonte)}, false)`)
    .join(",\n") + ";",
);
console.log(out.join("\n"));
