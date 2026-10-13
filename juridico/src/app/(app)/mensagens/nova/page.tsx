import { Cabecalho, Cartao } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { criarMensagem } from "../acoes";

export default async function Nova({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { andamento } = await searchParams;
  const ctx = await obterContexto();
  const { data: a } = await ctx.supabase.from("andamentos").select("id, nome, processos(cliente_id)").eq("id", andamento ?? "").maybeSingle();
  const semCliente = !(a?.processos as unknown as { cliente_id: string | null } | null)?.cliente_id;
  return (
    <div>
      <Cabecalho titulo="Explicar andamento ao cliente" voltar={{ href: "/mensagens", rotulo: "Mensagens" }} />
      <Cartao>
        {!a ? (
          <p className="text-sm">Andamento não encontrado.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">{a.nome}</p>
            {semCliente && <p className="text-sm text-amber-800">O processo não tem cliente vinculado. Vincule para poder enviar.</p>}
            <div className="flex gap-2">
              {process.env.ANTHROPIC_API_KEY && (
                <form action={criarMensagem}>
                  <input type="hidden" name="andamento_id" value={a.id} />
                  <Enviar>Gerar com IA</Enviar>
                </form>
              )}
              <form action={criarMensagem}>
                <input type="hidden" name="andamento_id" value={a.id} />
                <input type="hidden" name="ia" value="0" />
                <Enviar variante="secundario">Escrever eu mesmo</Enviar>
              </form>
            </div>
          </div>
        )}
      </Cartao>
    </div>
  );
}
