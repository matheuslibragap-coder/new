import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { avisar } from "@/lib/notificar";

export const dynamic = "force-dynamic";

/**
 * Webhook da ZapSign. Configure no painel da ZapSign a URL
 * {APP}/api/webhooks/zapsign?token={ZAPSIGN_WEBHOOK_TOKEN}.
 */
export async function POST(req: Request) {
  const esperado = process.env.ZAPSIGN_WEBHOOK_TOKEN ?? "";
  const recebido = new URL(req.url).searchParams.get("token") ?? "";
  if (!esperado || recebido.length !== esperado.length || !timingSafeEqual(Buffer.from(recebido), Buffer.from(esperado))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const ev = (await req.json().catch(() => null)) as { event_type?: string; token?: string; status?: string; external_id?: string } | null;
  if (!ev?.token) return NextResponse.json({ ok: true });
  const admin = criarClienteAdmin();
  const { data: doc } = await admin.from("documentos_gerados").select("id, escritorio_id, titulo, assinatura_status").eq("assinatura_id_externo", ev.token).maybeSingle();
  if (!doc) return NextResponse.json({ ok: true, ignorado: true });

  let status: string | null = null;
  if (ev.event_type === "doc_signed" || ev.status === "signed") status = "assinado";
  else if (ev.event_type === "doc_refused" || ev.status === "refused") status = "recusado";
  if (status && status !== doc.assinatura_status) {
    await admin.from("documentos_gerados").update({ assinatura_status: status }).eq("id", doc.id);
    await avisar(admin, {
      escritorioId: doc.escritorio_id,
      tipo: "assinatura",
      titulo: status === "assinado" ? `Documento assinado: ${doc.titulo}` : `Assinatura recusada: ${doc.titulo}`,
      corpo: status === "assinado" ? "Todas as assinaturas foram concluídas." : "Um signatário recusou a assinatura.",
      link: `/documentos/${doc.id}`,
    });
  }
  return NextResponse.json({ ok: true });
}
