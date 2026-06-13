import { describe, it, expect } from 'vitest';
import {
    advanceRecurrence,
    expandRecurrence,
    eventsOverlap,
    allDayUtcRange,
    wallClockToUtc,
    utcToWallClock,
    getMonthGrid,
    validateEventInput,
} from '@/lib/calendar';
import type { RecurrenceRule, CalendarEventInput } from '@/lib/types';

const TZ = 'America/New_York';

// ─── Recurrence math ─────────────────────────────────────────────────

describe('advanceRecurrence', () => {
    it('advances daily by 1 day', () => {
        const anchor = new Date('2026-06-15T09:00:00Z');
        const rule: RecurrenceRule = { frequency: 'daily', interval: 1 };
        const next = advanceRecurrence(anchor, rule);
        expect(next.toISOString()).toBe('2026-06-16T09:00:00.000Z');
    });

    it('advances daily by 3 days', () => {
        const anchor = new Date('2026-06-15T09:00:00Z');
        const rule: RecurrenceRule = { frequency: 'daily', interval: 3 };
        const next = advanceRecurrence(anchor, rule);
        expect(next.toISOString()).toBe('2026-06-18T09:00:00.000Z');
    });

    it('advances weekly by 1 week (same weekday)', () => {
        const anchor = new Date('2026-06-15T09:00:00Z');
        const rule: RecurrenceRule = { frequency: 'weekly', interval: 1 };
        const next = advanceRecurrence(anchor, rule);
        expect(next.toISOString()).toBe('2026-06-22T09:00:00.000Z');
    });

    it('advances weekly by 2 weeks', () => {
        const anchor = new Date('2026-06-15T09:00:00Z');
        const rule: RecurrenceRule = { frequency: 'weekly', interval: 2 };
        const next = advanceRecurrence(anchor, rule);
        expect(next.toISOString()).toBe('2026-06-29T09:00:00.000Z');
    });

    it('advances monthly by 1 month', () => {
        const anchor = new Date('2026-01-15T09:00:00Z');
        const rule: RecurrenceRule = { frequency: 'monthly', interval: 1 };
        const next = advanceRecurrence(anchor, rule);
        expect(next.toISOString()).toBe('2026-02-15T09:00:00.000Z');
    });

    it('handles Jan 31 -> Feb 28 rollover (non-leap year 2027)', () => {
        const anchor = new Date('2027-01-31T09:00:00Z');
        const rule: RecurrenceRule = { frequency: 'monthly', interval: 1 };
        const next = advanceRecurrence(anchor, rule);
        expect(next.toISOString()).toBe('2027-02-28T09:00:00.000Z');
    });

    it('handles Jan 31 -> Feb 29 rollover (leap year 2028)', () => {
        const anchor = new Date('2028-01-31T09:00:00Z');
        const rule: RecurrenceRule = { frequency: 'monthly', interval: 1 };
        const next = advanceRecurrence(anchor, rule);
        expect(next.toISOString()).toBe('2028-02-29T09:00:00.000Z');
    });
});

describe('expandRecurrence', () => {
    const eventStart = new Date('2026-06-15T09:00:00Z');
    const eventEnd = new Date('2026-06-15T10:00:00Z');
    const rangeStart = new Date('2026-06-01T00:00:00Z');
    const rangeEnd = new Date('2026-06-30T23:59:59.999Z');

    it('returns single occurrence when rule is null', () => {
        const results = expandRecurrence(eventStart, eventEnd, null, rangeStart, rangeEnd);
        expect(results).toHaveLength(1);
        expect(results[0].start.toISOString()).toBe('2026-06-15T09:00:00.000Z');
    });

    it('expands daily events in range', () => {
        const rule: RecurrenceRule = { frequency: 'daily', interval: 1 };
        const results = expandRecurrence(eventStart, eventEnd, rule, rangeStart, rangeEnd);
        expect(results.length).toBe(16); // June 15 through June 30
        expect(results[0].start.toISOString()).toBe('2026-06-15T09:00:00.000Z');
        expect(results[1].start.toISOString()).toBe('2026-06-16T09:00:00.000Z');
    });

    it('expands every-3-day events', () => {
        const rule: RecurrenceRule = { frequency: 'daily', interval: 3 };
        const results = expandRecurrence(eventStart, eventEnd, rule, rangeStart, rangeEnd);
        expect(results.length).toBe(6); // 15, 18, 21, 24, 27, 30
    });

    it('expands weekly events (same weekday)', () => {
        const rule: RecurrenceRule = { frequency: 'weekly', interval: 1 };
        const results = expandRecurrence(eventStart, eventEnd, rule, rangeStart, rangeEnd);
        expect(results.length).toBe(3); // June 15, 22, 29 (all Mondays)
    });

    it('respects `until` cutoff', () => {
        const rule: RecurrenceRule = { frequency: 'daily', interval: 1, until: '2026-06-18T23:59:59.000Z' };
        const results = expandRecurrence(eventStart, eventEnd, rule, rangeStart, rangeEnd);
        expect(results.length).toBe(4); // 15, 16, 17, 18 (until is inclusive for occurrences starting before it)
    });

    it('respects `count` cutoff', () => {
        const rule: RecurrenceRule = { frequency: 'daily', interval: 1, count: 3 };
        const results = expandRecurrence(eventStart, eventEnd, rule, rangeStart, rangeEnd);
        expect(results.length).toBe(3);
    });

    it('excludes occurrences before range start', () => {
        const earlyStart = new Date('2026-05-15T09:00:00Z');
        const earlyEnd = new Date('2026-05-15T10:00:00Z');
        const rule: RecurrenceRule = { frequency: 'weekly', interval: 1 };
        const results = expandRecurrence(earlyStart, earlyEnd, rule, rangeStart, rangeEnd);
        const juneDates = results.filter((r) => r.start.getMonth() === 5);
        expect(juneDates.length).toBeGreaterThan(0);
    });

    it('returns empty when event starts after range', () => {
        const lateStart = new Date('2026-07-15T09:00:00Z');
        const lateEnd = new Date('2026-07-15T10:00:00Z');
        const rule: RecurrenceRule = { frequency: 'daily', interval: 1 };
        const results = expandRecurrence(lateStart, lateEnd, rule, rangeStart, rangeEnd);
        expect(results).toHaveLength(0);
    });
});

// ─── Overlap detection ────────────────────────────────────────────────

describe('eventsOverlap', () => {
    it('detects partial overlap', () => {
        const a = { start: new Date('2026-06-15T09:00:00Z'), end: new Date('2026-06-15T11:00:00Z') };
        const b = { start: new Date('2026-06-15T10:00:00Z'), end: new Date('2026-06-15T12:00:00Z') };
        expect(eventsOverlap(a, b)).toBe(true);
    });

    it('detects fully contained event', () => {
        const a = { start: new Date('2026-06-15T09:00:00Z'), end: new Date('2026-06-15T14:00:00Z') };
        const b = { start: new Date('2026-06-15T10:00:00Z'), end: new Date('2026-06-15T11:00:00Z') };
        expect(eventsOverlap(a, b)).toBe(true);
    });

    it('adjacent events (end === start) do not overlap', () => {
        const a = { start: new Date('2026-06-15T09:00:00Z'), end: new Date('2026-06-15T10:00:00Z') };
        const b = { start: new Date('2026-06-15T10:00:00Z'), end: new Date('2026-06-15T11:00:00Z') };
        expect(eventsOverlap(a, b)).toBe(false);
    });

    it('non-overlapping events return false', () => {
        const a = { start: new Date('2026-06-15T09:00:00Z'), end: new Date('2026-06-15T10:00:00Z') };
        const b = { start: new Date('2026-06-15T11:00:00Z'), end: new Date('2026-06-15T12:00:00Z') };
        expect(eventsOverlap(a, b)).toBe(false);
    });

    it('detects all-day vs timed overlap', () => {
        const allDay = { start: new Date('2026-06-15T04:00:00Z'), end: new Date('2026-06-16T04:00:00Z') };
        const timed = { start: new Date('2026-06-15T14:00:00Z'), end: new Date('2026-06-15T15:00:00Z') };
        expect(eventsOverlap(allDay, timed)).toBe(true);
    });
});

// ─── Timezone conversions ────────────────────────────────────────────

describe('wallClockToUtc / utcToWallClock', () => {
    it('round-trips a standard time value', () => {
        const wallClock = '2026-01-15T09:00';
        const utc = wallClockToUtc(wallClock, TZ);
        expect(utc.toISOString()).toBe('2026-01-15T14:00:00.000Z');
        const back = utcToWallClock(utc, TZ);
        expect(back.getFullYear()).toBe(2026);
        expect(back.getMonth()).toBe(0);
        expect(back.getDate()).toBe(15);
        expect(back.getHours()).toBe(9);
    });

    it('round-trips a daylight time value', () => {
        const wallClock = '2026-07-15T09:00';
        const utc = wallClockToUtc(wallClock, TZ);
        expect(utc.toISOString()).toBe('2026-07-15T13:00:00.000Z');
        const back = utcToWallClock(utc, TZ);
        expect(back.getHours()).toBe(9);
    });

    it('DST spring forward: 2:30 AM on March 8 2026 shifts to 3:30', () => {
        // In 2026, DST starts March 8 at 2:00 AM in America/New_York.
        // Wall clock 2:30 AM does not exist; date-fns-tz shifts it forward.
        const wallClock = '2026-03-08T02:30';
        const utc = wallClockToUtc(wallClock, TZ);
        // 2:30 AM becomes 3:30 AM local = 7:30 AM UTC (EDT = UTC-4)
        expect(utc.toISOString()).toBe('2026-03-08T07:30:00.000Z');
        const back = utcToWallClock(utc, TZ);
        expect(back.getHours()).toBe(3);
        expect(back.getMinutes()).toBe(30);
    });

    it('DST fall back: 1:30 AM on Nov 1 2026 is ambiguous (prefers earlier offset)', () => {
        // In 2026, DST ends Nov 1 at 2:00 AM. 1:30 AM exists twice.
        // date-fns-tz fromZonedTime picks the earlier (EDT) offset.
        const wallClock = '2026-11-01T01:30';
        const utc = wallClockToUtc(wallClock, TZ);
        // EDT offset = UTC-4 → 5:30 AM UTC
        expect(utc.toISOString()).toBe('2026-11-01T05:30:00.000Z');
    });
});

describe('allDayUtcRange', () => {
    it('produces next-day exclusive boundaries for a standard date', () => {
        const { start, end } = allDayUtcRange('2026-06-15', TZ);
        // June 15 00:00 ET = 04:00 UTC, June 16 00:00 ET = 08:00 UTC
        expect(start.toISOString()).toBe('2026-06-15T04:00:00.000Z');
        expect(end.toISOString()).toBe('2026-06-16T04:00:00.000Z');
    });

    it('produces correct boundaries during DST transition day (spring)', () => {
        const { start, end } = allDayUtcRange('2026-03-08', TZ);
        // March 8 00:00 EST = 05:00 UTC; March 9 00:00 EDT = 04:00 UTC
        expect(start.toISOString()).toBe('2026-03-08T05:00:00.000Z');
        expect(end.toISOString()).toBe('2026-03-09T04:00:00.000Z');
    });
});

// ─── Month grid ───────────────────────────────────────────────────────

describe('getMonthGrid', () => {
    it('produces a grid for June 2026 (starts Monday June 1)', () => {
        const weeks = getMonthGrid(2026, 6, TZ);
        expect(weeks.length).toBeGreaterThanOrEqual(4);
        expect(weeks[0].days).toHaveLength(7);
        // Grid starts on Sunday; June 1 is a Monday so the first cell is May 31
        expect(weeks[0].days[0].date).toBe('2026-05-31');
        expect(weeks[0].days[0].isCurrentMonth).toBe(false);
        expect(weeks[0].days[1].date).toBe('2026-06-01');
        expect(weeks[0].days[1].isCurrentMonth).toBe(true);
    });

    it('includes padding days from adjacent months', () => {
        // January 2026 starts on Thursday, so the first row has 4 padding days
        const weeks = getMonthGrid(2026, 1, TZ);
        const firstDay = weeks[0].days[0];
        expect(firstDay.isCurrentMonth).toBe(false);
    });
});

// ─── Validation ───────────────────────────────────────────────────────

describe('validateEventInput', () => {
    const validInput: CalendarEventInput = {
        title: 'Site visit',
        start: '2026-06-15T09:00',
        end: '2026-06-15T10:00',
    };

    it('passes for valid input', () => {
        expect(validateEventInput(validInput)).toHaveLength(0);
    });

    it('rejects empty title', () => {
        const errors = validateEventInput({ ...validInput, title: '' });
        expect(errors).toHaveLength(1);
        expect(errors[0].field).toBe('title');
    });

    it('rejects end before start', () => {
        const errors = validateEventInput({ ...validInput, start: '2026-06-15T10:00', end: '2026-06-15T09:00' });
        expect(errors.some((e) => e.field === 'end')).toBe(true);
    });

    it('rejects invalid recurrence frequency', () => {
        const errors = validateEventInput({
            ...validInput,
            recurrenceRule: { frequency: 'yearly' as never },
        });
        expect(errors.some((e) => e.field === 'recurrenceRule')).toBe(true);
    });

    it('rejects negative reminder minutes', () => {
        const errors = validateEventInput({ ...validInput, reminderMinutesBefore: -5 });
        expect(errors.some((e) => e.field === 'reminderMinutesBefore')).toBe(true);
    });

    it('rejects invalid status', () => {
        const errors = validateEventInput({ ...validInput, status: 'unknown' as never });
        expect(errors.some((e) => e.field === 'status')).toBe(true);
    });

    it('accepts zero reminder minutes', () => {
        expect(validateEventInput({ ...validInput, reminderMinutesBefore: 0 })).toHaveLength(0);
    });

    it('accepts null reminder minutes', () => {
        expect(validateEventInput({ ...validInput, reminderMinutesBefore: null })).toHaveLength(0);
    });

    it('rejects count < 1 in recurrence', () => {
        const errors = validateEventInput({
            ...validInput,
            recurrenceRule: { frequency: 'daily', count: 0 },
        });
        expect(errors.some((e) => e.field === 'recurrenceRule')).toBe(true);
    });

    it('rejects interval < 1 in recurrence', () => {
        const errors = validateEventInput({
            ...validInput,
            recurrenceRule: { frequency: 'weekly', interval: 0 },
        });
        expect(errors.some((e) => e.field === 'recurrenceRule')).toBe(true);
    });
});
