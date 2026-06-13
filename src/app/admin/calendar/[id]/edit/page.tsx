import { Container } from '@radix-ui/themes';
import { getEvent, getBusinessTimezone } from '@/lib/calendar';
import { formatInTimeZone } from 'date-fns-tz';
import { isDatabaseConfigured } from '@/lib/prisma';
import CalendarEventForm from '@/components/CalendarEventForm';
import BackButton from '@/components/BackButton';
import type { CalendarEventInput } from '@/lib/types';

export default async function EditCalendarEventPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const dbReady = isDatabaseConfigured();
    const event = dbReady ? await getEvent(id) : null;
    const tz = await getBusinessTimezone();

    if (!event) {
        return <Container size="3" p="5"><p>Event not found.</p></Container>;
    }

    const startLocal = formatInTimeZone(new Date(event.start), tz, event.allDay ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm");
    const endLocal = event.allDay
        ? formatInTimeZone(new Date(new Date(event.end).getTime() - 1), tz, 'yyyy-MM-dd')
        : formatInTimeZone(new Date(event.end), tz, "yyyy-MM-dd'T'HH:mm");

    const initialData: CalendarEventInput = {
        title: event.title,
        description: event.description || undefined,
        status: event.status,
        start: startLocal,
        end: endLocal,
        allDay: event.allDay,
        location: event.location || undefined,
        assignee: event.assignee || undefined,
        clientId: event.clientId || undefined,
        jobId: event.jobId || undefined,
        recurrenceRule: event.recurrenceRule || undefined,
        reminderMinutesBefore: event.reminderMinutesBefore,
    };

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <BackButton href={`/admin/calendar/${id}`} />
            <CalendarEventForm mode="edit" eventId={id} initialData={initialData} />
        </Container>
    );
}
