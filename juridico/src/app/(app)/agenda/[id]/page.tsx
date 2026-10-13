import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho, Cartao, Mensagens, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { FormCompromisso } from "../form-compromisso";
import { opcoesProcessos } from "../opcoes";
import { anexarDocumento, excluirCompromisso, removerAnexo } from "../acoes";

export default async function Compromisso({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: c } = await ctx.supabase.from("compromissos").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const { data: anexos } = await ctx.supabase.from("compromisso_anexos").select("id, nome, caminho, tamanho").eq("compromisso_id", id).order("criado_em");
  const links = await Promise.all(
    (anexos ?? []).map(async (a) => ({ ...a, url: (await ctx.supabase.storage.from("documentos").createSignedUrl(a.caminho, 3600)).data?.signedUrl })),
  );
  const quando = new Date(c.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" });
  return (
    <div className="space-y-4">
      <Cabecalho titulo={c.titulo} descricao={quando} voltar={{ href: "/agenda", rotulo: "Agenda" }} />
      <Mensagens busca={await searchParams} />
      {(c.link_sala || c.processo_id) && (
        <div className="flex flex-wrap gap-2">
          {c.link_sala && (
            <a href={c.link_sala} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
              Entrar na sala virtual
            </a>
          )}
          {c.processo_id && (
            <Link href={`/processos/${c.processo_id}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">
              Ver processo
            </Link>
          )}
        </div>
      )}
      <Cartao titulo="Documentos anexados">
        {!links.length ? (
          <Vazio>Nenhum documento.</Vazio>
        ) : (
          <ul className="mb-3 space-y-1 text-sm">
            {links.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <a href={a.url ?? "#"} target="_blank" rel="noopener noreferrer" className="truncate underline">
                  {a.nome}
                </a>
                <form action={removerAnexo}>
                  <input type="hidden" name="anexo_id" value={a.id} />
                  <input type="hidden" name="compromisso_id" value={id} />
                  <button className="text-xs text-red-700 underline">remover</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={anexarDocumento} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="compromisso_id" value={id} />
          <input type="file" name="arquivo" required className="text-sm" />
          <Enviar variante="secundario" pequeno>
            Anexar
          </Enviar>
        </form>
      </Cartao>
      <Cartao titulo="Editar">
        <FormCompromisso c={c} processos={await opcoesProcessos(ctx)} />
      </Cartao>
      <form action={excluirCompromisso}>
        <input type="hidden" name="id" value={id} />
        <Enviar variante="perigo" pequeno confirmar="Excluir este compromisso?">
          Excluir compromisso
        </Enviar>
      </form>
    </div>
  );
}
