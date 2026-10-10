export const NOME_PRODUTO = process.env.NEXT_PUBLIC_NOME_PRODUTO || "Nome do Produto";

/** Aviso obrigatório em todo prazo, cálculo ou texto gerado (princípio 3). */
export const AVISO_RESPONSABILIDADE =
  "Cálculo automatizado. Confira antes de usar. A responsabilidade profissional é do(a) advogado(a).";

/** Atribuição obrigatória dos dados do DataJud (princípio 5). */
export const FONTE_DATAJUD = "Fonte: CNJ / DataJud";

export const AVISO_RASCUNHO = "RASCUNHO gerado com auxílio de IA. Revise integralmente antes de usar.";

export const AVISO_ASSINATURA =
  "Antes de enviar, confira se o tipo de assinatura eletrônica oferecido pelo provedor atende aos requisitos de validade para o uso pretendido (por exemplo, Lei 14.063/2020, MP 2.200-2/2001 e exigências específicas do tribunal ou do órgão destinatário).";

export const MENSAGENS_ERRO: Record<string, string> = {
  COTA_PROCESSOS: "Você atingiu o limite de processos monitorados do seu plano. Os processos existentes continuam acessíveis. Para monitorar mais, mude de plano ou desative o monitoramento de algum processo.",
  COTA_USUARIOS: "O plano atual não permite mais usuários.",
  ASSINATURA_INATIVA: "A assinatura não está ativa. Seus dados continuam acessíveis, mas novas ações deste tipo estão bloqueadas.",
  ENVIO_SEM_APROVACAO: "A mensagem precisa ser aprovada antes do envio.",
  CAMPOS_PROTEGIDOS: "Esses campos só podem ser alterados pelo sistema de pagamentos.",
  SEM_PERMISSAO: "Você não tem permissão para esta ação.",
  CONVITE_INVALIDO: "Convite inválido ou expirado.",
  CONVITE_OUTRO_EMAIL: "Este convite foi enviado para outro e-mail.",
};

/** Converte erro do banco em mensagem amigável. */
export function mensagemErro(err: unknown): string {
  const msg = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err);
  for (const [codigo, texto] of Object.entries(MENSAGENS_ERRO)) {
    if (msg.includes(codigo)) return texto;
  }
  if (msg.includes("row-level security")) return "Ação não permitida no seu plano ou perfil.";
  if (msg.includes("duplicate key")) return "Já existe um registro com esses dados.";
  return "Não foi possível concluir a ação. Tente novamente.";
}
