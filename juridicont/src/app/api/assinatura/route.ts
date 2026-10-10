import { NextResponse } from "next/server";
import { z } from "zod";
import { usuarioDaApi, obterConta } from "@/lib/sessao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import {
  atualizarClienteAsaas,
  cancelarAssinaturaAsaas,
  criarAssinaturaAsaas,
  criarClienteAsaas,
  documentoValido,
  ErroAsaas,
  limparDocumento,
  linkPrimeiraCobranca,
} from "@/lib/asaas";
import type { Plano } from "@/lib/tipos";

const entradaZ = z.object({
  plano: z.enum(["essencial", "pro"]),
  forma: z.enum(["PIX", "CREDIT_CARD"]),
  nome: z.string().trim().min(3).max(120),
  documento: z.string().trim(),
});

/** Cria a assinatura no Asaas e devolve o link de pagamento. */
export async function POST(request: Request) {
  const sessao = await usuarioDaApi();
  if (!sessao) return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  const { supabase, user } = sessao;

  const parse = entradaZ.safeParse(await request.json().catch(() => null));
  if (!parse.success) return NextResponse.json({ erro: "Preencha todos os campos." }, { status: 400 });
  const { plano: codigoPlano, forma, nome } = parse.data;
  const documento = limparDocumento(parse.data.documento);
  if (!documentoValido(documento)) return NextResponse.json({ erro: "CPF ou CNPJ inválido." }, { status: 400 });

  const { conta } = await obterConta(supabase);
  if (conta.assinatura_status === "ativa" && conta.plano !== "gratuito") {
    return NextResponse.json(
      { erro: "Você já tem uma assinatura ativa. Cancele a atual para trocar de plano." },
      { status: 409 },
    );
  }

  const { data: plano } = await supabase.from("planos").select("*").eq("codigo", codigoPlano).single<Plano>();
  if (!plano) return NextResponse.json({ erro: "Plano inválido." }, { status: 400 });

  const admin = criarClienteAdmin();
  try {
    let clienteId = conta.asaas_customer_id;
    const dadosCliente = { nome, cpfCnpj: documento, email: user.email ?? "" };
    if (clienteId) {
      await atualizarClienteAsaas(clienteId, dadosCliente);
    } else {
      clienteId = (await criarClienteAsaas({ ...dadosCliente, userId: user.id })).id;
    }

    // Assinatura anterior ainda pendente de pagamento: cancela para não gerar cobrança duplicada
    if (conta.asaas_subscription_id && conta.assinatura_status !== "ativa") {
      await cancelarAssinaturaAsaas(conta.asaas_subscription_id).catch((e) =>
        console.warn("[assinatura] não foi possível cancelar a anterior", e),
      );
    }

    const assinatura = await criarAssinaturaAsaas({
      cliente: clienteId,
      forma,
      valorCentavos: plano.preco_centavos,
      descricao: `Juridicont, plano ${plano.nome}`,
      referencia: `${user.id}:${plano.codigo}`,
    });

    await admin
      .from("contas")
      .update({
        asaas_customer_id: clienteId,
        asaas_subscription_id: assinatura.id,
        plano_pendente: plano.codigo,
        assinatura_status: conta.plano === "gratuito" ? "pendente" : conta.assinatura_status,
      })
      .eq("user_id", user.id);

    const link = await linkPrimeiraCobranca(assinatura.id);
    return NextResponse.json({ link });
  } catch (erro) {
    if (erro instanceof ErroAsaas) {
      console.error("[assinatura] Asaas", erro.status, JSON.stringify(erro.corpo));
      return NextResponse.json({ erro: `Pagamento: ${erro.message}` }, { status: 502 });
    }
    console.error("[assinatura]", erro);
    return NextResponse.json({ erro: "Erro inesperado. Tente novamente." }, { status: 500 });
  }
}

/** Cancela a assinatura. O plano continua até o fim do ciclo já pago. */
export async function DELETE() {
  const sessao = await usuarioDaApi();
  if (!sessao) return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  const { supabase, user } = sessao;
  const { conta } = await obterConta(supabase);
  if (!conta.asaas_subscription_id) return NextResponse.json({ erro: "Nenhuma assinatura encontrada." }, { status: 404 });

  try {
    await cancelarAssinaturaAsaas(conta.asaas_subscription_id);
  } catch (erro) {
    if (!(erro instanceof ErroAsaas && erro.status === 404)) {
      console.error("[assinatura] cancelar", erro);
      return NextResponse.json({ erro: "Não foi possível cancelar agora. Tente novamente." }, { status: 502 });
    }
  }
  await criarClienteAdmin()
    .from("contas")
    .update({ assinatura_status: "cancelada", plano_pendente: null })
    .eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
