'use client';

import { useRef, useState } from 'react';
import {
  blocksToApi,
  EditableBlock,
  newBulletListBlock,
  newHeadingBlock,
  newOrderedListBlock,
  newParagraphBlock,
} from '@/lib/note-blocks';
import type { NoteBlock } from '@/lib/types';

interface NoteEditorProps {
  initialTitle: string;
  initialBlocks: EditableBlock[];
  saving: boolean;
  onSave: (title: string, blocks: NoteBlock[]) => void;
  onDelete: () => void;
  onExport: (kind: 'pdf' | 'docx') => void;
  exporting: 'pdf' | 'docx' | null;
}

export function NoteEditor({ initialTitle, initialBlocks, saving, onSave, onDelete, onExport, exporting }: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [blocks, setBlocks] = useState<EditableBlock[]>(initialBlocks);
  const paragraphRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function updateBlock(id: string, updater: (block: EditableBlock) => EditableBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? updater(b) : b)));
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    delete paragraphRefs.current[id];
  }

  function addBlock(block: EditableBlock) {
    setBlocks((prev) => [...prev, block]);
  }

  function applyInline(cmd: 'bold' | 'italic' | 'underline') {
    document.execCommand(cmd);
  }

  function handleSave() {
    const withCurrentHtml = blocks.map((b) =>
      b.type === 'paragraph' && paragraphRefs.current[b.id]
        ? { ...b, html: paragraphRefs.current[b.id]!.innerHTML }
        : b,
    );
    onSave(title.trim() || 'Sem título', blocksToApi(withCurrentHtml));
  }

  return (
    <div className="editor-panel">
      <div className="editor-titlebar">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da nota" />
      </div>

      <div className="toolbar">
        <button type="button" className="tbtn" onMouseDown={(e) => e.preventDefault()} onClick={() => applyInline('bold')} title="Negrito">
          B
        </button>
        <button type="button" className="tbtn" onMouseDown={(e) => e.preventDefault()} onClick={() => applyInline('italic')} title="Itálico">
          <i>I</i>
        </button>
        <button type="button" className="tbtn" onMouseDown={(e) => e.preventDefault()} onClick={() => applyInline('underline')} title="Sublinhado">
          <u>S</u>
        </button>
        <div className="spacer" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onExport('pdf')} disabled={exporting === 'pdf'}>
          {exporting === 'pdf' ? 'Gerando…' : 'Exportar PDF'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onExport('docx')} disabled={exporting === 'docx'}>
          {exporting === 'docx' ? 'Gerando…' : 'Exportar DOCX'}
        </button>
        <button type="button" className="btn btn-gold btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      <div className="blocks">
        {blocks.map((block) => {
          if (block.type === 'heading') {
            return (
              <div key={block.id} className={`block block-heading level-${block.level}`}>
                <button type="button" className="block-remove" onClick={() => removeBlock(block.id)} aria-label="Remover bloco">
                  ×
                </button>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  {[1, 2, 3].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className="tbtn"
                      style={{ opacity: block.level === lvl ? 1 : 0.5 }}
                      onClick={() => updateBlock(block.id, (b) => (b.type === 'heading' ? { ...b, level: lvl as 1 | 2 | 3 } : b))}
                    >
                      H{lvl}
                    </button>
                  ))}
                </div>
                <input
                  value={block.text}
                  placeholder="Título…"
                  onChange={(e) => updateBlock(block.id, (b) => (b.type === 'heading' ? { ...b, text: e.target.value } : b))}
                />
              </div>
            );
          }

          if (block.type === 'paragraph') {
            return (
              <div key={block.id} className="block block-paragraph">
                <button type="button" className="block-remove" onClick={() => removeBlock(block.id)} aria-label="Remover bloco">
                  ×
                </button>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  ref={(el) => {
                    paragraphRefs.current[block.id] = el;
                  }}
                  dangerouslySetInnerHTML={{ __html: block.html }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  data-placeholder="Escreva aqui…"
                />
              </div>
            );
          }

          return (
            <div key={block.id} className="block block-list">
              <button type="button" className="block-remove" onClick={() => removeBlock(block.id)} aria-label="Remover bloco">
                ×
              </button>
              {block.items.map((item, idx) => (
                <div className="item-row" key={idx}>
                  <span className="marker">{block.type === 'bulletList' ? '•' : `${idx + 1}.`}</span>
                  <input
                    value={item}
                    placeholder="Item da lista…"
                    onChange={(e) =>
                      updateBlock(block.id, (b) =>
                        b.type === block.type && 'items' in b
                          ? { ...b, items: b.items.map((it, i) => (i === idx ? e.target.value : it)) }
                          : b,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        updateBlock(block.id, (b) =>
                          b.type === block.type && 'items' in b
                            ? { ...b, items: [...b.items.slice(0, idx + 1), '', ...b.items.slice(idx + 1)] }
                            : b,
                        );
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="tbtn"
                    style={{ width: 24, height: 24, minWidth: 24 }}
                    onClick={() =>
                      updateBlock(block.id, (b) =>
                        b.type === block.type && 'items' in b ? { ...b, items: b.items.filter((_, i) => i !== idx) } : b,
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-item"
                onClick={() => updateBlock(block.id, (b) => (b.type === block.type && 'items' in b ? { ...b, items: [...b.items, ''] } : b))}
              >
                + item
              </button>
            </div>
          );
        })}
      </div>

      <div className="add-block-row">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addBlock(newHeadingBlock())}>
          + Título
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addBlock(newParagraphBlock())}>
          + Parágrafo
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addBlock(newBulletListBlock())}>
          + Lista
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addBlock(newOrderedListBlock())}>
          + Lista numerada
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDelete}>
          Excluir nota
        </button>
      </div>
    </div>
  );
}
