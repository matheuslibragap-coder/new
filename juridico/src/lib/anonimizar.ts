/**
 * Anonimização de nomes e documentos antes de indexar petições (M8).
 * Heurística: confira o resultado; nomes fora do padrão podem escapar.
 */
const PRESERVAR = new Set([
  "Excelentíssimo", "Senhor", "Senhora", "Doutor", "Doutora", "Juiz", "Juíza", "Direito", "Vara", "Comarca", "Estado",
  "Tribunal", "Justiça", "Código", "Civil", "Processo", "Lei", "Constituição", "Federal", "Supremo", "Superior",
  "Ministério", "Público", "Defensoria", "União", "Fazenda", "Nacional", "Rio", "Grande", "Sul", "São", "Paulo",
  "Recurso", "Especial", "Extraordinário", "Apelação", "Agravo", "Instrumento", "Trabalho", "Regional",
]);

export type ResultadoAnonimizacao = { texto: string; substituicoes: number };

export function anonimizar(texto: string, nomesConhecidos: string[] = []): ResultadoAnonimizacao {
  let n = 0;
  let t = texto;
  // CPF e CNPJ (com ou sem máscara), RG e e-mails
  t = t.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, () => (n++, "[CPF]"));
  t = t.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, () => (n++, "[CNPJ]"));
  t = t.replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, () => (n++, "[E-MAIL]"));
  t = t.replace(/\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b/g, () => (n++, "[TELEFONE]"));
  // Nomes conhecidos (clientes e partes cadastrados)
  for (const nome of nomesConhecidos.filter((x) => x && x.trim().length > 3).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(nome.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "gi");
    t = t.replace(re, () => (n++, "[NOME]"));
  }
  // Sequências de 2 a 6 palavras capitalizadas (ou em caixa alta) seguidas de qualificação
  t = t.replace(
    /\b([A-ZÀ-Ý][a-zà-ÿ]+|[A-ZÀ-Ý]{2,})(?:\s+(?:d[aeo]s?|e|[A-ZÀ-Ý][a-zà-ÿ]+|[A-ZÀ-Ý]{2,})){1,5}(?=\s*,\s*(?:brasileir|portador|inscrit|natural|solteir|casad|divorciad|viúv|maior|menor))/g,
    (m) => {
      if (m.split(/\s+/).every((p) => PRESERVAR.has(p))) return m;
      n++;
      return "[NOME]";
    },
  );
  return { texto: t, substituicoes: n };
}
