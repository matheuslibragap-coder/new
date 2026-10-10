import "server-only";

/** Extrai texto de PDF ou DOCX enviado pelo advogado (M8 e M9). */
export async function extrairTexto(nomeArquivo: string, dados: ArrayBuffer): Promise<string> {
  const nome = nomeArquivo.toLowerCase();
  if (nome.endsWith(".pdf")) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(dados));
    const { text } = await extractText(pdf, { mergePages: true });
    return limpar(text);
  }
  if (nome.endsWith(".docx")) {
    const mammoth = (await import("mammoth")).default;
    const r = await mammoth.extractRawText({ buffer: Buffer.from(dados) });
    return limpar(r.value);
  }
  if (nome.endsWith(".txt")) return limpar(new TextDecoder("utf-8").decode(dados));
  throw new Error("Formato não suportado. Envie PDF, DOCX ou TXT.");
}

function limpar(t: string): string {
  return t.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
