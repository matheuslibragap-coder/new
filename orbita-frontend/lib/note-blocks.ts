import type { NoteBlock, TextRun } from './types';

export type EditableBlock =
  | { id: string; type: 'heading'; level: 1 | 2 | 3; text: string }
  | { id: string; type: 'paragraph'; html: string }
  | { id: string; type: 'bulletList' | 'orderedList'; items: string[] };

export function makeBlockId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `blk_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function runsToHtml(runs: TextRun[]): string {
  return runs
    .map((run) => {
      let html = escapeHtml(run.text).replace(/\n/g, '<br>');
      if (run.bold) html = `<strong>${html}</strong>`;
      if (run.italic) html = `<em>${html}</em>`;
      if (run.underline) html = `<u>${html}</u>`;
      return html;
    })
    .join('');
}

/** Percorre o HTML gerado pelo contentEditable e reconstrói os runs com bold/italic/underline. */
export function htmlToRuns(html: string): TextRun[] {
  if (typeof window === 'undefined') return [];
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  const runs: TextRun[] = [];

  function walk(node: Node, fmt: { bold?: boolean; italic?: boolean; underline?: boolean }) {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || '';
        if (text) runs.push({ text, ...fmt });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === 'br') {
          runs.push({ text: '\n' });
          return;
        }
        const nextFmt = { ...fmt };
        if (tag === 'strong' || tag === 'b') nextFmt.bold = true;
        if (tag === 'em' || tag === 'i') nextFmt.italic = true;
        if (tag === 'u') nextFmt.underline = true;
        walk(el, nextFmt);
      }
    });
  }

  if (root) walk(root, {});
  return runs;
}

export function blocksFromApi(blocks: NoteBlock[]): EditableBlock[] {
  return blocks.map((block) => {
    const id = makeBlockId();
    if (block.type === 'paragraph') return { id, type: 'paragraph', html: runsToHtml(block.runs) };
    if (block.type === 'heading') return { id, type: 'heading', level: block.level, text: block.text };
    return { id, type: block.type, items: block.items };
  });
}

export function blocksToApi(blocks: EditableBlock[]): NoteBlock[] {
  return blocks.map((block) => {
    if (block.type === 'paragraph') return { type: 'paragraph', runs: htmlToRuns(block.html) };
    if (block.type === 'heading') return { type: 'heading', level: block.level, text: block.text };
    return { type: block.type, items: block.items.filter((item) => item.trim().length > 0) };
  });
}

export function newHeadingBlock(): EditableBlock {
  return { id: makeBlockId(), type: 'heading', level: 2, text: '' };
}
export function newParagraphBlock(): EditableBlock {
  return { id: makeBlockId(), type: 'paragraph', html: '' };
}
export function newBulletListBlock(): EditableBlock {
  return { id: makeBlockId(), type: 'bulletList', items: [''] };
}
export function newOrderedListBlock(): EditableBlock {
  return { id: makeBlockId(), type: 'orderedList', items: [''] };
}
