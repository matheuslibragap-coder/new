export type Severidade = "verde" | "amarelo" | "vermelho";
export type SeveridadeRegra = "amarelo" | "vermelho";

export type Regra = {
  id: string;
  codigo: string;
  titulo: string;
  dispositivo: string;
  descricao: string;
  exemplos_vedados: string[];
  exemplos_conformes: string[];
  severidade_padrao: SeveridadeRegra;
  ativa: boolean;
  revisao_pendente: boolean;
  atualizado_em: string;
};

export type Achado = {
  regra_codigo: string;
  trecho: string;
  severidade: Severidade;
  explicacao: string;
  sugestao_reescrita: string;
};

export type ResultadoChecagem = {
  classificacao_geral: Severidade;
  achados: Achado[];
  versao_reescrita_completa: string | null;
  texto_extraido_imagem?: string | null;
  elementos_visuais?: string[];
};

export type RegraSnapshot = Pick<Regra, "codigo" | "titulo" | "dispositivo" | "severidade_padrao">;

export const TIPOS_CONTEUDO = {
  post_feed: "Post de feed",
  legenda: "Legenda",
  roteiro_reels: "Roteiro de reels",
  stories: "Stories",
  bio: "Bio",
  anuncio_pago: "Anúncio pago",
} as const;
export type TipoConteudo = keyof typeof TIPOS_CONTEUDO;

export const FORMATOS_POST = {
  carrossel: "Carrossel",
  legenda: "Legenda",
  reels: "Ideia de reels",
} as const;
export type FormatoPost = keyof typeof FORMATOS_POST;

export type PlanoCodigo = "gratuito" | "essencial" | "pro";

export type Plano = {
  codigo: PlanoCodigo;
  nome: string;
  preco_centavos: number;
  limite_checagens: number;
  limite_posts: number;
  limite_auditorias: number;
  permite_reels: boolean;
  permite_anuncio: boolean;
  ordem: number;
};

export type Conta = {
  user_id: string;
  plano: PlanoCodigo;
  assinatura_status: "nenhuma" | "pendente" | "ativa" | "atrasada" | "cancelada";
  plano_pendente: PlanoCodigo | null;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  ciclo_inicio: string;
  ciclo_fim: string;
  checagens_usadas: number;
  posts_usados: number;
  auditorias_usadas: number;
};

export type Perfil = {
  id: string;
  email: string | null;
  nome_profissional: string | null;
  areas: string[];
  cidade: string | null;
  tom: "formal" | "acessivel" | null;
  papel: "usuario" | "admin";
  onboarding_concluido: boolean;
};
