import { obterContexto, registrarAcesso } from "@/lib/contexto";

const TABELAS = [
  "clientes", "processos", "andamentos", "tarefas", "compromissos", "compromisso_anexos", "mensagens_cliente",
  "calculos_salvos", "lancamentos", "modelos_documento", "documentos_gerados", "biblioteca_documentos", "rascunhos",
  "verificacoes", "config_intimacoes", "intimacoes", "notificacoes", "membros", "logs_acesso",
];

/** Exportação completa dos dados do escritório (LGPD, art. 18, V). */
export async function GET() {
  const ctx = await obterContexto();
  if (ctx.membro.papel !== "titular") return new Response("Somente o titular pode exportar.", { status: 403 });
  const dados: Record<string, unknown> = { escritorio: { ...ctx.escritorio, planos: undefined }, exportado_em: new Date().toISOString() };
  for (const t of TABELAS) {
    const linhas: unknown[] = [];
    for (let i = 0; ; i += 1000) {
      const { data } = await ctx.supabase.from(t).select("*").eq("escritorio_id", ctx.escritorio.id).range(i, i + 999);
      linhas.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    dados[t] = linhas;
  }
  await registrarAcesso(ctx, "exportacao_dados");
  return new Response(JSON.stringify(dados, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="dados-escritorio-${new Date().toISOString().slice(0, 10)}.json"` },
  });
}
