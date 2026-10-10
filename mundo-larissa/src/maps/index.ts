import type { MapDef } from './types';
import { praca } from './m01_praca';
import { shopping } from './m02_shopping';

/**
 * LISTA DE MAPAS
 * Para adicionar um mapa: crie um arquivo mNN_nome.ts (copie um existente), importe aqui e
 * coloque na lista. A ordem (campo `order`) define a sequência de desbloqueio.
 */
export const MAPS: MapDef[] = [praca, shopping].sort((a, b) => a.order - b.order);

const BY_ID: Record<string, MapDef> = Object.fromEntries(MAPS.map((m) => [m.id, m]));

/** Gerador de mapas extras (casas). Preenchido pelo módulo de casas. */
let extraResolver: ((id: string) => MapDef | undefined) | null = null;
export function setExtraMapResolver(fn: (id: string) => MapDef | undefined) {
  extraResolver = fn;
}

export function getMap(id: string): MapDef | undefined {
  return BY_ID[id] ?? extraResolver?.(id);
}

export function nextMap(id: string): MapDef | undefined {
  const m = BY_ID[id];
  return m ? MAPS.find((x) => x.order === m.order + 1) : undefined;
}

export function prevMap(id: string): MapDef | undefined {
  const m = BY_ID[id];
  return m ? MAPS.find((x) => x.order === m.order - 1) : undefined;
}
