import Link from "next/link";
import { Cabecalho, Cartao, LinkBotao, Mensagens, Vazio } from "@/components/ui";
import { obterContexto } from "@/lib/contexto";
import { formatarDocumento, formatarTelefone } from "@/lib/documento";

export const metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const busca = await searchParams;
  const ctx = await obterContexto();
  let q = ctx.supabase.from("clientes").select("id, nome, documento, whatsapp, email, processos(count)").eq("escritorio_id", ctx.escritorio.id).order("nome").limit(200);
  if (busca.q) q = q.ilike("nome", `%${busca.q.replace(/[%_,()]/g, "")}%`);
  const { data: clientes } = await q;
  return (
    <div>
      <Cabecalho titulo="Clientes" acoes={<LinkBotao href="/clientes/novo">Novo cliente</LinkBotao>} />
      <Mensagens busca={busca} />
      <form className="mb-4">
        <input name="q" defaultValue={busca.q} placeholder="Buscar por nome" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </form>
      {!clientes?.length ? (
        <Vazio acao={<LinkBotao href="/clientes/novo">Cadastrar cliente</LinkBotao>}>Nenhum cliente encontrado.</Vazio>
      ) : (
        <Cartao className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {clientes.map((c) => (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`} className="block px-4 py-3 hover:bg-slate-50">
                  <div className="font-medium text-slate-900">{c.nome}</div>
                  <div className="text-xs text-slate-500">
                    {[formatarDocumento(c.documento), formatarTelefone(c.whatsapp), c.email].filter(Boolean).join(" · ")}
                    {" · "}
                    {(c.processos as unknown as { count: number }[])?.[0]?.count ?? 0} processo(s)
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  );
}
