import Link from "next/link";
import type { Metadata } from "next";
import { exigirUsuarioPronto } from "@/lib/sessao";
import { Semaforo } from "@/components/Semaforo";
import { formatarData } from "@/lib/textos";
import { TIPOS_CONTEUDO, type Severidade, type TipoConteudo } from "@/lib/tipos";

export const metadata: Metadata = { title: "Histórico" };

const POR_PAGINA = 20;
const ORIGENS = { checador: "Checagem", gerador: "Post gerado", auditoria: "Auditoria" } as const;

export default async function Historico({ searchParams }: PageProps<"/app/historico">) {
  const { supabase } = await exigirUsuarioPronto();
  const pagina = Math.max(1, Number((await searchParams).pagina) || 1);
  const { data, count } = await supabase
    .from("checagens")
    .select("id, origem, tipo_conteudo, classificacao, criado_em, texto, imagem_path", { count: "exact" })
    .order("criado_em", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  const total = count ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-marca">Histórico</h1>
        <p className="text-stone-600">Cada checagem fica salva com a data, o resultado e a versão das regras usada.</p>
      </div>
      {!data?.length && (
        <div className="cartao text-center text-stone-600">
          Nenhuma checagem ainda.{" "}
          <Link href="/app/checar" className="link">
            Fazer a primeira
          </Link>
        </div>
      )}
      <ul className="space-y-2">
        {data?.map((c) => (
          <li key={c.id}>
            <Link href={`/app/historico/${c.id}`} className="cartao flex items-center gap-3 p-3 hover:border-stone-300 sm:p-3">
              <Semaforo valor={c.classificacao as Severidade} tamanho="pequeno" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{c.texto || (c.imagem_path ? "(imagem)" : "(sem texto)")}</p>
                <p className="text-xs text-stone-500">
                  {ORIGENS[c.origem as keyof typeof ORIGENS]} · {TIPOS_CONTEUDO[c.tipo_conteudo as TipoConteudo]} ·{" "}
                  {formatarData(c.criado_em)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {total > POR_PAGINA && (
        <div className="flex justify-between text-sm">
          {pagina > 1 ? <Link href={`?pagina=${pagina - 1}`} className="link">Anteriores</Link> : <span />}
          {pagina * POR_PAGINA < total ? <Link href={`?pagina=${pagina + 1}`} className="link">Mais antigas</Link> : <span />}
        </div>
      )}
    </div>
  );
}
