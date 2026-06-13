import { Box, Button, Container, Heading, Text, Badge, Flex, Card } from '@radix-ui/themes';
import { CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { getEvent, getBusinessTimezone } from '@/lib/calendar';
import { isDatabaseConfigured } from '@/lib/prisma';
import { formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';
import CalendarEventStatusButtons from '@/components/CalendarEventStatusButtons';
import BackButton from '@/components/BackButton';

function statusColor(status: string) {
    if (status === 'confirmed') return 'blue';
    if (status === 'completed') return 'green';
    if (status === 'cancelled') return 'red';
    return 'orange';
}

export default async function CalendarEventDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const dbReady = isDatabaseConfigured();
    const event = dbReady ? await getEvent(id) : null;
    const tz = await getBusinessTimezone();

    if (!event) {
        return (
            <Container size="3" p="5">
                <Text>Event not found.</Text>
                <BackButton href="/admin/calendar" />
            </Container>
        );
    }

    const startUtc = new Date(event.start);
    const endUtc = new Date(event.end);
    const startLocal = formatInTimeZone(startUtc, tz, event.allDay ? 'MMMM d, yyyy' : 'MMMM d, yyyy h:mm a');
    const endLocal = event.allDay
        ? formatInTimeZone(new Date(endUtc.getTime() - 1), tz, 'MMMM d, yyyy')
        : formatInTimeZone(endUtc, tz, 'MMMM d, yyyy h:mm a');

    const recurrenceLabel = event.recurrenceRule
        ? `Every ${event.recurrenceRule.interval ?? 1} ${event.recurrenceRule.frequency.replace('ly', '').replace('dail', 'day')}${(event.recurrenceRule.interval ?? 1) > 1 ? 's' : ''}`
        : null;

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <Flex justify="between" align="center" mb="4">
                <BackButton href="/admin/calendar" />
                <Flex gap="2">
                    <CalendarEventStatusButtons eventId={event.id} status={event.status} />
                    <Button asChild size="2" variant="soft">
                        <Link href={`/admin/calendar/${event.id}/edit`}>Edit</Link>
                    </Button>
                </Flex>
            </Flex>

            <Card size="3">
                <Flex direction="column" gap="4">
                    <Flex justify="between" align="start">
                        <Box>
                            <Heading size="6">{event.title}</Heading>
                            {event.description ? <Text as="p" size="2" color="gray" mt="2" style={{ whiteSpace: 'pre-line' }}>{event.description}</Text> : null}
                        </Box>
                        <Badge color={statusColor(event.status)} size="2">{event.status}</Badge>
                    </Flex>

                    <Flex gap="4" wrap="wrap">
                        <Box>
                            <Text size="1" color="gray" weight="bold">Start</Text>
                            <Text as="div" size="2"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{startLocal}</Text>
                        </Box>
                        <Box>
                            <Text size="1" color="gray" weight="bold">End</Text>
                            <Text as="div" size="2">{endLocal}</Text>
                        </Box>
                        {event.allDay ? (
                            <Box>
                                <Text size="1" color="gray" weight="bold">Type</Text>
                                <Text as="div" size="2">All day</Text>
                            </Box>
                        ) : null}
                    </Flex>

                    {event.location ? (
                        <Box>
                            <Text size="1" color="gray" weight="bold">Location</Text>
                            <Text as="div" size="2">{event.location}</Text>
                        </Box>
                    ) : null}

                    {event.clientName ? (
                        <Box>
                            <Text size="1" color="gray" weight="bold">Client</Text>
                            <Text as="div" size="2">{event.clientName}</Text>
                        </Box>
                    ) : null}

                    {event.jobName ? (
                        <Box>
                            <Text size="1" color="gray" weight="bold">Job</Text>
                            <Text as="div" size="2">{event.jobName}</Text>
                        </Box>
                    ) : null}

                    {recurrenceLabel ? (
                        <Box>
                            <Text size="1" color="gray" weight="bold">Recurrence</Text>
                            <Text as="div" size="2">{recurrenceLabel}</Text>
                            {event.recurrenceRule?.until ? <Text as="div" size="1" color="gray">Until {format(new Date(event.recurrenceRule.until), 'MMMM d, yyyy')}</Text> : null}
                            {event.recurrenceRule?.count ? <Text as="div" size="1" color="gray">{event.recurrenceRule.count} occurrences</Text> : null}
                        </Box>
                    ) : null}

                    {event.reminderMinutesBefore !== null ? (
                        <Box>
                            <Text size="1" color="gray" weight="bold">Reminder</Text>
                            <Text as="div" size="2">{event.reminderMinutesBefore} minutes before start</Text>
                            {event.reminderSentAt ? <Text as="div" size="1" color="green"><CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />Reminder sent</Text> : null}
                        </Box>
                    ) : null}
                </Flex>
            </Card>
        </Container>
    );
}
