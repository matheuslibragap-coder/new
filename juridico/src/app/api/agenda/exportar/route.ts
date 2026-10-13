import { obterContexto } from "@/lib/contexto";
import { icsDoEscritorio } from "@/lib/agenda-ics";

export async function GET() {
  const ctx = await obterContexto();
  const ics = await icsDoEscritorio(ctx.supabase, ctx.escritorio.id, ctx.escritorio.nome);
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="agenda.ics"' } });
}
