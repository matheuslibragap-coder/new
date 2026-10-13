import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { gerarIcs, type EventoIcs } from "./ics";
import { formatarCnj } from "./cnj";

/** Monta o .ics de um escritório: compromissos dos últimos 30 dias em diante e prazos abertos. */
export async function icsDoEscritorio(supabase: SupabaseClient, escritorioId: string, nome: string): Promise<string> {
  const desde = new Date(Date.now() - 30 * 86400000).toISOString();
  const [{ data: comp }, { data: prazos }] = await Promise.all([
    supabase.from("compromissos").select("id, titulo, inicio, fim, local, link_sala, observacoes, alertas_minutos, processos(numero_cnj)").eq("escritorio_id", escritorioId).gte("inicio", desde).order("inicio").limit(2000),
    supabase.from("tarefas").select("id, titulo, data_vencimento, processos(numero_cnj)").eq("escritorio_id", escritorioId).eq("status", "aberta").limit(2000),
  ]);
  const base = process.env.NEXT_PUBLIC_URL_APP || "";
  const eventos: EventoIcs[] = [
    ...(comp ?? []).map((c) => {
      const proc = c.processos as unknown as { numero_cnj: string } | null;
      return {
        uid: `comp-${c.id}@gestao-juridica`,
        inicio: c.inicio,
        fim: c.fim,
        titulo: c.titulo,
        descricao: [proc ? `Processo ${formatarCnj(proc.numero_cnj)}` : null, c.link_sala ? `Sala: ${c.link_sala}` : null, c.observacoes].filter(Boolean).join("\n"),
        local: c.local ?? c.link_sala,
        url: base ? `${base}/agenda/${c.id}` : null,
        alarmesMinutos: c.alertas_minutos ?? [],
      };
    }),
    ...(prazos ?? []).map((t) => {
      const proc = t.processos as unknown as { numero_cnj: string } | null;
      return {
        uid: `prazo-${t.id}@gestao-juridica`,
        inicio: `${t.data_vencimento}T12:00:00.000Z`, // 9h em Brasília
        fim: `${t.data_vencimento}T12:30:00.000Z`,
        titulo: `PRAZO: ${t.titulo}`,
        descricao: `${proc ? `Processo ${formatarCnj(proc.numero_cnj)}\n` : ""}Cálculo automatizado. Confira antes de usar. A responsabilidade profissional é do(a) advogado(a).`,
        url: base ? `${base}/prazos/${t.id}` : null,
        alarmesMinutos: [60 * 24 * 2],
      };
    }),
  ];
  return gerarIcs(nome, eventos);
}
