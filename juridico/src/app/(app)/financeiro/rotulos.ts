export const TIPOS_LANCAMENTO = [
  { valor: "honorario_contratual", rotulo: "Honorários contratuais" },
  { valor: "honorario_exito", rotulo: "Honorários de êxito" },
  { valor: "honorario_sucumbencia", rotulo: "Honorários de sucumbência" },
  { valor: "custas", rotulo: "Custas" },
  { valor: "reembolso", rotulo: "Reembolso de despesas" },
  { valor: "alvara", rotulo: "Alvará a receber" },
  { valor: "despesa", rotulo: "Despesa do escritório" },
];
export const rotuloTipo = (t: string) => TIPOS_LANCAMENTO.find((x) => x.valor === t)?.rotulo ?? t;
