import { findFreeSlots, isRangeWithinAnySlot } from './free-slot-finder';

describe('findFreeSlots', () => {
  it('encontra o intervalo livre entre dois compromissos no mesmo dia', () => {
    const from = new Date('2026-09-21T00:00:00');
    const to = new Date('2026-09-21T23:59:00');

    const slots = findFreeSlots({
      from,
      to,
      busy: [
        { start: new Date('2026-09-21T08:00:00'), end: new Date('2026-09-21T10:00:00') },
        { start: new Date('2026-09-21T14:00:00'), end: new Date('2026-09-21T15:00:00') },
      ],
      workingHours: { start: '08:00', end: '18:00' },
      minDurationMinutes: 30,
    });

    expect(slots).toHaveLength(2);
    expect(slots[0].start.toISOString()).toBe(new Date('2026-09-21T10:00:00').toISOString());
    expect(slots[0].end.toISOString()).toBe(new Date('2026-09-21T14:00:00').toISOString());
    expect(slots[1].start.toISOString()).toBe(new Date('2026-09-21T15:00:00').toISOString());
    expect(slots[1].end.toISOString()).toBe(new Date('2026-09-21T18:00:00').toISOString());
  });

  it('ignora gaps menores que a duração mínima', () => {
    const slots = findFreeSlots({
      from: new Date('2026-09-21T00:00:00'),
      to: new Date('2026-09-21T23:59:00'),
      busy: [
        { start: new Date('2026-09-21T08:00:00'), end: new Date('2026-09-21T09:50:00') },
        { start: new Date('2026-09-21T10:00:00'), end: new Date('2026-09-21T18:00:00') },
      ],
      workingHours: { start: '08:00', end: '18:00' },
      minDurationMinutes: 30,
    });

    expect(slots).toHaveLength(0);
  });

  it('isRangeWithinAnySlot confirma se um bloco cabe totalmente em algum slot', () => {
    const slots = [{ start: new Date('2026-09-21T10:00:00'), end: new Date('2026-09-21T14:00:00') }];

    expect(
      isRangeWithinAnySlot({ start: new Date('2026-09-21T10:00:00'), end: new Date('2026-09-21T11:00:00') }, slots),
    ).toBe(true);

    expect(
      isRangeWithinAnySlot({ start: new Date('2026-09-21T13:30:00'), end: new Date('2026-09-21T14:30:00') }, slots),
    ).toBe(false);
  });
});
