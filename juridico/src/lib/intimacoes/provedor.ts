import "server-only";

/**
 * M10: fonte de intimações isolada atrás de uma interface, para trocar de fornecedor
 * (DJEN/Comunica PJe do CNJ ou provedor pago de captura por OAB) sem reescrever o módulo.
 */
export type IntimacaoCapturada = {
  idExterno: string;
  numeroCnj: string | null;
  tribunal: string | null;
  orgao: string | null;
  tipoComunicacao: string | null;
  dataDisponibilizacao: string; // AAAA-MM-DD
  texto: string;
  link: string | null;
};

export interface ProvedorIntimacoes {
  nome: string;
  buscar(params: { oabNumero: string; oabUf: string; inicio: string; fim: string }): Promise<IntimacaoCapturada[]>;
}

/**
 * Diário de Justiça Eletrônico Nacional (DJEN) via API do Comunica PJe.
 * [CONFERIR] endpoint, parâmetros e limites de uso na documentação oficial do CNJ
 * (https://comunicaapi.pje.jus.br/swagger-ui) antes de colocar em produção.
 */
export const djen: ProvedorIntimacoes = {
  nome: "djen",
  async buscar({ oabNumero, oabUf, inicio, fim }) {
    const base = process.env.DJEN_BASE_URL || "https://comunicaapi.pje.jus.br/api/v1";
    const out: IntimacaoCapturada[] = [];
    for (let pagina = 1; pagina <= 20; pagina++) {
      const url = new URL(`${base}/comunicacao`);
      url.searchParams.set("numeroOab", oabNumero.replace(/\D/g, ""));
      url.searchParams.set("ufOab", oabUf.toUpperCase());
      url.searchParams.set("dataDisponibilizacaoInicio", inicio);
      url.searchParams.set("dataDisponibilizacaoFim", fim);
      url.searchParams.set("pagina", String(pagina));
      url.searchParams.set("itensPorPagina", "100");
      const resp = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (resp.status === 429) throw new Error("DJEN: limite de requisições atingido.");
      if (!resp.ok) throw new Error(`DJEN: erro ${resp.status}.`);
      const json = (await resp.json()) as { items?: Record<string, unknown>[]; count?: number };
      const itens = json.items ?? [];
      for (const it of itens) {
        const s = (k: string) => (it[k] === undefined || it[k] === null ? null : String(it[k]));
        const data = (s("data_disponibilizacao") || s("dataDisponibilizacao") || "").slice(0, 10);
        if (!data) continue;
        out.push({
          idExterno: s("id") || s("hash") || `${s("numero_processo")}-${data}`,
          numeroCnj: (s("numero_processo") || s("numeroprocessocommascara") || "").replace(/\D/g, "") || null,
          tribunal: s("siglaTribunal"),
          orgao: s("nomeOrgao"),
          tipoComunicacao: s("tipoComunicacao"),
          dataDisponibilizacao: data,
          texto: (s("texto") || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
          link: s("link"),
        });
      }
      if (itens.length < 100) break;
    }
    return out;
  },
};

export function obterProvedor(nome: string): ProvedorIntimacoes {
  switch (nome) {
    case "djen":
      return djen;
    default:
      throw new Error(`Provedor de intimações desconhecido: ${nome}`);
  }
}

/** Sugere o número de dias a partir do texto ("prazo de 15 dias"); padrão 15 [CONFERIR]. */
export function diasSugeridos(texto: string): { dias: number; encontrado: boolean } {
  const m = texto.match(/prazo\s+(?:comum\s+)?de\s+(\d{1,3})\s*\(?[a-zçãé\s]*\)?\s*dias/i);
  if (m) return { dias: Number(m[1]), encontrado: true };
  return { dias: 15, encontrado: false };
}
