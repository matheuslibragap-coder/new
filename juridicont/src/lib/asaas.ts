import "server-only";

const URL_BASE = process.env.ASAAS_API_URL || "https://api-sandbox.asaas.com/v3";

export class ErroAsaas extends Error {
  constructor(
    message: string,
    public status: number,
    public corpo: unknown,
  ) {
    super(message);
  }
}

async function requisicao<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const resp = await fetch(URL_BASE + caminho, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Juridicont",
      access_token: process.env.ASAAS_API_KEY ?? "",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const corpo = await resp.json().catch(() => null);
  if (!resp.ok) {
    const descricao =
      (corpo as { errors?: { description?: string }[] } | null)?.errors?.[0]?.description ?? `HTTP ${resp.status}`;
    throw new ErroAsaas(descricao, resp.status, corpo);
  }
  return corpo as T;
}

export type FormaPagamento = "PIX" | "CREDIT_CARD";

export async function criarClienteAsaas(dados: { nome: string; cpfCnpj: string; email: string; userId: string }) {
  return requisicao<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: dados.nome,
      cpfCnpj: dados.cpfCnpj,
      email: dados.email,
      externalReference: dados.userId,
      notificationDisabled: false,
    }),
  });
}

export async function atualizarClienteAsaas(id: string, dados: { nome: string; cpfCnpj: string; email: string }) {
  return requisicao<{ id: string }>(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name: dados.nome, cpfCnpj: dados.cpfCnpj, email: dados.email }),
  });
}

export async function criarAssinaturaAsaas(dados: {
  cliente: string;
  forma: FormaPagamento;
  valorCentavos: number;
  descricao: string;
  referencia: string;
}) {
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // AAAA-MM-DD
  return requisicao<{ id: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: dados.cliente,
      billingType: dados.forma,
      value: dados.valorCentavos / 100,
      nextDueDate: hoje,
      cycle: "MONTHLY",
      description: dados.descricao,
      externalReference: dados.referencia,
    }),
  });
}

/** Link da fatura da primeira cobrança da assinatura (página do Asaas para pagar com Pix ou cartão). */
export async function linkPrimeiraCobranca(assinaturaId: string) {
  const resp = await requisicao<{ data: { id: string; invoiceUrl: string }[] }>(
    `/subscriptions/${assinaturaId}/payments?limit=1`,
  );
  return resp.data[0]?.invoiceUrl ?? null;
}

export async function cancelarAssinaturaAsaas(assinaturaId: string) {
  return requisicao<{ deleted: boolean }>(`/subscriptions/${assinaturaId}`, { method: "DELETE" });
}

export function limparDocumento(valor: string) {
  return valor.replace(/\D/g, "");
}

export function documentoValido(doc: string) {
  if (doc.length === 11) return cpfValido(doc);
  return doc.length === 14;
}

function cpfValido(cpf: string) {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const dig = (fim: number) => {
    let soma = 0;
    for (let i = 0; i < fim; i++) soma += Number(cpf[i]) * (fim + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dig(9) === Number(cpf[9]) && dig(10) === Number(cpf[10]);
}
