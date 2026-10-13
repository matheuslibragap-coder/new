"use server";
import { redirect } from "next/navigation";
import { obterContexto } from "@/lib/contexto";
import { texto, voltarCom } from "@/lib/acoes";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { asaas } from "@/lib/pagamentos/asaas";

async function apagarArquivos(admin: ReturnType<typeof criarClienteAdmin>, prefixo: string) {
  // percorre as pastas do escritório no storage
  const pilha = [prefixo];
  while (pilha.length) {
    const pasta = pilha.pop()!;
    const { data } = await admin.storage.from("documentos").list(pasta, { limit: 1000 });
    const arquivos: string[] = [];
    for (const item of data ?? []) {
      if (item.id) arquivos.push(`${pasta}/${item.name}`);
      else pilha.push(`${pasta}/${item.name}`);
    }
    if (arquivos.length) await admin.storage.from("documentos").remove(arquivos);
  }
}

/** Exclusão completa (titular): escritório, dados, arquivos, assinatura e contas sem outro vínculo. */
export async function excluirTudo(fd: FormData) {
  const ctx = await obterContexto();
  if (ctx.membro.papel !== "titular") voltarCom("/configuracoes/privacidade", { erro: "Somente o titular pode excluir o escritório." });
  if (texto(fd, "confirmacao") !== ctx.escritorio.nome) voltarCom("/configuracoes/privacidade", { erro: "O nome digitado não confere." });
  const admin = criarClienteAdmin();
  const id = ctx.escritorio.id;
  if (ctx.escritorio.gateway_assinatura_id && ctx.escritorio.assinatura_status !== "cancelada") {
    await asaas.cancelarAssinatura(ctx.escritorio.gateway_assinatura_id).catch(() => undefined);
  }
  const { data: membros } = await admin.from("membros").select("user_id").eq("escritorio_id", id);
  await apagarArquivos(admin, id);
  const { error } = await admin.from("escritorios").delete().eq("id", id); // cascade em todas as tabelas
  if (error) voltarCom("/configuracoes/privacidade", { erro: "Falha ao excluir. Tente novamente ou contate o suporte." });
  for (const m of membros ?? []) {
    const { count } = await admin.from("membros").select("user_id", { count: "exact", head: true }).eq("user_id", m.user_id);
    if (!count) await admin.auth.admin.deleteUser(m.user_id);
  }
  await ctx.supabase.auth.signOut();
  redirect("/?excluido=1");
}

export async function sairDoEscritorio() {
  const ctx = await obterContexto();
  if (ctx.membro.papel === "titular") voltarCom("/configuracoes/privacidade", { erro: "O titular deve excluir o escritório." });
  const admin = criarClienteAdmin();
  await admin.from("membros").delete().eq("escritorio_id", ctx.escritorio.id).eq("user_id", ctx.user.id);
  const { count } = await admin.from("membros").select("user_id", { count: "exact", head: true }).eq("user_id", ctx.user.id);
  if (!count) await admin.auth.admin.deleteUser(ctx.user.id);
  await ctx.supabase.auth.signOut();
  redirect("/");
}
