import { revalidatePath } from "next/cache";
import { AreaTexto, Cabecalho, Cartao, Mensagens, Tabela } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { texto, voltarCom } from "@/lib/acoes";
import { exigirAdmin } from "../guarda";

const INDICES = ["IPCA", "IPCA-E", "INPC", "SELIC", "TR"];

/** Aceita linhas "INDICE;AAAA-MM;valor" ou "INDICE;MM/AAAA;valor" (decimal com vírgula ou ponto). */
function lerCsv(conteudo: string, fonte: string) {
  const linhas: { indice: string; competencia: string; valor: number; fonte: string }[] = [];
  const erros: string[] = [];
  conteudo.split(/\r?\n/).forEach((bruta, i) => {
    const l = bruta.trim();
    if (!l || /^indice/i.test(l)) return;
    const partes = l.split(/[;\t]/).map((p) => p.trim());
    const [indice, comp, valorTxt] = partes.length >= 3 ? partes : l.split(",").map((p) => p.trim());
    const ind = (indice || "").toUpperCase();
    let competencia = "";
    if (/^\d{4}-\d{2}$/.test(comp ?? "")) competencia = `${comp}-01`;
    else if (/^\d{2}\/\d{4}$/.test(comp ?? "")) competencia = `${comp.slice(3)}-${comp.slice(0, 2)}-01`;
    const valor = Number(String(valorTxt ?? "").replace(",", "."));
    if (!INDICES.includes(ind) || !competencia || !Number.isFinite(valor)) {
      erros.push(`Linha ${i + 1}: "${l}"`);
      return;
    }
    linhas.push({ indice: ind, competencia, valor, fonte });
  });
  return { linhas, erros };
}

async function importar(fd: FormData) {
  "use server";
  const ctx = await exigirAdmin();
  let conteudo = texto(fd, "csv");
  const arquivo = fd.get("arquivo");
  if (arquivo instanceof File && arquivo.size > 0) conteudo = await arquivo.text();
  const { linhas, erros } = lerCsv(conteudo, texto(fd, "fonte") || "Importação CSV");
  if (erros.length) voltarCom("/admin/indices", { erro: `Corrija as linhas: ${erros.slice(0, 5).join("; ")}` });
  if (!linhas.length) voltarCom("/admin/indices", { erro: "Nenhuma linha válida." });
  const { error } = await ctx.supabase.from("indices").upsert(linhas.map((l) => ({ ...l, atualizado_em: new Date().toISOString() })), { onConflict: "indice,competencia" });
  if (error) voltarCom("/admin/indices", { erro: error.message });
  revalidatePath("/admin/indices");
  voltarCom("/admin/indices", { ok: `${linhas.length} valor(es) importado(s).` });
}

export default async function Indices({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await exigirAdmin();
  const { data } = await ctx.supabase.from("indices").select("indice, competencia, valor, fonte").order("competencia", { ascending: false }).limit(5 * 36);
  const meses = [...new Set((data ?? []).map((d) => d.competencia))].slice(0, 24);
  const valor = (ind: string, comp: string) => data?.find((d) => d.indice === ind && d.competencia === comp)?.valor;
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Índices econômicos" voltar={{ href: "/admin", rotulo: "Admin" }} descricao="Variação percentual mensal. Use as séries oficiais (IBGE para IPCA, IPCA-E e INPC; Banco Central para Selic e TR)." />
      <Mensagens busca={await searchParams} />
      <Cartao titulo="Importar CSV">
        <form action={importar} className="space-y-3">
          <p className="text-sm text-slate-600">
            Formato: <code>INDICE;AAAA-MM;valor</code> por linha. Exemplo: <code>IPCA;2024-01;0,42</code>. Índices aceitos: {INDICES.join(", ")}. Valores existentes são substituídos.
          </p>
          <input type="file" name="arquivo" accept=".csv,.txt" className="text-sm" />
          <AreaTexto rotulo="Ou cole aqui" name="csv" rows={5} />
          <input name="fonte" placeholder="Fonte (ex.: IBGE SIDRA, BCB SGS)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <Enviar>Importar</Enviar>
        </form>
      </Cartao>
      <Cartao titulo="Últimas competências">
        {!meses.length ? (
          <p className="text-sm text-slate-500">Nenhum índice cadastrado. As calculadoras só funcionam com índices importados.</p>
        ) : (
          <Tabela cabecalho={["Competência", ...INDICES]}>
            {meses.map((m) => (
              <tr key={m}>
                <td className="px-3 py-1.5">{m.slice(5, 7)}/{m.slice(0, 4)}</td>
                {INDICES.map((i) => (
                  <td key={i} className="px-3 py-1.5 font-mono text-xs">
                    {valor(i, m)?.toString().replace(".", ",") ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </Tabela>
        )}
      </Cartao>
    </div>
  );
}
