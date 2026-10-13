import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Cabecalho, Campo, Cartao, Etiqueta, Grade, Mensagens, Selecao, Tabela } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { formatarDataBr, normalizarTexto } from "@/lib/prazos/motor";
import { LISTA_UFS } from "@/lib/tribunais";
import { exigirAdmin } from "../guarda";

async function salvar(fd: FormData) {
  "use server";
  const ctx = await exigirAdmin();
  const id = textoOuNulo(fd, "id");
  const abr = texto(fd, "abrangencia");
  const dados = {
    data: texto(fd, "data"),
    descricao: texto(fd, "descricao"),
    abrangencia: abr,
    uf: abr === "nacional" ? null : textoOuNulo(fd, "uf"),
    tribunal: textoOuNulo(fd, "tribunal")?.toUpperCase() ?? null,
    comarca: abr === "comarca" ? normalizarTexto(texto(fd, "comarca")) || null : null,
    tipo: texto(fd, "tipo"),
    fonte: textoOuNulo(fd, "fonte"),
    validado: fd.get("validado") === "on",
  };
  // período: cria um registro por dia (útil para portarias de suspensão)
  const ate = textoOuNulo(fd, "ate");
  try {
    if (id) {
      const { error } = await ctx.supabase.from("feriados").update(dados).eq("id", id);
      if (error) throw error;
    } else {
      const linhas = [];
      for (let d = new Date(`${dados.data}T12:00:00Z`); d <= new Date(`${ate || dados.data}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
        linhas.push({ ...dados, data: d.toISOString().slice(0, 10) });
        if (linhas.length > 400) throw new Error("Período longo demais.");
      }
      const { error } = await ctx.supabase.from("feriados").insert(linhas);
      if (error) throw error;
    }
  } catch (e) {
    voltarCom("/admin/feriados", { erro: erroAmigavel(e) });
  }
  revalidatePath("/admin/feriados");
  voltarCom(`/admin/feriados?ano=${dados.data.slice(0, 4)}`, { ok: "Salvo." });
}

async function alternar(fd: FormData) {
  "use server";
  const ctx = await exigirAdmin();
  const campo = texto(fd, "campo");
  if (!["validado", "ativo"].includes(campo)) return;
  await ctx.supabase.from("feriados").update({ [campo]: texto(fd, "valor") === "1" }).eq("id", texto(fd, "id"));
  revalidatePath("/admin/feriados");
}

async function excluir(fd: FormData) {
  "use server";
  const ctx = await exigirAdmin();
  await ctx.supabase.from("feriados").delete().eq("id", texto(fd, "id"));
  revalidatePath("/admin/feriados");
}

const TIPOS = [
  { valor: "feriado", rotulo: "Feriado" },
  { valor: "suspensao", rotulo: "Suspensão de expediente (portaria)" },
  { valor: "recesso", rotulo: "Recesso" },
  { valor: "expediente_reduzido", rotulo: "Expediente reduzido (só prorroga início e vencimento)" },
];

export default async function Feriados({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const b = await searchParams;
  const ctx = await exigirAdmin();
  const ano = b.ano ?? new Date().getFullYear().toString();
  let q = ctx.supabase.from("feriados").select("*").gte("data", `${ano}-01-01`).lte("data", `${ano}-12-31`).order("data");
  if (b.tribunal) q = q.eq("tribunal", b.tribunal.toUpperCase());
  const { data: feriados } = await q;
  const ufs = [{ valor: "", rotulo: "-" }, ...LISTA_UFS.map((u) => ({ valor: u, rotulo: u }))];
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Feriados e suspensões" voltar={{ href: "/admin", rotulo: "Admin" }} descricao="Itens com [CONFERIR] vieram da carga inicial e precisam ser conferidos no calendário oficial do tribunal." />
      <Mensagens busca={b} />
      <Cartao titulo="Incluir feriado ou portaria de suspensão">
        <form action={salvar} className="space-y-3">
          <Grade colunas={3}>
            <Campo rotulo="Data (ou início)" name="data" type="date" required />
            <Campo rotulo="Até (opcional, para períodos)" name="ate" type="date" />
            <Selecao rotulo="Tipo" name="tipo" opcoes={TIPOS} />
            <Selecao rotulo="Abrangência" name="abrangencia" opcoes={[{ valor: "nacional", rotulo: "Nacional" }, { valor: "estadual", rotulo: "Estadual" }, { valor: "comarca", rotulo: "Comarca" }]} />
            <Selecao rotulo="UF" name="uf" opcoes={ufs} />
            <Campo rotulo="Tribunal (vazio = todos)" name="tribunal" placeholder="TJRS, TRT4..." />
            <Campo rotulo="Comarca" name="comarca" />
          </Grade>
          <Campo rotulo="Descrição" name="descricao" required />
          <Campo rotulo="Fonte (link do ato)" name="fonte" type="url" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="validado" /> Conferido no calendário oficial
          </label>
          <Enviar>Incluir</Enviar>
        </form>
      </Cartao>
      <form className="flex flex-wrap items-end gap-2">
        <Campo rotulo="Ano" name="ano" type="number" defaultValue={ano} className="w-28" />
        <Campo rotulo="Tribunal" name="tribunal" defaultValue={b.tribunal} className="w-32" />
        <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">Filtrar</button>
      </form>
      <Cartao titulo={`${feriados?.length ?? 0} registro(s) em ${ano}`}>
        <Tabela cabecalho={["Data", "Descrição", "Escopo", "Tipo", "Situação", ""]}>
          {(feriados ?? []).map((f) => (
            <tr key={f.id} className={f.ativo ? "" : "opacity-50"}>
              <td className="whitespace-nowrap px-3 py-2">{formatarDataBr(f.data)}</td>
              <td className="px-3 py-2">
                {f.descricao}
                {f.fonte?.startsWith("http") && (
                  <Link href={f.fonte.split(" ")[0]} target="_blank" className="ml-1 text-xs text-slate-500 underline">
                    fonte
                  </Link>
                )}
              </td>
              <td className="px-3 py-2 text-xs">{[f.abrangencia, f.uf, f.tribunal, f.comarca].filter(Boolean).join(" · ")}</td>
              <td className="px-3 py-2 text-xs">{f.tipo}</td>
              <td className="px-3 py-2">{f.validado ? <Etiqueta cor="verde">validado</Etiqueta> : <Etiqueta cor="amarelo">conferir</Etiqueta>}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                <form action={alternar} className="inline">
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="campo" value="validado" />
                  <input type="hidden" name="valor" value={f.validado ? "0" : "1"} />
                  <button className="underline">{f.validado ? "desvalidar" : "validar"}</button>
                </form>{" "}
                <form action={alternar} className="inline">
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="campo" value="ativo" />
                  <input type="hidden" name="valor" value={f.ativo ? "0" : "1"} />
                  <button className="underline">{f.ativo ? "desativar" : "ativar"}</button>
                </form>{" "}
                <form action={excluir} className="inline">
                  <input type="hidden" name="id" value={f.id} />
                  <button className="text-red-700 underline">excluir</button>
                </form>
              </td>
            </tr>
          ))}
        </Tabela>
      </Cartao>
    </div>
  );
}
