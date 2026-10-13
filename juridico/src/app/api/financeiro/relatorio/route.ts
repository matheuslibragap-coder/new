import { obterContexto } from "@/lib/contexto";
import { formatarCnj } from "@/lib/cnj";
import { rotuloTipo } from "@/app/(app)/financeiro/rotulos";

const csv = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Relatório mensal em CSV (abre no Excel/Planilhas, separador ;). */
export async function GET(req: Request) {
  const ctx = await obterContexto();
  if (!ctx.pode("financeiro")) return new Response("sem permissão", { status: 403 });
  const mes = new URL(req.url).searchParams.get("mes") ?? new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(mes)) return new Response("mês inválido", { status: 400 });
  const [a, m] = mes.split("-").map(Number);
  const fim = new Date(Date.UTC(a, m, 1)).toISOString().slice(0, 10);
  const { data } = await ctx.supabase
    .from("lancamentos_situacao")
    .select("vencimento, tipo, natureza, descricao, valor_centavos, situacao, recebido_em, parcela_numero, parcela_total, clientes(nome), processos(numero_cnj)")
    .eq("escritorio_id", ctx.escritorio.id)
    .gte("vencimento", `${mes}-01`)
    .lt("vencimento", fim)
    .order("vencimento");
  const linhas = [["Vencimento", "Tipo", "Natureza", "Descrição", "Cliente", "Processo", "Parcela", "Valor", "Situação", "Recebido em"].map(csv).join(";")];
  for (const l of data ?? []) {
    linhas.push(
      [
        l.vencimento.split("-").reverse().join("/"),
        rotuloTipo(l.tipo),
        l.natureza,
        l.descricao,
        (l.clientes as unknown as { nome: string } | null)?.nome,
        (l.processos as unknown as { numero_cnj: string } | null) ? formatarCnj((l.processos as unknown as { numero_cnj: string }).numero_cnj) : "",
        l.parcela_total ? `${l.parcela_numero}/${l.parcela_total}` : "",
        (Number(l.valor_centavos) / 100).toFixed(2).replace(".", ","),
        l.situacao,
        l.recebido_em ? l.recebido_em.split("-").reverse().join("/") : "",
      ]
        .map(csv)
        .join(";"),
    );
  }
  return new Response("﻿" + linhas.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="financeiro-${mes}.csv"` } });
}
