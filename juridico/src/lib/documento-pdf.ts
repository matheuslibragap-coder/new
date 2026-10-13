import "server-only";
import { gerarPdf } from "./pdf";

/** PDF de contrato ou procuração: texto corrido, sem o aviso de cálculo. */
export async function gerarPdfDocumento(titulo: string, conteudo: string, escritorio: string): Promise<Uint8Array> {
  const paragrafos = conteudo.split(/\n{2,}/);
  return gerarPdf({
    titulo,
    incluirAviso: false,
    rodape: escritorio,
    blocos: paragrafos.map((p, i) => (i === 0 && p === p.toUpperCase() && p.length < 120 ? { tipo: "titulo" as const, texto: p } : { tipo: "paragrafo" as const, texto: p })),
  });
}
