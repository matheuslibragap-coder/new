import Link from "next/link";
import type { Metadata } from "next";
import { exigirUsuarioPronto, obterConta } from "@/lib/sessao";
import { BarraCota } from "@/components/BarraCota";
import { Semaforo } from "@/components/Semaforo";
import { formatarData } from "@/lib/textos";
import { TIPOS_CONTEUDO, type Severidade, type TipoConteudo } from "@/lib/tipos";

export const metadata: Metadata = { title: "Início" };

export default async function Painel() {
  const { supabase, perfil } = await exigirUsuarioPronto();
  const [{ conta, plano }, { data: recentes }] = await Promise.all([
    obterConta(supabase),
    supabase
      .from("checagens")
      .select("id, tipo_conteudo, classificacao, criado_em, texto")
      .eq("origem", "checador")
      .order("criado_em", { ascending: false })
      .limit(3),
  ]);
  const auditoriaDisponivel = conta.auditorias_usadas < plano.limite_auditorias;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-marca">Olá, {perfil.nome_profissional?.split(" ").slice(0, 2).join(" ")}</h1>
        <p className="text-stone-600">O que você quer conferir hoje?</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/app/checar" className="cartao block hover:border-stone-300">
          <p className="font-semibold">Checar um conteúdo</p>
          <p className="text-sm text-stone-600">Post, legenda, roteiro, stories, bio ou anúncio.</p>
        </Link>
        <Link href="/app/gerar" className="cartao block hover:border-stone-300">
          <p className="font-semibold">Gerar post informativo</p>
          <p className="text-sm text-stone-600">Só entregamos posts sem riscos identificados pela base de regras.</p>
        </Link>
        <Link
          href="/app/auditoria"
          className={`cartao block hover:border-stone-300 sm:col-span-2 ${auditoriaDisponivel ? "border-marca" : ""}`}
        >
          <p className="font-semibold">
            Auditoria do perfil {auditoriaDisponivel && <span className="ml-1 rounded-full bg-marca px-2 py-0.5 text-xs text-white">disponível</span>}
          </p>
          <p className="text-sm text-stone-600">Cole sua bio e até 5 posts e receba uma nota e os principais riscos.</p>
        </Link>
      </div>

      <section className="cartao space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Plano {plano.nome}</h2>
          <Link href="/app/planos" className="link text-sm">
            {conta.plano === "gratuito" ? "Assinar" : "Gerenciar"}
          </Link>
        </div>
        <BarraCota rotulo="Checagens" usados={conta.checagens_usadas} limite={plano.limite_checagens} />
        <BarraCota rotulo="Posts gerados" usados={conta.posts_usados} limite={plano.limite_posts} />
        <BarraCota rotulo="Auditorias de perfil" usados={conta.auditorias_usadas} limite={plano.limite_auditorias} />
        <p className="text-xs text-stone-500">Renova em {formatarData(conta.ciclo_fim, false)}.</p>
        {conta.assinatura_status === "atrasada" && (
          <p className="erro">Há um pagamento em atraso. Regularize para manter seu plano na renovação.</p>
        )}
      </section>

      {!!recentes?.length && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Últimas checagens</h2>
            <Link href="/app/historico" className="link text-sm">
              Ver todas
            </Link>
          </div>
          <ul className="space-y-2">
            {recentes.map((c) => (
              <li key={c.id}>
                <Link href={`/app/historico/${c.id}`} className="cartao flex items-center gap-3 p-3 sm:p-3">
                  <Semaforo valor={c.classificacao as Severidade} tamanho="pequeno" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{c.texto || "(imagem)"}</p>
                    <p className="text-xs text-stone-500">
                      {TIPOS_CONTEUDO[c.tipo_conteudo as TipoConteudo]} · {formatarData(c.criado_em)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
