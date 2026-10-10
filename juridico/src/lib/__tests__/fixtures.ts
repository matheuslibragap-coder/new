import type { Feriado, RegraPrazo } from "@/lib/prazos/motor";

// Espelho dos padrões de supabase/migrations/0007_seed_base.sql
export const CIVEL: RegraPrazo = {
  codigo: "civel_cpc", nome: "Cível (CPC)", contagem: "uteis", exclui_dia_inicio: true,
  suspensao_inicio: "12-20", suspensao_fim: "01-20", dje_publicacao_dia_util_seguinte: true,
  portal_dias_ciencia_ficta: 10, inicio_e_fim_em_dia_util: true, permite_dobra: true, fundamentacao: "CPC",
};
export const PENAL: RegraPrazo = { ...CIVEL, codigo: "penal_cpp", nome: "Penal", contagem: "corridos", suspensao_inicio: null, suspensao_fim: null };

const nac = (data: string, descricao: string): Feriado => ({ data, descricao, tipo: "feriado", abrangencia: "nacional" });
const tj = (data: string, descricao: string, tipo: Feriado["tipo"] = "feriado"): Feriado =>
  ({ data, descricao, tipo, abrangencia: "estadual", uf: "RS", tribunal: "TJRS" });

export const FERIADOS: Feriado[] = [
  nac("2026-04-03", "Sexta-feira Santa"),
  nac("2027-01-01", "Confraternização Universal"),
  tj("2026-02-16", "Carnaval"),
  tj("2026-02-17", "Carnaval"),
  tj("2026-02-18", "Quarta-feira de Cinzas", "expediente_reduzido"),
  { data: "2026-02-02", descricao: "Navegantes", tipo: "feriado", abrangencia: "comarca", uf: "RS", comarca: "porto alegre" },
  ...Array.from({ length: 18 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 11, 20 + i));
    return tj(d.toISOString().slice(0, 10), "Recesso forense", "recesso");
  }),
];
