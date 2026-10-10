import { AreaTexto, Caixa, Campo, Grade, Selecao } from "@/components/ui";

export type Opcao = { valor: string; rotulo: string };

export const AREAS: Opcao[] = ["", "Cível", "Família", "Consumidor", "Trabalhista", "Previdenciária", "Tributária", "Penal", "Empresarial", "Administrativa", "Outra"].map((a) => ({ valor: a, rotulo: a || "Selecione" }));
export const POLOS: Opcao[] = [
  { valor: "", rotulo: "Selecione" },
  { valor: "ativo", rotulo: "Ativo (autor, reclamante, exequente)" },
  { valor: "passivo", rotulo: "Passivo (réu, reclamado, executado)" },
  { valor: "terceiro", rotulo: "Terceiro interessado" },
  { valor: "outro", rotulo: "Outro" },
];

export function CamposProcesso({
  processo = {},
  clientes,
  ritos,
}: {
  processo?: Record<string, unknown>;
  clientes: Opcao[];
  ritos: Opcao[];
}) {
  const v = (k: string) => (processo[k] as string | null | undefined) ?? "";
  return (
    <>
      <Grade>
        <Selecao rotulo="Cliente" name="cliente_id" opcoes={[{ valor: "", rotulo: "Sem cliente" }, ...clientes]} defaultValue={v("cliente_id")} />
        <Selecao rotulo="Rito para contagem de prazos" name="rito" opcoes={ritos} defaultValue={v("rito") || "civel_cpc"} />
        <Campo rotulo="Comarca" name="comarca" defaultValue={v("comarca")} ajuda="Usada para aplicar feriados municipais." />
        <Campo rotulo="Vara ou órgão" name="vara" defaultValue={v("vara")} />
        <Selecao rotulo="Área" name="area" opcoes={AREAS} defaultValue={v("area")} />
        <Selecao rotulo="Polo do cliente" name="polo" opcoes={POLOS} defaultValue={v("polo")} />
      </Grade>
      <AreaTexto rotulo="Observações internas" name="observacoes" rows={2} defaultValue={v("observacoes")} />
      <Caixa name="monitorado" defaultChecked={processo.monitorado !== false} rotulo="Monitorar andamentos diariamente (conta na cota do plano)" />
    </>
  );
}
