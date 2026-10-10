import { NextResponse } from "next/server";
import { z } from "zod";
import { usuarioDaApi } from "@/lib/sessao";
import { consumirCota, devolverCota, mensagemCotaEsgotada } from "@/lib/cota";
import { carregarRegrasAtivas } from "@/lib/regras";
import { analisarConteudo } from "@/lib/ia/checador";
import { ErroIA } from "@/lib/ia/cliente";
import { ErroValidacao } from "@/lib/ia/validacao";
import { montarRelatorio, type ItemAuditado } from "@/lib/auditoria";
import { registrarDescartes } from "@/lib/logs";

export const maxDuration = 180;

const entradaZ = z.object({
  bio: z.string().trim().max(500),
  posts: z.array(z.string().trim().max(4000)).max(5),
});

export async function POST(request: Request) {
  const sessao = await usuarioDaApi();
  if (!sessao) return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  const { supabase, user } = sessao;

  const parse = entradaZ.safeParse(await request.json().catch(() => null));
  if (!parse.success) {
    return NextResponse.json({ erro: "Confira os campos: bio até 500 caracteres e até 5 posts." }, { status: 400 });
  }
  const bio = parse.data.bio;
  const posts = parse.data.posts.filter(Boolean);
  if (!bio && posts.length === 0) {
    return NextResponse.json({ erro: "Cole a bio ou pelo menos um post." }, { status: 400 });
  }

  const cota = await consumirCota(supabase, "auditoria");
  if (!cota.ok) return NextResponse.json({ erro: mensagemCotaEsgotada("auditoria", cota), cota }, { status: 402 });

  try {
    const base = await carregarRegrasAtivas(supabase);
    const entradas = [
      ...(bio ? [{ rotulo: "Bio", texto: bio, tipo: "bio" as const }] : []),
      ...posts.map((texto, i) => ({ rotulo: `Post ${i + 1}`, texto, tipo: "legenda" as const })),
    ];
    const analises = await Promise.all(entradas.map((e) => analisarConteudo({ base, tipo: e.tipo, texto: e.texto })));
    await registrarDescartes(
      supabase,
      user.id,
      analises.flatMap((a) => a.descartados),
    );

    const itens: ItemAuditado[] = entradas.map((e, i) => ({
      rotulo: e.rotulo,
      texto: e.texto,
      resultado: analises[i].resultado,
    }));
    const relatorio = montarRelatorio(itens, base.snapshot);

    const { data: salvo, error } = await supabase
      .from("auditorias")
      .insert({
        user_id: user.id,
        entrada: { bio, posts },
        resultado: relatorio,
        nota: relatorio.nota,
        regras_versao: base.versao,
      })
      .select("id")
      .single();
    if (error) throw new Error("Falha ao salvar a auditoria: " + error.message);

    return NextResponse.json({ id: salvo.id, relatorio });
  } catch (erro) {
    await devolverCota(supabase, "auditoria");
    if (erro instanceof ErroIA || erro instanceof ErroValidacao) {
      return NextResponse.json({ erro: erro.message }, { status: 502 });
    }
    console.error("[auditoria]", erro);
    return NextResponse.json({ erro: "Erro inesperado. Tente novamente." }, { status: 500 });
  }
}
