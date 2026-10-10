import Link from "next/link";
import { notFound } from "next/navigation";
import { AvisoResponsabilidade, Cabecalho, Campo, Cartao, Etiqueta, Mensagens } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";
import { formatarDataBr, ROTULO_EVENTO, type DiaMemoria, type TipoEvento } from "@/lib/prazos/motor";
import { MemoriaCalculo } from "../memoria";
import { alterarStatusTarefa, editarTarefa, excluirTarefa } from "../acoes";

export default async function Tarefa({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: t } = await ctx.supabase.from("tarefas").select("*, processos(id, numero_cnj), regras_prazo(nome)").eq("id", id).maybeSingle();
  if (!t) notFound();
  const proc = t.processos as unknown as { id: string; numero_cnj: string } | null;
  const memoria = t.memoria as { memoria: DiaMemoria[]; observacoes: string[]; fundamentacao: string; dataFinal: string } | null;
  const alterado = memoria && memoria.dataFinal !== t.data_vencimento;
  return (
    <div className="space-y-4">
      <Cabecalho titulo={t.titulo} descricao={`Vencimento: ${formatarDataBr(t.data_vencimento)}`} voltar={{ href: "/prazos", rotulo: "Prazos" }} />
      <Mensagens busca={await searchParams} />
      <Cartao>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Etiqueta cor={t.status === "aberta" ? "azul" : t.status === "concluida" ? "verde" : "cinza"}>{t.status}</Etiqueta>
          {proc && (
            <Link href={`/processos/${proc.id}`} className="underline">
              {formatarCnj(proc.numero_cnj)}
            </Link>
          )}
          {t.alertas_enviados?.length > 0 && <span className="text-xs text-slate-500">Alertas enviados: {t.alertas_enviados.join(", ")}</span>}
        </div>
        {t.data_evento && (
          <p className="mt-2 text-sm text-slate-600">
            {ROTULO_EVENTO[t.tipo_evento as TipoEvento] ?? "Evento"} em {formatarDataBr(t.data_evento)} · {t.dias} dias{t.em_dobro ? " em dobro" : ""} · {(t.regras_prazo as unknown as { nome: string } | null)?.nome}
          </p>
        )}
        {t.descricao && <p className="mt-2 text-sm">{t.descricao}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {["aberta", "concluida", "cancelada"]
            .filter((s) => s !== t.status)
            .map((s) => (
              <form key={s} action={alterarStatusTarefa}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value={s} />
                <Enviar variante={s === "concluida" ? "sucesso" : "secundario"} pequeno>
                  {s === "aberta" ? "Reabrir" : s === "concluida" ? "Marcar como cumprido" : "Cancelar"}
                </Enviar>
              </form>
            ))}
        </div>
      </Cartao>
      {alterado && <AvisoResponsabilidade extra={`O vencimento foi alterado manualmente. O cálculo automático indicava ${formatarDataBr(memoria!.dataFinal)}.`} />}
      {memoria?.memoria && (
        <Cartao titulo="Memória de cálculo">
          <MemoriaCalculo memoria={memoria.memoria} observacoes={memoria.observacoes} fundamentacao={memoria.fundamentacao} />
        </Cartao>
      )}
      <Cartao titulo="Editar">
        <form action={editarTarefa} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <Campo rotulo="Título" name="titulo" defaultValue={t.titulo} required />
          <Campo rotulo="Observação" name="descricao" defaultValue={t.descricao ?? ""} />
          <Campo rotulo="Vencimento" name="data_vencimento" type="date" defaultValue={t.data_vencimento} required ajuda="A decisão final sobre o prazo é do(a) advogado(a)." />
          <Enviar>Salvar</Enviar>
        </form>
        <form action={excluirTarefa} className="mt-4">
          <input type="hidden" name="id" value={id} />
          <Enviar variante="perigo" pequeno confirmar="Excluir este prazo?">
            Excluir
          </Enviar>
        </form>
      </Cartao>
    </div>
  );
}
