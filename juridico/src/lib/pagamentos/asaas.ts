import "server-only";

/**
 * Gateway de pagamentos: Asaas (assinatura recorrente com cartão, Pix ou boleto).
 * A interface permite trocar por Mercado Pago sem reescrever as telas.
 * Documentação: https://docs.asaas.com
 */

export interface GatewayPagamento {
  nome: string;
  garantirCliente(dados: { nome: string; documento: string; email: string; idExistente?: string | null }): Promise<string>;
  criarAssinatura(dados: { clienteId: string; valorCentavos: number; descricao: string; referencia: string }): Promise<{ assinaturaId: string; linkPagamento: string | null }>;
  alterarAssinatura(assinaturaId: string, dados: { valorCentavos: number; descricao: string; referencia: string }): Promise<void>;
  cancelarAssinatura(assinaturaId: string): Promise<void>;
  obterReferenciaAssinatura(assinaturaId: string): Promise<string | null>;
  linkPagamentoPendente(assinaturaId: string): Promise<string | null>;
}

function base() {
  return process.env.ASAAS_AMBIENTE === "producao" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
}

async function chamar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const chave = process.env.ASAAS_API_KEY;
  if (!chave) throw new Error("ASAAS_API_KEY não configurada.");
  const resp = await fetch(`${base()}${caminho}`, {
    method: metodo,
    headers: { access_token: chave, "Content-Type": "application/json", "User-Agent": "gestao-juridica" },
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: "no-store",
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = (json as { errors?: { description?: string }[] }).errors?.map((e) => e.description).join("; ");
    throw new Error(`Asaas: ${msg || resp.status}`);
  }
  return json as T;
}

function hoje(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export const asaas: GatewayPagamento = {
  nome: "asaas",
  async garantirCliente({ nome, documento, email, idExistente }) {
    if (idExistente) return idExistente;
    const c = await chamar<{ id: string }>("POST", "/customers", { name: nome, cpfCnpj: documento, email });
    return c.id;
  },
  async criarAssinatura({ clienteId, valorCentavos, descricao, referencia }) {
    const a = await chamar<{ id: string }>("POST", "/subscriptions", {
      customer: clienteId,
      billingType: "UNDEFINED", // cliente escolhe cartão, Pix ou boleto na fatura
      value: valorCentavos / 100,
      nextDueDate: hoje(),
      cycle: "MONTHLY",
      description: descricao,
      externalReference: referencia,
    });
    return { assinaturaId: a.id, linkPagamento: await this.linkPagamentoPendente(a.id) };
  },
  async alterarAssinatura(assinaturaId, { valorCentavos, descricao, referencia }) {
    await chamar("POST", `/subscriptions/${assinaturaId}`, { value: valorCentavos / 100, description: descricao, externalReference: referencia, updatePendingPayments: true });
  },
  async cancelarAssinatura(assinaturaId) {
    await chamar("DELETE", `/subscriptions/${assinaturaId}`);
  },
  async obterReferenciaAssinatura(assinaturaId) {
    const a = await chamar<{ externalReference?: string }>("GET", `/subscriptions/${assinaturaId}`);
    return a.externalReference ?? null;
  },
  async linkPagamentoPendente(assinaturaId) {
    const p = await chamar<{ data: { invoiceUrl?: string; status: string }[] }>("GET", `/subscriptions/${assinaturaId}/payments`);
    const pendente = p.data.find((x) => x.status === "PENDING" || x.status === "OVERDUE") ?? p.data[0];
    return pendente?.invoiceUrl ?? null;
  },
};

/** Referência gravada na assinatura: "{escritorio_id}:{plano}" */
export function montarReferencia(escritorioId: string, plano: string) {
  return `${escritorioId}:${plano}`;
}
export function lerReferencia(ref: string | null): { escritorioId: string; plano: string } | null {
  if (!ref) return null;
  const [escritorioId, plano] = ref.split(":");
  return escritorioId && plano ? { escritorioId, plano } : null;
}
