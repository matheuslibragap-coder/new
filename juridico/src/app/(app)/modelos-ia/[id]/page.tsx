import { notFound } from "next/navigation";
import { Cabecalho, Cartao, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { excluirModeloIa } from "../acoes";

export default async function ModeloIa({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: d } = await ctx.supabase.from("biblioteca_documentos").select("*").eq("id", id).maybeSingle();
  if (!d) notFound();
  return (
    <div className="space-y-4">
      <Cabecalho titulo={d.nome} descricao={d.anonimizado ? "Texto anonimizado. Confira se algum dado pessoal escapou; se sim, exclua e reenvie." : "Texto original (não anonimizado)."} voltar={{ href: "/modelos-ia", rotulo: "Banco de modelos" }} />
      <Mensagens busca={await searchParams} />
      <Cartao>
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap font-sans text-sm">{d.texto}</pre>
      </Cartao>
      <form action={excluirModeloIa}>
        <input type="hidden" name="id" value={id} />
        <Enviar variante="perigo" pequeno confirmar="Excluir este modelo e seu índice?">
          Excluir modelo
        </Enviar>
      </form>
    </div>
  );
}
