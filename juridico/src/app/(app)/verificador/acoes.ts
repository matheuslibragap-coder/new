"use server";
import { redirect } from "next/navigation";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, voltarCom } from "@/lib/acoes";
import { extrairTexto } from "@/lib/extrair-texto";
import { verificarPeticao } from "@/lib/verificador-servidor";
import { hojeBrasilia } from "@/lib/prazos/motor";
import type { LeiRef } from "@/lib/verificador";

export async function verificar(fd: FormData) {
  const ctx = await obterContexto();
  if (!ctx.temModulo("M9")) voltarCom("/verificador", { erro: "Verificador disponível no plano Pro." });
  let conteudo = texto(fd, "texto");
  const arquivo = fd.get("arquivo");
  try {
    if (arquivo instanceof File && arquivo.size > 0) conteudo = await extrairTexto(arquivo.name, await arquivo.arrayBuffer());
  } catch (e) {
    voltarCom("/verificador", { erro: erroAmigavel(e) });
  }
  if (conteudo.length < 50) voltarCom("/verificador", { erro: "Cole o texto da petição ou envie o arquivo." });
  if (conteudo.length > 400_000) voltarCom("/verificador", { erro: "Texto muito longo (limite de 400 mil caracteres)." });
  const { data: leis } = await ctx.supabase.from("leis_referencia").select("sigla, nome, apelidos, ultimo_artigo");
  const resultado = await verificarPeticao(conteudo, (leis ?? []) as LeiRef[], hojeBrasilia());
  const { data, error } = await ctx.supabase
    .from("verificacoes")
    .insert({ escritorio_id: ctx.escritorio.id, titulo: texto(fd, "titulo") || (arquivo instanceof File && arquivo.name) || "Verificação", texto: conteudo, resultado, criado_por: ctx.user.id })
    .select("id")
    .single();
  if (error) voltarCom("/verificador", { erro: erroAmigavel(error) });
  redirect(`/verificador/${data.id}`);
}

export async function excluirVerificacao(fd: FormData) {
  const ctx = await obterContexto();
  await ctx.supabase.from("verificacoes").delete().eq("id", texto(fd, "id"));
  voltarCom("/verificador", { ok: "Verificação excluída." });
}
