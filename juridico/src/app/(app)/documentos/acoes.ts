"use server";
import { revalidatePath } from "next/cache";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { zapsign } from "@/lib/assinatura/provedor";
import { gerarPdfDocumento } from "@/lib/documento-pdf";
import { normalizarWhatsapp } from "@/lib/documento";

export async function salvarModelo(fd: FormData) {
  const ctx = await obterContexto();
  const id = textoOuNulo(fd, "id");
  const dados = { nome: texto(fd, "nome"), tipo: texto(fd, "tipo"), conteudo: texto(fd, "conteudo"), atualizado_em: new Date().toISOString() };
  let novoId = id;
  try {
    if (id) {
      const { error } = await ctx.supabase.from("modelos_documento").update(dados).eq("id", id).eq("escritorio_id", ctx.escritorio.id);
      if (error) throw error;
    } else {
      const { data, error } = await ctx.supabase.from("modelos_documento").insert({ ...dados, escritorio_id: ctx.escritorio.id }).select("id").single();
      if (error) throw error;
      novoId = data.id;
    }
  } catch (e) {
    voltarCom("/documentos", { erro: erroAmigavel(e) });
  }
  revalidatePath("/documentos");
  voltarCom(`/documentos/modelos/${novoId}`, { ok: "Modelo salvo." });
}

export async function copiarModeloPadrao(fd: FormData) {
  const ctx = await obterContexto();
  const { data: m } = await ctx.supabase.from("modelos_documento").select("nome, tipo, conteudo").eq("id", texto(fd, "id")).is("escritorio_id", null).single();
  if (!m) voltarCom("/documentos", { erro: "Modelo não encontrado." });
  const { data, error } = await ctx.supabase.from("modelos_documento").insert({ ...m, nome: `${m.nome} (cópia)`, escritorio_id: ctx.escritorio.id }).select("id").single();
  if (error) voltarCom("/documentos", { erro: erroAmigavel(error) });
  voltarCom(`/documentos/modelos/${data.id}`, { ok: "Cópia criada. Adapte ao seu escritório." });
}

export async function excluirModelo(fd: FormData) {
  const ctx = await obterContexto();
  await ctx.supabase.from("modelos_documento").delete().eq("id", texto(fd, "id")).eq("escritorio_id", ctx.escritorio.id);
  revalidatePath("/documentos");
  voltarCom("/documentos", { ok: "Modelo excluído." });
}

export async function salvarDocumento(fd: FormData) {
  const ctx = await obterContexto();
  if (!ctx.temModulo("M7")) voltarCom("/documentos", { erro: "Contratos e procurações estão disponíveis no plano Pro." });
  const { data, error } = await ctx.supabase
    .from("documentos_gerados")
    .insert({
      escritorio_id: ctx.escritorio.id,
      modelo_id: textoOuNulo(fd, "modelo_id"),
      cliente_id: textoOuNulo(fd, "cliente_id"),
      processo_id: textoOuNulo(fd, "processo_id"),
      titulo: texto(fd, "titulo"),
      conteudo: texto(fd, "conteudo"),
      criado_por: ctx.user.id,
    })
    .select("id")
    .single();
  if (error) voltarCom("/documentos/novo", { erro: erroAmigavel(error) });
  revalidatePath("/documentos");
  voltarCom(`/documentos/${data.id}`, { ok: "Documento gerado. Confira o texto antes de enviar para assinatura." });
}

export async function atualizarDocumento(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  const { error } = await ctx.supabase.from("documentos_gerados").update({ titulo: texto(fd, "titulo"), conteudo: texto(fd, "conteudo") }).eq("id", id).eq("assinatura_status", "nao_enviado");
  if (error) voltarCom(`/documentos/${id}`, { erro: erroAmigavel(error) });
  revalidatePath(`/documentos/${id}`);
  voltarCom(`/documentos/${id}`, { ok: "Texto atualizado." });
}

/**
 * Envio para assinatura eletrônica: exige que o advogado confirme ter conferido os requisitos
 * de validade da assinatura. O provedor não envia nada ao cliente: os links voltam para o advogado.
 */
export async function enviarParaAssinatura(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  if (!ctx.temModulo("M7")) voltarCom(`/documentos/${id}`, { erro: "Assinatura eletrônica disponível no plano Pro." });
  if (fd.get("conferi_validade") !== "on") voltarCom(`/documentos/${id}`, { erro: "Confirme que conferiu os requisitos de validade da assinatura eletrônica." });
  const { data: doc } = await ctx.supabase.from("documentos_gerados").select("*, clientes(nome, email, whatsapp)").eq("id", id).single();
  if (!doc || doc.assinatura_status !== "nao_enviado") voltarCom(`/documentos/${id}`, { erro: "Documento já enviado para assinatura." });

  const signatarios: { nome: string; email?: string | null; telefone?: string | null }[] = [];
  if (fd.get("assina_cliente") === "on") {
    const c = doc.clientes as unknown as { nome: string; email: string | null; whatsapp: string | null } | null;
    if (!c) voltarCom(`/documentos/${id}`, { erro: "Documento sem cliente vinculado." });
    signatarios.push({ nome: c.nome, email: c.email, telefone: normalizarWhatsapp(c.whatsapp) });
  }
  if (fd.get("assina_advogado") === "on") signatarios.push({ nome: ctx.membro.nome || ctx.user.email || "Advogado(a)", email: ctx.user.email });
  if (!signatarios.length) voltarCom(`/documentos/${id}`, { erro: "Selecione ao menos um signatário." });

  const { data: cotaOk, error: erroCota } = await ctx.supabase.rpc("consumir_cota", { e: ctx.escritorio.id, p_recurso: "assinatura_eletronica" });
  if (erroCota) voltarCom(`/documentos/${id}`, { erro: erroAmigavel(erroCota) });
  if (!cotaOk) voltarCom(`/documentos/${id}`, { erro: `A cota mensal de ${ctx.plano.cota_assinaturas_mes} assinaturas do plano foi atingida. Envios avulsos: contate o suporte. O documento continua disponível em PDF.` });

  try {
    const pdf = await gerarPdfDocumento(doc.titulo, doc.conteudo, ctx.escritorio.nome);
    const r = await zapsign.criarDocumento({ titulo: doc.titulo, pdf, referencia: doc.id, signatarios });
    await ctx.supabase
      .from("documentos_gerados")
      .update({ assinatura_status: "aguardando", assinatura_provedor: zapsign.nome, assinatura_id_externo: r.idExterno, assinatura_links: r.links, aviso_validade_aceito_em: new Date().toISOString() })
      .eq("id", id);
  } catch (e) {
    // devolve a unidade da cota em caso de falha no provedor
    const admin = criarClienteAdmin();
    const periodo = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()).slice(0, 7);
    const { data: uso } = await admin.from("uso_cotas").select("quantidade").eq("escritorio_id", ctx.escritorio.id).eq("recurso", "assinatura_eletronica").eq("periodo", periodo).single();
    if (uso) await admin.from("uso_cotas").update({ quantidade: Math.max(0, uso.quantidade - 1) }).eq("escritorio_id", ctx.escritorio.id).eq("recurso", "assinatura_eletronica").eq("periodo", periodo);
    voltarCom(`/documentos/${id}`, { erro: (e as Error).message });
  }
  revalidatePath(`/documentos/${id}`);
  voltarCom(`/documentos/${id}`, { ok: "Documento criado no provedor. Compartilhe os links de assinatura com quem deve assinar." });
}

export async function excluirDocumento(fd: FormData) {
  const ctx = await obterContexto();
  await ctx.supabase.from("documentos_gerados").delete().eq("id", texto(fd, "id"));
  revalidatePath("/documentos");
  voltarCom("/documentos", { ok: "Documento excluído." });
}
