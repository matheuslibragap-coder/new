import Link from "next/link";
import { Cabecalho, Cartao, Etiqueta, LinkBotao, Mensagens, Vazio } from "@/components/ui";
import { obterContexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";
import { diferencaDias, formatarDataBr, hojeBrasilia, somarDias } from "@/lib/prazos/motor";
import { centavosParaReais, moeda } from "@/lib/documento";

export const metadata = { title: "Painel" };

export default async function Painel({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await obterContexto();
  const e = ctx.escritorio.id;
  const hoje = hojeBrasilia();
  const fimSemana = new Date(Date.now() + 7 * 86400000).toISOString();
  const [prazos, compromissos, andamentos, mensagens, intimacoes, vencidos, monitorados] = await Promise.all([
    ctx.supabase.from("tarefas").select("id, titulo, data_vencimento, processos(numero_cnj)").eq("escritorio_id", e).eq("status", "aberta").lte("data_vencimento", somarDias(hoje, 7)).order("data_vencimento").limit(15),
    ctx.supabase.from("compromissos").select("id, titulo, inicio, modalidade").eq("escritorio_id", e).gte("inicio", new Date().toISOString()).lte("inicio", fimSemana).order("inicio").limit(10),
    ctx.supabase.from("andamentos").select("id, nome, data_hora, processo_id, processos(numero_cnj)").eq("escritorio_id", e).is("visto_em", null).eq("importacao_inicial", false).order("criado_em", { ascending: false }).limit(10),
    ctx.supabase.from("mensagens_cliente").select("id", { count: "exact", head: true }).eq("escritorio_id", e).in("status", ["rascunho", "aprovada"]),
    ctx.planoInclui("M10") ? ctx.supabase.from("intimacoes").select("id", { count: "exact", head: true }).eq("escritorio_id", e).eq("status", "nova") : Promise.resolve({ count: 0 }),
    ctx.pode("financeiro") ? ctx.supabase.from("lancamentos").select("valor_centavos").eq("escritorio_id", e).eq("status", "previsto").eq("natureza", "receber").lt("vencimento", hoje) : Promise.resolve({ data: [] as { valor_centavos: number }[] }),
    ctx.supabase.from("processos").select("id", { count: "exact", head: true }).eq("escritorio_id", e).eq("monitorado", true).eq("ativo", true),
  ]);
  const totalVencido = ((vencidos as { data: { valor_centavos: number }[] | null }).data ?? []).reduce((s, l) => s + Number(l.valor_centavos), 0);

  return (
    <div className="space-y-4">
      <Cabecalho titulo={`Olá${ctx.membro.nome ? `, ${ctx.membro.nome.split(" ")[0]}` : ""}`} descricao={ctx.escritorio.nome} acoes={<LinkBotao href="/processos/novo">Novo processo</LinkBotao>} />
      <Mensagens busca={await searchParams} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/mensagens" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-2xl font-semibold">{mensagens.count ?? 0}</div>
          <div className="text-xs text-slate-500">Mensagens a revisar</div>
        </Link>
        <Link href="/intimacoes" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-2xl font-semibold">{intimacoes.count ?? 0}</div>
          <div className="text-xs text-slate-500">Intimações novas</div>
        </Link>
        <Link href="/processos" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="text-2xl font-semibold">
            {monitorados.count ?? 0}
            <span className="text-sm font-normal text-slate-500">/{ctx.plano.max_processos}</span>
          </div>
          <div className="text-xs text-slate-500">Processos monitorados</div>
        </Link>
        {ctx.pode("financeiro") && (
          <Link href="/financeiro?situacao=atrasado" className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className={`text-lg font-semibold ${totalVencido ? "text-red-700" : ""}`}>{moeda(centavosParaReais(totalVencido))}</div>
            <div className="text-xs text-slate-500">A receber vencido</div>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Cartao titulo="Prazos dos próximos 7 dias" acoes={<Link href="/prazos" className="text-sm underline">Todos</Link>}>
          {!prazos.data?.length ? (
            <Vazio>Nenhum prazo nos próximos 7 dias.</Vazio>
          ) : (
            <ul className="space-y-2 text-sm">
              {prazos.data.map((t) => {
                const d = diferencaDias(hoje, t.data_vencimento);
                const proc = t.processos as unknown as { numero_cnj: string } | null;
                return (
                  <li key={t.id} className="flex items-start justify-between gap-2">
                    <Link href={`/prazos/${t.id}`} className="min-w-0 hover:underline">
                      <span className="font-medium">{formatarDataBr(t.data_vencimento)}</span> · {t.titulo}
                      {proc && <span className="block text-xs text-slate-500">{formatarCnj(proc.numero_cnj)}</span>}
                    </Link>
                    <Etiqueta cor={d < 0 ? "vermelho" : d <= 2 ? "amarelo" : "azul"}>{d < 0 ? "vencido" : d === 0 ? "hoje" : `${d} dia(s)`}</Etiqueta>
                  </li>
                );
              })}
            </ul>
          )}
        </Cartao>
        <Cartao titulo="Agenda da semana" acoes={<Link href="/agenda" className="text-sm underline">Agenda</Link>}>
          {!compromissos.data?.length ? (
            <Vazio>Nenhum compromisso nos próximos 7 dias.</Vazio>
          ) : (
            <ul className="space-y-2 text-sm">
              {compromissos.data.map((c) => (
                <li key={c.id}>
                  <Link href={`/agenda/${c.id}`} className="hover:underline">
                    <span className="font-medium">{new Date(c.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span> · {c.titulo}
                  </Link>{" "}
                  {c.modalidade === "virtual" && <Etiqueta cor="azul">virtual</Etiqueta>}
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <Cartao titulo="Novos andamentos" acoes={<Link href="/mensagens" className="text-sm underline">Explicar aos clientes</Link>}>
        {!andamentos.data?.length ? (
          <Vazio>Nenhum andamento novo. O DataJud é consultado diariamente.</Vazio>
        ) : (
          <ul className="space-y-2 text-sm">
            {andamentos.data.map((a) => (
              <li key={a.id}>
                <Link href={`/processos/${a.processo_id}`} className="hover:underline">
                  <span className="font-mono text-xs">{formatarCnj((a.processos as unknown as { numero_cnj: string }).numero_cnj)}</span>
                  <span className="block">{a.nome}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-500">Fonte: CNJ / DataJud</p>
      </Cartao>
    </div>
  );
}
