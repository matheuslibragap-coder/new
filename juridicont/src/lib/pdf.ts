import "server-only";
import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { RegraSnapshot, ResultadoChecagem } from "@/lib/tipos";
import { AVISO_LEGAL, CODIGO_NAO_CATALOGADO, ROTULO_SEVERIDADE, formatarData } from "@/lib/textos";
import { TIPOS_CONTEUDO, type TipoConteudo } from "@/lib/tipos";

export type DadosRegistro = {
  id: string;
  criado_em: string;
  tipo_conteudo: string;
  texto: string | null;
  tem_imagem: boolean;
  classificacao: ResultadoChecagem["classificacao_geral"];
  resultado: ResultadoChecagem;
  regras_versao: number;
  regras_snapshot: RegraSnapshot[];
  modelo: string | null;
  usuario: { nome: string | null; email: string | null };
};

// As fontes padrão do PDF usam WinAnsi: remove caracteres que ela não representa (emojis etc.)
function paraWinAnsi(texto: string) {
  return texto
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

const CORES = {
  verde: rgb(0.13, 0.55, 0.3),
  amarelo: rgb(0.75, 0.55, 0.05),
  vermelho: rgb(0.75, 0.15, 0.15),
  texto: rgb(0.1, 0.1, 0.12),
  suave: rgb(0.4, 0.4, 0.45),
};

class Escritor {
  pagina!: PDFPage;
  y = 0;
  readonly margem = 50;
  readonly largura = 595.28;
  readonly altura = 841.89;
  constructor(
    private doc: PDFDocument,
    private fonte: PDFFont,
    private negrito: PDFFont,
  ) {
    this.novaPagina();
  }
  novaPagina() {
    this.pagina = this.doc.addPage([this.largura, this.altura]);
    this.y = this.altura - this.margem;
  }
  private quebrar(texto: string, fonte: PDFFont, tamanho: number) {
    const max = this.largura - this.margem * 2;
    const linhas: string[] = [];
    for (const paragrafo of paraWinAnsi(texto).split(/\r?\n/)) {
      let atual = "";
      for (const palavra of paragrafo.split(/\s+/)) {
        const teste = atual ? `${atual} ${palavra}` : palavra;
        if (fonte.widthOfTextAtSize(teste, tamanho) > max && atual) {
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
  escrever(texto: string, opcoes: { tamanho?: number; negrito?: boolean; cor?: ReturnType<typeof rgb>; espaco?: number } = {}) {
    const tamanho = opcoes.tamanho ?? 10;
    const fonte = opcoes.negrito ? this.negrito : this.fonte;
    for (const linha of this.quebrar(texto, fonte, tamanho)) {
      if (this.y < this.margem + tamanho) this.novaPagina();
      this.pagina.drawText(linha, { x: this.margem, y: this.y - tamanho, size: tamanho, font: fonte, color: opcoes.cor ?? CORES.texto });
      this.y -= tamanho * 1.4;
    }
    this.y -= opcoes.espaco ?? 4;
  }
  titulo(texto: string) {
    this.y -= 6;
    this.escrever(texto, { tamanho: 12, negrito: true, espaco: 2 });
  }
}

export function hashRegistro(d: Pick<DadosRegistro, "id" | "criado_em" | "texto" | "resultado" | "regras_versao">) {
  return createHash("sha256")
    .update(JSON.stringify([d.id, d.criado_em, d.texto, d.resultado, d.regras_versao]))
    .digest("hex");
}

export async function gerarPdfRegistro(d: DadosRegistro) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Registro de checagem ${d.id}`);
  doc.setProducer("Juridicont");
  const fonte = await doc.embedFont(StandardFonts.Helvetica);
  const negrito = await doc.embedFont(StandardFonts.HelveticaBold);
  const e = new Escritor(doc, fonte, negrito);
  const regras = new Map(d.regras_snapshot.map((r) => [r.codigo, r]));

  e.escrever("Juridicont", { tamanho: 18, negrito: true, espaco: 0 });
  e.escrever("Registro de checagem de conformidade de publicidade", { tamanho: 11, cor: CORES.suave, espaco: 10 });

  e.escrever(`Data e hora: ${formatarData(d.criado_em)} (horário de Brasília)`);
  e.escrever(`Identificador: ${d.id}`);
  e.escrever(`Usuário: ${d.usuario.nome ?? ""} ${d.usuario.email ? `(${d.usuario.email})` : ""}`);
  e.escrever(`Tipo de conteúdo: ${TIPOS_CONTEUDO[d.tipo_conteudo as TipoConteudo] ?? d.tipo_conteudo}`);
  e.escrever(`Versão da base de regras: ${d.regras_versao}`);
  if (d.modelo) e.escrever(`Modelo de IA: ${d.modelo}`);

  e.titulo("Resultado");
  e.escrever(`${d.classificacao.toUpperCase()}: ${ROTULO_SEVERIDADE[d.classificacao]}`, {
    tamanho: 12,
    negrito: true,
    cor: CORES[d.classificacao],
  });

  e.titulo("Conteúdo analisado");
  e.escrever(d.texto?.trim() ? d.texto : "(sem texto)");
  if (d.tem_imagem) e.escrever("Uma imagem foi enviada junto com o conteúdo.", { cor: CORES.suave });
  if (d.resultado.texto_extraido_imagem) {
    e.escrever("Texto extraído da imagem:", { negrito: true, espaco: 0 });
    e.escrever(d.resultado.texto_extraido_imagem);
  }
  if (d.resultado.elementos_visuais?.length) {
    e.escrever("Elementos visuais observados:", { negrito: true, espaco: 0 });
    d.resultado.elementos_visuais.forEach((el) => e.escrever(`- ${el}`, { espaco: 0 }));
    e.y -= 4;
  }

  e.titulo(`Achados (${d.resultado.achados.length})`);
  if (d.resultado.achados.length === 0) e.escrever("Nenhum achado.");
  d.resultado.achados.forEach((a, i) => {
    const regra = regras.get(a.regra_codigo);
    const nome = a.regra_codigo === CODIGO_NAO_CATALOGADO ? "Risco não catalogado" : regra?.titulo ?? a.regra_codigo;
    e.escrever(`${i + 1}. ${nome} [${a.severidade}]`, { negrito: true, cor: CORES[a.severidade], espaco: 0 });
    if (regra) e.escrever(`Dispositivo: ${regra.dispositivo}`, { cor: CORES.suave, espaco: 0 });
    if (a.trecho) e.escrever(`Trecho: "${a.trecho}"`, { espaco: 0 });
    e.escrever(`Explicação: ${a.explicacao}`, { espaco: 0 });
    if (a.sugestao_reescrita) e.escrever(`Sugestão: ${a.sugestao_reescrita}`);
    e.y -= 4;
  });

  if (d.resultado.versao_reescrita_completa) {
    e.titulo("Versão corrigida sugerida");
    e.escrever(d.resultado.versao_reescrita_completa);
  }

  e.titulo("Regras consideradas nesta checagem");
  d.regras_snapshot.forEach((r) =>
    e.escrever(`${r.codigo}: ${r.titulo} (${r.dispositivo}), severidade padrão ${r.severidade_padrao}`, {
      tamanho: 9,
      espaco: 1,
    }),
  );

  e.titulo("Aviso");
  e.escrever(AVISO_LEGAL);
  e.escrever(`Código de integridade (SHA-256): ${hashRegistro(d)}`, { tamanho: 8, cor: CORES.suave });

  return doc.save();
}
