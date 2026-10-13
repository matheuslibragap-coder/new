import Link from "next/link";
import { AvisoResponsabilidade, BloqueioPlano, Cabecalho, Campo, Cartao, Etiqueta, Mensagens, Selecao, Vazio } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";
import { formatarDataBr } from "@/lib/prazos/motor";
import { LISTA_UFS } from "@/lib/tribunais";
import { capturarAgora, descartarIntimacao, removerConfig, salvarConfig } from "./acoes";

export const metadata = { title: "Intimações" };

type Sugestao = { dias: number; diasEncontradosNoTexto: boolean; regra: string; dataFinal: string | null };

export default async function Intimacoes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const b = await searchParams;
  const ctx = await obterContexto();
  const liberado = ctx.temModulo("M10");
  const status = b.status === "confirmada" || b.status === "descartada" ? b.status : "nova";
  const [{ data: configs }, { data: intimacoes }] = await Promise.all([
    ctx.supabase.from("config_intimacoes").select("*").eq("escritorio_id", ctx.escritorio.id),
    ctx.supabase.from("intimacoes").select("*, processos(id, numero_cnj)").eq("escritorio_id", ctx.escritorio.id).eq("status", status).order("data_disponibilizacao", { ascending: false }).limit(100),
  ]);
  return (
    <div className="space-y-4">
      <Cabecalho titulo="Monitor de intimações" descricao="Captura diária de comunicações pelo número da OAB. Cada intimação sugere um prazo, que só vira tarefa com a sua confirmação." />
      <Mensagens busca={b} />
      {!liberado && <BloqueioPlano modulo="O monitor de intimações" />}
      {liberado && (
        <Cartao titulo="OABs monitoradas">
          <ul className="mb-3 space-y-2 text-sm">
            {(configs ?? []).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  OAB {c.oab_numero}/{c.oab_uf}
                </span>
                <span className="text-xs text-slate-500">
                  {c.ultima_captura ? `última captura ${new Date(c.ultima_captura).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "ainda não capturada"}
                </span>
                {c.ultimo_erro && <Etiqueta cor="vermelho">{c.ultimo_erro}</Etiqueta>}
                <form action={capturarAgora}>
                  <input type="hidden" name="id" value={c.id} />
                  <Enviar pequeno variante="secundario">Buscar agora</Enviar>
                </form>
                <form action={removerConfig}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="text-xs text-red-700 underline">remover</button>
                </form>
              </li>
            ))}
          </ul>
          <form action={salvarConfig} className="grid gap-3 sm:grid-cols-[1fr_120px_1fr_auto] sm:items-end">
            <Campo rotulo="Número da OAB" name="oab_numero" required defaultValue={ctx.membro.oab_numero ?? ""} inputMode="numeric" />
            <Selecao rotulo="UF" name="oab_uf" defaultValue={ctx.membro.oab_uf ?? ctx.escritorio.uf ?? "RS"} opcoes={LISTA_UFS.map((u) => ({ valor: u, rotulo: u }))} />
            <Campo rotulo="Nome do(a) advogado(a)" name="nome_advogado" defaultValue={ctx.membro.nome ?? ""} />
            <Enviar>Adicionar</Enviar>
          </form>
          <p className="mt-2 text-xs text-slate-500">Fonte: Diário de Justiça Eletrônico Nacional (Comunica PJe, CNJ). [CONFERIR] cobertura de cada tribunal; publicações em diários não integrados ao DJEN podem não aparecer.</p>
        </Cartao>
      )}
      <div className="flex gap-3 text-sm">
        {(["nova", "confirmada", "descartada"] as const).map((s) => (
          <Link key={s} href={`/intimacoes?status=${s}`} className={status === s ? "font-semibold underline" : "text-slate-600"}>
            {s === "nova" ? "Novas" : s === "confirmada" ? "Confirmadas" : "Descartadas"}
          </Link>
        ))}
      </div>
      {status === "nova" && !!intimacoes?.length && <AvisoResponsabilidade extra="O prazo sugerido parte da data de disponibilização e de um número de dias lido no texto (ou 15 dias, se não encontrado). Confira o ato antes de confirmar." />}
      {!intimacoes?.length ? (
        <Vazio>Nenhuma intimação.</Vazio>
      ) : (
        intimacoes.map((i) => {
          const s = i.prazo_sugerido as Sugestao | null;
          const proc = i.processos as unknown as { id: string; numero_cnj: string } | null;
          const params = new URLSearchParams({
            calcular: "1",
            data: i.data_disponibilizacao,
            evento: "disponibilizacao_dje",
            dias: String(s?.dias ?? 15),
            regra: s?.regra ?? "civel_cpc",
            intimacao: i.id,
            titulo: `${i.tipo_comunicacao ?? "Intimação"}${i.orgao ? ` (${i.orgao})` : ""}`.slice(0, 120),
            ...(proc ? { processo: proc.id } : { tribunal: i.tribunal ?? "" }),
          });
          return (
            <Cartao key={i.id}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Disponibilizada em {formatarDataBr(i.data_disponibilizacao)}</span>
                {i.tribunal && <Etiqueta>{i.tribunal}</Etiqueta>}
                {i.tipo_comunicacao && <Etiqueta cor="azul">{i.tipo_comunicacao}</Etiqueta>}
                {i.numero_cnj && (proc ? <Link href={`/processos/${proc.id}`} className="underline">{formatarCnj(i.numero_cnj)}</Link> : <span>{formatarCnj(i.numero_cnj)} (não cadastrado)</span>)}
              </div>
              <p className="mt-2 line-clamp-6 whitespace-pre-line text-sm">{i.texto}</p>
              {i.link && (
                <a href={i.link} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                  Ver no diário
                </a>
              )}
              {status === "nova" && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <span className="text-sm">
                    Prazo sugerido: <strong>{s?.dataFinal ? formatarDataBr(s.dataFinal) : "não calculado"}</strong> ({s?.dias ?? 15} dias{s && !s.diasEncontradosNoTexto ? ", padrão: confira no ato" : ""})
                  </span>
                  <Link href={`/prazos/calculadora?${params}`} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white">
                    Revisar e confirmar prazo
                  </Link>
                  <form action={descartarIntimacao}>
                    <input type="hidden" name="id" value={i.id} />
                    <Enviar pequeno variante="fantasma">Descartar</Enviar>
                  </form>
                </div>
              )}
            </Cartao>
          );
        })
      )}
    </div>
  );
}
