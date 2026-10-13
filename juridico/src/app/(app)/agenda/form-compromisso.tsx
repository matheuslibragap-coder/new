import { AreaTexto, Campo, Grade, Selecao } from "@/components/ui";
import { Enviar } from "@/components/cliente";
import { salvarCompromisso } from "./acoes";

export const TIPOS = [
  { valor: "audiencia", rotulo: "Audiência" },
  { valor: "sessao_julgamento", rotulo: "Sessão de julgamento" },
  { valor: "pericia", rotulo: "Perícia" },
  { valor: "reuniao", rotulo: "Reunião" },
  { valor: "diligencia", rotulo: "Diligência" },
  { valor: "outro", rotulo: "Outro" },
];

const ALERTAS = [
  { valor: 10080, rotulo: "7 dias antes" },
  { valor: 2880, rotulo: "2 dias antes" },
  { valor: 1440, rotulo: "1 dia antes" },
  { valor: 180, rotulo: "3 horas antes" },
  { valor: 60, rotulo: "1 hora antes" },
  { valor: 15, rotulo: "15 minutos antes" },
];

/** ISO -> valor de input datetime-local no horário de Brasília */
export function paraLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

export function FormCompromisso({ c = {}, processos }: { c?: Record<string, unknown>; processos: { valor: string; rotulo: string }[] }) {
  const v = (k: string) => (c[k] as string | null | undefined) ?? "";
  const alertas = (c.alertas_minutos as number[] | undefined) ?? [1440, 60];
  return (
    <form action={salvarCompromisso} className="space-y-3">
      {!!c.id && <input type="hidden" name="id" value={v("id")} />}
      <Campo rotulo="Título" name="titulo" required defaultValue={v("titulo")} placeholder="Ex.: Audiência de instrução" />
      <Grade>
        <Selecao rotulo="Tipo" name="tipo" opcoes={TIPOS} defaultValue={v("tipo") || "audiencia"} />
        <Campo rotulo="Subtipo" name="subtipo" defaultValue={v("subtipo")} placeholder="Conciliação, instrução e julgamento..." />
        <Campo rotulo="Início" name="inicio" type="datetime-local" required defaultValue={paraLocal(v("inicio"))} />
        <Campo rotulo="Término (opcional)" name="fim" type="datetime-local" defaultValue={paraLocal(v("fim"))} />
        <Selecao rotulo="Modalidade" name="modalidade" defaultValue={v("modalidade") || "presencial"} opcoes={[{ valor: "presencial", rotulo: "Presencial" }, { valor: "virtual", rotulo: "Virtual" }, { valor: "hibrida", rotulo: "Híbrida" }]} />
        <Selecao rotulo="Processo" name="processo_id" defaultValue={v("processo_id")} opcoes={[{ valor: "", rotulo: "Sem processo" }, ...processos]} />
      </Grade>
      <Campo rotulo="Link da sala virtual" name="link_sala" type="url" defaultValue={v("link_sala")} />
      <Campo rotulo="Local" name="local" defaultValue={v("local")} placeholder="Fórum, sala, endereço" />
      <AreaTexto rotulo="Observações" name="observacoes" rows={2} defaultValue={v("observacoes")} />
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Alertas (e-mail e push)</legend>
        <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3">
          {ALERTAS.map((a) => (
            <label key={a.valor} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="alertas" value={a.valor} defaultChecked={alertas.includes(a.valor)} /> {a.rotulo}
            </label>
          ))}
        </div>
      </fieldset>
      <Enviar>Salvar</Enviar>
    </form>
  );
}
