import { notFound } from "next/navigation";
import { Cabecalho, Campo, Cartao, Grade, Mensagens, Selecao } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { opcoesProcesso } from "../../processos/opcoes";
import { opcoesProcessos } from "../../agenda/opcoes";
import { criarLancamento } from "../acoes";
import { TIPOS_LANCAMENTO } from "../rotulos";

export const metadata = { title: "Novo lançamento" };

export default async function Novo({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const b = await searchParams;
  const ctx = await obterContexto();
  if (!ctx.pode("financeiro")) notFound();
  const [{ clientes }, processos] = await Promise.all([opcoesProcesso(ctx), opcoesProcessos(ctx)]);
  let clientePadrao = b.cliente ?? "";
  if (b.processo && !clientePadrao) {
    const { data } = await ctx.supabase.from("processos").select("cliente_id").eq("id", b.processo).maybeSingle();
    clientePadrao = data?.cliente_id ?? "";
  }
  return (
    <div>
      <Cabecalho titulo="Novo lançamento" voltar={{ href: "/financeiro", rotulo: "Financeiro" }} />
      <Mensagens busca={b} />
      <Cartao>
        <form action={criarLancamento} className="space-y-3">
          <Grade>
            <Selecao rotulo="Tipo" name="tipo" opcoes={TIPOS_LANCAMENTO} />
            <Selecao rotulo="Natureza" name="natureza" opcoes={[{ valor: "receber", rotulo: "A receber" }, { valor: "pagar", rotulo: "A pagar" }]} />
            <Selecao rotulo="Cliente" name="cliente_id" defaultValue={clientePadrao} opcoes={[{ valor: "", rotulo: "Sem cliente" }, ...clientes]} />
            <Selecao rotulo="Processo" name="processo_id" defaultValue={b.processo ?? ""} opcoes={[{ valor: "", rotulo: "Sem processo" }, ...processos]} />
            <Campo rotulo="Valor (R$)" name="valor" inputMode="decimal" required placeholder="3.000,00" />
            <Selecao rotulo="O valor informado é" name="modo_valor" opcoes={[{ valor: "total", rotulo: "Total (dividido nas parcelas)" }, { valor: "parcela", rotulo: "De cada parcela" }]} />
            <Campo rotulo="Número de parcelas" name="parcelas" type="number" min={1} max={120} defaultValue="1" />
            <Campo rotulo="Vencimento (1ª parcela)" name="vencimento" type="date" required ajuda="As demais vencem no mesmo dia dos meses seguintes." />
          </Grade>
          <Campo rotulo="Descrição" name="descricao" />
          <Enviar>Registrar</Enviar>
        </form>
      </Cartao>
    </div>
  );
}
