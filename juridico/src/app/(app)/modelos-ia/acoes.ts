"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { extrairTexto } from "@/lib/extrair-texto";
import { anonimizar } from "@/lib/anonimizar";
import { dividirEmTrechos, embeddingsDisponiveis, gerarEmbeddings } from "@/lib/ia/embeddings";
import { gerarRascunho } from "@/lib/ia/claude";

export async function enviarModelo(fd: FormData) {
  const ctx = await obterContexto();
  if (!ctx.temModulo("M8")) voltarCom("/modelos-ia", { erro: "Banco de modelos disponível no plano Pro." });
  const arquivo = fd.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) voltarCom("/modelos-ia", { erro: "Selecione um arquivo PDF, DOCX ou TXT." });
  if (arquivo.size > 12 * 1024 * 1024) voltarCom("/modelos-ia", { erro: "Arquivo acima de 12 MB." });

  let docId: string;
  try {
    const bruto = await extrairTexto(arquivo.name, await arquivo.arrayBuffer());
    if (bruto.length < 200) throw new Error("Não foi possível extrair texto suficiente. PDFs digitalizados (imagem) precisam de OCR antes do envio.");
    const anon = fd.get("anonimizar") === "on";
    let conteudo = bruto;
    if (anon) {
      const { data: clientes } = await ctx.supabase.from("clientes").select("nome").eq("escritorio_id", ctx.escritorio.id).limit(2000);
      conteudo = anonimizar(bruto, (clientes ?? []).map((c) => c.nome)).texto;
    }
    // guarda o arquivo original só quando não anonimizado (o anonimizado vale pelo texto)
    let caminho: string | null = null;
    if (!anon) {
      caminho = `${ctx.escritorio.id}/biblioteca/${randomUUID()}-${arquivo.name.replace(/[^\w.\-]+/g, "_").slice(-80)}`;
      const up = await ctx.supabase.storage.from("documentos").upload(caminho, arquivo, { contentType: arquivo.type || "application/octet-stream" });
      if (up.error) caminho = null;
    }
    const { data: doc, error } = await ctx.supabase
      .from("biblioteca_documentos")
      .insert({
        escritorio_id: ctx.escritorio.id,
        nome: texto(fd, "nome") || arquivo.name,
        arquivo_caminho: caminho,
        tipo_peca: textoOuNulo(fd, "tipo_peca"),
        area: textoOuNulo(fd, "area"),
        texto: conteudo,
        anonimizado: anon,
        criado_por: ctx.user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    docId = doc.id;

    const trechos = dividirEmTrechos(conteudo);
    let embeddings: number[][] | null = null;
    if (embeddingsDisponiveis()) {
      try {
        embeddings = await gerarEmbeddings(trechos, "document");
      } catch {
        embeddings = null;
      }
    }
    const { error: e2 } = await ctx.supabase.from("biblioteca_trechos").insert(
      trechos.map((t, i) => ({ escritorio_id: ctx.escritorio.id, documento_id: docId, ordem: i, conteudo: t, embedding: embeddings ? JSON.stringify(embeddings[i]) : null })),
    );
    if (e2) throw e2;
    await ctx.supabase.from("biblioteca_documentos").update({ status_indexacao: embeddings ? "indexado" : "sem_embedding" }).eq("id", docId);
  } catch (e) {
    voltarCom("/modelos-ia", { erro: erroAmigavel(e) });
  }
  revalidatePath("/modelos-ia");
  voltarCom(`/modelos-ia/${docId}`, { ok: "Modelo adicionado. Confira a anonimização no texto abaixo." });
}

export async function excluirModeloIa(fd: FormData) {
  const ctx = await obterContexto();
  const { data: d } = await ctx.supabase.from("biblioteca_documentos").select("id, arquivo_caminho").eq("id", texto(fd, "id")).single();
  if (d?.arquivo_caminho) await ctx.supabase.storage.from("documentos").remove([d.arquivo_caminho]);
  await ctx.supabase.from("biblioteca_documentos").delete().eq("id", texto(fd, "id"));
  revalidatePath("/modelos-ia");
  voltarCom("/modelos-ia", { ok: "Modelo excluído com seus trechos indexados." });
}

function termosBusca(t: string): string {
  const pare = new Set(["sobre", "para", "como", "contra", "entre", "quando", "porque", "pelos", "pelas", "deste", "desta", "nesse", "nessa", "cliente", "pedido"]);
  const palavras = [...new Set(t.toLowerCase().normalize("NFC").match(/[a-zà-ÿ]{5,}/g) ?? [])].filter((p) => !pare.has(p)).slice(0, 12);
  return palavras.join(" or ");
}

export async function criarRascunho(fd: FormData) {
  const ctx = await obterContexto();
  if (!ctx.temModulo("M8")) voltarCom("/modelos-ia", { erro: "Disponível no plano Pro." });
  const briefing = texto(fd, "briefing");
  if (briefing.length < 30) voltarCom("/modelos-ia", { erro: "Descreva o caso com mais detalhes (mínimo de 30 caracteres)." });

  type Trecho = { id: string; documento_id: string; conteudo: string; similaridade: number };
  let trechos: Trecho[] = [];
  if (embeddingsDisponiveis()) {
    try {
      const [vetor] = await gerarEmbeddings([briefing], "query");
      const { data } = await ctx.supabase.rpc("buscar_trechos", { e: ctx.escritorio.id, consulta: JSON.stringify(vetor), limite: 8 });
      trechos = (data ?? []) as Trecho[];
    } catch {
      trechos = [];
    }
  }
  if (!trechos.length) {
    const termos = termosBusca(briefing);
    if (termos) {
      const { data } = await ctx.supabase.rpc("buscar_trechos_texto", { e: ctx.escritorio.id, consulta: termos, limite: 8 });
      trechos = (data ?? []) as Trecho[];
    }
  }
  const ids = [...new Set(trechos.map((t) => t.documento_id))];
  const { data: docs } = ids.length ? await ctx.supabase.from("biblioteca_documentos").select("id, nome").in("id", ids) : { data: [] };
  const nome = (id: string) => docs?.find((d) => d.id === id)?.nome ?? "modelo";

  let textoGerado: string;
  try {
    textoGerado = await gerarRascunho(briefing, trechos.map((t) => ({ nome: nome(t.documento_id), conteudo: t.conteudo })));
  } catch (e) {
    voltarCom("/modelos-ia", { erro: erroAmigavel(e) });
  }
  if (!/^RASCUNHO/i.test(textoGerado)) textoGerado = `RASCUNHO. Revisar integralmente antes de usar.\n\n${textoGerado}`;
  const { data: r, error } = await ctx.supabase
    .from("rascunhos")
    .insert({ escritorio_id: ctx.escritorio.id, processo_id: textoOuNulo(fd, "processo_id"), titulo: texto(fd, "titulo") || "Rascunho", briefing, texto: textoGerado, documentos_base: ids, criado_por: ctx.user.id })
    .select("id")
    .single();
  if (error) voltarCom("/modelos-ia", { erro: erroAmigavel(error) });
  redirect(`/modelos-ia/rascunhos/${r.id}`);
}

export async function salvarRascunho(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  await ctx.supabase.from("rascunhos").update({ texto: texto(fd, "texto"), titulo: texto(fd, "titulo") }).eq("id", id);
  revalidatePath(`/modelos-ia/rascunhos/${id}`);
  voltarCom(`/modelos-ia/rascunhos/${id}`, { ok: "Rascunho salvo." });
}

export async function excluirRascunho(fd: FormData) {
  const ctx = await obterContexto();
  await ctx.supabase.from("rascunhos").delete().eq("id", texto(fd, "id"));
  revalidatePath("/modelos-ia");
  voltarCom("/modelos-ia", { ok: "Rascunho excluído." });
}
