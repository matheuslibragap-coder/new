import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AchadoDescartado } from "@/lib/ia/validacao";

export async function registrarLog(supabase: SupabaseClient, userId: string, tipo: string, detalhe: unknown) {
  console.warn(`[validacao] ${tipo}`, JSON.stringify(detalhe));
  const { error } = await supabase.from("logs_validacao").insert({ user_id: userId, tipo, detalhe });
  if (error) console.error("[validacao] falha ao gravar log", error.message);
}

export async function registrarDescartes(supabase: SupabaseClient, userId: string, descartados: AchadoDescartado[]) {
  if (descartados.length === 0) return;
  await registrarLog(supabase, userId, "achado_descartado", { descartados });
}
