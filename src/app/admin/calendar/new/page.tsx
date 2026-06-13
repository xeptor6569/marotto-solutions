import { Container } from '@radix-ui/themes';
import CalendarEventForm from '@/components/CalendarEventForm';
import BackButton from '@/components/BackButton';
import type { CalendarEventInput } from '@/lib/types';

export default async function NewCalendarEventPage({
    searchParams,
}: {
    searchParams?: Promise<{ year?: string; month?: string }>;
}) {
    const params = (await searchParams) || {};
    const now = new Date();
    const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
    const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
    const day = now.getDate();
    const defaultStart = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T09:00`;
    const defaultEnd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00`;

    const initialData: CalendarEventInput = {
        title: '',
        start: defaultStart,
        end: defaultEnd,
    };

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <BackButton href="/admin/calendar" />
            <CalendarEventForm mode="create" initialData={initialData} />
        </Container>
    );
}
