import { NextResponse } from "next/server";
import { autorizarCron, esperar } from "@/lib/cron";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { sincronizarProcesso } from "@/lib/sincronizar-processo";
import { ErroDatajud } from "@/lib/datajud";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_TENTATIVAS = 8;

/**
 * Job do DataJud.
 * ?enfileirar=1 (uma vez por dia): coloca todos os processos ativos na fila.
 * Sem parâmetro (a cada poucos minutos): processa a fila respeitando limite de requisições,
 * com intervalo entre chamadas e backoff exponencial em caso de 429 ou indisponibilidade.
 */
export async function GET(req: Request) {
  const negado = autorizarCron(req);
  if (negado) return negado;
  const admin = criarClienteAdmin();
  const url = new URL(req.url);
  const inicio = Date.now();
  const orcamentoMs = 50_000;
  const intervalo = Number(process.env.DATAJUD_INTERVALO_MS || 500);

  let enfileirados = 0;
  if (url.searchParams.get("enfileirar") === "1") {
    const { data, error } = await admin.rpc("enfileirar_datajud");
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    enfileirados = data as number;
  }

  let processados = 0, novos = 0, falhas = 0;
  let pausaGlobal = false;
  while (Date.now() - inicio < orcamentoMs && !pausaGlobal) {
    const { data: lote, error } = await admin.rpc("reservar_fila_datajud", { lote: 10 });
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    if (!lote || lote.length === 0) break;
    for (const item of lote as { processo_id: string; tentativas: number }[]) {
      if (Date.now() - inicio > orcamentoMs) break;
      const { data: p } = await admin.from("processos").select("id, escritorio_id, numero_cnj, datajud_alias, datajud_status, ativo, monitorado").eq("id", item.processo_id).maybeSingle();
      if (!p || !p.ativo || !p.monitorado) {
        await admin.from("fila_datajud").delete().eq("processo_id", item.processo_id);
        continue;
      }
      try {
        const r = await sincronizarProcesso(admin, p);
        novos += r.novos;
        processados++;
        await admin.from("fila_datajud").delete().eq("processo_id", p.id);
      } catch (e) {
        falhas++;
        const tentativas = item.tentativas + 1;
        const repetivel = e instanceof ErroDatajud ? e.repetivel : true;
        if (!repetivel || tentativas >= MAX_TENTATIVAS) {
          await admin.from("fila_datajud").delete().eq("processo_id", p.id);
        } else {
          const atrasoMin = Math.min(2 ** tentativas, 360); // 2, 4, 8... até 6 horas
          await admin
            .from("fila_datajud")
            .update({ tentativas, ultimo_erro: (e as Error).message, proxima_tentativa: new Date(Date.now() + atrasoMin * 60_000).toISOString() })
            .eq("processo_id", p.id);
        }
        if (e instanceof ErroDatajud && e.status === 429) pausaGlobal = true; // respeita o limite: para esta execução
      }
      await esperar(intervalo);
    }
  }
  return NextResponse.json({ enfileirados, processados, novos, falhas, pausaGlobal, duracaoMs: Date.now() - inicio });
}
