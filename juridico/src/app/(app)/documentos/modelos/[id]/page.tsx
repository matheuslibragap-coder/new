import { notFound } from "next/navigation";
import { Cabecalho, Cartao, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { FormModelo } from "@/components/form-modelo";
import { obterContexto } from "@/lib/contexto";
import { excluirModelo, salvarModelo } from "../../acoes";

export default async function Modelo({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: m } = await ctx.supabase.from("modelos_documento").select("*").eq("id", id).eq("escritorio_id", ctx.escritorio.id).maybeSingle();
  if (!m) notFound();
  return (
    <div className="space-y-4">
      <Cabecalho titulo={m.nome} voltar={{ href: "/documentos", rotulo: "Documentos" }} />
      <Mensagens busca={await searchParams} />
      <Cartao>
        <FormModelo acao={salvarModelo} modelo={m} />
      </Cartao>
      <form action={excluirModelo}>
        <input type="hidden" name="id" value={id} />
        <Enviar variante="perigo" pequeno confirmar="Excluir este modelo?">
          Excluir modelo
        </Enviar>
      </form>
    </div>
  );
}
