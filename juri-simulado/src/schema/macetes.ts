import { z } from "zod";

const texto = z.string().trim().min(1, "campo obrigatório vazio");

/** Status da conferência de cada dispositivo legal ou precedente. */
export const StatusVerificacao = z.enum([
  "confirmado", // conferido no texto oficial (Planalto / STF)
  "fonte_secundaria", // conferido só em fonte secundária: a interface mostra VERIFICAR
  "verificar", // não conferido: a interface mostra VERIFICAR
]);

export const Dispositivo = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  rotulo: texto, // como aparece na tela: "art. 478, I, CPP"
  diploma: z.enum(["CPP", "CP", "CPM", "CF", "STF", "STJ"]),
  resumo: texto,
  fonteOficial: z.string().url(),
  status: StatusVerificacao,
  fonteConsultada: texto,
  observacao: z.string().optional(),
});

export const Fase = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  ordem: z.number().int(),
  titulo: texto,
  descricao: texto,
});

/**
 * Macete genérico (vale para qualquer júri). A aplicação ao caso concreto
 * fica em caso.json, chave `macetes[id].aplicacao`, para que este arquivo
 * possa ser reaproveitado em outro processo.
 */
export const Macete = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  fase: z.string(),
  ordem: z.number().int(),
  titulo: texto,
  dispositivos: z.array(z.string()).min(1, "todo macete precisa de ao menos um artigo"),
  momento: texto,
  pedido: texto,
  formula: texto,
  seNaoFizer: texto,
  alerta: z.string().optional(),
  divergencia: z.string().optional(),
  /** Aparece na lista de requerimentos do Modo plenário. */
  requerimento: z.boolean().default(false),
});

export const MacetesArquivo = z.object({
  meta: z.object({
    titulo: texto,
    atualizadoEm: texto,
    regraDeOuro: texto,
    formulaPadrao: texto,
    pelaOrdemOuAparte: texto,
  }),
  fases: z.array(Fase).min(1),
  dispositivos: z.array(Dispositivo).min(1),
  macetes: z.array(Macete).min(1),
});

export type TDispositivo = z.infer<typeof Dispositivo>;
export type TMacete = z.infer<typeof Macete>;
export type TMacetesArquivo = z.infer<typeof MacetesArquivo>;
