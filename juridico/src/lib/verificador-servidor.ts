import "server-only";
import { consultarProcesso, ErroDatajud } from "./datajud";
import { analisarTexto, AVISO_NAO_VERIFICADO, normalizar, type Achado, type LeiRef } from "./verificador";
import { esperar } from "./cron";

const MAX_CONSULTAS = 15;

/**
 * Análise completa: regras locais + verificação dos números CNJ no DataJud.
 * Nunca afirma que uma citação existe sem ter encontrado a fonte.
 */
export async function verificarPeticao(texto: string, leis: LeiRef[], hoje: string): Promise<{ achados: Achado[]; resumo: Record<string, number> }> {
  const { cnjs, achados } = analisarTexto(texto, leis, hoje);
  const consultados = new Set<string>();
  for (const c of cnjs) {
    if (!c.dvValido || consultados.has(c.digitos)) continue;
    consultados.add(c.digitos);
    if (consultados.size > MAX_CONSULTAS) {
      achados.push({ categoria: "processo", gravidade: "nao_verificado", trecho: c.formatado, mensagem: `${AVISO_NAO_VERIFICADO}. Limite de ${MAX_CONSULTAS} consultas por verificação atingido.` });
      continue;
    }
    if (!c.aliasDatajud) {
      achados.push({ categoria: "processo", gravidade: "nao_verificado", trecho: c.formatado, mensagem: `${AVISO_NAO_VERIFICADO}. O ${c.tribunalPeloNumero ?? "tribunal"} não está na API Pública do DataJud.` });
      continue;
    }
    try {
      const r = await consultarProcesso(c.aliasDatajud, c.digitos, 15000);
      if (!r.encontrado) {
        achados.push({
          categoria: "processo",
          gravidade: "alerta",
          trecho: c.formatado,
          mensagem: `${AVISO_NAO_VERIFICADO}. Número válido, mas não localizado na API Pública do DataJud (pode ser sigiloso, recente ou não indexado).`,
        });
        continue;
      }
      const classe = r.capa?.classe?.nome ?? "";
      if (c.classeCitada && classe && !normalizar(classe).includes(normalizar(c.classeCitada)) && !normalizar(c.classeCitada).includes(normalizar(classe))) {
        achados.push({ categoria: "processo", gravidade: "erro", trecho: c.formatado, mensagem: `O texto cita "${c.classeCitada}", mas no DataJud a classe é "${classe}" (${c.tribunalPeloNumero}). Fonte: CNJ / DataJud` });
      } else {
        achados.push({ categoria: "processo", gravidade: "ok", trecho: c.formatado, mensagem: `Processo localizado no ${c.tribunalPeloNumero}: ${classe || "classe não informada"}. Confira se o conteúdo citado corresponde à decisão. Fonte: CNJ / DataJud` });
      }
    } catch (e) {
      achados.push({ categoria: "processo", gravidade: "nao_verificado", trecho: c.formatado, mensagem: `${AVISO_NAO_VERIFICADO}. Consulta ao DataJud falhou: ${e instanceof ErroDatajud ? e.message : "erro de conexão"}.` });
    }
    await esperar(300);
  }
  const ordem = { erro: 0, alerta: 1, nao_verificado: 2, ok: 3 };
  achados.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade]);
  const resumo = achados.reduce<Record<string, number>>((acc, a) => ((acc[a.gravidade] = (acc[a.gravidade] ?? 0) + 1), acc), {});
  return { achados, resumo };
}
