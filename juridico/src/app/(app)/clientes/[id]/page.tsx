import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho, Cartao, Etiqueta, LinkBotao, Mensagens, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";
import { FormCliente } from "../form-cliente";
import { excluirCliente } from "../acoes";

export default async function Cliente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: cliente } = await ctx.supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (!cliente) notFound();
  const { data: processos } = await ctx.supabase.from("processos").select("id, numero_cnj, tribunal_sigla, classe, ativo").eq("cliente_id", id).order("criado_em", { ascending: false });
  return (
    <div className="space-y-4">
      <Cabecalho titulo={cliente.nome} voltar={{ href: "/clientes", rotulo: "Clientes" }} acoes={<LinkBotao href={`/processos/novo?cliente=${id}`} variante="secundario">Novo processo</LinkBotao>} />
      <Mensagens busca={await searchParams} />
      <Cartao titulo="Processos">
        {!processos?.length ? (
          <Vazio>Nenhum processo vinculado.</Vazio>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {processos.map((p) => (
              <li key={p.id} className="py-2">
                <Link href={`/processos/${p.id}`} className="font-medium text-slate-900 hover:underline">
                  {formatarCnj(p.numero_cnj)}
                </Link>{" "}
                <span className="text-slate-500">
                  {p.tribunal_sigla} {p.classe && `· ${p.classe}`}
                </span>{" "}
                {!p.ativo && <Etiqueta>arquivado</Etiqueta>}
              </li>
            ))}
          </ul>
        )}
      </Cartao>
      <Cartao titulo="Dados do cliente">
        <FormCliente cliente={cliente} />
      </Cartao>
      <Cartao titulo="Excluir cliente">
        <form action={excluirCliente}>
          <input type="hidden" name="id" value={id} />
          <p className="mb-3 text-sm text-slate-600">Os processos e lançamentos vinculados são mantidos, sem cliente.</p>
          <Enviar variante="perigo" confirmar="Excluir este cliente definitivamente?">
            Excluir
          </Enviar>
        </form>
      </Cartao>
    </div>
  );
}
