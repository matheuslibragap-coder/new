'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { NoteEditor } from '@/components/NoteEditor';
import { useToast } from '@/components/Toast';
import { apiDownload, apiFetch, ApiError, triggerDownload } from '@/lib/api-client';
import { blocksFromApi } from '@/lib/note-blocks';
import type { Note, NoteBlock } from '@/lib/types';

function snippet(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const BLANK_BLOCKS: NoteBlock[] = [{ type: 'paragraph', runs: [] }];

export default function NotesPage() {
  const toast = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

  const loadNotes = useCallback(
    async (selectAfter?: string) => {
      try {
        const list = await apiFetch<Note[]>('/notes');
        setNotes(list);
        if (selectAfter) {
          setSelectedId(selectAfter);
        } else if (!selectedId && list.length > 0) {
          setSelectedId(list[0].id);
        }
      } catch (err) {
        toast(err instanceof ApiError ? err.message : 'Não foi possível carregar as notas.');
      } finally {
        setLoading(false);
      }
    },
    [selectedId, toast],
  );

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId) ?? null, [notes, selectedId]);

  async function handleNewNote() {
    try {
      const created = await apiFetch<Note>('/notes', {
        method: 'POST',
        body: JSON.stringify({ title: 'Nova nota', blocks: BLANK_BLOCKS }),
      });
      await loadNotes(created.id);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Não foi possível criar a nota.');
    }
  }

  async function handleSave(title: string, blocks: NoteBlock[]) {
    if (!selectedNote) return;
    setSaving(true);
    try {
      await apiFetch<Note>(`/notes/${selectedNote.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, blocks }),
      });
      await loadNotes(selectedNote.id);
      toast('Nota salva');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Não foi possível salvar a nota.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedNote) return;
    try {
      await apiFetch(`/notes/${selectedNote.id}`, { method: 'DELETE' });
      setSelectedId(null);
      await loadNotes();
      toast('Nota excluída');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Não foi possível excluir a nota.');
    }
  }

  async function handleExport(kind: 'pdf' | 'docx') {
    if (!selectedNote) return;
    setExporting(kind);
    try {
      const { blob, filename } = await apiDownload(`/notes/${selectedNote.id}/export/${kind}`);
      triggerDownload(blob, filename);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : `Não foi possível exportar em ${kind.toUpperCase()}.`);
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
      <Topbar title="Suas notas" />
      <section className="page">
        <div className="section-head">
          <h2>Notas</h2>
          <button type="button" className="btn btn-outline-gold btn-sm" onClick={handleNewNote}>
            + Nova nota
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Carregando notas…</div>
        ) : notes.length === 0 ? (
          <div className="empty-state">Você ainda não tem notas. Crie a primeira!</div>
        ) : (
          <div className="notes-layout">
            <div className="notes-list">
              {notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className={`note-card${note.id === selectedId ? ' active' : ''}`}
                  onClick={() => setSelectedId(note.id)}
                >
                  <div className="n-title">{note.title}</div>
                  <div className="n-snip">{snippet(note.contentHtml) || 'Nota vazia'}</div>
                </button>
              ))}
            </div>

            {selectedNote && (
              <NoteEditor
                key={selectedNote.id}
                initialTitle={selectedNote.title}
                initialBlocks={blocksFromApi(selectedNote.contentJson)}
                saving={saving}
                exporting={exporting}
                onSave={handleSave}
                onDelete={handleDelete}
                onExport={handleExport}
              />
            )}
          </div>
        )}
      </section>
    </>
  );
}
