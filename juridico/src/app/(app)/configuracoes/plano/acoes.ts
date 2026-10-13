"use server";
import { redirect } from "next/navigation";
import { obterContexto } from "@/lib/contexto";
import { texto, voltarCom } from "@/lib/acoes";
import { asaas, montarReferencia } from "@/lib/pagamentos/asaas";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export async function assinarPlano(fd: FormData) {
  const ctx = await obterContexto();
  if (ctx.membro.papel !== "titular") voltarCom("/configuracoes/plano", { erro: "Somente o titular pode alterar o plano." });
  const codigo = texto(fd, "plano");
  const { data: plano } = await ctx.supabase.from("planos").select("*").eq("codigo", codigo).eq("ativo", true).single();
  if (!plano) voltarCom("/configuracoes/plano", { erro: "Plano inválido." });
  if (!ctx.escritorio.documento) voltarCom("/configuracoes/escritorio", { erro: "Informe o CPF ou CNPJ do escritório para a cobrança." });

  let link: string | null = null;
  try {
    const admin = criarClienteAdmin();
    const clienteId = await asaas.garantirCliente({ nome: ctx.escritorio.nome, documento: ctx.escritorio.documento, email: ctx.user.email ?? "", idExistente: ctx.escritorio.gateway_cliente_id });
    const ref = montarReferencia(ctx.escritorio.id, plano.codigo);
    const descricao = `Plano ${plano.nome}`;
    if (ctx.escritorio.gateway_assinatura_id && ctx.escritorio.assinatura_status !== "cancelada") {
      await asaas.alterarAssinatura(ctx.escritorio.gateway_assinatura_id, { valorCentavos: plano.preco_centavos, descricao, referencia: ref });
      link = await asaas.linkPagamentoPendente(ctx.escritorio.gateway_assinatura_id);
      await admin.from("escritorios").update({ gateway_cliente_id: clienteId }).eq("id", ctx.escritorio.id);
    } else {
      const a = await asaas.criarAssinatura({ clienteId, valorCentavos: plano.preco_centavos, descricao, referencia: ref });
      link = a.linkPagamento;
      await admin.from("escritorios").update({ gateway_cliente_id: clienteId, gateway_assinatura_id: a.assinaturaId }).eq("id", ctx.escritorio.id);
    }
  } catch (e) {
    voltarCom("/configuracoes/plano", { erro: `Não foi possível iniciar o pagamento: ${(e as Error).message}` });
  }
  if (link) redirect(link);
  voltarCom("/configuracoes/plano", { ok: "Assinatura atualizada. A mudança de plano vale após a confirmação do pagamento." });
}

export async function cancelarAssinatura() {
  const ctx = await obterContexto();
  if (ctx.membro.papel !== "titular") voltarCom("/configuracoes/plano", { erro: "Somente o titular pode cancelar." });
  if (!ctx.escritorio.gateway_assinatura_id) voltarCom("/configuracoes/plano", { erro: "Não há assinatura ativa." });
  try {
    await asaas.cancelarAssinatura(ctx.escritorio.gateway_assinatura_id);
    await criarClienteAdmin().from("escritorios").update({ assinatura_status: "cancelada" }).eq("id", ctx.escritorio.id);
  } catch (e) {
    voltarCom("/configuracoes/plano", { erro: (e as Error).message });
  }
  voltarCom("/configuracoes/plano", { ok: "Assinatura cancelada. Seus dados continuam acessíveis e podem ser exportados." });
}
