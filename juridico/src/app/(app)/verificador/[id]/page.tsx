import { notFound } from "next/navigation";
import { AvisoResponsabilidade, Cabecalho, Cartao, Etiqueta } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import type { Achado } from "@/lib/verificador";
import { excluirVerificacao } from "../acoes";

const GRAV = {
  erro: { rotulo: "Erro", cor: "vermelho" },
  alerta: { rotulo: "Alerta", cor: "amarelo" },
  nao_verificado: { rotulo: "NÃO VERIFICADO", cor: "roxo" },
  ok: { rotulo: "Localizado", cor: "verde" },
} as const;

const CATEGORIAS: Record<Achado["categoria"], string> = {
  processo: "Números de processo",
  jurisprudencia: "Jurisprudência e precedentes",
  artigo: "Artigos de lei",
  data: "Datas",
  parte: "Nomes das partes",
  formatacao: "Padronização e formatação",
};

export default async function Verificacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: v } = await ctx.supabase.from("verificacoes").select("*").eq("id", id).maybeSingle();
  if (!v) notFound();
  const { achados, resumo } = v.resultado as { achados: Achado[]; resumo: Record<string, number> };
  const grupos = (Object.keys(CATEGORIAS) as Achado["categoria"][]).map((c) => ({ c, itens: achados.filter((a) => a.categoria === c) })).filter((g) => g.itens.length);
  return (
    <div className="space-y-4">
      <Cabecalho titulo={v.titulo} descricao={new Date(v.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} voltar={{ href: "/verificador", rotulo: "Verificador" }} />
      <div className="flex flex-wrap gap-2">
        {(Object.keys(GRAV) as (keyof typeof GRAV)[]).map((g) => (
          <Etiqueta key={g} cor={GRAV[g].cor}>
            {resumo[g] ?? 0} {GRAV[g].rotulo.toLowerCase()}
          </Etiqueta>
        ))}
      </div>
      <AvisoResponsabilidade extra="A verificação é automatizada e não substitui a conferência nas fontes oficiais." />
      {!grupos.length && <Cartao>Nenhum apontamento encontrado. Isso não garante que o texto esteja correto.</Cartao>}
      {grupos.map((g) => (
        <Cartao key={g.c} titulo={CATEGORIAS[g.c]}>
          <ul className="space-y-2">
            {g.itens.map((a, i) => (
              <li key={i} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Etiqueta cor={GRAV[a.gravidade].cor}>{GRAV[a.gravidade].rotulo}</Etiqueta>
                  <code className="rounded bg-slate-100 px-1 text-xs">{a.trecho.slice(0, 160)}</code>
                </div>
                <p className="mt-0.5 text-slate-700">{a.mensagem}</p>
                {a.link && (
                  <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                    Buscar no site do tribunal
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Cartao>
      ))}
      <form action={excluirVerificacao}>
        <input type="hidden" name="id" value={id} />
        <Enviar variante="perigo" pequeno confirmar="Excluir esta verificação?">
          Excluir
        </Enviar>
      </form>
    </div>
  );
}
