"use server";
import { revalidatePath } from "next/cache";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, voltarCom } from "@/lib/acoes";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { capturarIntimacoes } from "@/lib/intimacoes/capturar";

export async function salvarConfig(fd: FormData) {
  const ctx = await obterContexto();
  const { error } = await ctx.supabase.from("config_intimacoes").insert({
    escritorio_id: ctx.escritorio.id,
    provedor: "djen",
    oab_numero: texto(fd, "oab_numero").replace(/\D/g, ""),
    oab_uf: texto(fd, "oab_uf").toUpperCase(),
    nome_advogado: texto(fd, "nome_advogado") || null,
  });
  if (error) voltarCom("/intimacoes", { erro: erroAmigavel(error) });
  revalidatePath("/intimacoes");
  voltarCom("/intimacoes", { ok: "OAB cadastrada. A captura roda diariamente." });
}

export async function removerConfig(fd: FormData) {
  const ctx = await obterContexto();
  await ctx.supabase.from("config_intimacoes").delete().eq("id", texto(fd, "id"));
  revalidatePath("/intimacoes");
}

export async function capturarAgora(fd: FormData) {
  const ctx = await obterContexto();
  if (!ctx.temModulo("M10")) voltarCom("/intimacoes", { erro: "Monitor de intimações disponível no plano Pro." });
  const { data: cfg } = await ctx.supabase.from("config_intimacoes").select("id, escritorio_id, provedor, oab_numero, oab_uf, ultima_captura").eq("id", texto(fd, "id")).single();
  if (!cfg) voltarCom("/intimacoes", { erro: "Configuração não encontrada." });
  if (cfg.ultima_captura && Date.now() - new Date(cfg.ultima_captura).getTime() < 10 * 60 * 1000) voltarCom("/intimacoes", { erro: "Captura feita há menos de 10 minutos." });
  let n = 0;
  try {
    n = await capturarIntimacoes(criarClienteAdmin(), cfg, 7);
  } catch (e) {
    voltarCom("/intimacoes", { erro: `Falha na captura: ${(e as Error).message}` });
  }
  revalidatePath("/intimacoes");
  voltarCom("/intimacoes", { ok: `${n} nova(s) intimação(ões).` });
}

export async function descartarIntimacao(fd: FormData) {
  const ctx = await obterContexto();
  await ctx.supabase.from("intimacoes").update({ status: "descartada" }).eq("id", texto(fd, "id"));
  revalidatePath("/intimacoes");
}
