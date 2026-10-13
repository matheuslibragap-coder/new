"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { reaisParaCentavos } from "@/lib/documento";

function somarMeses(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + n, 1));
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimo));
  return alvo.toISOString().slice(0, 10);
}

export async function criarLancamento(fd: FormData) {
  const ctx = await obterContexto();
  if (!ctx.pode("financeiro")) voltarCom("/painel", { erro: "Sem acesso ao financeiro." });
  try {
    const total = reaisParaCentavos(texto(fd, "valor"));
    if (total <= 0) throw new Error("Informe um valor positivo.");
    const parcelas = Math.min(120, Math.max(1, Number(texto(fd, "parcelas")) || 1));
    const modo = texto(fd, "modo_valor"); // total ou parcela
    const vencimento = texto(fd, "vencimento");
    if (!vencimento) throw new Error("Informe o vencimento.");
    const tipo = texto(fd, "tipo");
    const base = Math.floor((modo === "parcela" ? total * parcelas : total) / parcelas);
    const resto = (modo === "parcela" ? total * parcelas : total) - base * parcelas;
    const grupo = parcelas > 1 ? randomUUID() : null;
    const linhas = Array.from({ length: parcelas }, (_, i) => ({
      escritorio_id: ctx.escritorio.id,
      cliente_id: textoOuNulo(fd, "cliente_id"),
      processo_id: textoOuNulo(fd, "processo_id"),
      tipo,
      natureza: tipo === "despesa" || fd.get("natureza") === "pagar" ? "pagar" : "receber",
      descricao: textoOuNulo(fd, "descricao"),
      valor_centavos: base + (i === 0 ? resto : 0),
      vencimento: somarMeses(vencimento, i),
      parcela_numero: parcelas > 1 ? i + 1 : null,
      parcela_total: parcelas > 1 ? parcelas : null,
      grupo_parcelamento: grupo,
      criado_por: ctx.user.id,
    }));
    const { error } = await ctx.supabase.from("lancamentos").insert(linhas);
    if (error) throw error;
  } catch (e) {
    voltarCom("/financeiro/novo", { erro: erroAmigavel(e) });
  }
  revalidatePath("/financeiro");
  voltarCom("/financeiro", { ok: "Lançamento registrado." });
}

export async function alterarStatusLancamento(fd: FormData) {
  const ctx = await obterContexto();
  const status = texto(fd, "status");
  if (!["previsto", "recebido", "cancelado"].includes(status)) return;
  const { error } = await ctx.supabase
    .from("lancamentos")
    .update({ status, recebido_em: status === "recebido" ? textoOuNulo(fd, "data") ?? new Date().toISOString().slice(0, 10) : null })
    .eq("id", texto(fd, "id"));
  if (error) voltarCom("/financeiro", { erro: erroAmigavel(error) });
  revalidatePath("/financeiro");
}

export async function excluirLancamento(fd: FormData) {
  const ctx = await obterContexto();
  const grupo = textoOuNulo(fd, "grupo");
  if (grupo && fd.get("todas") === "1") await ctx.supabase.from("lancamentos").delete().eq("grupo_parcelamento", grupo).eq("status", "previsto");
  else await ctx.supabase.from("lancamentos").delete().eq("id", texto(fd, "id"));
  revalidatePath("/financeiro");
  voltarCom("/financeiro", { ok: "Excluído." });
}
