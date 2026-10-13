import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Cabecalho, Cartao, Mensagens } from "@/components/ui";
import { FormModelo } from "@/components/form-modelo";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { exigirAdmin } from "../guarda";

async function salvar(fd: FormData) {
  "use server";
  const ctx = await exigirAdmin();
  const id = textoOuNulo(fd, "id");
  const dados = { nome: texto(fd, "nome"), tipo: texto(fd, "tipo"), conteudo: texto(fd, "conteudo"), escritorio_id: null, atualizado_em: new Date().toISOString() };
  const { error } = id ? await ctx.supabase.from("modelos_documento").update(dados).eq("id", id) : await ctx.supabase.from("modelos_documento").insert(dados);
  if (error) voltarCom("/admin/modelos", { erro: erroAmigavel(error) });
  revalidatePath("/admin/modelos");
  voltarCom("/admin/modelos", { ok: "Modelo padrão salvo." });
}

export default async function ModelosGlobais({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const b = await searchParams;
  const ctx = await exigirAdmin();
  const { data: modelos } = await ctx.supabase.from("modelos_documento").select("*").is("escritorio_id", null).order("nome");
  const editando = modelos?.find((m) => m.id === b.editar);
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Modelos padrão" voltar={{ href: "/admin", rotulo: "Admin" }} descricao="Disponíveis para todos os escritórios, que podem copiar e adaptar." />
      <Mensagens busca={b} />
      <Cartao titulo="Modelos">
        <ul className="space-y-1 text-sm">
          {(modelos ?? []).map((m) => (
            <li key={m.id}>
              <Link href={`/admin/modelos?editar=${m.id}`} className="underline">
                {m.nome}
              </Link>{" "}
              <span className="text-slate-500">({m.tipo})</span>
            </li>
          ))}
        </ul>
      </Cartao>
      <Cartao titulo={editando ? `Editar: ${editando.nome}` : "Novo modelo padrão"}>
        <FormModelo key={editando?.id ?? "novo"} acao={salvar} modelo={editando ?? {}} />
      </Cartao>
    </div>
  );
}
