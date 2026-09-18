export function formatTimeRange(startAt: string, endAt: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${fmt(startAt)}–${fmt(endAt)}`;
}

export function formatSeconds(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function startOfDayIso(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function endOfDayIso(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  APPOINTMENT: 'Compromisso',
  ROUTINE: 'Rotina',
  STUDY_BLOCK: 'Bloco de estudo',
};

export function eventTypeLabel(type: string): string {
  return EVENT_TYPE_LABEL[type] || type;
}
