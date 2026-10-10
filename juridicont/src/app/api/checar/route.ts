import { NextResponse } from "next/server";
import { usuarioDaApi, obterConta } from "@/lib/sessao";
import { consumirCota, devolverCota, mensagemCotaEsgotada } from "@/lib/cota";
import { carregarRegrasAtivas } from "@/lib/regras";
import { analisarConteudo, type ImagemEntrada } from "@/lib/ia/checador";
import { ErroIA, MODELO } from "@/lib/ia/cliente";
import { ErroValidacao } from "@/lib/ia/validacao";
import { registrarDescartes, registrarLog } from "@/lib/logs";
import { TIPOS_CONTEUDO, type TipoConteudo } from "@/lib/tipos";

export const maxDuration = 120;

const TAMANHO_MAX_IMAGEM = 4 * 1024 * 1024;
const TAMANHO_MAX_TEXTO = 8000;
const TIPOS_IMAGEM = { "image/jpeg": "jpg", "image/png": "png" } as const;

export async function POST(request: Request) {
  const sessao = await usuarioDaApi();
  if (!sessao) return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
  const { supabase, user } = sessao;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });

  const tipo = String(form.get("tipo") ?? "") as TipoConteudo;
  const texto = String(form.get("texto") ?? "").trim();
  const arquivo = form.get("imagem");
  const imagemArquivo = arquivo instanceof File && arquivo.size > 0 ? arquivo : null;

  if (!(tipo in TIPOS_CONTEUDO)) return NextResponse.json({ erro: "Escolha o tipo de conteúdo." }, { status: 400 });
  if (!texto && !imagemArquivo) {
    return NextResponse.json({ erro: "Cole um texto ou envie uma imagem." }, { status: 400 });
  }
  if (texto.length > TAMANHO_MAX_TEXTO) {
    return NextResponse.json({ erro: `O texto pode ter até ${TAMANHO_MAX_TEXTO} caracteres.` }, { status: 400 });
  }
  if (imagemArquivo) {
    if (!(imagemArquivo.type in TIPOS_IMAGEM)) {
      return NextResponse.json({ erro: "A imagem deve estar em JPG ou PNG." }, { status: 400 });
    }
    if (imagemArquivo.size > TAMANHO_MAX_IMAGEM) {
      return NextResponse.json({ erro: "A imagem pode ter até 4 MB." }, { status: 400 });
    }
  }

  const { plano } = await obterConta(supabase);
  if (tipo === "anuncio_pago" && !plano.permite_anuncio) {
    return NextResponse.json({ erro: "A checagem de anúncios pagos está disponível no plano Pro." }, { status: 403 });
  }

  const cota = await consumirCota(supabase, "checagem");
  if (!cota.ok) {
    return NextResponse.json({ erro: mensagemCotaEsgotada("checagem", cota), cota }, { status: 402 });
  }

  try {
    let imagem: ImagemEntrada | null = null;
    let imagemPath: string | null = null;
    if (imagemArquivo) {
      const bytes = Buffer.from(await imagemArquivo.arrayBuffer());
      const mediaType = imagemArquivo.type as keyof typeof TIPOS_IMAGEM;
      imagem = { base64: bytes.toString("base64"), mediaType };
      imagemPath = `${user.id}/${crypto.randomUUID()}.${TIPOS_IMAGEM[mediaType]}`;
      const { error } = await supabase.storage
        .from("conteudos")
        .upload(imagemPath, bytes, { contentType: mediaType, upsert: false });
      if (error) {
        console.error("[checar] falha ao salvar imagem", error.message);
        imagemPath = null;
      }
    }

    const base = await carregarRegrasAtivas(supabase);
    const { resultado, descartados } = await analisarConteudo({ base, tipo, texto, imagem });
    await registrarDescartes(supabase, user.id, descartados);

    const { data: salvo, error } = await supabase
      .from("checagens")
      .insert({
        user_id: user.id,
        origem: "checador",
        tipo_conteudo: tipo,
        texto,
        imagem_path: imagemPath,
        classificacao: resultado.classificacao_geral,
        resultado,
        regras_versao: base.versao,
        regras_snapshot: base.snapshot,
        modelo: MODELO,
      })
      .select("id, criado_em")
      .single();
    if (error) throw new Error("Falha ao salvar no histórico: " + error.message);

    return NextResponse.json({ id: salvo.id, criado_em: salvo.criado_em, resultado, regras: base.snapshot, cota });
  } catch (erro) {
    await devolverCota(supabase, "checagem");
    if (erro instanceof ErroValidacao) {
      await registrarLog(supabase, user.id, "json_invalido", { mensagem: erro.message, detalhe: erro.detalhe });
      return NextResponse.json({ erro: "Não foi possível validar a análise. Tente novamente." }, { status: 502 });
    }
    if (erro instanceof ErroIA) {
      return NextResponse.json({ erro: erro.message }, { status: 502 });
    }
    console.error("[checar]", erro);
    return NextResponse.json({ erro: "Erro inesperado. Tente novamente." }, { status: 500 });
  }
}
