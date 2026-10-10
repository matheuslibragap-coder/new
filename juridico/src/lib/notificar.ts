import "server-only";
import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Notificações: in-app (tabela notificacoes), e-mail (Resend) e push (Web Push / VAPID).
 * Todas as funções toleram ausência de configuração: registram e seguem.
 */

let vapidConfigurado: boolean | null = null;
function configurarVapid(): boolean {
  if (vapidConfigurado !== null) return vapidConfigurado;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  vapidConfigurado = !!(pub && priv);
  if (vapidConfigurado) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contato@exemplo.com.br", pub!, priv!);
  return vapidConfigurado;
}

export async function enviarEmail(para: string, assunto: string, texto: string, html?: string): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave || !para) return false;
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_REMETENTE || "Avisos <avisos@exemplo.com.br>",
      to: [para],
      subject: assunto,
      text: texto,
      html: html ?? `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">${texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</div>`,
    }),
  });
  if (!resp.ok) console.error("Falha ao enviar e-mail", resp.status, await resp.text().catch(() => ""));
  return resp.ok;
}

export async function enviarPush(admin: SupabaseClient, userId: string, titulo: string, corpo: string, link?: string): Promise<number> {
  if (!configurarVapid()) return 0;
  const { data: inscricoes } = await admin.from("push_inscricoes").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  let enviados = 0;
  for (const s of inscricoes ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ titulo, corpo, link: link ?? "/painel" }),
        { TTL: 60 * 60 * 24 },
      );
      enviados++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await admin.from("push_inscricoes").delete().eq("id", s.id);
      else console.error("Falha no push", status);
    }
  }
  return enviados;
}

export type Aviso = {
  escritorioId: string;
  tipo: string;
  titulo: string;
  corpo: string;
  link?: string;
  /** permissão exigida para receber (ex.: financeiro) */
  permissao?: string;
  /** limitar a um usuário (ex.: responsável pela tarefa) */
  userId?: string | null;
  email?: boolean;
  push?: boolean;
};

const URL_APP = () => process.env.NEXT_PUBLIC_URL_APP || "http://localhost:3000";

/** Registra a notificação in-app e dispara e-mail e push para os destinatários. */
export async function avisar(admin: SupabaseClient, a: Aviso): Promise<void> {
  const { data: dest } = await admin.rpc("destinatarios_alerta", { e: a.escritorioId, permissao: a.permissao ?? null });
  const lista = ((dest ?? []) as { user_id: string; email: string; nome: string | null }[]).filter((d) => !a.userId || d.user_id === a.userId);
  await admin.from("notificacoes").insert({
    escritorio_id: a.escritorioId,
    user_id: a.userId ?? null,
    tipo: a.tipo,
    titulo: a.titulo,
    corpo: a.corpo,
    link: a.link ?? null,
  });
  for (const d of lista) {
    if (a.email !== false && d.email) {
      const link = a.link ? `\n\nAbrir: ${URL_APP()}${a.link}` : "";
      await enviarEmail(d.email, a.titulo, `${a.corpo}${link}`);
    }
    if (a.push !== false) await enviarPush(admin, d.user_id, a.titulo, a.corpo, a.link);
  }
}
