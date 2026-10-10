/**
 * Número único de processo (Resolução CNJ 65/2008): NNNNNNN-DD.AAAA.J.TR.OOOO
 * DD = 98 - ((NNNNNNN AAAA J TR OOOO 00) mod 97)
 */

export type NumeroCnj = {
  digitos: string; // 20 dígitos
  sequencial: string;
  dv: string;
  ano: string;
  segmento: string; // J
  tribunal: string; // TR
  origem: string; // OOOO
};

export function somenteDigitos(v: string): string {
  return (v || "").replace(/\D/g, "");
}

export function calcularDv(sequencial: string, ano: string, segmento: string, tribunal: string, origem: string): string {
  const base = BigInt(`${sequencial}${ano}${segmento}${tribunal}${origem}00`);
  const resto = Number(base % BigInt(97));
  return String(98 - resto).padStart(2, "0");
}

export function parseCnj(entrada: string): NumeroCnj | null {
  const d = somenteDigitos(entrada);
  if (d.length !== 20) return null;
  return {
    digitos: d,
    sequencial: d.slice(0, 7),
    dv: d.slice(7, 9),
    ano: d.slice(9, 13),
    segmento: d.slice(13, 14),
    tribunal: d.slice(14, 16),
    origem: d.slice(16, 20),
  };
}

export type ValidacaoCnj = { valido: true; numero: NumeroCnj } | { valido: false; erro: string };

export function validarCnj(entrada: string): ValidacaoCnj {
  const d = somenteDigitos(entrada);
  if (d.length !== 20) return { valido: false, erro: "O número CNJ deve ter 20 dígitos." };
  const n = parseCnj(d)!;
  const esperado = calcularDv(n.sequencial, n.ano, n.segmento, n.tribunal, n.origem);
  if (esperado !== n.dv) return { valido: false, erro: "Dígito verificador inválido. Confira o número digitado." };
  if (n.segmento === "0") return { valido: false, erro: "Segmento de justiça inválido." };
  return { valido: true, numero: n };
}

export function formatarCnj(entrada: string): string {
  const n = parseCnj(entrada);
  if (!n) return entrada;
  return `${n.sequencial}-${n.dv}.${n.ano}.${n.segmento}.${n.tribunal}.${n.origem}`;
}

/** Encontra números CNJ (com ou sem máscara) em um texto. */
export function extrairNumerosCnj(texto: string): { bruto: string; digitos: string; indice: number }[] {
  const re = /\b(\d{7})-?(\d{2})\.?(\d{4})\.?(\d)\.?(\d{2})\.?(\d{4})\b/g;
  const out: { bruto: string; digitos: string; indice: number }[] = [];
  for (const m of texto.matchAll(re)) {
    out.push({ bruto: m[0], digitos: m.slice(1, 7).join(""), indice: m.index ?? 0 });
  }
  return out;
}
