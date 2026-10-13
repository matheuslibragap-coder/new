import Link from "next/link";
import { Cabecalho, Cartao, Vazio } from "@/components/ui";
import { obterContexto } from "@/lib/contexto";
import { CALCULADORAS } from "./lista";

export const metadata = { title: "Calculadoras" };



export default async function Calculadoras() {
  const ctx = await obterContexto();
  const { data: salvos } = await ctx.supabase.from("calculos_salvos").select("id, titulo, tipo, criado_em").eq("escritorio_id", ctx.escritorio.id).order("criado_em", { ascending: false }).limit(20);
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Calculadoras" descricao="Toda calculadora gera memória de cálculo exportável em PDF." />
      <div className="grid gap-3 sm:grid-cols-2">
        {CALCULADORAS.map((c) => (
          <Link key={c.tipo} href={`/calculadoras/${c.tipo}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400">
            <div className="font-medium">{c.titulo}</div>
            <div className="text-sm text-slate-600">{c.desc}</div>
          </Link>
        ))}
      </div>
      <Cartao titulo="Cálculos salvos">
        {!salvos?.length ? (
          <Vazio>Nenhum cálculo salvo.</Vazio>
        ) : (
          <ul className="space-y-1 text-sm">
            {salvos.map((s) => (
              <li key={s.id}>
                <Link href={`/calculadoras/salvos/${s.id}`} className="underline">
                  {s.titulo}
                </Link>{" "}
                <span className="text-slate-500">· {CALCULADORAS.find((c) => c.tipo === s.tipo)?.titulo} · {new Date(s.criado_em).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
