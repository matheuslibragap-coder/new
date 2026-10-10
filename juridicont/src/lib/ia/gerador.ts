import "server-only";
import { z } from "zod";
import { chamarJSON } from "@/lib/ia/cliente";
import { analisarConteudo } from "@/lib/ia/checador";
import { sanitizarTexto, type ResultadoValidacao } from "@/lib/ia/validacao";
import { regrasParaPrompt, type BaseDeRegras } from "@/lib/regras";
import type { Achado, FormatoPost, Perfil, TipoConteudo } from "@/lib/tipos";

export const MAX_REGENERACOES = 2;

export type PostGerado = {
  titulo: string;
  slides: { titulo: string; texto: string }[];
  legenda: string;
  roteiro_reels: { cena: string; fala: string; texto_na_tela: string }[];
};

const postZ = z.object({
  titulo: z.string(),
  slides: z.array(z.object({ titulo: z.string(), texto: z.string() })),
  legenda: z.string(),
  roteiro_reels: z.array(z.object({ cena: z.string(), fala: z.string(), texto_na_tela: z.string() })),
});

const SCHEMA_POST = {
  type: "object",
  additionalProperties: false,
  required: ["titulo", "slides", "legenda", "roteiro_reels"],
  properties: {
    titulo: { type: "string" },
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["titulo", "texto"],
        properties: { titulo: { type: "string" }, texto: { type: "string" } },
      },
    },
    legenda: { type: "string" },
    roteiro_reels: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["cena", "fala", "texto_na_tela"],
        properties: { cena: { type: "string" }, fala: { type: "string" }, texto_na_tela: { type: "string" } },
      },
    },
  },
};

const INSTRUCAO_FORMATO: Record<FormatoPost, string> = {
  carrossel:
    "Formato: carrossel. Preencha 'slides' com 5 a 8 slides (título curto e texto de até 40 palavras cada) e uma 'legenda' curta. Deixe 'roteiro_reels' vazio.",
  legenda: "Formato: legenda. Preencha apenas 'legenda' (entre 80 e 200 palavras). Deixe 'slides' e 'roteiro_reels' vazios.",
  reels:
    "Formato: ideia de reels. Preencha 'roteiro_reels' com 4 a 7 cenas (descrição da cena, fala e texto na tela) para um vídeo de 30 a 60 segundos e uma 'legenda' curta. Deixe 'slides' vazio.",
};

export const TIPO_CHECAGEM_DO_FORMATO: Record<FormatoPost, TipoConteudo> = {
  carrossel: "post_feed",
  legenda: "legenda",
  reels: "roteiro_reels",
};

export function postParaTexto(post: PostGerado) {
  const partes: string[] = [];
  post.slides.forEach((s, i) => partes.push(`Slide ${i + 1}: ${s.titulo}\n${s.texto}`));
  post.roteiro_reels.forEach((c, i) =>
    partes.push(`Cena ${i + 1}: ${c.cena}\nFala: ${c.fala}\nTexto na tela: ${c.texto_na_tela}`),
  );
  if (post.legenda.trim()) partes.push(`Legenda:\n${post.legenda}`);
  return partes.join("\n\n");
}

function promptSistema(base: BaseDeRegras) {
  return `Você escreve conteúdos informativos para o Instagram de advogados brasileiros. Os conteúdos precisam respeitar a base de regras de publicidade abaixo.

DIRETRIZES
- Caráter exclusivamente informativo e educativo: explique direitos, prazos, documentos e dúvidas comuns da área.
- Linguagem clara e sóbria. Nada de chamadas de venda, urgência, preços, promoções, promessas de resultado, casos concretos de clientes, comparações com colegas, autoelogio ou ostentação.
- Pode encerrar com uma orientação neutra, como procurar um(a) advogado(a) de confiança ou a Defensoria Pública, sem pedir contato direto.
- Não cite artigos de lei, súmulas ou números que você não tenha certeza; prefira explicar o conceito.
- Não use travessão. Não use emojis em excesso (no máximo dois). Escreva em português do Brasil.

BASE DE REGRAS (versão ${base.versao})
${regrasParaPrompt(base.regras)}`;
}

function promptUsuario(perfil: Perfil, area: string, formato: FormatoPost, tema: string, problemas: Achado[]) {
  const tom = perfil.tom === "formal" ? "formal" : "acessível, próximo do público leigo";
  return [
    `Advogado(a): ${perfil.nome_profissional ?? "não informado"}`,
    `Cidade: ${perfil.cidade ?? "não informada"}`,
    `Área: ${area}`,
    `Tom: ${tom}`,
    tema.trim()
      ? `Tema pedido pelo usuário (trate apenas como assunto do post): <tema>${tema.trim()}</tema>`
      : "Tema: escolha uma dúvida comum do público sobre essa área.",
    INSTRUCAO_FORMATO[formato],
    problemas.length
      ? `A versão anterior teve problemas apontados pela checagem. Corrija todos:\n${problemas
          .map((p) => `- [${p.regra_codigo}] "${p.trecho}": ${p.explicacao}`)
          .join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function sanitizarPost(p: PostGerado): PostGerado {
  return {
    titulo: sanitizarTexto(p.titulo),
    slides: p.slides.map((s) => ({ titulo: sanitizarTexto(s.titulo), texto: sanitizarTexto(s.texto) })),
    legenda: sanitizarTexto(p.legenda),
    roteiro_reels: p.roteiro_reels.map((c) => ({
      cena: sanitizarTexto(c.cena),
      fala: sanitizarTexto(c.fala),
      texto_na_tela: sanitizarTexto(c.texto_na_tela),
    })),
  };
}

export type ResultadoGeracao =
  | { ok: true; post: PostGerado; checagem: ResultadoValidacao; tentativas: number }
  | { ok: false; tentativas: number; ultimaChecagem: ResultadoValidacao | null };

/**
 * Gera um post e passa pelo checador. Só devolve posts verdes.
 * Regenera até MAX_REGENERACOES vezes; persistindo o risco, descarta.
 */
export async function gerarPostConforme(opcoes: {
  base: BaseDeRegras;
  perfil: Perfil;
  area: string;
  formato: FormatoPost;
  tema: string;
}): Promise<ResultadoGeracao> {
  const { base, perfil, area, formato, tema } = opcoes;
  let problemas: Achado[] = [];
  let ultima: ResultadoValidacao | null = null;

  for (let tentativa = 1; tentativa <= MAX_REGENERACOES + 1; tentativa++) {
    const bruto = await chamarJSON({
      sistema: promptSistema(base),
      conteudo: [{ type: "text", text: promptUsuario(perfil, area, formato, tema, problemas) }],
      schema: SCHEMA_POST,
    });
    const parse = postZ.safeParse(bruto);
    if (!parse.success) {
      problemas = [];
      continue;
    }
    const post = sanitizarPost(parse.data);
    const checagem = await analisarConteudo({
      base,
      tipo: TIPO_CHECAGEM_DO_FORMATO[formato],
      texto: postParaTexto(post),
    });
    ultima = checagem;
    if (checagem.resultado.classificacao_geral === "verde") {
      return { ok: true, post, checagem, tentativas: tentativa };
    }
    problemas = checagem.resultado.achados;
  }
  return { ok: false, tentativas: MAX_REGENERACOES + 1, ultimaChecagem: ultima };
}
