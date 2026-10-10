import Link from "next/link";
import { obterContexto } from "@/lib/contexto";
import { itensNavegacao } from "../itens-nav";

export default async function Menu() {
  const ctx = await obterContexto();
  const itens = itensNavegacao({ financeiro: ctx.pode("financeiro"), admin: ctx.isAdmin });
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Menu</h1>
      <p className="mb-4 text-sm text-slate-500">{ctx.escritorio.nome} · Plano {ctx.plano.nome}</p>
      <div className="grid grid-cols-2 gap-2">
        {itens.map((i) => (
          <Link key={i.href} href={i.href} className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium shadow-sm">
            <span className="mb-1 block text-xl" aria-hidden>
              {i.icone}
            </span>
            {i.rotulo}
          </Link>
        ))}
      </div>
      <form action="/auth/sair" method="post" className="mt-6">
        <button className="text-sm text-slate-600 underline">Sair</button>
      </form>
    </div>
  );
}
