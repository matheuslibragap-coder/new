import { AreaTexto, Campo, Selecao } from "./ui";
import { Enviar } from "./cliente";
import { VARIAVEIS_DISPONIVEIS } from "@/lib/modelos-texto";

export const TIPOS_MODELO = [
  { valor: "contrato_honorarios", rotulo: "Contrato de honorários" },
  { valor: "procuracao", rotulo: "Procuração" },
  { valor: "declaracao", rotulo: "Declaração" },
  { valor: "outro", rotulo: "Outro" },
];

export function FormModelo({ acao, modelo = {} }: { acao: (fd: FormData) => Promise<void>; modelo?: { id?: string; nome?: string; tipo?: string; conteudo?: string } }) {
  return (
    <form action={acao} className="space-y-3">
      {modelo.id && <input type="hidden" name="id" value={modelo.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Nome do modelo" name="nome" required defaultValue={modelo.nome} />
        <Selecao rotulo="Tipo" name="tipo" opcoes={TIPOS_MODELO} defaultValue={modelo.tipo ?? "contrato_honorarios"} />
      </div>
      <AreaTexto rotulo="Conteúdo" name="conteudo" rows={18} required defaultValue={modelo.conteudo} className="font-mono" />
      <details className="text-sm text-slate-600">
        <summary className="cursor-pointer">Variáveis disponíveis</summary>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {VARIAVEIS_DISPONIVEIS.map((v) => (
            <li key={v.nome}>
              <code className="rounded bg-slate-100 px-1">{`{{${v.nome}}}`}</code> {v.descricao}
            </li>
          ))}
        </ul>
      </details>
      <Enviar>Salvar modelo</Enviar>
    </form>
  );
}
