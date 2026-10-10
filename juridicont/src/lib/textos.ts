export const AVISO_LEGAL =
  "Esta análise é um checklist automatizado e não constitui parecer jurídico. A responsabilidade pela publicação é do(a) advogado(a).";

export const CODIGO_NAO_CATALOGADO = "NAO_CATALOGADO";
export const TEXTO_NAO_CATALOGADO = "Possível risco não catalogado, revise com cautela.";

export const ROTULO_SEVERIDADE = {
  verde: "Sem riscos identificados pela base de regras",
  amarelo: "Atenção: revise antes de publicar",
  vermelho: "Risco alto: não publique assim",
} as const;

export const ROTULO_CURTO_SEVERIDADE = {
  verde: "Verde",
  amarelo: "Amarelo",
  vermelho: "Vermelho",
} as const;

export function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(iso: string, comHora = true) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(comHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
