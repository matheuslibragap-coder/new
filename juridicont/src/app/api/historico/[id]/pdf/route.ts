import { NextResponse } from "next/server";
import { usuarioDaApi } from "@/lib/sessao";
import { gerarPdfRegistro } from "@/lib/pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await usuarioDaApi();
  if (!sessao) return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  const { supabase, perfil } = sessao;

  const { data: c } = await supabase.from("checagens").select("*").eq("id", id).maybeSingle();
  if (!c) return NextResponse.json({ erro: "Checagem não encontrada." }, { status: 404 });

  const bytes = await gerarPdfRegistro({
    id: c.id,
    criado_em: c.criado_em,
    tipo_conteudo: c.tipo_conteudo,
    texto: c.texto,
    tem_imagem: Boolean(c.imagem_path),
    classificacao: c.classificacao,
    resultado: c.resultado,
    regras_versao: c.regras_versao,
    regras_snapshot: c.regras_snapshot,
    modelo: c.modelo,
    usuario: { nome: perfil.nome_profissional, email: perfil.email },
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="juridicont-checagem-${c.id.slice(0, 8)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
