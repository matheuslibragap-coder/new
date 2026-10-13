import { NextResponse } from "next/server";
import { autorizarCron } from "@/lib/cron";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { avisar } from "@/lib/notificar";
import { diferencaDias, formatarDataBr, hojeBrasilia, somarDias } from "@/lib/prazos/motor";
import { formatarCnj } from "@/lib/cnj";
import { AVISO_RESPONSABILIDADE } from "@/lib/textos";
import { centavosParaReais, moeda } from "@/lib/documento";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MARCOS = [5, 2, 0];

/**
 * Alertas. Rodar a cada hora (compromissos) e ao menos uma vez por dia (prazos e financeiro).
 * Prazos: D-5, D-2 e D-0. Cada marco é enviado uma única vez (alertas_enviados).
 */
export async function GET(req: Request) {
  const negado = autorizarCron(req);
  if (negado) return negado;
  const admin = criarClienteAdmin();
  const hoje = hojeBrasilia();
  const res = { prazos: 0, compromissos: 0, financeiro: 0 };

  // Prazos
  const { data: tarefas } = await admin
    .from("tarefas")
    .select("id, escritorio_id, titulo, data_vencimento, responsavel_id, alertas_enviados, processos(numero_cnj)")
    .eq("status", "aberta")
    .gte("data_vencimento", hoje)
    .lte("data_vencimento", somarDias(hoje, 5))
    .limit(5000);
  for (const t of tarefas ?? []) {
    const falta = diferencaDias(hoje, t.data_vencimento);
    const marco = MARCOS.find((m) => falta <= m && !(t.alertas_enviados ?? []).includes(`D-${m}`) && !MARCOS.filter((x) => x < m).some((x) => falta <= x));
    if (marco === undefined) continue;
    const proc = t.processos as unknown as { numero_cnj: string } | null;
    await avisar(admin, {
      escritorioId: t.escritorio_id,
      userId: t.responsavel_id,
      tipo: "prazo",
      titulo: falta === 0 ? `Prazo vence HOJE: ${t.titulo}` : `Prazo em ${falta} dia(s): ${t.titulo}`,
      corpo: `Vencimento em ${formatarDataBr(t.data_vencimento)}${proc ? ` no processo ${formatarCnj(proc.numero_cnj)}` : ""}.\n${AVISO_RESPONSABILIDADE}`,
      link: `/prazos/${t.id}`,
    });
    // registra este marco e os maiores (evita alerta atrasado de D-5 depois do D-2)
    const enviados = [...new Set([...(t.alertas_enviados ?? []), ...MARCOS.filter((m) => m >= marco).map((m) => `D-${m}`)])];
    await admin.from("tarefas").update({ alertas_enviados: enviados }).eq("id", t.id);
    res.prazos++;
  }

  // Compromissos (janela de até 7 dias)
  const agora = Date.now();
  const { data: comps } = await admin
    .from("compromissos")
    .select("id, escritorio_id, titulo, inicio, local, link_sala, responsavel_id, alertas_minutos, alertas_enviados")
    .gte("inicio", new Date(agora).toISOString())
    .lte("inicio", new Date(agora + 7 * 86400000 + 3600000).toISOString())
    .limit(5000);
  for (const c of comps ?? []) {
    const faltamMin = (new Date(c.inicio).getTime() - agora) / 60000;
    const devidos = (c.alertas_minutos ?? []).filter((m: number) => faltamMin <= m && !(c.alertas_enviados ?? []).includes(m));
    if (!devidos.length) continue;
    const quando = new Date(c.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
    await avisar(admin, {
      escritorioId: c.escritorio_id,
      userId: c.responsavel_id,
      tipo: "compromisso",
      titulo: `Lembrete: ${c.titulo} em ${quando}`,
      corpo: [c.local ? `Local: ${c.local}` : null, c.link_sala ? `Sala virtual: ${c.link_sala}` : null].filter(Boolean).join("\n") || "Confira os detalhes na agenda.",
      link: `/agenda/${c.id}`,
    });
    await admin.from("compromissos").update({ alertas_enviados: [...(c.alertas_enviados ?? []), ...devidos] }).eq("id", c.id);
    res.compromissos++;
  }

  // Financeiro: lançamentos a receber que venceram ontem (um aviso por escritório)
  const url = new URL(req.url);
  if (url.searchParams.get("diario") === "1") {
    const ontem = somarDias(hoje, -1);
    const { data: venc } = await admin.from("lancamentos").select("escritorio_id, valor_centavos, descricao").eq("status", "previsto").eq("natureza", "receber").eq("vencimento", ontem).limit(5000);
    const porEscritorio = new Map<string, { total: number; n: number }>();
    for (const l of venc ?? []) {
      const atual = porEscritorio.get(l.escritorio_id) ?? { total: 0, n: 0 };
      porEscritorio.set(l.escritorio_id, { total: atual.total + Number(l.valor_centavos), n: atual.n + 1 });
    }
    for (const [escritorioId, v] of porEscritorio) {
      await avisar(admin, {
        escritorioId,
        permissao: "financeiro",
        tipo: "financeiro",
        titulo: `${v.n} recebimento(s) venceram ontem`,
        corpo: `Total de ${moeda(centavosParaReais(v.total))} em aberto.`,
        link: "/financeiro?situacao=atrasado",
        push: false,
      });
      res.financeiro++;
    }
  }
  return NextResponse.json(res);
}
