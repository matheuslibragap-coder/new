"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";

/** "2026-11-05T14:30" (horário de Brasília) -> ISO UTC */
function deLocal(v: string | null): string | null {
  if (!v) return null;
  const d = new Date(`${v}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function dados(fd: FormData) {
  const inicio = deLocal(textoOuNulo(fd, "inicio"));
  if (!inicio) throw new Error("Informe data e hora de início.");
  const alertas = fd.getAll("alertas").map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
  return {
    processo_id: textoOuNulo(fd, "processo_id"),
    titulo: texto(fd, "titulo"),
    tipo: texto(fd, "tipo") || "audiencia",
    subtipo: textoOuNulo(fd, "subtipo"),
    inicio,
    fim: deLocal(textoOuNulo(fd, "fim")),
    modalidade: texto(fd, "modalidade") || "presencial",
    link_sala: textoOuNulo(fd, "link_sala"),
    local: textoOuNulo(fd, "local"),
    observacoes: textoOuNulo(fd, "observacoes"),
    alertas_minutos: alertas,
  };
}

export async function salvarCompromisso(fd: FormData) {
  const ctx = await obterContexto();
  const id = textoOuNulo(fd, "id");
  let novoId = id;
  try {
    const d = dados(fd);
    if (id) {
      const { error } = await ctx.supabase.from("compromissos").update({ ...d, alertas_enviados: [] }).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await ctx.supabase
        .from("compromissos")
        .insert({ ...d, escritorio_id: ctx.escritorio.id, criado_por: ctx.user.id, responsavel_id: ctx.user.id })
        .select("id")
        .single();
      if (error) throw error;
      novoId = data.id;
    }
  } catch (e) {
    voltarCom(id ? `/agenda/${id}` : "/agenda/novo", { erro: erroAmigavel(e) });
  }
  revalidatePath("/agenda");
  voltarCom(`/agenda/${novoId}`, { ok: "Compromisso salvo." });
}

export async function excluirCompromisso(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  const { data: anexos } = await ctx.supabase.from("compromisso_anexos").select("caminho").eq("compromisso_id", id);
  if (anexos?.length) await ctx.supabase.storage.from("documentos").remove(anexos.map((a) => a.caminho));
  await ctx.supabase.from("compromissos").delete().eq("id", id);
  revalidatePath("/agenda");
  voltarCom("/agenda", { ok: "Compromisso excluído." });
}

export async function anexarDocumento(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "compromisso_id");
  const arquivo = fd.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) voltarCom(`/agenda/${id}`, { erro: "Selecione um arquivo." });
  if (arquivo.size > 10 * 1024 * 1024) voltarCom(`/agenda/${id}`, { erro: "Arquivo acima de 10 MB." });
  const nomeSeguro = arquivo.name.replace(/[^\w.\-]+/g, "_").slice(-100);
  const caminho = `${ctx.escritorio.id}/compromissos/${id}/${randomUUID()}-${nomeSeguro}`;
  const { error } = await ctx.supabase.storage.from("documentos").upload(caminho, arquivo, { contentType: arquivo.type || "application/octet-stream" });
  if (error) voltarCom(`/agenda/${id}`, { erro: "Falha no envio do arquivo." });
  await ctx.supabase.from("compromisso_anexos").insert({ escritorio_id: ctx.escritorio.id, compromisso_id: id, nome: arquivo.name, caminho, tamanho: arquivo.size });
  revalidatePath(`/agenda/${id}`);
  voltarCom(`/agenda/${id}`, { ok: "Documento anexado." });
}

export async function removerAnexo(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "compromisso_id");
  const { data: a } = await ctx.supabase.from("compromisso_anexos").select("id, caminho").eq("id", texto(fd, "anexo_id")).single();
  if (a) {
    await ctx.supabase.storage.from("documentos").remove([a.caminho]);
    await ctx.supabase.from("compromisso_anexos").delete().eq("id", a.id);
  }
  revalidatePath(`/agenda/${id}`);
  voltarCom(`/agenda/${id}`, { ok: "Anexo removido." });
}

export async function gerarLinkCalendario() {
  const ctx = await obterContexto();
  await ctx.supabase.from("calendario_tokens").delete().eq("user_id", ctx.user.id).eq("escritorio_id", ctx.escritorio.id);
  await ctx.supabase.from("calendario_tokens").insert({ user_id: ctx.user.id, escritorio_id: ctx.escritorio.id });
  revalidatePath("/agenda");
  voltarCom("/agenda?visao=lista", { ok: "Novo link de calendário gerado. O link anterior deixou de funcionar." });
}
