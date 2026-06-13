import Link from 'next/link';
import { Button, Callout, Container } from '@radix-ui/themes';
import { Plus, XCircle } from 'lucide-react';
import { isDatabaseConfigured } from '@/lib/prisma';
import { listEventsInRange, getMonthGrid, getBusinessTimezone, expandRecurrence } from '@/lib/calendar';
import CalendarView from '@/components/CalendarView';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import BackButton from '@/components/BackButton';
import RunCalendarRemindersButton from '@/components/RunCalendarRemindersButton';

export default async function AdminCalendarPage({
    searchParams,
}: {
    searchParams?: Promise<{ view?: string; year?: string; month?: string }>;
}) {
    const params = (await searchParams) || {};
    const dbReady = isDatabaseConfigured();
    const tz = await getBusinessTimezone();
    const view = params.view || 'month';
    const now = new Date();
    const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
    const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;

    const rangeStart = new Date(year, month - 1, 1);
    const rangeEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const events = dbReady ? await listEventsInRange(rangeStart, rangeEnd) : [];
    const grid = getMonthGrid(year, month, tz);

    const eventsByDate = new Map<string, Array<{
        id: string;
        title: string;
        status: string;
        allDay: boolean;
        start: string;
    }>>();

    for (const event of events) {
        const rule = event.recurrenceRule;
        const occurrences = expandRecurrence(
            new Date(event.start),
            new Date(event.end),
            rule,
            rangeStart,
            rangeEnd,
        );
        for (const occ of occurrences) {
            const wallDate = new Date(occ.start.toLocaleString('en-US', { timeZone: tz }));
            const dateStr = `${wallDate.getFullYear()}-${String(wallDate.getMonth() + 1).padStart(2, '0')}-${String(wallDate.getDate()).padStart(2, '0')}`;
            const list = eventsByDate.get(dateStr) || [];
            list.push({
                id: event.id,
                title: event.title,
                status: event.status,
                allDay: event.allDay,
                start: occ.start.toISOString(),
            });
            eventsByDate.set(dateStr, list);
        }
    }

    return (
        <Container size="4" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title="Calendar"
                actions={(
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href={`/admin/calendar/new?year=${year}&month=${month}`}><Plus size={14} /> New event</Link>
                        </Button>
                        <RunCalendarRemindersButton />
                        <BackButton href="/admin" />
                    </>
                )}
            />

            {!dbReady ? (
                <Callout.Root color="amber" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>
                        The calendar requires <code>DATABASE_URL</code> to be set. Configure Postgres and run <code>prisma migrate deploy</code>.
                    </Callout.Text>
                </Callout.Root>
            ) : null}

            <CalendarView
                view={view}
                year={year}
                month={month}
                grid={grid}
                eventsByDate={eventsByDate}
            />
        </Container>
    );
}
