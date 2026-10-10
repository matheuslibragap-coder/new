"use client";

import { useActionState } from "react";
import { salvarPerfil, type EstadoPerfil } from "@/app/onboarding/actions";
import { AREAS_ATUACAO } from "@/lib/areas";
import type { Perfil } from "@/lib/tipos";

export function FormPerfil({ perfil, origem }: { perfil: Perfil; origem: "onboarding" | "conta" }) {
  const [estado, acao, pendente] = useActionState<EstadoPerfil, FormData>(salvarPerfil, {});
  const outras = perfil.areas.filter((a) => !AREAS_ATUACAO.includes(a)).join(", ");

  return (
    <form action={acao} className="space-y-5">
      <input type="hidden" name="origem" value={origem} />
      <div>
        <label htmlFor="nome_profissional" className="rotulo">
          Nome profissional
        </label>
        <input
          id="nome_profissional"
          name="nome_profissional"
          className="campo"
          defaultValue={perfil.nome_profissional ?? ""}
          placeholder="Ex.: Dra. Ana Souza"
          required
        />
      </div>

      <fieldset>
        <legend className="rotulo">Áreas de atuação</legend>
        <div className="flex flex-wrap gap-2">
          {AREAS_ATUACAO.map((a) => (
            <label key={a} className="cursor-pointer">
              <input type="checkbox" name="areas" value={a} defaultChecked={perfil.areas.includes(a)} className="peer sr-only" />
              <span className="inline-block rounded-full border border-stone-300 bg-white px-3 py-2 text-sm peer-checked:border-marca peer-checked:bg-marca peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-slate-300">
                {a}
              </span>
            </label>
          ))}
        </div>
        <input
          name="outras_areas"
          className="campo mt-3"
          defaultValue={outras}
          placeholder="Outras áreas, separadas por vírgula"
        />
      </fieldset>

      <div>
        <label htmlFor="cidade" className="rotulo">
          Cidade
        </label>
        <input id="cidade" name="cidade" className="campo" defaultValue={perfil.cidade ?? ""} placeholder="Ex.: Santa Maria/RS" required />
      </div>

      <fieldset>
        <legend className="rotulo">Tom dos posts</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "formal", t: "Formal", d: "Linguagem técnica e institucional" },
            { v: "acessivel", t: "Acessível", d: "Linguagem simples, para leigos" },
          ].map((o) => (
            <label key={o.v} className="cursor-pointer">
              <input type="radio" name="tom" value={o.v} defaultChecked={perfil.tom === o.v} className="peer sr-only" required />
              <span className="block h-full rounded-xl border border-stone-300 bg-white p-3 peer-checked:border-marca peer-checked:ring-2 peer-checked:ring-slate-300">
                <span className="block font-semibold">{o.t}</span>
                <span className="block text-xs text-stone-500">{o.d}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {estado.erro && <p className="erro">{estado.erro}</p>}
      {estado.ok && <p className="sucesso">Dados salvos.</p>}

      <button type="submit" className="btn-primario w-full" disabled={pendente}>
        {pendente ? "Salvando..." : origem === "onboarding" ? "Concluir cadastro" : "Salvar alterações"}
      </button>
    </form>
  );
}
