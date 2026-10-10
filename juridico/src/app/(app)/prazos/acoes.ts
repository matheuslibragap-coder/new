"use server";
import { revalidatePath } from "next/cache";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { calcularComBanco } from "@/lib/prazos/servidor";
import type { TipoEvento } from "@/lib/prazos/motor";

export async function salvarPrazoCalculado(fd: FormData) {
  const ctx = await obterContexto();
  const processoId = textoOuNulo(fd, "processo_id");
  const params = {
    dataEvento: texto(fd, "data"),
    tipoEvento: texto(fd, "evento") as TipoEvento,
    dias: Number(texto(fd, "dias")),
    emDobro: fd.get("dobro") === "on" || texto(fd, "dobro") === "1",
    regraCodigo: texto(fd, "regra"),
    contexto: { tribunal: textoOuNulo(fd, "tribunal"), uf: textoOuNulo(fd, "uf"), comarca: textoOuNulo(fd, "comarca") },
  };
  let id: string;
  try {
    // recalcula no servidor: nunca confiar na data enviada pelo navegador
    const { resultado } = await calcularComBanco(ctx.supabase, params);
    const { data, error } = await ctx.supabase
      .from("tarefas")
      .insert({
        escritorio_id: ctx.escritorio.id,
        processo_id: processoId,
        titulo: texto(fd, "titulo") || `Prazo de ${params.dias} dias`,
        descricao: textoOuNulo(fd, "descricao"),
        tipo: "prazo",
        data_evento: params.dataEvento,
        tipo_evento: params.tipoEvento,
        dias: params.dias,
        regra_codigo: params.regraCodigo,
        em_dobro: params.emDobro,
        data_vencimento: resultado.dataFinal,
        memoria: { ...resultado, contexto: params.contexto },
        responsavel_id: ctx.user.id,
        origem: textoOuNulo(fd, "origem") ?? "calculadora",
        criado_por: ctx.user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
    const intimacaoId = textoOuNulo(fd, "intimacao_id");
    if (intimacaoId) await ctx.supabase.from("intimacoes").update({ status: "confirmada", tarefa_id: id }).eq("id", intimacaoId);
  } catch (e) {
    voltarCom("/prazos/calculadora", { erro: erroAmigavel(e) });
  }
  revalidatePath("/prazos");
  voltarCom(`/prazos/${id}`, { ok: "Prazo salvo. Alertas em D-5, D-2 e D-0." });
}

export async function criarTarefaSimples(fd: FormData) {
  const ctx = await obterContexto();
  const { error } = await ctx.supabase.from("tarefas").insert({
    escritorio_id: ctx.escritorio.id,
    processo_id: textoOuNulo(fd, "processo_id"),
    titulo: texto(fd, "titulo"),
    descricao: textoOuNulo(fd, "descricao"),
    tipo: texto(fd, "tipo") === "prazo" ? "prazo" : "tarefa",
    data_vencimento: texto(fd, "data_vencimento"),
    responsavel_id: ctx.user.id,
    origem: "manual",
    criado_por: ctx.user.id,
  });
  if (error) voltarCom("/prazos", { erro: erroAmigavel(error) });
  revalidatePath("/prazos");
  voltarCom("/prazos", { ok: "Tarefa criada." });
}

export async function alterarStatusTarefa(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  const status = texto(fd, "status");
  if (!["aberta", "concluida", "cancelada"].includes(status)) voltarCom(`/prazos/${id}`, { erro: "Status inválido." });
  await ctx.supabase.from("tarefas").update({ status, concluida_em: status === "concluida" ? new Date().toISOString() : null }).eq("id", id);
  revalidatePath("/prazos");
  voltarCom(texto(fd, "voltar") || `/prazos/${id}`, { ok: "Prazo atualizado." });
}

export async function editarTarefa(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  const { error } = await ctx.supabase
    .from("tarefas")
    .update({ titulo: texto(fd, "titulo"), descricao: textoOuNulo(fd, "descricao"), data_vencimento: texto(fd, "data_vencimento"), alertas_enviados: [] })
    .eq("id", id);
  if (error) voltarCom(`/prazos/${id}`, { erro: erroAmigavel(error) });
  revalidatePath(`/prazos/${id}`);
  voltarCom(`/prazos/${id}`, { ok: "Prazo alterado pelo(a) advogado(a). Alertas reprogramados." });
}

export async function excluirTarefa(fd: FormData) {
  const ctx = await obterContexto();
  await ctx.supabase.from("tarefas").delete().eq("id", texto(fd, "id"));
  revalidatePath("/prazos");
  voltarCom("/prazos", { ok: "Excluído." });
}
