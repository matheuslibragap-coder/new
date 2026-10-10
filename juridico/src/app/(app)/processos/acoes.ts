"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { obterContexto } from "@/lib/contexto";
import { erroAmigavel, texto, textoOuNulo, voltarCom } from "@/lib/acoes";
import { validarCnj } from "@/lib/cnj";
import { identificarTribunal } from "@/lib/tribunais";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { sincronizarProcesso } from "@/lib/sincronizar-processo";

function camposEditaveis(fd: FormData) {
  const polo = textoOuNulo(fd, "polo");
  return {
    cliente_id: textoOuNulo(fd, "cliente_id"),
    comarca: textoOuNulo(fd, "comarca"),
    vara: textoOuNulo(fd, "vara"),
    area: textoOuNulo(fd, "area"),
    polo: polo && ["ativo", "passivo", "terceiro", "outro"].includes(polo) ? polo : null,
    rito: texto(fd, "rito") || "civel_cpc",
    observacoes: textoOuNulo(fd, "observacoes"),
  };
}

export async function criarProcesso(fd: FormData) {
  const ctx = await obterContexto();
  const v = validarCnj(texto(fd, "numero_cnj"));
  if (!v.valido) voltarCom("/processos/novo", { erro: v.erro });
  const trib = identificarTribunal(v.numero.segmento, v.numero.tribunal);
  const monitorado = fd.get("monitorado") === "on";
  let id: string;
  try {
    const { data, error } = await ctx.supabase
      .from("processos")
      .insert({
        ...camposEditaveis(fd),
        escritorio_id: ctx.escritorio.id,
        numero_cnj: v.numero.digitos,
        tribunal_sigla: trib?.sigla ?? null,
        datajud_alias: trib?.alias ?? null,
        uf: trib?.uf ?? ctx.escritorio.uf,
        monitorado,
        datajud_status: trib?.alias ? "pendente" : "manual",
      })
      .select("id, escritorio_id, numero_cnj, datajud_alias, datajud_status")
      .single();
    if (error) throw error;
    id = data.id;
    // Importação inicial: o processo acabou de ser inserido pelo próprio usuário (RLS validou)
    if (data.datajud_alias) {
      try {
        const r = await sincronizarProcesso(criarClienteAdmin(), data, { notificar: false });
        revalidatePath("/processos");
        voltarCom(`/processos/${id}`, {
          ok: r.status === "ok" ? "Processo cadastrado e importado do DataJud." : "Processo cadastrado. Não foi localizado no DataJud: você pode registrar andamentos manualmente.",
        });
      } catch (e) {
        unstable_rethrow(e);
        voltarCom(`/processos/${id}`, { erro: `Processo cadastrado, mas a consulta ao DataJud falhou: ${(e as Error).message}. O job diário tentará novamente.` });
      }
    }
  } catch (e) {
    voltarCom("/processos/novo", { erro: erroAmigavel(e) });
  }
  revalidatePath("/processos");
  voltarCom(`/processos/${id}`, { ok: "Processo cadastrado. Este tribunal não está na API Pública do DataJud; registre os andamentos manualmente." });
}

export async function atualizarProcesso(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  try {
    const { error } = await ctx.supabase
      .from("processos")
      .update({ ...camposEditaveis(fd), monitorado: fd.get("monitorado") === "on", ativo: fd.get("ativo") === "on" })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    voltarCom(`/processos/${id}`, { erro: erroAmigavel(e) });
  }
  revalidatePath(`/processos/${id}`);
  voltarCom(`/processos/${id}`, { ok: "Processo atualizado." });
}

export async function ressincronizar(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  const { data: p } = await ctx.supabase.from("processos").select("id, escritorio_id, numero_cnj, datajud_alias, datajud_status, datajud_ultima_consulta").eq("id", id).single();
  if (!p) voltarCom("/processos", { erro: "Processo não encontrado." });
  if (p.datajud_ultima_consulta && Date.now() - new Date(p.datajud_ultima_consulta).getTime() < 5 * 60 * 1000) {
    voltarCom(`/processos/${id}`, { erro: "Consulta feita há menos de 5 minutos. Aguarde para consultar de novo." });
  }
  let msg: string;
  try {
    const r = await sincronizarProcesso(criarClienteAdmin(), p, { notificar: false });
    msg = r.status === "ok" ? `Consulta concluída. ${r.novos} andamento(s) novo(s).` : r.status === "nao_encontrado" ? "Processo não localizado no DataJud." : "Tribunal sem endpoint no DataJud.";
  } catch (e) {
    voltarCom(`/processos/${id}`, { erro: (e as Error).message });
  }
  revalidatePath(`/processos/${id}`);
  voltarCom(`/processos/${id}`, { ok: msg });
}

export async function adicionarAndamento(fd: FormData) {
  const ctx = await obterContexto();
  const processoId = texto(fd, "processo_id");
  const data = texto(fd, "data");
  const descricao = texto(fd, "descricao");
  if (!data || !descricao) voltarCom(`/processos/${processoId}`, { erro: "Informe data e descrição do andamento." });
  const { error } = await ctx.supabase.from("andamentos").insert({
    escritorio_id: ctx.escritorio.id,
    processo_id: processoId,
    data_hora: `${data}T12:00:00-03:00`,
    nome: descricao,
    origem: "manual",
    hash: `manual-${randomUUID()}`,
    criado_por: ctx.user.id,
    visto_em: new Date().toISOString(),
  });
  if (error) voltarCom(`/processos/${processoId}`, { erro: erroAmigavel(error) });
  revalidatePath(`/processos/${processoId}`);
  voltarCom(`/processos/${processoId}`, { ok: "Andamento registrado." });
}

export async function excluirAndamentoManual(fd: FormData) {
  const ctx = await obterContexto();
  const processoId = texto(fd, "processo_id");
  await ctx.supabase.from("andamentos").delete().eq("id", texto(fd, "id")).eq("origem", "manual");
  revalidatePath(`/processos/${processoId}`);
  voltarCom(`/processos/${processoId}`, { ok: "Andamento excluído." });
}

export async function excluirProcesso(fd: FormData) {
  const ctx = await obterContexto();
  const id = texto(fd, "id");
  const { error } = await ctx.supabase.from("processos").delete().eq("id", id);
  if (error) voltarCom(`/processos/${id}`, { erro: erroAmigavel(error) });
  revalidatePath("/processos");
  voltarCom("/processos", { ok: "Processo excluído com seus andamentos, prazos e mensagens." });
}


export async function marcarAndamentosVistos(processoId: string) {
  const ctx = await obterContexto();
  await ctx.supabase.from("andamentos").update({ visto_em: new Date().toISOString() }).eq("processo_id", processoId).is("visto_em", null);
}
