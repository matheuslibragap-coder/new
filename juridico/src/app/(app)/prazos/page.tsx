import Link from "next/link";
import { Cabecalho, Campo, Cartao, Etiqueta, LinkBotao, Mensagens, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";
import { diferencaDias, formatarDataBr, hojeBrasilia } from "@/lib/prazos/motor";
import { alterarStatusTarefa, criarTarefaSimples } from "./acoes";

export const metadata = { title: "Prazos" };

export default async function Prazos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const busca = await searchParams;
  const ctx = await obterContexto();
  const status = busca.status === "concluida" ? "concluida" : "aberta";
  const { data: tarefas } = await ctx.supabase
    .from("tarefas")
    .select("id, titulo, tipo, data_vencimento, status, origem, processos(id, numero_cnj, clientes(nome))")
    .eq("escritorio_id", ctx.escritorio.id)
    .eq("status", status)
    .order("data_vencimento", { ascending: status === "aberta" })
    .limit(300);
  const hoje = hojeBrasilia();

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Prazos e tarefas" acoes={<LinkBotao href="/prazos/calculadora">Calcular prazo</LinkBotao>} />
      <Mensagens busca={busca} />
      <div className="flex gap-3 text-sm">
        <Link href="/prazos" className={status === "aberta" ? "font-semibold underline" : "text-slate-600"}>
          Abertos
        </Link>
        <Link href="/prazos?status=concluida" className={status === "concluida" ? "font-semibold underline" : "text-slate-600"}>
          Concluídos
        </Link>
      </div>
      {!tarefas?.length ? (
        <Vazio acao={<LinkBotao href="/prazos/calculadora">Calcular um prazo</LinkBotao>}>Nada por aqui.</Vazio>
      ) : (
        <Cartao className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {tarefas.map((t) => {
              const d = diferencaDias(hoje, t.data_vencimento);
              const proc = t.processos as unknown as { id: string; numero_cnj: string; clientes: { nome: string } | null } | null;
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <Link href={`/prazos/${t.id}`} className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{formatarDataBr(t.data_vencimento)}</span>
                      {status === "aberta" && <Etiqueta cor={d < 0 ? "vermelho" : d <= 2 ? "amarelo" : d <= 5 ? "azul" : "cinza"}>{d < 0 ? `vencido há ${-d} dia(s)` : d === 0 ? "vence hoje" : `em ${d} dia(s)`}</Etiqueta>}
                      {t.tipo === "tarefa" && <Etiqueta>tarefa</Etiqueta>}
                    </div>
                    <div className="truncate text-sm text-slate-900">{t.titulo}</div>
                    {proc && <div className="text-xs text-slate-500">{formatarCnj(proc.numero_cnj)}{proc.clientes?.nome ? ` · ${proc.clientes.nome}` : ""}</div>}
                  </Link>
                  {status === "aberta" && (
                    <form action={alterarStatusTarefa}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="status" value="concluida" />
                      <input type="hidden" name="voltar" value="/prazos" />
                      <Enviar variante="secundario" pequeno>
                        Concluir
                      </Enviar>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </Cartao>
      )}
      <Cartao titulo="Nova tarefa sem cálculo">
        <form action={criarTarefaSimples} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <Campo rotulo="Descrição" name="titulo" required />
          <Campo rotulo="Data" name="data_vencimento" type="date" required />
          <Enviar variante="secundario">Criar</Enviar>
        </form>
      </Cartao>
    </div>
  );
}
