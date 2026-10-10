import "server-only";

/**
 * Assinatura eletrônica por provedor terceiro (M7). Implementação: ZapSign.
 * O envio automático de e-mail pelo provedor fica DESLIGADO: os links voltam ao advogado,
 * que decide quando e como compartilhar (nada é enviado ao cliente sem aprovação).
 */
export interface ProvedorAssinatura {
  nome: string;
  criarDocumento(dados: { titulo: string; pdf: Uint8Array; referencia: string; signatarios: { nome: string; email?: string | null; telefone?: string | null }[] }): Promise<{ idExterno: string; links: { nome: string; url: string }[] }>;
}

export const zapsign: ProvedorAssinatura = {
  nome: "zapsign",
  async criarDocumento({ titulo, pdf, referencia, signatarios }) {
    const token = process.env.ZAPSIGN_API_TOKEN;
    if (!token) throw new Error("ZAPSIGN_API_TOKEN não configurado.");
    const base = process.env.ZAPSIGN_AMBIENTE === "producao" ? "https://api.zapsign.com.br" : "https://sandbox.api.zapsign.com.br";
    const resp = await fetch(`${base}/api/v1/docs/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: titulo,
        base64_pdf: Buffer.from(pdf).toString("base64"),
        lang: "pt-br",
        external_id: referencia,
        signers: signatarios.map((s) => ({
          name: s.nome,
          email: s.email || undefined,
          phone_country: s.telefone ? s.telefone.slice(0, 2) : undefined,
          phone_number: s.telefone ? s.telefone.slice(2) : undefined,
          send_automatic_email: false,
          send_automatic_whatsapp: false,
        })),
      }),
    });
    const json = (await resp.json().catch(() => ({}))) as { token?: string; signers?: { name: string; sign_url: string }[]; detail?: string };
    if (!resp.ok || !json.token) throw new Error(`ZapSign: ${json.detail || resp.status}`);
    return { idExterno: json.token, links: (json.signers ?? []).map((s) => ({ nome: s.name, url: s.sign_url })) };
  },
};
