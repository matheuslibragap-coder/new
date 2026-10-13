import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho, Cartao, Etiqueta, LinkBotao, Mensagens, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { centavosParaReais, moeda } from "@/lib/documento";
import { formatarDataBr, hojeBrasilia } from "@/lib/prazos/motor";
import { formatarCnj } from "@/lib/cnj";
import { alterarStatusLancamento, excluirLancamento } from "./acoes";
import { rotuloTipo, TIPOS_LANCAMENTO } from "./rotulos";

export const metadata = { title: "Financeiro" };

const COR = { previsto: "azul", recebido: "verde", atrasado: "vermelho", cancelado: "cinza" } as const;

function mesAnterior(m: string, d: number) {
  const [a, mm] = m.split("-").map(Number);
  const x = new Date(Date.UTC(a, mm - 1 + d, 1));
  return x.toISOString().slice(0, 7);
}

export default async function Financeiro({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const b = await searchParams;
  const ctx = await obterContexto();
  if (!ctx.pode("financeiro")) notFound();
  const mes = b.mes && /^\d{4}-\d{2}$/.test(b.mes) ? b.mes : hojeBrasilia().slice(0, 7);
  const atrasados = b.situacao === "atrasado";
  const fimMes = `${mesAnterior(mes, 1)}-01`;

  let q = ctx.supabase
    .from("lancamentos_situacao")
    .select("id, tipo, natureza, descricao, valor_centavos, vencimento, status, situacao, recebido_em, parcela_numero, parcela_total, grupo_parcelamento, clientes(nome), processos(numero_cnj)")
    .eq("escritorio_id", ctx.escritorio.id)
    .order("vencimento");
  q = atrasados ? q.eq("situacao", "atrasado") : q.gte("vencimento", `${mes}-01`).lt("vencimento", fimMes);
  if (b.tipo) q = q.eq("tipo", b.tipo);
  const { data: lancs } = await q.limit(1000);

  const soma = (f: (l: NonNullable<typeof lancs>[number]) => boolean) => (lancs ?? []).filter(f).reduce((s, l) => s + Number(l.valor_centavos), 0);
  const receber = (l: { natureza: string }) => l.natureza === "receber";
  const resumo = {
    previsto: soma((l) => receber(l) && l.situacao === "previsto"),
    recebido: soma((l) => receber(l) && l.situacao === "recebido"),
    atrasado: soma((l) => receber(l) && l.situacao === "atrasado"),
    pagar: soma((l) => !receber(l) && l.situacao !== "cancelado"),
  };
  const porTipo = TIPOS_LANCAMENTO.map((t) => ({ ...t, total: soma((l) => l.tipo === t.valor && l.situacao !== "cancelado") })).filter((t) => t.total > 0);
  const nomeMes = new Date(`${mes}-15T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <Cabecalho
        titulo="Financeiro"
        acoes={
          <>
            <LinkBotao href="/financeiro/novo">Novo lançamento</LinkBotao>
            <a href={`/api/financeiro/relatorio?mes=${mes}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">
              Relatório do mês (CSV)
            </a>
          </>
        }
      />
      <Mensagens busca={b} />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href={`/financeiro?mes=${mesAnterior(mes, -1)}`} className="rounded-lg border border-slate-300 bg-white px-2 py-1">‹</Link>
        <span className="font-medium capitalize">{atrasados ? "Todos os vencidos" : nomeMes}</span>
        <Link href={`/financeiro?mes=${mesAnterior(mes, 1)}`} className="rounded-lg border border-slate-300 bg-white px-2 py-1">›</Link>
        <Link href={atrasados ? `/financeiro?mes=${mes}` : "/financeiro?situacao=atrasado"} className="ml-2 underline">
          {atrasados ? "Ver por mês" : "Ver vencidos"}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["A receber", resumo.previsto, ""],
          ["Recebido", resumo.recebido, "text-emerald-700"],
          ["Atrasado", resumo.atrasado, "text-red-700"],
          ["A pagar", resumo.pagar, ""],
        ].map(([r, v, c]) => (
          <div key={r as string} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className={`text-lg font-semibold ${c}`}>{moeda(centavosParaReais(v as number))}</div>
            <div className="text-xs text-slate-500">{r}</div>
          </div>
        ))}
      </div>
      {porTipo.length > 0 && (
        <Cartao titulo="Por tipo">
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {porTipo.map((t) => (
              <li key={t.valor} className="flex justify-between">
                <Link href={`/financeiro?mes=${mes}&tipo=${t.valor}`} className="underline">{t.rotulo}</Link>
                <span>{moeda(centavosParaReais(t.total))}</span>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
      {!lancs?.length ? (
        <Vazio acao={<LinkBotao href="/financeiro/novo">Registrar honorários</LinkBotao>}>Nenhum lançamento.</Vazio>
      ) : (
        <Cartao className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {lancs.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{moeda(centavosParaReais(l.valor_centavos))}</span>
                    <Etiqueta cor={COR[l.situacao as keyof typeof COR]}>{l.situacao}</Etiqueta>
                    {l.natureza === "pagar" && <Etiqueta>a pagar</Etiqueta>}
                    <span className="text-xs text-slate-500">venc. {formatarDataBr(l.vencimento)}</span>
                  </div>
                  <div className="text-slate-700">
                    {rotuloTipo(l.tipo)}
                    {l.parcela_total ? ` · parcela ${l.parcela_numero}/${l.parcela_total}` : ""}
                    {l.descricao ? ` · ${l.descricao}` : ""}
                  </div>
                  <div className="text-xs text-slate-500">
                    {[(l.clientes as unknown as { nome: string } | null)?.nome, (l.processos as unknown as { numero_cnj: string } | null)?.numero_cnj && formatarCnj((l.processos as unknown as { numero_cnj: string }).numero_cnj)].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {l.status === "previsto" ? (
                    <form action={alterarStatusLancamento}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="status" value="recebido" />
                      <Enviar pequeno variante="sucesso">{l.natureza === "pagar" ? "Pago" : "Recebido"}</Enviar>
                    </form>
                  ) : (
                    <form action={alterarStatusLancamento}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="status" value="previsto" />
                      <Enviar pequeno variante="secundario">Reabrir</Enviar>
                    </form>
                  )}
                  <form action={excluirLancamento}>
                    <input type="hidden" name="id" value={l.id} />
                    <Enviar pequeno variante="fantasma" confirmar="Excluir este lançamento?">Excluir</Enviar>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  );
}
