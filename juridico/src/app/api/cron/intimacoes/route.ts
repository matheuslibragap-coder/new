import { NextResponse } from "next/server";
import { autorizarCron, esperar } from "@/lib/cron";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { capturarIntimacoes } from "@/lib/intimacoes/capturar";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Captura diária de intimações por OAB (plano Pro e Escritório). */
export async function GET(req: Request) {
  const negado = autorizarCron(req);
  if (negado) return negado;
  const admin = criarClienteAdmin();
  const inicio = Date.now();
  const { data: configs } = await admin.from("config_intimacoes").select("id, escritorio_id, provedor, oab_numero, oab_uf, ultima_captura").eq("ativo", true).order("ultima_captura", { ascending: true, nullsFirst: true }).limit(200);
  let novas = 0, falhas = 0, processadas = 0;
  for (const c of configs ?? []) {
    if (Date.now() - inicio > 50_000) break;
    const { data: ok } = await admin.rpc("tem_modulo", { e: c.escritorio_id, modulo: "M10" });
    if (!ok) continue;
    try {
      novas += await capturarIntimacoes(admin, c);
    } catch {
      falhas++;
    }
    processadas++;
    await esperar(Number(process.env.DJEN_INTERVALO_MS || 1000));
  }
  return NextResponse.json({ processadas, novas, falhas });
}
