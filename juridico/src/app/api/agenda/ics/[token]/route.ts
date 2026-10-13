import { criarClienteAdmin } from "@/lib/supabase/admin";
import { icsDoEscritorio } from "@/lib/agenda-ics";

export const dynamic = "force-dynamic";

/** Link privado de assinatura do calendário (o token é a credencial). */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) return new Response("não encontrado", { status: 404 });
  const admin = criarClienteAdmin();
  const { data: t } = await admin.from("calendario_tokens").select("user_id, escritorio_id, escritorios(nome)").eq("token", token).maybeSingle();
  if (!t) return new Response("não encontrado", { status: 404 });
  const { data: membro } = await admin.from("membros").select("ativo").eq("user_id", t.user_id).eq("escritorio_id", t.escritorio_id).maybeSingle();
  if (!membro?.ativo) return new Response("não encontrado", { status: 404 });
  const ics = await icsDoEscritorio(admin, t.escritorio_id, (t.escritorios as unknown as { nome: string }).nome);
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=900" } });
}
