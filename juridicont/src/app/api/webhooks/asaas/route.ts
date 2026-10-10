import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { criarClienteAdmin } from "@/lib/supabase/admin";

type EventoAsaas = {
  id?: string;
  event: string;
  payment?: { id: string; subscription?: string | null; customer?: string; status?: string };
  subscription?: { id: string; customer?: string };
};

function tokenValido(recebido: string | null) {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

const UM_MES_MS = 1000 * 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  if (!tokenValido(request.headers.get("asaas-access-token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const evento = (await request.json().catch(() => null)) as EventoAsaas | null;
  if (!evento?.event) return NextResponse.json({ ok: true });

  const admin = criarClienteAdmin();
  const assinaturaId = evento.payment?.subscription ?? evento.subscription?.id ?? null;
  const clienteId = evento.payment?.customer ?? evento.subscription?.customer ?? null;

  // Localiza a conta pela assinatura (ou pelo cliente)
  let consulta = admin.from("contas").select("*");
  if (assinaturaId) consulta = consulta.eq("asaas_subscription_id", assinaturaId);
  else if (clienteId) consulta = consulta.eq("asaas_customer_id", clienteId);
  else return NextResponse.json({ ok: true });
  const { data: conta } = await consulta.maybeSingle();

  // Idempotência: cada evento é processado uma vez
  const { error: erroEvento } = await admin.from("pagamentos_eventos").insert({
    evento_id: evento.id ?? null,
    evento: evento.event,
    pagamento_id: evento.payment?.id ?? null,
    user_id: conta?.user_id ?? null,
    payload: evento,
  });
  if (erroEvento?.code === "23505") return NextResponse.json({ ok: true, duplicado: true });

  if (!conta) return NextResponse.json({ ok: true, ignorado: "conta não encontrada" });

  switch (evento.event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED": {
      if (!evento.payment) break;
      // Cartão dispara CONFIRMED e depois RECEIVED: o ciclo só renova uma vez por cobrança
      const { error } = await admin
        .from("ciclos_pagos")
        .insert({ pagamento_id: evento.payment.id, user_id: conta.user_id });
      if (error?.code === "23505") {
        await admin.from("contas").update({ assinatura_status: "ativa" }).eq("user_id", conta.user_id);
        break;
      }
      const agora = new Date();
      await admin
        .from("contas")
        .update({
          plano: conta.plano_pendente ?? conta.plano,
          plano_pendente: null,
          assinatura_status: "ativa",
          ciclo_inicio: agora.toISOString(),
          ciclo_fim: new Date(agora.getTime() + UM_MES_MS).toISOString(),
          checagens_usadas: 0,
          posts_usados: 0,
          auditorias_usadas: 0,
        })
        .eq("user_id", conta.user_id);
      break;
    }
    case "PAYMENT_OVERDUE":
      if (conta.assinatura_status === "ativa") {
        await admin.from("contas").update({ assinatura_status: "atrasada" }).eq("user_id", conta.user_id);
      }
      break;
    case "PAYMENT_REFUNDED":
    case "PAYMENT_CHARGEBACK_REQUESTED":
      await admin
        .from("contas")
        .update({ plano: "gratuito", assinatura_status: "cancelada", plano_pendente: null })
        .eq("user_id", conta.user_id);
      break;
    case "SUBSCRIPTION_DELETED":
    case "SUBSCRIPTION_INACTIVATED":
      await admin
        .from("contas")
        .update({ assinatura_status: "cancelada", plano_pendente: null })
        .eq("user_id", conta.user_id);
      break;
  }

  return NextResponse.json({ ok: true });
}
