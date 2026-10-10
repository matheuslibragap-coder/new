import "server-only";

/**
 * Embeddings para o banco de modelos (M8). Provedor: Voyage AI (recomendado pela Anthropic).
 * Sem VOYAGE_API_KEY, o sistema usa busca textual do Postgres (português).
 */
export const DIMENSOES = 1024;

export function embeddingsDisponiveis(): boolean {
  return !!process.env.VOYAGE_API_KEY;
}

export async function gerarEmbeddings(textos: string[], tipo: "document" | "query"): Promise<number[][]> {
  const chave = process.env.VOYAGE_API_KEY;
  if (!chave) throw new Error("VOYAGE_API_KEY não configurada.");
  const saida: number[][] = [];
  for (let i = 0; i < textos.length; i += 64) {
    const resp = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: textos.slice(i, i + 64), model: process.env.VOYAGE_MODEL || "voyage-3.5", input_type: tipo, output_dimension: DIMENSOES }),
    });
    if (!resp.ok) throw new Error(`Falha ao gerar embeddings (${resp.status}).`);
    const json = (await resp.json()) as { data: { embedding: number[]; index: number }[] };
    saida.push(...json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding));
  }
  return saida;
}

/** Divide texto em trechos de ~1.500 caracteres, respeitando parágrafos. */
export function dividirEmTrechos(texto: string, tamanho = 1500): string[] {
  const paragrafos = texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const trechos: string[] = [];
  let atual = "";
  for (const p of paragrafos) {
    if ((atual + "\n\n" + p).length > tamanho && atual) {
      trechos.push(atual);
      atual = "";
    }
    if (p.length > tamanho) {
      for (let i = 0; i < p.length; i += tamanho) trechos.push(p.slice(i, i + tamanho));
    } else {
      atual = atual ? `${atual}\n\n${p}` : p;
    }
  }
  if (atual) trechos.push(atual);
  return trechos;
}
