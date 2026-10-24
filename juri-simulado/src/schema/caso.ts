import { z } from "zod";

const texto = z.string().trim().min(1, "campo obrigatório vazio");
const id = z.string().regex(/^[a-z0-9-]+$/);

/** Texto padrão exibido quando uma informação não está no estudo do caso. */
export const NAO_CONSTA = "não consta nos autos";

/** Onde a informação está nos autos. `folha: null` aparece como "não consta nos autos". */
export const Fonte = z.object({
  peca: texto,
  folha: z.string().nullable(),
});

export const Impacto = z.enum(["favorece", "prejudica", "neutro"]);
export const Peso = z.enum(["alto", "medio", "baixo"]);

export const FaseProcesso = z.enum([
  "inquerito",
  "instrucao",
  "primeira-fase",
  "recursos",
  "plenario",
  "execucao",
]);

export const Pessoa = z.object({
  papel: texto,
  nome: texto,
  alcunha: z.string().nullable(),
  idade: z.string().nullable(),
  descricao: texto,
});

export const EventoFato = z.object({
  id,
  ordem: z.number(),
  momento: texto, // hora, ou "não consta nos autos"
  titulo: texto,
  descricao: texto,
  relatoDe: texto, // quem conta: perícia, réu, testemunha...
  fonte: Fonte,
  impacto: Impacto,
});

export const EventoProcesso = z.object({
  id,
  ordem: z.number(),
  data: z.string().nullable(), // null = não consta nos autos
  fase: FaseProcesso,
  titulo: texto,
  descricao: texto,
  fonte: Fonte,
  impacto: Impacto,
  dispositivos: z.array(z.string()).default([]),
});

export const Prova = z.object({
  id,
  titulo: texto,
  descricao: texto,
  fonte: Fonte,
  peso: Peso,
});

export const ProvaNegativa = Prova.extend({ respostaDefesa: texto });

export const LinhaTestemunha = z.object({
  id,
  tema: texto,
  categoria: z.enum(["viu", "nao-viu", "contra", "contexto"]),
  policia: z.string().nullable(),
  juizo: z.string().nullable(),
  plenario: z.string().nullable(),
  /** Fase não identificada no estudo: o relato existe, mas não se sabe em qual depoimento. */
  semFase: z.string().nullable(),
  cresceu: z.boolean(),
  nota: texto,
});

export const PontoAtencao = z.object({
  id,
  titulo: texto,
  risco: texto,
  motivo: texto,
  neutralizar: texto,
  dispositivos: z.array(z.string()).default([]),
  gravidade: Peso,
});

export const Tese = z.object({
  id,
  prioridade: z.number().int(),
  pai: z.string().nullable(),
  rotulo: texto, // "Principal", "1ª subsidiária"...
  titulo: texto,
  fundamento: texto,
  dispositivos: z.array(z.string()).min(1),
  provas: z.array(z.string()).min(1), // ids do mapa de provas
  quesito: texto,
  minutos: z.number().positive(),
  observacao: z.string().optional(),
});

export const TipoQuesito = z.enum([
  "materialidade",
  "autoria",
  "absolvicao",
  "desclassificacao",
  "diminuicao",
  "qualificadora",
]);

export const Quesito = z.object({
  id,
  tipo: TipoQuesito,
  rotulo: texto,
  texto: texto,
  dispositivos: z.array(z.string()).min(1),
  nota: z.string().optional(),
});

export const Resultado = z.object({
  rotulo: texto,
  capitulacao: texto,
  penaAbstrata: texto,
  dispositivos: z.array(z.string()).min(1),
  nota: z.string().optional(),
});

export const Quesitacao = z.object({
  jurados: z.literal(7),
  maioria: z.literal(4),
  aviso: texto,
  regras: z.array(texto).min(1),
  quesitos: z.array(Quesito).min(5),
  posicaoDesclassificacao: z.object({
    padrao: z.enum(["apos-ii", "apos-iii", "nenhuma"]),
    nota: texto,
  }),
  resultados: z.object({
    absolvicao: Resultado,
    desclassificacao: Resultado,
    simples: Resultado,
    privilegiado: Resultado,
    qualificado: Resultado,
    qualificadoPrivilegiado: Resultado,
  }),
});

export const FalaMP = z.object({
  id,
  fala: texto,
  resposta: texto,
  reacao: texto,
  dispositivos: z.array(z.string()).default([]),
});

export const ParagrafoSustentacao = z.object({
  id,
  texto: texto,
  alerta: z.string().optional(),
  versaoRevisada: z.string().optional(),
});

export const Roteiro = z.object({
  id,
  testemunha: texto,
  objetivo: texto,
  perguntas: z.array(z.object({ etapa: texto, pergunta: texto, alvo: texto })).min(1),
  cuidado: texto,
});

export const CasoArquivo = z.object({
  meta: z.object({
    titulo: texto,
    fonte: texto,
    premissa: texto,
    avisoFontes: texto,
  }),
  painel: z.object({
    processo: texto,
    vara: texto,
    imputacaoAtual: z.object({ texto, dispositivos: z.array(z.string()).min(1) }),
    faseSimulada: texto,
    resumo: z.array(texto).length(5, "o resumo deve ter exatamente cinco linhas"),
    pessoas: z.array(Pessoa).min(2),
    local: texto,
  }),
  linhaFato: z.array(EventoFato).min(1),
  linhaProcesso: z.array(EventoProcesso).min(1),
  provas: z.object({
    favorece: z.array(Prova).min(1),
    dificulta: z.array(ProvaNegativa).min(1),
  }),
  /** Testemunha cujo relato é comparado fase a fase (polícia, juízo, plenário). */
  testemunhaChave: z.object({
    nome: texto,
    introducao: texto,
    linhas: z.array(LinhaTestemunha).min(1),
  }),
  pontosAtencao: z.array(PontoAtencao).min(5),
  principio: texto,
  recomendacao: texto,
  teses: z.array(Tese).min(4),
  quesitacao: Quesitacao,
  roteiros: z.array(Roteiro).default([]),
  criteriosJurados: z.array(texto).default([]),
  falasMP: z.array(FalaMP).default([]),
  sustentacao: z.array(ParagrafoSustentacao).default([]),
  checklist: z.array(texto).default([]),
  /** Aplicação de cada macete genérico ao caso. Chave = id do macete. */
  macetes: z.record(
    z.string(),
    z.object({ aplicacao: texto, formula: z.string().optional() }),
  ),
});

export type TCaso = z.infer<typeof CasoArquivo>;
export type TQuesito = z.infer<typeof Quesito>;
export type TResultado = z.infer<typeof Resultado>;
export type TQuesitacao = z.infer<typeof Quesitacao>;
