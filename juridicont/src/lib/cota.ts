import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TipoCota = "checagem" | "post" | "auditoria";
export type RespostaCota = { ok: boolean; usados: number; limite: number; plano: string; renova_em: string };

export async function consumirCota(supabase: SupabaseClient, tipo: TipoCota): Promise<RespostaCota> {
  const { data, error } = await supabase.rpc("consumir_cota", { p_tipo: tipo });
  if (error) throw new Error("Falha ao verificar cota: " + error.message);
  return data as RespostaCota;
}

export async function devolverCota(supabase: SupabaseClient, tipo: TipoCota) {
  const { error } = await supabase.rpc("devolver_cota", { p_tipo: tipo });
  if (error) console.error("[cota] falha ao devolver", tipo, error.message);
}

const NOMES: Record<TipoCota, string> = {
  checagem: "checagens",
  post: "posts gerados",
  auditoria: "auditorias de perfil",
};

export function mensagemCotaEsgotada(tipo: TipoCota, r: RespostaCota) {
  const data = new Date(r.renova_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  if (r.limite === 0) return `Seu plano não inclui ${NOMES[tipo]}. Veja os planos disponíveis.`;
  return `Você usou ${r.usados} de ${r.limite} ${NOMES[tipo]} deste ciclo. A cota renova em ${data}.`;
}
