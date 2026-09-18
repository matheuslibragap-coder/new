import { BadRequestException } from '@nestjs/common';

export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export type NoteBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; runs: TextRun[] }
  | { type: 'bulletList'; items: string[] }
  | { type: 'orderedList'; items: string[] };

function isTextRun(value: unknown): value is TextRun {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TextRun).text === 'string' &&
    ['bold', 'italic', 'underline'].every(
      (key) => (value as Record<string, unknown>)[key] === undefined || typeof (value as Record<string, unknown>)[key] === 'boolean',
    )
  );
}

/**
 * Valida e normaliza o conteúdo rico enviado pelo editor de notas.
 * O schema é intencionalmente simples (títulos, parágrafos com formatação inline e listas)
 * para permitir renderização determinística tanto em HTML quanto em PDF/DOCX.
 */
export function parseNoteBlocks(input: unknown): NoteBlock[] {
  if (!Array.isArray(input)) {
    throw new BadRequestException('"blocks" deve ser uma lista de blocos de conteúdo.');
  }

  return input.map((block, index) => {
    if (typeof block !== 'object' || block === null || typeof (block as { type?: unknown }).type !== 'string') {
      throw new BadRequestException(`Bloco inválido no índice ${index}.`);
    }

    const b = block as Record<string, unknown>;

    switch (b.type) {
      case 'heading': {
        if (![1, 2, 3].includes(b.level as number) || typeof b.text !== 'string') {
          throw new BadRequestException(`Bloco "heading" inválido no índice ${index}.`);
        }
        return { type: 'heading', level: b.level as 1 | 2 | 3, text: b.text };
      }
      case 'paragraph': {
        if (!Array.isArray(b.runs) || !b.runs.every(isTextRun)) {
          throw new BadRequestException(`Bloco "paragraph" inválido no índice ${index}.`);
        }
        return { type: 'paragraph', runs: b.runs as TextRun[] };
      }
      case 'bulletList':
      case 'orderedList': {
        if (!Array.isArray(b.items) || !b.items.every((i) => typeof i === 'string')) {
          throw new BadRequestException(`Bloco "${b.type}" inválido no índice ${index}.`);
        }
        return { type: b.type, items: b.items as string[] };
      }
      default:
        throw new BadRequestException(`Tipo de bloco desconhecido "${String(b.type)}" no índice ${index}.`);
    }
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderRun(run: TextRun): string {
  let html = escapeHtml(run.text);
  if (run.bold) html = `<strong>${html}</strong>`;
  if (run.italic) html = `<em>${html}</em>`;
  if (run.underline) html = `<u>${html}</u>`;
  return html;
}

/** Renderiza os blocos em HTML — usado para preview e como cache pesquisável. */
export function renderBlocksToHtml(blocks: NoteBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
        case 'paragraph':
          return `<p>${block.runs.map(renderRun).join('')}</p>`;
        case 'bulletList':
          return `<ul>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
        case 'orderedList':
          return `<ol>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>`;
      }
    })
    .join('\n');
}
