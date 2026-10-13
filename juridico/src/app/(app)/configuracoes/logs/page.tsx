import { notFound } from "next/navigation";
import { Cabecalho, Cartao, Tabela } from "@/components/ui";
import { obterContexto } from "@/lib/contexto";

export const metadata = { title: "Registro de acessos" };

export default async function Logs({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await obterContexto();
  if (ctx.membro.papel !== "titular") notFound();
  const pagina = Math.max(0, Number((await searchParams).p ?? 0));
  const [{ data: logs }, { data: membros }] = await Promise.all([
    ctx.supabase.from("logs_acesso").select("id, user_id, acao, tabela, registro_id, criado_em").eq("escritorio_id", ctx.escritorio.id).order("criado_em", { ascending: false }).range(pagina * 100, pagina * 100 + 99),
    ctx.supabase.from("membros").select("user_id, nome, email").eq("escritorio_id", ctx.escritorio.id),
  ]);
  const nome = (id: string | null) => membros?.find((m) => m.user_id === id)?.nome ?? membros?.find((m) => m.user_id === id)?.email ?? (id ? "sistema/ex-membro" : "sistema");
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Registro de acessos" descricao="Inclusões, alterações e exclusões de dados, exportações e outros eventos." voltar={{ href: "/configuracoes", rotulo: "Configurações" }} />
      <Cartao>
        <Tabela cabecalho={["Quando", "Quem", "Ação", "Onde"]}>
          {(logs ?? []).map((l) => (
            <tr key={l.id}>
              <td className="whitespace-nowrap px-3 py-1.5 text-xs">{new Date(l.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
              <td className="px-3 py-1.5">{nome(l.user_id)}</td>
              <td className="px-3 py-1.5">{l.acao}</td>
              <td className="px-3 py-1.5 text-xs text-slate-500">{[l.tabela, l.registro_id?.slice(0, 8)].filter(Boolean).join(" · ")}</td>
            </tr>
          ))}
        </Tabela>
        <div className="mt-3 flex gap-3 text-sm">
          {pagina > 0 && <a href={`?p=${pagina - 1}`} className="underline">Mais recentes</a>}
          {logs?.length === 100 && <a href={`?p=${pagina + 1}`} className="underline">Mais antigos</a>}
        </div>
      </Cartao>
    </div>
  );
}
