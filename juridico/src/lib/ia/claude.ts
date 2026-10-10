import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Integração com a API da Anthropic. Usada só nos módulos que exigem IA (M4 e M8).
 * Os textos enviados não são usados para treinar modelos (política comercial da API);
 * mesmo assim, enviamos o mínimo necessário.
 */

const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

let cliente: Anthropic | null = null;
function obterCliente(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY não configurada.");
  cliente ??= new Anthropic();
  return cliente;
}

export class ErroIA extends Error {}

function textoDaResposta(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

async function gerar(params: { system: string; prompt: string; maxTokens: number; effort: "low" | "medium" | "high" }): Promise<string> {
  const client = obterCliente();
  try {
    const stream = client.beta.messages.stream({
      model: MODELO,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
      output_config: { effort: params.effort },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new ErroIA("A IA não conseguiu gerar este texto. Escreva a mensagem manualmente.");
    const texto = textoDaResposta(msg.content);
    if (!texto) throw new ErroIA("A IA retornou um texto vazio.");
    if (msg.stop_reason === "max_tokens") return `${texto}\n\n[Texto interrompido por limite de tamanho. Revise e complete.]`;
    return texto;
  } catch (e) {
    if (e instanceof ErroIA) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new ErroIA("Muitas solicitações à IA agora. Tente em instantes.");
    if (e instanceof Anthropic.AuthenticationError) throw new ErroIA("Chave da API de IA inválida.");
    if (e instanceof Anthropic.APIError) throw new ErroIA(`Serviço de IA indisponível (${e.status ?? "conexão"}).`);
    throw e;
  }
}

const SISTEMA_TRADUTOR = `Você ajuda advogados brasileiros a explicar andamentos processuais a clientes leigos.
Escreva uma mensagem curta de WhatsApp em português do Brasil, em tom sóbrio, cordial e claro, com no máximo 6 frases, contendo:
1. o que aconteceu no processo, em linguagem simples;
2. se o cliente precisa fazer algo agora (se não precisar, diga isso);
3. o próximo passo provável, descrito com cautela ("em regra", "normalmente"), sem prometer resultado, prazo exato ou êxito.
Regras obrigatórias:
- Não inclua dados de outras partes (nomes, CPF, endereços, valores de terceiros) além do estritamente necessário.
- Não invente fatos que não estejam no andamento. Se o andamento for técnico ou ambíguo, diga que o(a) advogado(a) vai analisar e explicar.
- Não use travessão (—). Não use jargão sem explicar. Não use emojis.
- Não assine a mensagem e não inclua saudação com nome (o advogado completa).
Responda apenas com o texto da mensagem.`;

export async function traduzirAndamento(dados: { andamento: string; data: string; classe?: string | null; area?: string | null; polo?: string | null; primeiroNomeCliente?: string | null }): Promise<string> {
  const prompt = [
    `Andamento: ${dados.andamento}`,
    `Data: ${dados.data}`,
    dados.classe ? `Tipo de processo: ${dados.classe}` : null,
    dados.area ? `Área: ${dados.area}` : null,
    dados.polo ? `O cliente está no polo ${dados.polo}.` : null,
    dados.primeiroNomeCliente ? `Primeiro nome do cliente (pode usar na saudação): ${dados.primeiroNomeCliente}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const texto = await gerar({ system: SISTEMA_TRADUTOR, prompt, maxTokens: 2000, effort: "low" });
  return texto.replace(/—/g, ",");
}

const SISTEMA_RASCUNHO = `Você auxilia um(a) advogado(a) brasileiro(a) a redigir o RASCUNHO de uma peça processual.
Use como referência de estilo, estrutura e vocabulário os trechos de modelos do próprio escritório fornecidos.
Regras obrigatórias:
- Comece o texto com a linha "RASCUNHO. Revisar integralmente antes de usar."
- Nunca invente jurisprudência, números de processo, súmulas, temas ou ementas. Onde caberia uma citação, escreva [INSERIR PRECEDENTE VERIFICADO].
- Cite apenas dispositivos de lei de que tenha segurança; na dúvida, escreva [CONFERIR DISPOSITIVO].
- Dados que não estejam no briefing ficam entre colchetes, por exemplo [NOME DO RÉU], [VALOR].
- Não use travessão (—).
- Português do Brasil, linguagem técnica e clara.`;

export async function gerarRascunho(briefing: string, trechos: { nome: string; conteudo: string }[]): Promise<string> {
  const contexto = trechos.length
    ? trechos.map((t, i) => `<modelo indice="${i + 1}" nome="${t.nome.replace(/"/g, "'")}">\n${t.conteudo}\n</modelo>`).join("\n\n")
    : "(nenhum modelo do escritório encontrado; use estrutura usual de peças processuais brasileiras)";
  const prompt = `<modelos_do_escritorio>\n${contexto}\n</modelos_do_escritorio>\n\n<briefing>\n${briefing}\n</briefing>\n\nRedija o rascunho.`;
  const texto = await gerar({ system: SISTEMA_RASCUNHO, prompt, maxTokens: 32000, effort: "medium" });
  return texto.replace(/—/g, ",");
}
