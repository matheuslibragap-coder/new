import { obterContexto } from "@/lib/contexto";
import { gerarPdfDocumento } from "@/lib/documento-pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: d } = await ctx.supabase.from("documentos_gerados").select("titulo, conteudo").eq("id", id).maybeSingle();
  if (!d) return new Response("não encontrado", { status: 404 });
  const pdf = await gerarPdfDocumento(d.titulo, d.conteudo, ctx.escritorio.nome);
  return new Response(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="documento-${id.slice(0, 8)}.pdf"` } });
}
