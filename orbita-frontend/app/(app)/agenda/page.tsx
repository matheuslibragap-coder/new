'use client';

import { useCallback, useEffect, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { useToast } from '@/components/Toast';
import { apiFetch, ApiError } from '@/lib/api-client';
import { endOfDayIso, eventTypeLabel, formatTimeRange, startOfDayIso } from '@/lib/format';
import type { OrbitaEvent, SubjectGoal, SuggestStudyBlocksResponse, SuggestedBlock, TimeSlot } from '@/lib/types';

const today = new Date();
const FROM = startOfDayIso(today);
const TO = endOfDayIso(today);

export default function AgendaPage() {
  const toast = useToast();
  const [events, setEvents] = useState<OrbitaEvent[]>([]);
  const [freeSlots, setFreeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [subjects, setSubjects] = useState<SubjectGoal[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [subjectGoal, setSubjectGoal] = useState(60);

  const [suggestions, setSuggestions] = useState<SuggestedBlock[] | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [usedAi, setUsedAi] = useState(false);
  const [acceptingIndex, setAcceptingIndex] = useState<number | null>(null);

  const loadAgenda = useCallback(async () => {
    try {
      const [eventsRes, slotsRes] = await Promise.all([
        apiFetch<OrbitaEvent[]>(`/events?from=${encodeURIComponent(FROM)}&to=${encodeURIComponent(TO)}`),
        apiFetch<TimeSlot[]>('/scheduling/free-slots', {
          method: 'POST',
          body: JSON.stringify({ from: FROM, to: TO }),
        }),
      ]);
      setEvents(eventsRes);
      setFreeSlots(slotsRes);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Não foi possível carregar a agenda.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAgenda();
  }, [loadAgenda]);

  function addSubject() {
    const name = subjectName.trim();
    if (!name) return;
    setSubjects((prev) => [...prev, { name, weeklyGoalMinutes: subjectGoal }]);
    setSubjectName('');
    setSubjectGoal(60);
  }

  function removeSubject(index: number) {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSuggest() {
    if (subjects.length === 0) {
      toast('Adicione ao menos uma matéria com meta semanal.');
      return;
    }
    setSuggesting(true);
    setSuggestions(null);
    try {
      const res = await apiFetch<SuggestStudyBlocksResponse>('/scheduling/suggest-study-blocks', {
        method: 'POST',
        body: JSON.stringify({ from: FROM, to: TO, subjects }),
      });
      setSuggestions(res.blocks);
      setUsedAi(res.usedAi);
      if (res.blocks.length === 0) toast('Não há horários livres suficientes hoje.');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Não foi possível gerar sugestões.');
    } finally {
      setSuggesting(false);
    }
  }

  async function handleAccept(index: number) {
    if (!suggestions) return;
    const block = suggestions[index];
    setAcceptingIndex(index);
    try {
      await apiFetch('/scheduling/accept', {
        method: 'POST',
        body: JSON.stringify({ blocks: [block] }),
      });
      setSuggestions((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
      toast(`Bloco "${block.subject}" adicionado à agenda`);
      await loadAgenda();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Não foi possível aceitar este bloco.');
    } finally {
      setAcceptingIndex(null);
    }
  }

  const studyBlockCount = events.filter((e) => e.type === 'STUDY_BLOCK').length;
  const nextFreeSlot = freeSlots[0] ? formatTimeRange(freeSlots[0].start, freeSlots[0].end) : '—';

  return (
    <>
      <Topbar title="Sua agenda" />
      <section className="page">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{events.length}</div>
            <div className="stat-label">eventos hoje</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{studyBlockCount}</div>
            <div className="stat-label">blocos de estudo</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{nextFreeSlot}</div>
            <div className="stat-label">próxima janela livre</div>
          </div>
        </div>

        <div className="section-head">
          <h2>Hoje</h2>
        </div>

        {loading ? (
          <div className="empty-state">Carregando agenda…</div>
        ) : events.length === 0 ? (
          <div className="empty-state">Nada agendado para hoje ainda.</div>
        ) : (
          <div className="agenda-list">
            {events.map((ev) => (
              <div key={ev.id} className={`ev-card type-${ev.type}`}>
                <div className="ev-time">{formatTimeRange(ev.startAt, ev.endAt)}</div>
                <div>
                  <div className="ev-title">{ev.title}</div>
                  <div className="ev-badge">
                    {eventTypeLabel(ev.type)}
                    {ev.source === 'AI_SUGGESTED' ? ' · IA' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="ai-box">
          <div className="ai-head">
            <span className="sparkle">✨</span>
            <h3>Bloqueio de tempo sugerido por IA</h3>
          </div>
          <p>Diga o que você precisa estudar e a meta semanal — a Orbyta acha os horários livres reais de hoje e distribui os blocos.</p>

          <div className="subject-row">
            <div className="field">
              <label htmlFor="subj-name">Matéria</label>
              <input
                id="subj-name"
                type="text"
                placeholder="Ex.: Direito Administrativo"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>
            <div className="field" style={{ maxWidth: 120 }}>
              <label htmlFor="subj-goal">Meta/semana (min)</label>
              <input
                id="subj-goal"
                type="number"
                min={10}
                step={10}
                value={subjectGoal}
                onChange={(e) => setSubjectGoal(Number(e.target.value))}
              />
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addSubject}>
              + Adicionar
            </button>
          </div>

          {subjects.length > 0 && (
            <div className="subject-tags">
              {subjects.map((s, i) => (
                <span key={i} className="subject-tag">
                  {s.name} · {s.weeklyGoalMinutes}min
                  <button type="button" onClick={() => removeSubject(i)} aria-label={`Remover ${s.name}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <button type="button" className="btn btn-outline-gold btn-sm" onClick={handleSuggest} disabled={suggesting}>
            {suggesting ? 'Analisando horários…' : 'Sugerir blocos de estudo'}
          </button>

          {suggesting && (
            <div className="suggestions">
              <div className="sugg-row">
                <span className="dots">
                  <span />
                  <span />
                  <span />
                </span>
                &nbsp; procurando horários livres e distribuindo os blocos…
              </div>
            </div>
          )}

          {!suggesting && suggestions && (
            <div className="suggestions">
              {suggestions.length === 0 ? (
                <div className="sugg-row" style={{ justifyContent: 'center', color: 'var(--gold)', fontWeight: 700 }}>
                  Todos os blocos sugeridos foram aceitos ✓
                </div>
              ) : (
                <>
                  {!usedAi && (
                    <div className="sugg-row" style={{ color: 'var(--white-faint)', fontSize: 12 }}>
                      Distribuição determinística (sem ANTHROPIC_API_KEY configurada no backend).
                    </div>
                  )}
                  {suggestions.map((s, i) => (
                    <div key={i} className="sugg-row">
                      <div className="ev-time">{formatTimeRange(s.startAt, s.endAt)}</div>
                      <div className="sugg-title">{s.subject}</div>
                      <button
                        type="button"
                        className="btn btn-outline-gold btn-sm"
                        onClick={() => handleAccept(i)}
                        disabled={acceptingIndex === i}
                      >
                        {acceptingIndex === i ? 'Aceitando…' : 'Aceitar'}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
