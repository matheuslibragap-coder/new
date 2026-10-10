import { z } from "zod";
import type { Achado, RegraSnapshot, ResultadoChecagem, Severidade } from "@/lib/tipos";
import { CODIGO_NAO_CATALOGADO, TEXTO_NAO_CATALOGADO } from "@/lib/textos";

const ORDEM: Record<Severidade, number> = { verde: 0, amarelo: 1, vermelho: 2 };

export function piorSeveridade(lista: Severidade[]): Severidade {
  return lista.reduce<Severidade>((pior, s) => (ORDEM[s] > ORDEM[pior] ? s : pior), "verde");
}

/** JSON Schema enviado ao modelo (structured outputs). Os códigos válidos vão como enum. */
export function esquemaJsonChecagem(codigos: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "classificacao_geral",
      "achados",
      "versao_reescrita_completa",
      "texto_extraido_imagem",
      "elementos_visuais",
    ],
    properties: {
      classificacao_geral: { type: "string", enum: ["verde", "amarelo", "vermelho"] },
      achados: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["regra_codigo", "trecho", "severidade", "explicacao", "sugestao_reescrita"],
          properties: {
            regra_codigo: { type: "string", enum: [...codigos, CODIGO_NAO_CATALOGADO] },
            trecho: { type: "string" },
            severidade: { type: "string", enum: ["verde", "amarelo", "vermelho"] },
            explicacao: { type: "string" },
            sugestao_reescrita: { type: "string" },
          },
        },
      },
      versao_reescrita_completa: { anyOf: [{ type: "string" }, { type: "null" }] },
      texto_extraido_imagem: { anyOf: [{ type: "string" }, { type: "null" }] },
      elementos_visuais: { type: "array", items: { type: "string" } },
    },
  };
}

const severidadeZ = z.enum(["verde", "amarelo", "vermelho"]);

/** Validação no backend. Não confia no enum do schema: revalida tudo. */
export const respostaModeloZ = z.object({
  classificacao_geral: severidadeZ,
  achados: z.array(
    z.object({
      regra_codigo: z.string(),
      trecho: z.string(),
      severidade: severidadeZ,
      explicacao: z.string(),
      sugestao_reescrita: z.string(),
    }),
  ),
  versao_reescrita_completa: z.string().nullable(),
  texto_extraido_imagem: z.string().nullable().optional(),
  elementos_visuais: z.array(z.string()).optional(),
});

export class ErroValidacao extends Error {
  constructor(
    message: string,
    public detalhe: unknown,
  ) {
    super(message);
  }
}

/** Remove travessões vindos do modelo (a interface não usa travessão). */
export function sanitizarTexto(texto: string) {
  return texto
    .replace(/\s*[—―]\s*/g, ", ")
    .replace(/\s+–\s+/g, ", ")
    .replace(/,\s*,/g, ",")
    .trim();
}

export type AchadoDescartado = { motivo: string; achado: unknown };

export type ResultadoValidacao = {
  resultado: ResultadoChecagem;
  descartados: AchadoDescartado[];
};

/**
 * Valida a resposta do modelo contra a base de regras:
 * - descarta achados com regra_codigo inexistente (e devolve para log);
 * - aplica a severidade padrão da regra cadastrada;
 * - achados NAO_CATALOGADO viram sempre amarelo, sem citar dispositivo;
 * - recalcula a classificação geral a partir dos achados aceitos.
 */
export function validarResposta(bruto: unknown, regras: RegraSnapshot[]): ResultadoValidacao {
  const parse = respostaModeloZ.safeParse(bruto);
  if (!parse.success) {
    throw new ErroValidacao("Resposta da IA fora do formato esperado", parse.error.issues);
  }
  const resp = parse.data;
  const porCodigo = new Map(regras.map((r) => [r.codigo, r]));
  const descartados: AchadoDescartado[] = [];
  const achados: Achado[] = [];

  for (const a of resp.achados) {
    const base = {
      trecho: a.trecho.trim(),
      explicacao: sanitizarTexto(a.explicacao),
      sugestao_reescrita: sanitizarTexto(a.sugestao_reescrita),
    };
    if (a.regra_codigo === CODIGO_NAO_CATALOGADO) {
      if (a.severidade === "verde") continue;
      const explicacao = base.explicacao.startsWith(TEXTO_NAO_CATALOGADO)
        ? base.explicacao
        : `${TEXTO_NAO_CATALOGADO} ${base.explicacao}`.trim();
      achados.push({ ...base, regra_codigo: CODIGO_NAO_CATALOGADO, severidade: "amarelo", explicacao });
      continue;
    }
    const regra = porCodigo.get(a.regra_codigo);
    if (!regra) {
      descartados.push({ motivo: "regra_codigo inexistente na base", achado: a });
      continue;
    }
    if (a.severidade === "verde") {
      // Achado "verde" não indica risco: ignorado.
      continue;
    }
    achados.push({ ...base, regra_codigo: regra.codigo, severidade: regra.severidade_padrao });
  }

  let classificacao = piorSeveridade(achados.map((a) => a.severidade));

  // O modelo viu risco, mas nenhum achado sobreviveu à validação: não pode virar verde.
  if (classificacao === "verde" && resp.classificacao_geral !== "verde") {
    achados.push({
      regra_codigo: CODIGO_NAO_CATALOGADO,
      trecho: "",
      severidade: "amarelo",
      explicacao: TEXTO_NAO_CATALOGADO,
      sugestao_reescrita: "",
    });
    classificacao = "amarelo";
  }

  const reescrita =
    classificacao === "verde" || !resp.versao_reescrita_completa?.trim()
      ? null
      : sanitizarTexto(resp.versao_reescrita_completa);

  return {
    resultado: {
      classificacao_geral: classificacao,
      achados,
      versao_reescrita_completa: reescrita,
      texto_extraido_imagem: resp.texto_extraido_imagem?.trim() || null,
      elementos_visuais: (resp.elementos_visuais ?? []).map(sanitizarTexto).filter(Boolean),
    },
    descartados,
  };
}

export type Segmento = { texto: string; severidade: Severidade | null };

/** Divide o texto original em segmentos, marcando os trechos citados nos achados. */
export function segmentarTexto(texto: string, achados: Pick<Achado, "trecho" | "severidade">[]): Segmento[] {
  const marcas: { ini: number; fim: number; severidade: Severidade }[] = [];
  const minusculo = texto.toLowerCase();
  for (const a of achados) {
    const trecho = a.trecho.trim();
    if (trecho.length < 2) continue;
    let pos = minusculo.indexOf(trecho.toLowerCase());
    while (pos !== -1) {
      marcas.push({ ini: pos, fim: pos + trecho.length, severidade: a.severidade });
      pos = minusculo.indexOf(trecho.toLowerCase(), pos + trecho.length);
    }
  }
  if (marcas.length === 0) return [{ texto, severidade: null }];

  // Severidade por caractere (a pior vence quando há sobreposição)
  const sev: (Severidade | null)[] = new Array(texto.length).fill(null);
  for (const m of marcas) {
    for (let i = m.ini; i < m.fim; i++) {
      const atual = sev[i];
      if (!atual || ORDEM[m.severidade] > ORDEM[atual]) sev[i] = m.severidade;
    }
  }
  const segmentos: Segmento[] = [];
  let inicio = 0;
  for (let i = 1; i <= texto.length; i++) {
    if (i === texto.length || sev[i] !== sev[inicio]) {
      segmentos.push({ texto: texto.slice(inicio, i), severidade: sev[inicio] });
      inicio = i;
    }
  }
  return segmentos;
}
