import { addDays, addWeeks, addMonths, isBefore, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { getAppConfig } from '@/lib/config';
import type {
    CalendarEventInput,
    CalendarEventRecord,
    CalendarEventStatus,
    RecurrenceRule,
    RecurrenceFrequency,
} from '@/lib/types';

const VALID_STATUSES: CalendarEventStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled'];
const VALID_FREQUENCIES: RecurrenceFrequency[] = ['daily', 'weekly', 'monthly'];

// ─── Timezone helpers ────────────────────────────────────────────────

export async function getBusinessTimezone(): Promise<string> {
    const config = await getAppConfig();
    return config.businessTimezone || 'America/New_York';
}

/** Parse "YYYY-MM-DD[THH:mm[:ss]]" into a Date whose UTC fields carry the wall-clock values. */
function parseWallClockFields(wallClockIso: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(wallClockIso.trim());
    if (!m) return new Date(NaN);
    const [, y, mo, d, h = '0', mi = '0', s = '0'] = m;
    return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)));
}

/**
 * True UTC offset (ms) of `tz` at the given instant, via Intl. date-fns-tz's
 * getTimezoneOffset reports the wrong offset for instants near DST
 * transitions, so it cannot be used here.
 */
function tzOffsetMs(tz: string, instant: Date): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    const parts: Record<string, number> = {};
    for (const part of dtf.formatToParts(instant)) {
        if (part.type !== 'literal') parts[part.type] = Number(part.value);
    }
    const wallAsUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour === 24 ? 0 : parts.hour,
        parts.minute,
        parts.second,
    );
    // Truncate sub-second precision the formatter cannot represent.
    return wallAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Apply the zone offset to wall-clock fields (held in a Date's UTC getters) to get the real instant. */
function wallClockFieldsToUtc(fields: Date, tz: string): Date {
    // Single pass on purpose: querying the offset at the "fields read as UTC"
    // instant makes nonexistent spring-forward times shift forward
    // (2:30 AM → 3:30 AM EDT) and resolves ambiguous fall-back times to the
    // earlier (DST) offset, matching the documented calendar semantics.
    return new Date(fields.getTime() - tzOffsetMs(tz, fields));
}

/**
 * Convert a wall-clock ISO string (no offset, e.g. "2026-06-15T09:00") in the
 * given IANA timezone to the UTC instant it represents.
 *
 * Host-timezone independent: a naive `new Date(iso)` parse would interpret the
 * string in the *server's* local zone, which differs between dev machines and
 * the Docker container (UTC). Instead the wall-clock fields are read as-is and
 * the zone offset applied explicitly. Nonexistent times in the spring-forward
 * gap shift forward (2:30 AM → 3:30 AM EDT); ambiguous fall-back times resolve
 * to the earlier (DST) offset.
 */
export function wallClockToUtc(wallClockIso: string, tz: string): Date {
    return wallClockFieldsToUtc(parseWallClockFields(wallClockIso), tz);
}

export function utcToWallClock(utcDate: Date, tz: string): Date {
    return toZonedTime(utcDate, tz);
}

export function allDayUtcRange(dateStr: string, tz: string): { start: Date; end: Date } {
    const startFields = parseWallClockFields(dateStr);
    const endFields = new Date(startFields.getTime());
    endFields.setUTCDate(endFields.getUTCDate() + 1);
    return {
        start: wallClockFieldsToUtc(startFields, tz),
        end: wallClockFieldsToUtc(endFields, tz),
    };
}

// ─── Recurrence ──────────────────────────────────────────────────────

export function advanceRecurrence(anchor: Date, rule: RecurrenceRule): Date {
    const interval = rule.interval ?? 1;
    switch (rule.frequency) {
        case 'daily':
            return addDays(anchor, interval);
        case 'weekly':
            return addWeeks(anchor, interval);
        case 'monthly':
            return addMonths(anchor, interval);
    }
}

export function expandRecurrence(
    eventStart: Date,
    eventEnd: Date,
    rule: RecurrenceRule | null,
    rangeStart: Date,
    rangeEnd: Date,
): Array<{ start: Date; end: Date }> {
    if (!rule) return [{ start: eventStart, end: eventEnd }];

    const durationMs = eventEnd.getTime() - eventStart.getTime();
    const results: Array<{ start: Date; end: Date }> = [];
    let current = eventStart;
    let occurrenceCount = 0;

    while (true) {
        const occEnd = new Date(current.getTime() + durationMs);

        if (rule.until) {
            const untilDate = new Date(rule.until);
            if (isAfter(current, untilDate)) break;
        }
        if (rule.count && occurrenceCount >= rule.count) break;

        if (!isBefore(occEnd, rangeStart) && !isAfter(current, rangeEnd)) {
            results.push({ start: current, end: occEnd });
        }

        if (isAfter(current, rangeEnd)) break;

        current = advanceRecurrence(current, rule);
        occurrenceCount++;
    }

    return results;
}

export function isRecurrenceRule(value: unknown): value is RecurrenceRule {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
        typeof obj.frequency === 'string'
        && VALID_FREQUENCIES.includes(obj.frequency as RecurrenceFrequency)
    );
}

function parseRecurrenceRule(raw: string | null): RecurrenceRule | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (isRecurrenceRule(parsed)) return parsed as RecurrenceRule;
        return null;
    } catch {
        return null;
    }
}

function serializeRecurrenceRule(rule: RecurrenceRule | null | undefined): string | null {
    if (!rule) return null;
    return JSON.stringify(rule);
}

// ─── Overlap detection ───────────────────────────────────────────────

export function eventsOverlap(
    a: { start: Date; end: Date },
    b: { start: Date; end: Date },
): boolean {
    return isBefore(a.start, b.end) && isAfter(a.end, b.start);
}

// ─── Month grid ──────────────────────────────────────────────────────

export interface MonthGridDay {
    date: string;
    isCurrentMonth: boolean;
}

export interface MonthGridWeek {
    days: MonthGridDay[];
}

export function getMonthGrid(year: number, month: number, tz: string): MonthGridWeek[] {
    const firstOfMonth = wallClockToUtc(`${year}-${String(month).padStart(2, '0')}-01T00:00:00`, tz);
    const dayOfWeek = firstOfMonth.getUTCDay();
    const weeks: MonthGridWeek[] = [];
    let current = addDays(firstOfMonth, -dayOfWeek);

    for (let week = 0; week < 6; week++) {
        const days: MonthGridDay[] = [];
        for (let d = 0; d < 7; d++) {
            const wallDate = toZonedTime(current, tz);
            const wallYear = wallDate.getFullYear();
            const wallMonth = wallDate.getMonth() + 1;
            days.push({
                date: `${wallYear}-${String(wallMonth).padStart(2, '0')}-${String(wallDate.getDate()).padStart(2, '0')}`,
                isCurrentMonth: wallYear === year && wallMonth === month,
            });
            current = addDays(current, 1);
        }
        weeks.push({ days });
        const nextWallDate = toZonedTime(current, tz);
        if (nextWallDate.getMonth() + 1 !== month && nextWallDate.getFullYear() === year) break;
        if (nextWallDate.getFullYear() > year) break;
    }

    return weeks;
}

// ─── Validation ──────────────────────────────────────────────────────

export interface ValidationError {
    field: string;
    message: string;
}

export function validateEventInput(input: CalendarEventInput): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!input.title?.trim()) {
        errors.push({ field: 'title', message: 'Title is required.' });
    }

    const startDate = new Date(input.start);
    const endDate = new Date(input.end);
    if (isNaN(startDate.getTime())) {
        errors.push({ field: 'start', message: 'Start date/time is invalid.' });
    }
    if (isNaN(endDate.getTime())) {
        errors.push({ field: 'end', message: 'End date/time is invalid.' });
    }
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && isBefore(endDate, startDate)) {
        errors.push({ field: 'end', message: 'End must be at or after start.' });
    }

    if (input.recurrenceRule) {
        if (!VALID_FREQUENCIES.includes(input.recurrenceRule.frequency)) {
            errors.push({ field: 'recurrenceRule', message: `Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}.` });
        }
        if (input.recurrenceRule.interval !== undefined && input.recurrenceRule.interval < 1) {
            errors.push({ field: 'recurrenceRule', message: 'Interval must be at least 1.' });
        }
        if (input.recurrenceRule.count !== undefined && input.recurrenceRule.count < 1) {
            errors.push({ field: 'recurrenceRule', message: 'Count must be at least 1.' });
        }
        if (input.recurrenceRule.until) {
            const untilDate = new Date(input.recurrenceRule.until);
            if (isNaN(untilDate.getTime())) {
                errors.push({ field: 'recurrenceRule', message: 'Until date is invalid.' });
            }
        }
    }

    if (input.reminderMinutesBefore !== undefined && input.reminderMinutesBefore !== null && input.reminderMinutesBefore < 0) {
        errors.push({ field: 'reminderMinutesBefore', message: 'Reminder minutes must be 0 or greater.' });
    }

    if (input.status && !VALID_STATUSES.includes(input.status)) {
        errors.push({ field: 'status', message: `Status must be one of: ${VALID_STATUSES.join(', ')}.` });
    }

    return errors;
}

// ─── Prisma mapping ─────────────────────────────────────────────────

function toRecord(row: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    start: Date;
    end: Date;
    allDay: boolean;
    location: string | null;
    assignee: string | null;
    clientId: string | null;
    jobId: string | null;
    client: { name: string } | null;
    job: { name: string } | null;
    recurrenceRule: string | null;
    reminderMinutesBefore: number | null;
    reminderSentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}): CalendarEventRecord {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status as CalendarEventStatus,
        start: row.start.toISOString(),
        end: row.end.toISOString(),
        allDay: row.allDay,
        location: row.location,
        assignee: row.assignee,
        clientId: row.clientId,
        jobId: row.jobId,
        clientName: row.client?.name ?? null,
        jobName: row.job?.name ?? null,
        recurrenceRule: parseRecurrenceRule(row.recurrenceRule),
        reminderMinutesBefore: row.reminderMinutesBefore,
        reminderSentAt: row.reminderSentAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

// ─── CRUD ────────────────────────────────────────────────────────────

export async function listEventsInRange(
    from: Date,
    to: Date,
    options?: { status?: CalendarEventStatus; clientId?: string; jobId?: string },
): Promise<CalendarEventRecord[]> {
    if (!isDatabaseConfigured()) return [];

    const where: Record<string, unknown> = {
        start: { lte: to },
        end: { gte: from },
    };
    if (options?.status) where.status = options.status;
    if (options?.clientId) where.clientId = options.clientId;
    if (options?.jobId) where.jobId = options.jobId;

    const rows = await prisma.calendarEvent.findMany({
        where,
        include: { client: { select: { name: true } }, job: { select: { name: true } } },
        orderBy: { start: 'asc' },
    });

    return rows.map(toRecord);
}

export async function getEvent(id: string): Promise<CalendarEventRecord | null> {
    if (!isDatabaseConfigured()) return null;

    const row = await prisma.calendarEvent.findUnique({
        where: { id },
        include: { client: { select: { name: true } }, job: { select: { name: true } } },
    });
    return row ? toRecord(row) : null;
}

export async function createEvent(input: CalendarEventInput): Promise<CalendarEventRecord> {
    const tz = await getBusinessTimezone();
    const errors = validateEventInput(input);
    if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.map((e) => e.message).join('; ')}`);
    }

    const startUtc = input.allDay
        ? allDayUtcRange(input.start.split('T')[0], tz).start
        : wallClockToUtc(input.start, tz);
    const endUtc = input.allDay
        ? allDayUtcRange(input.start.split('T')[0], tz).end
        : wallClockToUtc(input.end, tz);

    const row = await prisma.calendarEvent.create({
        data: {
            title: input.title.trim(),
            description: input.description?.trim() || null,
            status: input.status || 'scheduled',
            start: startUtc,
            end: endUtc,
            allDay: input.allDay ?? false,
            location: input.location?.trim() || null,
            assignee: input.assignee?.trim() || null,
            clientId: input.clientId || null,
            jobId: input.jobId || null,
            recurrenceRule: serializeRecurrenceRule(input.recurrenceRule),
            reminderMinutesBefore: input.reminderMinutesBefore ?? null,
        },
        include: { client: { select: { name: true } }, job: { select: { name: true } } },
    });

    return toRecord(row);
}

export async function updateEvent(id: string, input: Partial<CalendarEventInput>): Promise<CalendarEventRecord> {
    const tz = await getBusinessTimezone();

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.status !== undefined) data.status = input.status;
    if (input.location !== undefined) data.location = input.location?.trim() || null;
    if (input.assignee !== undefined) data.assignee = input.assignee?.trim() || null;
    if (input.clientId !== undefined) data.clientId = input.clientId || null;
    if (input.jobId !== undefined) data.jobId = input.jobId || null;
    if (input.recurrenceRule !== undefined) data.recurrenceRule = serializeRecurrenceRule(input.recurrenceRule);
    if (input.reminderMinutesBefore !== undefined) data.reminderMinutesBefore = input.reminderMinutesBefore ?? null;

    if (input.start !== undefined) {
        data.start = input.allDay
            ? allDayUtcRange(input.start.split('T')[0], tz).start
            : wallClockToUtc(input.start, tz);
    }
    if (input.end !== undefined) {
        data.end = input.allDay
            ? allDayUtcRange((input.start || '').split('T')[0], tz).end
            : wallClockToUtc(input.end, tz);
    }
    if (input.allDay !== undefined) data.allDay = input.allDay;

    const row = await prisma.calendarEvent.update({
        where: { id },
        data,
        include: { client: { select: { name: true } }, job: { select: { name: true } } },
    });

    return toRecord(row);
}

export async function cancelEvent(id: string): Promise<CalendarEventRecord> {
    const row = await prisma.calendarEvent.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { client: { select: { name: true } }, job: { select: { name: true } } },
    });
    return toRecord(row);
}

export async function deleteEvent(id: string): Promise<void> {
    await prisma.calendarEvent.delete({ where: { id } });
}

// ─── Reminders ───────────────────────────────────────────────────────

export async function getEventsNeedingReminder(now: Date): Promise<CalendarEventRecord[]> {
    if (!isDatabaseConfigured()) return [];

    const rows = await prisma.calendarEvent.findMany({
        where: {
            status: { in: ['scheduled', 'confirmed'] },
            reminderMinutesBefore: { not: null },
            reminderSentAt: null,
            recurrenceRule: null,
            start: { gte: now },
        },
        include: { client: { select: { name: true } }, job: { select: { name: true } } },
        orderBy: { start: 'asc' },
    });

    return rows.filter((row) => {
        const reminderTime = new Date(row.start.getTime() - (row.reminderMinutesBefore ?? 0) * 60 * 1000);
        return !isAfter(reminderTime, now);
    }).map(toRecord);
}

export async function markReminderSent(id: string): Promise<void> {
    await prisma.calendarEvent.update({
        where: { id },
        data: { reminderSentAt: new Date() },
    });
}

// ─── Upcoming events (for dashboard widget) ──────────────────────────

export async function getUpcomingEvents(days: number = 7): Promise<CalendarEventRecord[]> {
    const now = new Date();
    const to = addDays(now, days);
    return listEventsInRange(now, to, { status: 'scheduled' });
}
