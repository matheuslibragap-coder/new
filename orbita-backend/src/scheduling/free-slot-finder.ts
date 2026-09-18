export interface TimeRange {
  start: Date;
  end: Date;
}

export interface WorkingHours {
  /** Formato "HH:mm", ex.: "08:00" */
  start: string;
  /** Formato "HH:mm", ex.: "22:00" */
  end: string;
}

export interface FindFreeSlotsParams {
  from: Date;
  to: Date;
  busy: TimeRange[];
  workingHours: WorkingHours;
  minDurationMinutes: number;
}

function parseTimeOfDay(value: string): { hours: number; minutes: number } {
  const [hours, minutes] = value.split(':').map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

function combineDateAndTime(day: Date, time: { hours: number; minutes: number }): Date {
  const result = new Date(day);
  result.setHours(time.hours, time.minutes, 0, 0);
  return result;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Identifica os intervalos de tempo realmente livres na agenda do usuário,
 * considerando apenas a janela de horário útil configurada e removendo
 * qualquer sobreposição com compromissos, rotina ou blocos já existentes.
 */
export function findFreeSlots(params: FindFreeSlotsParams): TimeRange[] {
  const { from, to, busy, workingHours, minDurationMinutes } = params;
  if (from.getTime() >= to.getTime()) {
    return [];
  }

  const workStart = parseTimeOfDay(workingHours.start);
  const workEnd = parseTimeOfDay(workingHours.end);
  const minDurationMs = minDurationMinutes * 60 * 1000;

  const sortedBusy = [...busy].sort((a, b) => a.start.getTime() - b.start.getTime());

  const freeSlots: TimeRange[] = [];
  let cursorDay = startOfDay(from);
  const lastDay = startOfDay(to);

  while (cursorDay.getTime() <= lastDay.getTime()) {
    let windowStart = combineDateAndTime(cursorDay, workStart);
    let windowEnd = combineDateAndTime(cursorDay, workEnd);

    if (windowStart.getTime() < from.getTime()) windowStart = new Date(from);
    if (windowEnd.getTime() > to.getTime()) windowEnd = new Date(to);

    if (windowStart.getTime() < windowEnd.getTime()) {
      const busyToday = sortedBusy.filter(
        (b) => b.end.getTime() > windowStart.getTime() && b.start.getTime() < windowEnd.getTime(),
      );

      let pointer = windowStart;
      for (const block of busyToday) {
        const blockStart = block.start.getTime() < pointer.getTime() ? pointer : block.start;
        if (blockStart.getTime() > pointer.getTime()) {
          const gapDuration = blockStart.getTime() - pointer.getTime();
          if (gapDuration >= minDurationMs) {
            freeSlots.push({ start: new Date(pointer), end: new Date(blockStart) });
          }
        }
        if (block.end.getTime() > pointer.getTime()) {
          pointer = new Date(block.end);
        }
      }

      if (pointer.getTime() < windowEnd.getTime()) {
        const gapDuration = windowEnd.getTime() - pointer.getTime();
        if (gapDuration >= minDurationMs) {
          freeSlots.push({ start: new Date(pointer), end: new Date(windowEnd) });
        }
      }
    }

    cursorDay = new Date(cursorDay.getTime() + 24 * 60 * 60 * 1000);
  }

  return freeSlots;
}

/** Um bloco proposto (por IA ou fallback) está inteiramente contido em algum slot livre. */
export function isRangeWithinAnySlot(range: TimeRange, slots: TimeRange[]): boolean {
  return slots.some(
    (slot) => range.start.getTime() >= slot.start.getTime() && range.end.getTime() <= slot.end.getTime(),
  );
}
