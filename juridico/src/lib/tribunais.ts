/**
 * Identificação do tribunal pelo segmento J.TR do número CNJ e alias do endpoint
 * da API Pública do DataJud (https://api-publica.datajud.cnj.jus.br/api_publica_{alias}/_search).
 */

export type Tribunal = { sigla: string; alias: string | null; uf: string | null; nome: string };

// Ordem das UFs usada nos códigos TR da Justiça Estadual e Eleitoral (Res. CNJ 65/2008)
const UFS: [string, string][] = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"],
  ["CE", "Ceará"], ["DF", "Distrito Federal e Territórios"], ["ES", "Espírito Santo"], ["GO", "Goiás"],
  ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"],
  ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"], ["PE", "Pernambuco"], ["PI", "Piauí"],
  ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"],
  ["RR", "Roraima"], ["SC", "Santa Catarina"], ["SE", "Sergipe"], ["SP", "São Paulo"], ["TO", "Tocantins"],
];

// UF sede de cada TRT (TR 01 a 24)
const TRT_UF: Record<number, string> = {
  1: "RJ", 2: "SP", 3: "MG", 4: "RS", 5: "BA", 6: "PE", 7: "CE", 8: "PA", 9: "PR", 10: "DF", 11: "AM", 12: "SC",
  13: "PB", 14: "RO", 15: "SP", 16: "MA", 17: "ES", 18: "GO", 19: "AL", 20: "SE", 21: "RN", 22: "PI", 23: "MT", 24: "MS",
};

export function identificarTribunal(segmento: string, tr: string): Tribunal | null {
  const t = Number(tr);
  switch (segmento) {
    case "1":
      return { sigla: "STF", alias: null, uf: null, nome: "Supremo Tribunal Federal" };
    case "2":
      return { sigla: "CNJ", alias: null, uf: null, nome: "Conselho Nacional de Justiça" };
    case "3":
      return { sigla: "STJ", alias: "stj", uf: null, nome: "Superior Tribunal de Justiça" };
    case "4":
      if (t === 0) return { sigla: "CJF", alias: null, uf: null, nome: "Conselho da Justiça Federal" };
      if (t >= 1 && t <= 6) return { sigla: `TRF${t}`, alias: `trf${t}`, uf: null, nome: `Tribunal Regional Federal da ${t}ª Região` };
      return null;
    case "5":
      if (t === 0) return { sigla: "TST", alias: "tst", uf: null, nome: "Tribunal Superior do Trabalho" };
      if (t >= 1 && t <= 24) return { sigla: `TRT${t}`, alias: `trt${t}`, uf: TRT_UF[t], nome: `Tribunal Regional do Trabalho da ${t}ª Região` };
      return null;
    case "6": {
      if (t === 0) return { sigla: "TSE", alias: "tse", uf: null, nome: "Tribunal Superior Eleitoral" };
      const uf = UFS[t - 1];
      if (!uf) return null;
      return { sigla: `TRE-${uf[0]}`, alias: `tre-${uf[0].toLowerCase()}`, uf: uf[0], nome: `Tribunal Regional Eleitoral (${uf[1]})` };
    }
    case "7":
      return { sigla: "STM", alias: "stm", uf: null, nome: "Superior Tribunal Militar" };
    case "8": {
      const uf = UFS[t - 1];
      if (!uf) return null;
      const sigla = uf[0] === "DF" ? "TJDFT" : `TJ${uf[0]}`;
      return { sigla, alias: sigla.toLowerCase(), uf: uf[0], nome: `Tribunal de Justiça (${uf[1]})` };
    }
    case "9": {
      const mapa: Record<number, Tribunal> = {
        13: { sigla: "TJMMG", alias: "tjmmg", uf: "MG", nome: "Tribunal de Justiça Militar de Minas Gerais" },
        21: { sigla: "TJMRS", alias: "tjmrs", uf: "RS", nome: "Tribunal de Justiça Militar do Rio Grande do Sul" },
        26: { sigla: "TJMSP", alias: "tjmsp", uf: "SP", nome: "Tribunal de Justiça Militar de São Paulo" },
      };
      return mapa[t] ?? null;
    }
    default:
      return null;
  }
}

/** Rito padrão sugerido pelo segmento (o advogado pode alterar). */
export function ritoSugerido(segmento: string): string {
  if (segmento === "5") return "trabalhista_clt";
  return "civel_cpc";
}

export const LISTA_UFS = UFS.map(([sigla]) => sigla);
