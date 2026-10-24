import type { MapDef } from './types';
import { praca } from './m01_praca';
import { shopping } from './m02_shopping';
import { salao } from './m03_salao';
import { confeitaria } from './m04_confeitaria';
import { parque } from './m05_parque';
import { clinica } from './m06_clinica';
import { praia } from './m07_praia';
import { danca } from './m08_danca';
import { biblioteca } from './m09_biblioteca';
import { fazenda } from './m10_fazenda';
import { diversoes } from './m11_diversoes';
import { gelo } from './m12_gelo';
import { atelie } from './m13_atelie';
import { floresta } from './m14_floresta';
import { castelo } from './m15_castelo';

/**
 * LISTA DE MAPAS
 * Para adicionar um mapa: crie um arquivo mNN_nome.ts (copie um existente), importe aqui e
 * coloque na lista. A ordem (campo `order`) define a sequência de desbloqueio.
 */
export const MAPS: MapDef[] = [
  praca, shopping, salao, confeitaria, parque, clinica, praia, danca,
  biblioteca, fazenda, diversoes, gelo, atelie, floresta, castelo,
].sort((a, b) => a.order - b.order);

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
