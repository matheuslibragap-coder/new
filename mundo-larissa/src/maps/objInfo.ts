import { OBJECTS } from '../art/objects';

/** Informações de um objeto colocado no mapa (pegada, se bloqueia, se é "chato" como tapete). */
export interface ObjInfo {
  w: number;
  d: number;
  solid: boolean;
  flat: boolean;
  wall?: boolean;
  artKey: string;
}

type Provider = (type: string) => ObjInfo | null;
const providers: Provider[] = [
  (type) => {
    const o = OBJECTS[type];
    if (!o) return null;
    const solid = o.solid !== false;
    return { w: o.w, d: o.d, solid, flat: !solid && o.h < 12, artKey: `obj:${type}` };
  },
];

export function addObjProvider(p: Provider) {
  providers.unshift(p);
}

export function objInfo(type: string): ObjInfo | null {
  for (const p of providers) {
    const r = p(type);
    if (r) return r;
  }
  return null;
}
