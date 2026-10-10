import "server-only";

/**
 * Envio automático pela API oficial do WhatsApp (Cloud API da Meta). Restrito ao plano Pro.
 * Fora da janela de 24 horas a Meta exige modelo (template) aprovado; usamos um modelo
 * com um único parâmetro de corpo, configurado em WHATSAPP_TEMPLATE.
 */
export async function enviarWhatsappApi(phoneNumberId: string, para: string, texto: string): Promise<string> {
  const token = process.env.WHATSAPP_TOKEN;
  const template = process.env.WHATSAPP_TEMPLATE;
  if (!token || !template) throw new Error("WhatsApp API não configurada (WHATSAPP_TOKEN e WHATSAPP_TEMPLATE).");
  const versao = process.env.WHATSAPP_API_VERSION || "v21.0";
  const resp = await fetch(`https://graph.facebook.com/${versao}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: para,
      type: "template",
      template: {
        name: template,
        language: { code: "pt_BR" },
        // parâmetros de template não aceitam quebras de linha
        components: [{ type: "body", parameters: [{ type: "text", text: texto.replace(/\s*\n+\s*/g, " ").replace(/ {4,}/g, " ") }] }],
      },
    }),
  });
  const json = (await resp.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
  if (!resp.ok || !json.messages?.[0]) throw new Error(`WhatsApp: ${json.error?.message || resp.status}`);
  return json.messages[0].id;
}
