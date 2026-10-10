import "server-only";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { AVISO_RESPONSABILIDADE } from "./textos";

/**
 * Geração de PDFs (memórias de cálculo, contratos, procurações) com fontes padrão.
 * As fontes padrão usam WinAnsi: caracteres fora dele são substituídos.
 */

export type BlocoPdf =
  | { tipo: "titulo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "paragrafo"; texto: string; negrito?: boolean }
  | { tipo: "tabela"; colunas: string[]; linhas: string[][]; larguras?: number[] }
  | { tipo: "espaco"; altura?: number };

const MARGEM = 50;
const LARGURA = 595.28; // A4
const ALTURA = 841.89;

function sanear(t: string): string {
  return t
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ€]/g, "?");
}

function quebrarLinhas(texto: string, fonte: PDFFont, tamanho: number, largura: number): string[] {
  const linhas: string[] = [];
  for (const paragrafo of sanear(texto).split("\n")) {
    if (paragrafo.trim() === "") {
      linhas.push("");
      continue;
    }
    let atual = "";
    for (const palavra of paragrafo.split(/\s+/)) {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (fonte.widthOfTextAtSize(teste, tamanho) > largura && atual) {
        linhas.push(atual);
        atual = palavra;
      } else {
        atual = teste;
      }
    }
    linhas.push(atual);
  }
  return linhas;
}

export async function gerarPdf(opcoes: { titulo: string; blocos: BlocoPdf[]; rodape?: string; incluirAviso?: boolean; marcaDagua?: string }): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(sanear(opcoes.titulo));
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const negrito = await doc.embedFont(StandardFonts.HelveticaBold);
  const util = LARGURA - 2 * MARGEM;
  let pagina: PDFPage = doc.addPage([LARGURA, ALTURA]);
  let y = ALTURA - MARGEM;

  const novaPagina = () => {
    pagina = doc.addPage([LARGURA, ALTURA]);
    y = ALTURA - MARGEM;
  };
  const garantir = (altura: number) => {
    if (y - altura < MARGEM + 30) novaPagina();
  };
  const escrever = (texto: string, fonte: PDFFont, tamanho: number, x = MARGEM, largura = util) => {
    for (const linha of quebrarLinhas(texto, fonte, tamanho, largura)) {
      garantir(tamanho + 4);
      pagina.drawText(linha, { x, y: y - tamanho, size: tamanho, font: fonte, color: rgb(0.1, 0.1, 0.1) });
      y -= tamanho + 4;
    }
  };

  for (const b of opcoes.blocos) {
    if (b.tipo === "titulo") {
      escrever(b.texto, negrito, 15);
      y -= 6;
    } else if (b.tipo === "subtitulo") {
      y -= 4;
      escrever(b.texto, negrito, 11.5);
      y -= 2;
    } else if (b.tipo === "paragrafo") {
      escrever(b.texto, b.negrito ? negrito : normal, 10.5);
      y -= 4;
    } else if (b.tipo === "espaco") {
      y -= b.altura ?? 10;
    } else if (b.tipo === "tabela") {
      const n = b.colunas.length;
      const larg = b.larguras ?? Array(n).fill(1);
      const soma = larg.reduce((s, v) => s + v, 0);
      const ws = larg.map((v) => (v / soma) * util);
      const desenharLinha = (cel: string[], fonte: PDFFont) => {
        const quebras = cel.map((c, i) => quebrarLinhas(c, fonte, 8.5, ws[i] - 6));
        const altura = Math.max(...quebras.map((q) => q.length)) * 11 + 4;
        garantir(altura);
        let x = MARGEM;
        quebras.forEach((q, i) => {
          q.forEach((linha, k) => pagina.drawText(linha, { x: x + 3, y: y - 10 - k * 11, size: 8.5, font: fonte }));
          x += ws[i];
        });
        pagina.drawLine({ start: { x: MARGEM, y: y - altura }, end: { x: MARGEM + util, y: y - altura }, thickness: 0.4, color: rgb(0.7, 0.7, 0.7) });
        y -= altura;
      };
      desenharLinha(b.colunas, negrito);
      for (const l of b.linhas) desenharLinha(l, normal);
      y -= 8;
    }
  }

  if (opcoes.incluirAviso !== false) {
    y -= 8;
    escrever(AVISO_RESPONSABILIDADE, negrito, 9.5);
  }

  const paginas = doc.getPages();
  paginas.forEach((p, i) => {
    const rod = sanear(`${opcoes.rodape ?? ""}${opcoes.rodape ? "  |  " : ""}Página ${i + 1} de ${paginas.length}`);
    p.drawText(rod, { x: MARGEM, y: 25, size: 8, font: normal, color: rgb(0.4, 0.4, 0.4) });
    if (opcoes.marcaDagua) {
      p.drawText(sanear(opcoes.marcaDagua), { x: 120, y: 380, size: 60, font: negrito, color: rgb(0.85, 0.85, 0.85), rotate: degrees(35), opacity: 0.4 });
    }
  });
  return doc.save();
}
