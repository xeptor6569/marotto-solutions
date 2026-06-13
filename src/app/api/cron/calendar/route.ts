import { NextResponse, type NextRequest } from 'next/server';
import { getEventsNeedingReminder, markReminderSent, getBusinessTimezone } from '@/lib/calendar';
import { sendCalendarEventReminderEmail } from '@/lib/email';

function checkSecret(request: NextRequest): NextResponse | null {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
        return NextResponse.json(
            { error: 'CRON_SECRET is not set on the server. Cron endpoint is disabled.' },
            { status: 503 },
        );
    }
    const provided = request.headers.get('x-cron-secret') || request.headers.get('authorization');
    const stripped = provided?.startsWith('Bearer ') ? provided.slice(7) : provided;
    if (stripped !== expected) {
        return NextResponse.json({ error: 'Invalid or missing X-Cron-Secret header' }, { status: 401 });
    }
    return null;
}

async function runReminders() {
    const now = new Date();
    const events = await getEventsNeedingReminder(now);
    const tz = await getBusinessTimezone();

    const results = [];
    for (const event of events) {
        const emailResult = await sendCalendarEventReminderEmail(event, tz);
        if (emailResult.ok) {
            await markReminderSent(event.id);
        }
        results.push({ eventId: event.id, title: event.title, ok: emailResult.ok, error: emailResult.error });
    }

    return NextResponse.json({
        checkedAt: now.toISOString(),
        remindersSent: results.filter((r) => r.ok).length,
        errors: results.filter((r) => !r.ok).length,
        details: results,
    });
}

export async function POST(request: NextRequest) {
    const guard = checkSecret(request);
    if (guard) return guard;
    try {
        return await runReminders();
    } catch (error) {
        console.error('Calendar reminders endpoint failed', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return POST(request);
}
