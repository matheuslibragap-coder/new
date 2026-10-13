import Link from "next/link";
import { Cabecalho, Cartao, Etiqueta, LinkBotao, Mensagens, Vazio } from "@/components/ui";
import { Copiar, Enviar } from "@/components/cliente";
import { obterContexto } from "@/lib/contexto";
import { diaSemana, formatarDataBr, hojeBrasilia, somarDias } from "@/lib/prazos/motor";
import { gerarLinkCalendario } from "./acoes";
import { TIPOS } from "./form-compromisso";

export const metadata = { title: "Agenda" };

type Item = { id: string; tipo: "compromisso" | "prazo"; data: string; hora?: string; titulo: string; detalhe?: string; href: string };

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
const dataBr = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));

function inicioSemana(d: string) {
  const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
  return somarDias(d, dow === 0 ? -6 : 1 - dow);
}

export default async function Agenda({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const b = await searchParams;
  const ctx = await obterContexto();
  const visao = b.visao === "dia" || b.visao === "lista" ? b.visao : "semana";
  const ref = b.data && /^\d{4}-\d{2}-\d{2}$/.test(b.data) ? b.data : hojeBrasilia();
  const [de, ate] = visao === "dia" ? [ref, somarDias(ref, 1)] : visao === "semana" ? [inicioSemana(ref), somarDias(inicioSemana(ref), 7)] : [ref, somarDias(ref, 60)];

  const [{ data: compromissos }, { data: prazos }, { data: token }] = await Promise.all([
    ctx.supabase.from("compromissos").select("id, titulo, tipo, inicio, modalidade, local").eq("escritorio_id", ctx.escritorio.id).gte("inicio", new Date(`${de}T00:00:00-03:00`).toISOString()).lt("inicio", new Date(`${ate}T00:00:00-03:00`).toISOString()).order("inicio"),
    ctx.supabase.from("tarefas").select("id, titulo, data_vencimento").eq("escritorio_id", ctx.escritorio.id).eq("status", "aberta").gte("data_vencimento", de).lt("data_vencimento", ate),
    ctx.supabase.from("calendario_tokens").select("token").eq("user_id", ctx.user.id).eq("escritorio_id", ctx.escritorio.id).maybeSingle(),
  ]);

  const itens: Item[] = ([
    ...(compromissos ?? []).map((c) => ({
      id: c.id,
      tipo: "compromisso" as const,
      data: dataBr(c.inicio),
      hora: hora(c.inicio),
      titulo: c.titulo,
      detalhe: [TIPOS.find((t) => t.valor === c.tipo)?.rotulo, c.modalidade === "virtual" ? "virtual" : c.local].filter(Boolean).join(" · "),
      href: `/agenda/${c.id}`,
    })),
    ...(prazos ?? []).map((t) => ({ id: t.id, tipo: "prazo" as const, data: t.data_vencimento, titulo: `Prazo: ${t.titulo}`, href: `/prazos/${t.id}` })),
  ] as Item[]).sort((x, y) => `${x.data}${x.hora ?? "00:00"}`.localeCompare(`${y.data}${y.hora ?? "00:00"}`));

  const dias: string[] = [];
  for (let d = de; d < ate; d = somarDias(d, 1)) dias.push(d);
  const passo = visao === "dia" ? 1 : visao === "semana" ? 7 : 60;
  const url = (extra: Record<string, string>) => `/agenda?${new URLSearchParams({ visao, data: ref, ...extra })}`;
  const base = process.env.NEXT_PUBLIC_URL_APP || "";

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Agenda" acoes={<LinkBotao href="/agenda/novo">Novo compromisso</LinkBotao>} />
      <Mensagens busca={b} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
          {(["dia", "semana", "lista"] as const).map((v) => (
            <Link key={v} href={`/agenda?visao=${v}&data=${ref}`} className={`rounded-md px-3 py-1 ${visao === v ? "bg-slate-900 text-white" : "text-slate-700"}`}>
              {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Lista"}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href={url({ data: somarDias(ref, -passo) })} className="rounded-lg border border-slate-300 bg-white px-2 py-1">‹</Link>
          <Link href={url({ data: hojeBrasilia() })} className="rounded-lg border border-slate-300 bg-white px-2 py-1">Hoje</Link>
          <Link href={url({ data: somarDias(ref, passo) })} className="rounded-lg border border-slate-300 bg-white px-2 py-1">›</Link>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        {visao === "dia" ? `${diaSemana(ref)}, ${formatarDataBr(ref)}` : `${formatarDataBr(de)} a ${formatarDataBr(somarDias(ate, -1))}`}
      </p>

      {visao === "lista" && !itens.length ? (
        <Vazio>Nada nos próximos 60 dias.</Vazio>
      ) : (
        <div className="space-y-3">
          {dias
            .filter((d) => visao !== "lista" || itens.some((i) => i.data === d))
            .map((d) => {
              const doDia = itens.filter((i) => i.data === d);
              return (
                <Cartao key={d} titulo={<span className={d === hojeBrasilia() ? "text-sky-800" : ""}>{`${diaSemana(d)}, ${formatarDataBr(d)}`}</span>}>
                  {!doDia.length ? (
                    <p className="text-sm text-slate-400">Livre</p>
                  ) : (
                    <ul className="space-y-2">
                      {doDia.map((i) => (
                        <li key={`${i.tipo}-${i.id}`}>
                          <Link href={i.href} className="flex items-start gap-3 text-sm hover:underline">
                            <span className="w-12 shrink-0 font-mono text-slate-500">{i.hora ?? "--:--"}</span>
                            <span className="min-w-0">
                              {i.titulo} {i.tipo === "prazo" && <Etiqueta cor="amarelo">prazo</Etiqueta>}
                              {i.detalhe && <span className="block text-xs text-slate-500">{i.detalhe}</span>}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Cartao>
              );
            })}
        </div>
      )}

      <Cartao titulo="Exportar agenda (.ics)">
        <p className="mb-2 text-sm text-slate-600">Baixe o arquivo para importar no Google Agenda, Outlook ou iPhone, ou use o link de assinatura para manter atualizado.</p>
        <div className="flex flex-wrap gap-2">
          <a href="/api/agenda/exportar" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">
            Baixar .ics
          </a>
          <form action={gerarLinkCalendario}>
            <Enviar variante="secundario">{token ? "Gerar novo link" : "Criar link de assinatura"}</Enviar>
          </form>
        </div>
        {token && (
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs">{`${base}/api/agenda/ics/${token.token}`}</code>
            <Copiar texto={`${base}/api/agenda/ics/${token.token}`} />
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">O link é privado. Quem tiver o link vê seus compromissos e prazos; gere um novo se ele vazar.</p>
      </Cartao>
    </div>
  );
}
