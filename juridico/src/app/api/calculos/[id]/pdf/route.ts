import { obterContexto } from "@/lib/contexto";
import { gerarPdf, type BlocoPdf } from "@/lib/pdf";
import { moeda } from "@/lib/documento";
import { formatarDataBr } from "@/lib/prazos/motor";
import { formatarCnj } from "@/lib/cnj";
import { ROTULO_JUROS, type ResultadoAtualizacao } from "@/lib/calculos/atualizacao";
import type { ResultadoRescisao } from "@/lib/calculos/rescisao";
import type { ResultadoCumprimento } from "@/lib/calculos/cumprimento";
import type { LinhaDebito } from "@/lib/calculos/pensao";
import { CALCULADORAS } from "@/app/(app)/calculadoras/lista";

const pct = (v: number | null) => (v === null ? "-" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}%`);

function blocosAtualizacao(r: ResultadoAtualizacao, entrada: Record<string, unknown>): BlocoPdf[] {
  const periodos = (entrada.periodos as { ate: string | null; correcao: string; juros: keyof typeof ROTULO_JUROS }[]) ?? [];
  return [
    { tipo: "subtitulo", texto: "Parâmetros" },
    { tipo: "paragrafo", texto: `Data inicial: ${formatarDataBr(String(entrada.dataInicial ?? entrada.dataBase))}. Data do cálculo: ${formatarDataBr(String(entrada.dataFinal ?? entrada.dataCalculo))}.${entrada.dataInicioJuros ? ` Juros desde ${formatarDataBr(String(entrada.dataInicioJuros))}.` : ""}` },
    ...periodos.map((p) => ({ tipo: "paragrafo" as const, texto: `Até ${p.ate ? formatarDataBr(p.ate) : "o fim"}: correção ${p.correcao}; ${ROTULO_JUROS[p.juros]}.` })),
    { tipo: "subtitulo", texto: "Resumo" },
    {
      tipo: "tabela",
      colunas: ["Item", "Valor"],
      larguras: [3, 1],
      linhas: [
        ["Valor original", moeda(r.valorOriginal)],
        ["Fator de correção", r.fatorCorrecao.toFixed(6)],
        ["Valor corrigido", moeda(r.valorCorrigido)],
        [`Juros (${pct(r.percentualJuros)})`, moeda(r.valorJuros)],
        ["Total atualizado", moeda(r.total)],
      ],
    },
    ...r.observacoes.map((o) => ({ tipo: "paragrafo" as const, texto: o })),
    { tipo: "subtitulo", texto: "Memória mês a mês" },
    {
      tipo: "tabela",
      colunas: ["Competência", "Índice", "Variação", "Fator acumulado", "Juros mês", "Juros acum."],
      linhas: r.memoria.map((m) => [m.competencia.split("-").reverse().join("/"), m.correcao, pct(m.variacao), m.fatorAcumulado.toFixed(6), pct(m.taxaJuros), pct(m.jurosAcumulado)]),
    },
  ];
}

function blocos(tipo: string, r: unknown, entrada: Record<string, unknown>): BlocoPdf[] {
  if (tipo === "atualizacao") return blocosAtualizacao(r as ResultadoAtualizacao, entrada);
  if (tipo === "rescisao") {
    const x = r as ResultadoRescisao;
    return [
      { tipo: "paragrafo", texto: `Admissão: ${formatarDataBr(String(entrada.admissao))}. Último dia trabalhado: ${formatarDataBr(String(entrada.desligamento))}. Aviso prévio: ${x.diasAviso} dias. Data projetada: ${formatarDataBr(x.dataProjetada)}.` },
      { tipo: "tabela", colunas: ["Verba", "Detalhe", "Fundamento", "Valor"], larguras: [2.2, 1.2, 2.2, 1.2], linhas: [...x.itens.map((i) => [i.descricao + (i.informativo ? " (informativo)" : ""), i.detalhe ?? "", i.fundamento, moeda(i.valor)]), ["Total estimado (bruto)", "", "", moeda(x.total)]] },
      ...x.observacoes.map((o) => ({ tipo: "paragrafo" as const, texto: o })),
    ];
  }
  if (tipo === "pensao") {
    const x = r as { mensal: { baseCalculo: number; valor: number; descricao: string } | null; debito: { linhas: LinhaDebito[]; totalOriginal: number; total: number; observacoes: string[] } | null };
    const out: BlocoPdf[] = [];
    if (x.mensal) out.push({ tipo: "paragrafo", texto: `Pensão mensal: ${moeda(x.mensal.valor)} (${x.mensal.descricao}; base de cálculo ${moeda(x.mensal.baseCalculo)}).` });
    if (x.debito) {
      out.push(
        { tipo: "subtitulo", texto: "Débito em atraso" },
        { tipo: "tabela", colunas: ["Vencimento", "Devido", "Pago", "Saldo", "Corrigido", "Juros", "Total"], linhas: x.debito.linhas.map((l) => [formatarDataBr(l.vencimento), moeda(l.devido), moeda(l.pago), moeda(l.saldo), moeda(l.corrigido), moeda(l.juros), moeda(l.total)]) },
        { tipo: "paragrafo", texto: `Saldo original: ${moeda(x.debito.totalOriginal)}. Débito atualizado: ${moeda(x.debito.total)}.`, negrito: true },
        ...x.debito.observacoes.map((o) => ({ tipo: "paragrafo" as const, texto: o })),
      );
    }
    return out;
  }
  const x = r as ResultadoCumprimento;
  return [
    {
      tipo: "tabela",
      colunas: ["Item", "Valor"],
      larguras: [3, 1],
      linhas: [
        ["Condenação atualizada", moeda(x.principalAtualizado)],
        ["Honorários da fase de conhecimento", moeda(x.honorariosConhecimento)],
        ["Subtotal", moeda(x.subtotal)],
        ["Base após pagamento parcial", moeda(x.baseMultaHonorarios)],
        ["Multa de 10% (CPC art. 523 §1º)", moeda(x.multa)],
        ["Honorários de 10% (CPC art. 523 §1º)", moeda(x.honorarios523)],
        ["Custas", moeda(x.custas)],
        ["Total devido", moeda(x.total)],
      ],
    },
    ...x.observacoes.map((o) => ({ tipo: "paragrafo" as const, texto: o })),
    ...blocosAtualizacao(x.atualizacao, entrada),
  ];
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await obterContexto();
  const { data: c } = await ctx.supabase.from("calculos_salvos").select("*, processos(numero_cnj)").eq("id", id).maybeSingle();
  if (!c) return new Response("não encontrado", { status: 404 });
  const nomeCalc = CALCULADORAS.find((x) => x.tipo === c.tipo)?.titulo ?? "Cálculo";
  const proc = c.processos as unknown as { numero_cnj: string } | null;
  const pdf = await gerarPdf({
    titulo: `Memória de cálculo: ${c.titulo}`,
    rodape: `${ctx.escritorio.nome} · ${nomeCalc} · gerado em ${new Date().toLocaleDateString("pt-BR")}`,
    blocos: [
      { tipo: "titulo", texto: `Memória de cálculo: ${c.titulo}` },
      { tipo: "paragrafo", texto: `${nomeCalc}${proc ? ` · Processo ${formatarCnj(proc.numero_cnj)}` : ""} · ${new Date(c.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` },
      ...blocos(c.tipo, c.resultado, c.entrada as Record<string, unknown>),
    ],
  });
  return new Response(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="calculo-${id.slice(0, 8)}.pdf"` } });
}
