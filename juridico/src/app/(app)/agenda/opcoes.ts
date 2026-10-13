import type { Contexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";

export async function opcoesProcessos(ctx: Contexto) {
  const { data } = await ctx.supabase.from("processos").select("id, numero_cnj, clientes(nome)").eq("escritorio_id", ctx.escritorio.id).eq("ativo", true).order("atualizado_em", { ascending: false }).limit(300);
  return (data ?? []).map((p) => ({ valor: p.id, rotulo: `${formatarCnj(p.numero_cnj)}${(p.clientes as unknown as { nome: string } | null)?.nome ? ` · ${(p.clientes as unknown as { nome: string }).nome}` : ""}` }));
}
