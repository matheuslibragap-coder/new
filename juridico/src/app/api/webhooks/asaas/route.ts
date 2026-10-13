import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { asaas, lerReferencia } from "@/lib/pagamentos/asaas";

export const dynamic = "force-dynamic";

function tokenValido(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido), b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Evento = {
  id?: string;
  event: string;
  payment?: { id: string; subscription?: string; externalReference?: string; value?: number; status?: string };
  subscription?: { id: string; externalReference?: string };
};

/** Webhook do Asaas: confirma pagamento, aplica plano, marca inadimplência e cancelamento. */
export async function POST(req: Request) {
  if (!tokenValido(req.headers.get("asaas-access-token"))) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  const ev = (await req.json().catch(() => null)) as Evento | null;
  if (!ev?.event) return NextResponse.json({ erro: "payload inválido" }, { status: 400 });
  const admin = criarClienteAdmin();

  const assinaturaId = ev.payment?.subscription ?? ev.subscription?.id ?? null;
  let ref = lerReferencia(ev.subscription?.externalReference ?? ev.payment?.externalReference ?? null);
  if (!ref && assinaturaId) {
    try {
      ref = lerReferencia(await asaas.obterReferenciaAssinatura(assinaturaId));
    } catch {
      /* segue tentando pelo id da assinatura */
    }
  }
  let escritorioId = ref?.escritorioId ?? null;
  if (!escritorioId && assinaturaId) {
    const { data } = await admin.from("escritorios").select("id").eq("gateway_assinatura_id", assinaturaId).maybeSingle();
    escritorioId = data?.id ?? null;
  }

  // idempotência: o mesmo evento não é processado duas vezes
  const { error: dup } = await admin.from("pagamentos_eventos").insert({
    escritorio_id: escritorioId,
    gateway: "asaas",
    evento: ev.event,
    id_externo: ev.id ?? ev.payment?.id ?? ev.subscription?.id ?? null,
    valor_centavos: ev.payment?.value ? Math.round(ev.payment.value * 100) : null,
    payload: ev,
  });
  if (dup?.code === "23505") return NextResponse.json({ ok: true, duplicado: true });
  if (!escritorioId) return NextResponse.json({ ok: true, ignorado: "escritório não identificado" });

  switch (ev.event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED": {
      const atualizacao: Record<string, unknown> = { assinatura_status: "ativa" };
      if (ref?.plano) {
        const { data: plano } = await admin.from("planos").select("codigo").eq("codigo", ref.plano).maybeSingle();
        if (plano) atualizacao.plano_codigo = plano.codigo;
      }
      if (assinaturaId) atualizacao.gateway_assinatura_id = assinaturaId;
      await admin.from("escritorios").update(atualizacao).eq("id", escritorioId);
      break;
    }
    case "PAYMENT_OVERDUE":
      await admin.from("escritorios").update({ assinatura_status: "inadimplente" }).eq("id", escritorioId).neq("assinatura_status", "cancelada");
      break;
    case "SUBSCRIPTION_DELETED":
    case "SUBSCRIPTION_INACTIVATED":
      await admin.from("escritorios").update({ assinatura_status: "cancelada" }).eq("id", escritorioId);
      break;
    default:
      break;
  }
  return NextResponse.json({ ok: true });
}
