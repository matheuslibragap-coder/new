import type { Contexto } from "@/lib/contexto";

export async function opcoesProcesso(ctx: Contexto) {
  const [{ data: clientes }, { data: regras }] = await Promise.all([
    ctx.supabase.from("clientes").select("id, nome").eq("escritorio_id", ctx.escritorio.id).order("nome"),
    ctx.supabase.from("regras_prazo").select("codigo, nome").eq("ativo", true).order("nome"),
  ]);
  return {
    clientes: (clientes ?? []).map((c) => ({ valor: c.id, rotulo: c.nome })),
    ritos: (regras ?? []).map((r) => ({ valor: r.codigo, rotulo: r.nome })),
  };
}
