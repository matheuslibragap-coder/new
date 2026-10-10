import "server-only";
import { NextResponse } from "next/server";

/** Jobs agendados exigem Authorization: Bearer CRON_SECRET (padrão da Vercel Cron). */
export function autorizarCron(req: Request): NextResponse | null {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return NextResponse.json({ erro: "CRON_SECRET não configurado" }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${segredo}`) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  return null;
}

export const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
