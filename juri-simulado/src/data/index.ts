import casoJson from "./caso.json";
import macetesJson from "./macetes.json";
import { validarDados } from "../schema/validar";
import type { TDispositivo } from "../schema/macetes";

// Valida na carga: se o JSON estiver quebrado, a tela mostra o erro em vez de dados errados.
export const { caso, macetes } = validarDados(casoJson, macetesJson);

const porId = new Map(macetes.dispositivos.map((d) => [d.id, d]));
export const dispositivo = (id: string): TDispositivo => porId.get(id)!;

const provas = new Map([...caso.provas.favorece, ...caso.provas.dificulta].map((p) => [p.id, p]));
export const prova = (id: string) => provas.get(id)!;
export const provaFavorece = (id: string) => caso.provas.favorece.some((p) => p.id === id);

/** Fórmula do macete: a versão do caso, se houver, senão a genérica. */
export const formulaDe = (id: string, generica: string) => caso.macetes[id]?.formula ?? generica;

export const fasesOrdenadas = [...macetes.fases].sort((a, b) => a.ordem - b.ordem);
export const macetesOrdenados = [...macetes.macetes].sort((a, b) => {
  const fa = macetes.fases.find((f) => f.id === a.fase)!.ordem;
  const fb = macetes.fases.find((f) => f.id === b.fase)!.ordem;
  return fa - fb || a.ordem - b.ordem;
});
