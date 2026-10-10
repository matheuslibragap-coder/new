"use client";

import { useActionState } from "react";
import { salvarRegra, type EstadoRegra } from "./actions";
import type { Regra } from "@/lib/tipos";

export function FormRegra({ regra }: { regra?: Regra }) {
  const [estado, acao, pendente] = useActionState<EstadoRegra, FormData>(salvarRegra, {});
  return (
    <form action={acao} className="cartao space-y-4">
      {regra && <input type="hidden" name="id" value={regra.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="rotulo" htmlFor="codigo">Código</label>
          <input id="codigo" name="codigo" className="campo font-mono uppercase" defaultValue={regra?.codigo} placeholder="EX: PROMESSA_RESULTADO" required />
          <p className="mt-1 text-xs text-stone-500">É o identificador que a IA precisa citar. Evite mudar depois de usado.</p>
        </div>
        <div>
          <label className="rotulo" htmlFor="severidade_padrao">Severidade padrão</label>
          <select id="severidade_padrao" name="severidade_padrao" className="campo" defaultValue={regra?.severidade_padrao ?? "amarelo"}>
            <option value="amarelo">Amarelo</option>
            <option value="vermelho">Vermelho</option>
          </select>
        </div>
      </div>
      <div>
        <label className="rotulo" htmlFor="titulo">Título</label>
        <input id="titulo" name="titulo" className="campo" defaultValue={regra?.titulo} required />
      </div>
      <div>
        <label className="rotulo" htmlFor="dispositivo">Dispositivo</label>
        <input id="dispositivo" name="dispositivo" className="campo" defaultValue={regra?.dispositivo} placeholder="Provimento 205/2021, art. ..." required />
      </div>
      <div>
        <label className="rotulo" htmlFor="descricao">Descrição</label>
        <textarea id="descricao" name="descricao" className="campo min-h-24" defaultValue={regra?.descricao} required />
      </div>
      <div>
        <label className="rotulo" htmlFor="exemplos_vedados">Exemplos vedados (um por linha)</label>
        <textarea id="exemplos_vedados" name="exemplos_vedados" className="campo min-h-28" defaultValue={regra?.exemplos_vedados.join("\n")} />
      </div>
      <div>
        <label className="rotulo" htmlFor="exemplos_conformes">Exemplos conformes (um por linha)</label>
        <textarea id="exemplos_conformes" name="exemplos_conformes" className="campo min-h-24" defaultValue={regra?.exemplos_conformes.join("\n")} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="ativa" defaultChecked={regra?.ativa ?? true} className="h-5 w-5" />
          Ativa
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="revisao_pendente" defaultChecked={regra?.revisao_pendente ?? true} className="h-5 w-5" />
          Pendente de revisão humana
        </label>
      </div>
      {estado.erro && <p className="erro">{estado.erro}</p>}
      <button type="submit" className="btn-primario w-full sm:w-auto" disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar regra"}
      </button>
    </form>
  );
}
