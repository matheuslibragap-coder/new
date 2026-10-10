import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Dados enviados pela API comercial da Anthropic não são usados para treinar modelos.
export const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
type Esforco = "low" | "medium" | "high" | "xhigh" | "max";
const ESFORCO = (process.env.ANTHROPIC_EFFORT as Esforco | undefined) || "medium";

let cliente: Anthropic | null = null;
function obterCliente() {
  if (!cliente) cliente = new Anthropic({ maxRetries: 2 });
  return cliente;
}

export class ErroIA extends Error {
  constructor(
    message: string,
    public codigo: "recusa" | "truncado" | "json_invalido" | "api",
  ) {
    super(message);
  }
}

type Conteudo = Anthropic.Beta.Messages.BetaContentBlockParam[];

/**
 * Faz uma chamada ao modelo exigindo resposta em JSON conforme o schema.
 * O prompt de sistema (que contém a base de regras) é marcado para cache.
 */
export async function chamarJSON(opcoes: {
  sistema: string;
  conteudo: Conteudo;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<unknown> {
  let resposta: Anthropic.Beta.Messages.BetaMessage;
  try {
    resposta = await obterCliente().beta.messages.create({
      model: MODELO,
      max_tokens: opcoes.maxTokens ?? 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: opcoes.sistema, cache_control: { type: "ephemeral" } }],
      output_config: { effort: ESFORCO, format: { type: "json_schema", schema: opcoes.schema } },
      messages: [{ role: "user", content: opcoes.conteudo }],
    });
  } catch (erro) {
    if (erro instanceof Anthropic.RateLimitError) {
      throw new ErroIA("Muitas requisições ao serviço de IA. Tente novamente em instantes.", "api");
    }
    if (erro instanceof Anthropic.APIError) {
      console.error("[ia] erro da API", erro.status, erro.message);
      throw new ErroIA("O serviço de IA está indisponível no momento.", "api");
    }
    throw erro;
  }

  if (resposta.stop_reason === "refusal") {
    throw new ErroIA("A IA não conseguiu analisar este conteúdo.", "recusa");
  }
  if (resposta.stop_reason === "max_tokens") {
    throw new ErroIA("A resposta da IA veio incompleta. Tente um conteúdo menor.", "truncado");
  }

  const texto = resposta.content
    .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErroIA("A resposta da IA não veio em JSON válido.", "json_invalido");
  }
}
