"use server";
import { obterContexto } from "@/lib/contexto";
import { executar, type TipoCalculo } from "@/lib/calculos/servidor";

const TIPOS: TipoCalculo[] = ["atualizacao", "rescisao", "pensao", "cumprimento_sentenca"];

export async function calcular(tipo: TipoCalculo, entrada: Record<string, unknown>): Promise<{ resultado?: unknown; erro?: string }> {
  const ctx = await obterContexto();
  if (!TIPOS.includes(tipo)) return { erro: "Calculadora inválida." };
  try {
    return { resultado: await executar(ctx.supabase, tipo, entrada) };
  } catch (e) {
    return { erro: (e as Error).message };
  }
}

export async function salvarCalculo(tipo: TipoCalculo, titulo: string, entrada: Record<string, unknown>, processoId: string | null): Promise<{ id?: string; erro?: string }> {
  const ctx = await obterContexto();
  if (!TIPOS.includes(tipo)) return { erro: "Calculadora inválida." };
  try {
    const resultado = await executar(ctx.supabase, tipo, entrada);
    const { data, error } = await ctx.supabase
      .from("calculos_salvos")
      .insert({ escritorio_id: ctx.escritorio.id, processo_id: processoId || null, tipo, titulo: titulo || "Cálculo", entrada, resultado, criado_por: ctx.user.id })
      .select("id")
      .single();
    if (error) throw error;
    return { id: data.id };
  } catch (e) {
    return { erro: (e as Error).message };
  }
}
