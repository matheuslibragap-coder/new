import { NextResponse } from "next/server";
import { z } from "zod";
import { usuarioDaApi, obterConta } from "@/lib/sessao";
import { consumirCota, devolverCota, mensagemCotaEsgotada } from "@/lib/cota";
import { carregarRegrasAtivas } from "@/lib/regras";
import { gerarPostConforme, postParaTexto, TIPO_CHECAGEM_DO_FORMATO } from "@/lib/ia/gerador";
import { ErroIA, MODELO } from "@/lib/ia/cliente";
import { ErroValidacao } from "@/lib/ia/validacao";
import { registrarDescartes, registrarLog } from "@/lib/logs";

export const maxDuration = 300;

const entradaZ = z.object({
  area: z.string().trim().min(1).max(80),
  formato: z.enum(["carrossel", "legenda", "reels"]),
  tema: z.string().trim().max(300).default(""),
});

export async function POST(request: Request) {
  const sessao = await usuarioDaApi();
  if (!sessao) return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  const { supabase, user, perfil } = sessao;

  const parse = entradaZ.safeParse(await request.json().catch(() => null));
  if (!parse.success) return NextResponse.json({ erro: "Preencha área e formato." }, { status: 400 });
  const { area, formato, tema } = parse.data;

  const { plano } = await obterConta(supabase);
  if (formato === "reels" && !plano.permite_reels) {
    return NextResponse.json({ erro: "Roteiros de reels estão disponíveis no plano Pro." }, { status: 403 });
  }

  const cota = await consumirCota(supabase, "post");
  if (!cota.ok) return NextResponse.json({ erro: mensagemCotaEsgotada("post", cota), cota }, { status: 402 });

  try {
    const base = await carregarRegrasAtivas(supabase);
    const geracao = await gerarPostConforme({ base, perfil, area, formato, tema });

    if (!geracao.ok) {
      await devolverCota(supabase, "post");
      if (geracao.ultimaChecagem) await registrarDescartes(supabase, user.id, geracao.ultimaChecagem.descartados);
      await registrarLog(supabase, user.id, "post_descartado", {
        formato,
        tentativas: geracao.tentativas,
        achados: geracao.ultimaChecagem?.resultado.achados ?? [],
      });
      return NextResponse.json(
        {
          erro: "Não conseguimos gerar um post sem riscos identificados para esse tema. Nenhuma cota foi descontada. Tente outro tema.",
        },
        { status: 422 },
      );
    }

    await registrarDescartes(supabase, user.id, geracao.checagem.descartados);
    const { data: checagem } = await supabase
      .from("checagens")
      .insert({
        user_id: user.id,
        origem: "gerador",
        tipo_conteudo: TIPO_CHECAGEM_DO_FORMATO[formato],
        texto: postParaTexto(geracao.post),
        classificacao: geracao.checagem.resultado.classificacao_geral,
        resultado: geracao.checagem.resultado,
        regras_versao: base.versao,
        regras_snapshot: base.snapshot,
        modelo: MODELO,
      })
      .select("id")
      .single();

    const { data: salvo, error } = await supabase
      .from("posts_gerados")
      .insert({
        user_id: user.id,
        formato,
        tema: tema || null,
        conteudo: geracao.post,
        checagem_id: checagem?.id ?? null,
        tentativas: geracao.tentativas,
      })
      .select("id")
      .single();
    if (error) throw new Error("Falha ao salvar o post: " + error.message);

    return NextResponse.json({ id: salvo.id, post: geracao.post, checagem_id: checagem?.id ?? null, cota });
  } catch (erro) {
    await devolverCota(supabase, "post");
    if (erro instanceof ErroIA || erro instanceof ErroValidacao) {
      return NextResponse.json({ erro: erro.message }, { status: 502 });
    }
    console.error("[gerar]", erro);
    return NextResponse.json({ erro: "Erro inesperado. Tente novamente." }, { status: 500 });
  }
}
