/**
 * Preenchimento de modelos com variáveis {{nome}} (M7).
 */
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function dataPorExtenso(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  return `${d === 1 ? "1º" : d} de ${MESES[m - 1]} de ${a}`;
}

export const VARIAVEIS_DISPONIVEIS: { nome: string; descricao: string }[] = [
  { nome: "cliente_nome", descricao: "Nome do cliente" },
  { nome: "cliente_documento", descricao: "CPF ou CNPJ do cliente" },
  { nome: "cliente_qualificacao", descricao: "Nacionalidade, estado civil e profissão" },
  { nome: "cliente_endereco", descricao: "Endereço do cliente" },
  { nome: "cliente_email", descricao: "E-mail do cliente" },
  { nome: "advogado_nome", descricao: "Nome do(a) advogado(a)" },
  { nome: "advogado_oab", descricao: "Número da OAB" },
  { nome: "advogado_oab_uf", descricao: "UF da OAB" },
  { nome: "escritorio_nome", descricao: "Nome do escritório" },
  { nome: "processo_numero", descricao: "Número CNJ do processo" },
  { nome: "objeto", descricao: "Objeto do contrato ou finalidade" },
  { nome: "valor", descricao: "Valor dos honorários" },
  { nome: "forma_pagamento", descricao: "Forma de pagamento" },
  { nome: "percentual_exito", descricao: "Percentual de êxito" },
  { nome: "cidade", descricao: "Cidade de assinatura" },
  { nome: "data_extenso", descricao: "Data por extenso" },
];

export function variaveisDoModelo(conteudo: string): string[] {
  return [...new Set([...conteudo.matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi)].map((m) => m[1]))];
}

export function preencherModelo(conteudo: string, valores: Record<string, string | null | undefined>): { texto: string; faltantes: string[] } {
  const faltantes = new Set<string>();
  const texto = conteudo.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, nome: string) => {
    const v = valores[nome];
    if (v === undefined || v === null || String(v).trim() === "") {
      faltantes.add(nome);
      return `[${nome.toUpperCase()}]`;
    }
    return String(v);
  });
  return { texto, faltantes: [...faltantes] };
}
