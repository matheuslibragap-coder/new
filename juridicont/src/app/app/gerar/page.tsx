import type { Metadata } from "next";
import { exigirUsuarioPronto, obterConta } from "@/lib/sessao";
import { FORMATOS_POST, type FormatoPost } from "@/lib/tipos";
import type { PostGerado } from "@/lib/ia/gerador";
import { formatarData } from "@/lib/textos";
import { Gerador } from "./Gerador";

export const metadata: Metadata = { title: "Gerar post" };

export default async function PaginaGerar() {
  const { supabase, perfil } = await exigirUsuarioPronto();
  const [{ conta, plano }, { data: anteriores }] = await Promise.all([
    obterConta(supabase),
    supabase.from("posts_gerados").select("id, formato, conteudo, criado_em").order("criado_em", { ascending: false }).limit(10),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca">Gerar post informativo</h1>
        <p className="text-stone-600">
          {plano.limite_posts === 0
            ? "A geração de posts está disponível nos planos pagos."
            : `${conta.posts_usados} de ${plano.limite_posts} posts usados neste ciclo.`}
        </p>
      </div>
      <Gerador areas={perfil.areas} permiteReels={plano.permite_reels} bloqueado={plano.limite_posts === 0} />

      {!!anteriores?.length && (
        <section className="space-y-2 pt-4">
          <h2 className="font-semibold">Posts gerados</h2>
          <ul className="space-y-2">
            {anteriores.map((p) => (
              <li key={p.id}>
                <details className="cartao p-3 sm:p-4">
                  <summary className="cursor-pointer text-sm">
                    <span className="font-medium">{(p.conteudo as PostGerado).titulo}</span>
                    <span className="block text-xs text-stone-500">
                      {FORMATOS_POST[p.formato as FormatoPost]} · {formatarData(p.criado_em)}
                    </span>
                  </summary>
                  <div className="mt-3 whitespace-pre-wrap text-sm">
                    {(p.conteudo as PostGerado).slides.map((s, i) => `Slide ${i + 1}: ${s.titulo}\n${s.texto}\n\n`).join("")}
                    {(p.conteudo as PostGerado).roteiro_reels.map((c, i) => `Cena ${i + 1}: ${c.cena}\nFala: ${c.fala}\nTexto na tela: ${c.texto_na_tela}\n\n`).join("")}
                    {(p.conteudo as PostGerado).legenda}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
