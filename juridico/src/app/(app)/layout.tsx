import Link from "next/link";
import { obterContexto } from "@/lib/contexto";
import { NOME_PRODUTO } from "@/lib/textos";
import { NavInferior, NavLateral } from "./nav";
import { ITENS_INFERIORES, itensNavegacao } from "./itens-nav";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const ctx = await obterContexto();
  const itens = itensNavegacao({ financeiro: ctx.pode("financeiro"), admin: ctx.isAdmin });
  const { count: naoLidas } = await ctx.supabase
    .from("notificacoes")
    .select("id", { count: "exact", head: true })
    .eq("escritorio_id", ctx.escritorio.id)
    .is("lida_em", null)
    .or(`user_id.is.null,user_id.eq.${ctx.user.id}`);
  const diasTeste = Math.ceil((new Date(ctx.escritorio.trial_ate).getTime() - Date.now()) / 86400000);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="nao-imprimir hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
        <Link href="/painel" className="mb-1 block px-3 text-lg font-semibold">
          {NOME_PRODUTO}
        </Link>
        <p className="mb-4 truncate px-3 text-xs text-slate-500">{ctx.escritorio.nome}</p>
        <NavLateral itens={itens} />
        <form action="/auth/sair" method="post" className="mt-6 px-3">
          <button className="text-sm text-slate-500 hover:text-slate-800">Sair</button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="nao-imprimir sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur lg:px-8">
          <Link href="/painel" className="font-semibold lg:hidden">
            {NOME_PRODUTO}
          </Link>
          <span className="hidden text-sm text-slate-500 lg:inline">
            Plano {ctx.plano.nome}
            {ctx.escritorio.assinatura_status === "trial" && diasTeste > 0 && ` · teste termina em ${diasTeste} dia(s)`}
          </span>
          <Link href="/notificacoes" className="relative rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-slate-100">
            Avisos
            {!!naoLidas && <span className="ml-1 rounded-full bg-red-600 px-1.5 text-xs text-white">{naoLidas}</span>}
          </Link>
        </header>
        {!ctx.assinaturaValida && (
          <div className="nao-imprimir border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 lg:px-8">
            Sua assinatura não está ativa. Os dados seguem acessíveis, mas novas ações do plano ficam bloqueadas.{" "}
            <Link href="/configuracoes/plano" className="underline">
              Regularizar
            </Link>
          </div>
        )}
        <main className="mx-auto max-w-5xl px-4 pb-24 pt-5 lg:px-8 lg:pb-10">{children}</main>
      </div>
      <NavInferior itens={ITENS_INFERIORES} />
    </div>
  );
}
