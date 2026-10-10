import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularPrazo, somarDias, type Contexto, type Feriado, type RegraPrazo, type ResultadoPrazo, type TipoEvento } from "./motor";

/** Carrega regra e feriados do banco e calcula o prazo. */
export async function calcularComBanco(
  supabase: SupabaseClient,
  p: { dataEvento: string; tipoEvento: TipoEvento; dias: number; emDobro: boolean; regraCodigo: string; contexto: Contexto },
): Promise<{ resultado: ResultadoPrazo; regra: RegraPrazo }> {
  const { data: regra } = await supabase.from("regras_prazo").select("*").eq("codigo", p.regraCodigo).single();
  if (!regra) throw new Error("Regra de prazo não encontrada.");
  const ate = somarDias(p.dataEvento, Math.max(400, p.dias * (p.emDobro ? 2 : 1) * 3 + 120));
  const { data: feriados } = await supabase
    .from("feriados")
    .select("data, descricao, tipo, abrangencia, uf, tribunal, comarca, ativo, validado")
    .gte("data", p.dataEvento)
    .lte("data", ate)
    .eq("ativo", true);
  const resultado = calcularPrazo({
    dataEvento: p.dataEvento,
    tipoEvento: p.tipoEvento,
    dias: p.dias,
    emDobro: p.emDobro,
    regra: regra as RegraPrazo,
    feriados: (feriados ?? []) as Feriado[],
    contexto: p.contexto,
  });
  return { resultado, regra: regra as RegraPrazo };
}
