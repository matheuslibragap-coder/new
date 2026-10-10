import { somenteDigitos } from "./cnj";

export function validarCpf(v: string): boolean {
  const c = somenteDigitos(v);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const dig = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dig(9) === Number(c[9]) && dig(10) === Number(c[10]);
}

export function validarCnpj(v: string): boolean {
  const c = somenteDigitos(v);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const dig = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = pesos.reduce((acc, p, i) => acc + p * Number(c[i]), 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dig(12) === Number(c[12]) && dig(13) === Number(c[13]);
}

export function formatarDocumento(v: string | null | undefined): string {
  const c = somenteDigitos(v || "");
  if (c.length === 11) return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (c.length === 14) return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return v || "";
}

/** Normaliza telefone brasileiro para o formato internacional sem "+" (ex.: 5551999999999). */
export function normalizarWhatsapp(v: string | null | undefined): string | null {
  let d = somenteDigitos(v || "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.length < 12 || d.length > 13) return null;
  return d;
}

export function formatarTelefone(v: string | null | undefined): string {
  const d = somenteDigitos(v || "");
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return v || "";
}

/** Link wa.me: abre o WhatsApp do próprio advogado com o texto pronto (custo zero). */
export function linkWaMe(telefone: string, texto: string): string {
  const n = normalizarWhatsapp(telefone);
  if (!n) throw new Error("Telefone de WhatsApp inválido.");
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}

export function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function centavosParaReais(c: number | string | null | undefined): number {
  return Number(c || 0) / 100;
}

/** Converte "1.234,56" ou "1234.56" em centavos. */
export function reaisParaCentavos(v: string | number): number {
  if (typeof v === "number") return Math.round(v * 100);
  const s = v.trim().replace(/[R$\s]/g, "");
  const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
  if (!Number.isFinite(n)) throw new Error("Valor inválido.");
  return Math.round(n * 100);
}

export function lerNumero(v: FormDataEntryValue | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (!s) return 0;
  return reaisParaCentavos(s) / 100;
}
