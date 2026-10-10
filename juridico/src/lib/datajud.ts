import "server-only";
import { createHash } from "node:crypto";

/**
 * Cliente da API Pública do DataJud (CNJ).
 * Documentação: https://datajud-wiki.cnj.jus.br/api-publica/
 * A chave pública é divulgada pelo CNJ e fica em DATAJUD_API_KEY.
 */

const BASE = process.env.DATAJUD_BASE_URL || "https://api-publica.datajud.cnj.jus.br";

export class ErroDatajud extends Error {
  constructor(message: string, public status: number, public repetivel: boolean) {
    super(message);
  }
}

export type MovimentoDatajud = {
  codigo?: number;
  nome: string;
  dataHora: string;
  complementosTabelados?: { codigo?: number; valor?: number; nome?: string; descricao?: string }[];
  orgaoJulgador?: { codigoOrgao?: number; nomeOrgao?: string };
};

export type ProcessoDatajud = {
  numeroProcesso: string;
  classe?: { codigo?: number; nome?: string };
  sistema?: { nome?: string };
  formato?: { nome?: string };
  tribunal?: string;
  dataHoraUltimaAtualizacao?: string;
  grau?: string;
  dataAjuizamento?: string;
  nivelSigilo?: number;
  orgaoJulgador?: { codigo?: number; nome?: string; codigoMunicipioIBGE?: number };
  assuntos?: ({ codigo?: number; nome?: string } | { codigo?: number; nome?: string }[])[];
  movimentos?: MovimentoDatajud[];
};

export type ResultadoConsulta = {
  encontrado: boolean;
  capa: Omit<ProcessoDatajud, "movimentos"> | null;
  graus: string[];
  movimentos: (MovimentoDatajud & { hash: string })[];
};

export function hashMovimento(m: MovimentoDatajud): string {
  const base = `${m.codigo ?? ""}|${m.dataHora}|${m.nome}|${JSON.stringify(m.complementosTabelados ?? [])}`;
  return createHash("sha256").update(base).digest("hex").slice(0, 32);
}

/** Converte data do DataJud ("2023-05-10T12:00:00.000Z" ou "20230510120000") em ISO. */
export function dataDatajud(v: string | undefined | null): string | null {
  if (!v) return null;
  if (/^\d{14}$/.test(v)) return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(8, 10)}:${v.slice(10, 12)}:${v.slice(12, 14)}-03:00`;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function nomesAssuntos(capa: ProcessoDatajud | Omit<ProcessoDatajud, "movimentos"> | null): string {
  if (!capa?.assuntos) return "";
  return capa.assuntos.flat().map((a) => a?.nome).filter(Boolean).join("; ");
}

export async function consultarProcesso(alias: string, numero: string, timeoutMs = 20000): Promise<ResultadoConsulta> {
  const chave = process.env.DATAJUD_API_KEY;
  if (!chave) throw new ErroDatajud("DATAJUD_API_KEY não configurada.", 0, false);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  let resp: Response;
  try {
    resp = await fetch(`${BASE}/api_publica_${alias}/_search`, {
      method: "POST",
      headers: { Authorization: `APIKey ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: { match: { numeroProcesso: numero } }, size: 20 }),
      signal: ctrl.signal,
      cache: "no-store",
    });
  } catch (e) {
    throw new ErroDatajud(`Falha de conexão com o DataJud: ${(e as Error).message}`, 0, true);
  } finally {
    clearTimeout(t);
  }
  if (resp.status === 429) throw new ErroDatajud("Limite de requisições do DataJud atingido.", 429, true);
  if (resp.status >= 500) throw new ErroDatajud(`DataJud indisponível (${resp.status}).`, resp.status, true);
  if (resp.status === 404) throw new ErroDatajud("Endpoint do tribunal não encontrado no DataJud.", 404, false);
  if (!resp.ok) throw new ErroDatajud(`Erro do DataJud (${resp.status}).`, resp.status, false);

  const json = (await resp.json()) as { hits?: { hits?: { _source: ProcessoDatajud }[] } };
  const hits = (json.hits?.hits ?? []).map((h) => h._source).filter((s) => s && s.numeroProcesso === numero);
  if (hits.length === 0) return { encontrado: false, capa: null, graus: [], movimentos: [] };

  // Vários registros = um por grau/sistema. Capa: o atualizado mais recentemente.
  hits.sort((a, b) => (dataDatajud(b.dataHoraUltimaAtualizacao) ?? "").localeCompare(dataDatajud(a.dataHoraUltimaAtualizacao) ?? ""));
  const { movimentos: _ignorar, ...capa } = hits[0];
  void _ignorar;
  const mapa = new Map<string, MovimentoDatajud & { hash: string }>();
  for (const h of hits) {
    for (const m of h.movimentos ?? []) {
      if (!m?.nome || !m?.dataHora) continue;
      const hash = hashMovimento(m);
      if (!mapa.has(hash)) mapa.set(hash, { ...m, hash });
    }
  }
  return {
    encontrado: true,
    capa,
    graus: [...new Set(hits.map((h) => h.grau).filter(Boolean) as string[])],
    movimentos: [...mapa.values()].sort((a, b) => (dataDatajud(b.dataHora) ?? "").localeCompare(dataDatajud(a.dataHora) ?? "")),
  };
}

/** Texto legível de um movimento, com complementos. */
export function descreverMovimento(m: Pick<MovimentoDatajud, "nome" | "complementosTabelados">): string {
  const comp = (m.complementosTabelados ?? []).map((c) => c.nome || c.descricao).filter(Boolean);
  return comp.length ? `${m.nome} (${comp.join("; ")})` : m.nome;
}
