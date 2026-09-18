'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Topbar } from '@/components/Topbar';
import { useToast } from '@/components/Toast';
import { apiFetch, ApiError } from '@/lib/api-client';
import { endOfDayIso, formatSeconds, startOfDayIso } from '@/lib/format';
import type { FocusSession, OrbitaEvent } from '@/lib/types';

const DURATIONS = [25, 45, 60];

export default function FocusPage() {
  const toast = useToast();
  const [studyBlocks, setStudyBlocks] = useState<OrbitaEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [plannedMinutes, setPlannedMinutes] = useState(25);

  const [session, setSession] = useState<FocusSession | null>(null);
  const [displaySec, setDisplaySec] = useState(0);
  const [busy, setBusy] = useState(false);

  const [history, setHistory] = useState<FocusSession[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTicking(), [stopTicking]);

  useEffect(() => {
    const from = startOfDayIso(new Date());
    const to = endOfDayIso(new Date());
    apiFetch<OrbitaEvent[]>(`/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&types=STUDY_BLOCK`)
      .then(setStudyBlocks)
      .catch(() => {
        /* vínculo com bloco é opcional — sem problema se a listagem falhar */
      });
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadHistory() {
    apiFetch<FocusSession[]>('/focus-sessions')
      .then((list) => setHistory(list.slice(0, 6)))
      .catch(() => {});
  }

  const completeSession = useCallback(
    async (id: string) => {
      stopTicking();
      try {
        const updated = await apiFetch<FocusSession>(`/focus-sessions/${id}/complete`, { method: 'POST' });
        setSession(updated);
        setDisplaySec(updated.actualDurationSec);
        loadHistory();
      } catch {
        /* se falhar, o usuário ainda pode tentar concluir manualmente */
      }
    },
    [stopTicking],
  );

  function startTicking(baseSec: number, plannedSec: number, sessionId: string) {
    stopTicking();
    intervalRef.current = setInterval(() => {
      setDisplaySec((prev) => {
        const next = prev + 1;
        if (next >= plannedSec) {
          completeSession(sessionId);
          return plannedSec;
        }
        return next;
      });
    }, 1000);
    setDisplaySec(baseSec);
  }

  async function handleStart() {
    setBusy(true);
    try {
      if (session && session.status === 'PAUSED') {
        const updated = await apiFetch<FocusSession>(`/focus-sessions/${session.id}/resume`, { method: 'POST' });
        setSession(updated);
        startTicking(updated.accumulatedSec, updated.plannedDurationSec, updated.id);
      } else {
        const created = await apiFetch<FocusSession>('/focus-sessions', {
          method: 'POST',
          body: JSON.stringify({
            plannedDurationSec: plannedMinutes * 60,
            ...(selectedEventId ? { eventId: selectedEventId } : {}),
          }),
        });
        setSession(created);
        startTicking(0, created.plannedDurationSec, created.id);
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Não foi possível iniciar a sessão de foco.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePause() {
    if (!session) return;
    setBusy(true);
    stopTicking();
    try {
      const updated = await apiFetch<FocusSession>(`/focus-sessions/${session.id}/pause`, { method: 'POST' });
      setSession(updated);
      setDisplaySec(updated.accumulatedSec);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Não foi possível pausar.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    stopTicking();
    if (session && (session.status === 'RUNNING' || session.status === 'PAUSED')) {
      try {
        await apiFetch(`/focus-sessions/${session.id}/abandon`, { method: 'POST' });
        loadHistory();
      } catch {
        /* mesmo se falhar, seguimos limpando o estado local */
      }
    }
    setSession(null);
    setDisplaySec(0);
  }

  const plannedSec = session ? session.plannedDurationSec : plannedMinutes * 60;
  const remaining = Math.max(0, plannedSec - displaySec);
  const pct = Math.min(100, (displaySec / plannedSec) * 100);
  const isRunning = session?.status === 'RUNNING';
  const isPaused = session?.status === 'PAUSED';
  const isCompleted = session?.status === 'COMPLETED';

  let statusText = 'pronto pra começar';
  if (isCompleted) statusText = 'concluído';
  else if (isRunning) statusText = 'em foco';
  else if (isPaused) statusText = 'pausado';

  let compareStatus = 'O cronômetro conta o tempo real, mesmo se você pausar.';
  if (isCompleted) compareStatus = 'Sessão concluída — tempo planejado batido! 🎉';
  else if (isRunning) compareStatus = 'Em andamento — contando o tempo real estudado.';
  else if (isPaused) compareStatus = 'Pausado — o tempo acumulado fica guardado.';

  return (
    <>
      <Topbar title="Modo foco" />
      <section className="page">
        <div className="focus-wrap">
          <div className="focus-select">
            Vincular a um bloco de estudo:
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={!!session}
            >
              <option value="">Nenhum</option>
              {studyBlocks.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div className="timer-ring">
            <div className="ring-progress" style={{ '--pct': pct } as React.CSSProperties} />
            <div>
              <div className="timer-num">{formatSeconds(remaining)}</div>
              <div className="timer-label">{statusText}</div>
            </div>
          </div>

          <div className="duration-chips">
            {DURATIONS.map((min) => (
              <button
                key={min}
                type="button"
                className={`chip${plannedMinutes === min ? ' active' : ''}`}
                disabled={!!session}
                onClick={() => setPlannedMinutes(min)}
              >
                {min} min
              </button>
            ))}
          </div>

          <div className="focus-controls">
            {!isCompleted && (
              <button type="button" className="btn btn-gold" onClick={handleStart} disabled={busy || isRunning}>
                {isPaused ? '▶ Continuar' : '▶ Iniciar'}
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={handlePause} disabled={busy || !isRunning}>
              ⏸ Pausar
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleReset} disabled={busy || !session}>
              ↺ Zerar
            </button>
          </div>

          <div className="compare">
            <div className="row">
              <span>
                planejado: <b>{formatSeconds(plannedSec)}</b>
              </span>
              <span>
                real: <b>{formatSeconds(displaySec)}</b>
              </span>
            </div>
            <div className="track">
              <div className="fill" style={{ width: `${pct}%` }} />
            </div>
            <div className={`status${isCompleted ? ' done' : ''}`}>{compareStatus}</div>
          </div>

          {history.length > 0 && (
            <div className="history">
              <h3>Últimas sessões</h3>
              {history.map((h) => (
                <div className="history-row" key={h.id}>
                  <span>{new Date(h.startedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  <span>
                    <b>{formatSeconds(h.actualDurationSec)}</b> / {formatSeconds(h.plannedDurationSec)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
