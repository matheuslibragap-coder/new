import Link from "next/link";
import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/sessao";
import { Semaforo } from "@/components/Semaforo";
import { formatarData } from "@/lib/textos";
import type { Regra } from "@/lib/tipos";
import { alternarRegra } from "./actions";

export const metadata: Metadata = { title: "Regras" };

export default async function AdminRegras() {
  const { supabase } = await exigirAdmin();
  const [{ data }, { data: versao }] = await Promise.all([
    supabase.from("regras").select("*").order("codigo"),
    supabase.from("regras_versao").select("versao, atualizado_em").eq("id", 1).single(),
  ]);
  const regras = (data ?? []) as Regra[];
  const pendentes = regras.filter((r) => r.revisao_pendente).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-marca">Base de regras</h1>
          <p className="text-sm text-stone-600">
            Versão {versao?.versao} · atualizada em {versao ? formatarData(versao.atualizado_em) : ""}
          </p>
        </div>
        <Link href="/admin/regras/nova" className="btn-primario">Nova regra</Link>
      </div>
      {pendentes > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {pendentes} {pendentes === 1 ? "regra está pendente" : "regras estão pendentes"} de revisão humana. Confira os
          dispositivos no texto oficial antes do lançamento.
        </p>
      )}
      <ul className="space-y-2">
        {regras.map((r) => (
          <li key={r.id} className={`cartao space-y-2 ${r.ativa ? "" : "opacity-60"}`}>
            <div className="flex items-start gap-3">
              <span className="mt-1.5"><Semaforo valor={r.severidade_padrao} tamanho="pequeno" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-stone-500">{r.codigo}</p>
                <p className="font-semibold">{r.titulo}</p>
                <p className="text-sm text-stone-600">{r.dispositivo}</p>
                <div className="mt-1 flex flex-wrap gap-1 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${r.ativa ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700"}`}>
                    {r.ativa ? "Ativa" : "Inativa"}
                  </span>
                  {r.revisao_pendente && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Revisão pendente</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/regras/${r.id}`} className="btn-secundario min-h-10 flex-1 py-2 text-sm sm:flex-none">Editar</Link>
              <form action={alternarRegra} className="flex-1 sm:flex-none">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="ativa" value={String(r.ativa)} />
                <button className="btn-secundario min-h-10 w-full py-2 text-sm">{r.ativa ? "Desativar" : "Ativar"}</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
