import { notFound } from "next/navigation";
import { AreaTexto, AvisoResponsabilidade, Cabecalho, Campo, Cartao, Mensagens } from "@/components/ui";
import { Copiar, Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { AVISO_RASCUNHO } from "@/lib/textos";
import { excluirRascunho, salvarRascunho } from "../../acoes";

export default async function Rascunho({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: r } = await ctx.supabase.from("rascunhos").select("*").eq("id", id).maybeSingle();
  if (!r) notFound();
  const { data: base } = r.documentos_base?.length ? await ctx.supabase.from("biblioteca_documentos").select("id, nome").in("id", r.documentos_base) : { data: [] };
  return (
    <div className="space-y-4">
      <Cabecalho titulo={`RASCUNHO: ${r.titulo}`} voltar={{ href: "/modelos-ia", rotulo: "Banco de modelos" }} acoes={<Copiar texto={r.texto}>Copiar texto</Copiar>} />
      <Mensagens busca={await searchParams} />
      <AvisoResponsabilidade extra={`${AVISO_RASCUNHO} Verifique toda citação de lei e jurisprudência; use o verificador de petição.`} />
      {!!base?.length && <p className="text-xs text-slate-500">Modelos usados como referência: {base.map((b) => b.nome).join("; ")}</p>}
      <Cartao>
        <form action={salvarRascunho} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <Campo rotulo="Título" name="titulo" defaultValue={r.titulo} />
          <AreaTexto rotulo="Texto" name="texto" rows={28} defaultValue={r.texto} className="font-mono" />
          <div className="flex flex-wrap gap-2">
            <Enviar variante="secundario">Salvar</Enviar>
            <a href={`/verificador?rascunho=${id}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">
              Verificar citações
            </a>
          </div>
        </form>
      </Cartao>
      <details className="text-sm text-slate-600">
        <summary className="cursor-pointer">Briefing usado</summary>
        <p className="mt-2 whitespace-pre-wrap">{r.briefing}</p>
      </details>
      <form action={excluirRascunho}>
        <input type="hidden" name="id" value={id} />
        <Enviar variante="perigo" pequeno confirmar="Excluir este rascunho?">
          Excluir
        </Enviar>
      </form>
    </div>
  );
}
