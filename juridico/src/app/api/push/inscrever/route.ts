import { NextResponse } from "next/server";
import { obterContexto } from "@/lib/contexto";

export async function POST(req: Request) {
  const ctx = await obterContexto();
  const corpo = (await req.json().catch(() => null)) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;
  if (!corpo?.endpoint || !corpo.keys?.p256dh || !corpo.keys?.auth) return NextResponse.json({ erro: "inscrição inválida" }, { status: 400 });
  const { error } = await ctx.supabase.from("push_inscricoes").upsert(
    { escritorio_id: ctx.escritorio.id, user_id: ctx.user.id, endpoint: corpo.endpoint, p256dh: corpo.keys.p256dh, auth: corpo.keys.auth },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ erro: "falha ao salvar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
