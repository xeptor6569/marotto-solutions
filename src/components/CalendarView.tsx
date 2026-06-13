'use client';

import { Flex, Box, Text, Button, Badge, Grid, Card, Heading } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type EventChip = {
    id: string;
    title: string;
    status: string;
    allDay: boolean;
    start: string;
};

type MonthGridWeek = { days: Array<{ date: string; isCurrentMonth: boolean }> };

function statusChipColor(status: string) {
    if (status === 'confirmed') return 'blue';
    if (status === 'completed') return 'green';
    if (status === 'cancelled') return 'red';
    return 'orange';
}

export default function CalendarView({
    view,
    year,
    month,
    grid,
    eventsByDate,
}: {
    view: string;
    year: number;
    month: number;
    grid: MonthGridWeek[];
    eventsByDate: Map<string, EventChip[]>;
}) {
    const router = useRouter();

    const navigate = (delta: number) => {
        let m = month + delta;
        let y = year;
        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }
        router.push(`/admin/calendar?view=month&year=${y}&month=${m}`);
    };

    const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

    if (view === 'list') {
        const sortedDates = [...eventsByDate.keys()].sort();
        return (
            <Flex direction="column" gap="3">
                <Flex justify="between" align="center" mb="3">
                    <Heading size="5">{monthName} {year}</Heading>
                    <Flex gap="2">
                        <Button variant="soft" size="2" onClick={() => navigate(-1)}><ChevronLeft size={14} /></Button>
                        <Button variant="soft" size="2" onClick={() => navigate(1)}><ChevronRight size={14} /></Button>
                    </Flex>
                </Flex>
                {sortedDates.length === 0 ? (
                    <Text color="gray">No events this month.</Text>
                ) : (
                    sortedDates.map((dateStr) => {
                        const events = eventsByDate.get(dateStr) || [];
                        return (
                            <Card key={dateStr} variant="surface">
                                <Text weight="bold" size="2" mb="2" as="div">{new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                                <Flex direction="column" gap="1">
                                    {events.map((ev) => (
                                        <Link key={`${ev.id}-${ev.start}`} href={`/admin/calendar/${ev.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <Flex align="center" gap="2" py="1">
                                                <Badge color={statusChipColor(ev.status)} size="1">{ev.status}</Badge>
                                                <Text size="2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</Text>
                                            </Flex>
                                        </Link>
                                    ))}
                                </Flex>
                            </Card>
                        );
                    })
                )}
            </Flex>
        );
    }

    // Month grid view (default)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Flex direction="column" gap="3">
            <Flex justify="between" align="center" mb="2">
                <Flex align="center" gap="3">
                    <Text size="6" weight="bold">{monthName}</Text>
                    <Text size="5" color="gray">{year}</Text>
                </Flex>
                <Flex gap="2">
                    <Button variant="soft" size="2" asChild>
                        <Link href={`/admin/calendar?view=month&year=${year}&month=${month}`}>Month</Link>
                    </Button>
                    <Button variant="soft" size="2" asChild>
                        <Link href={`/admin/calendar?view=list&year=${year}&month=${month}`}>List</Link>
                    </Button>
                    <Button variant="ghost" size="2" onClick={() => navigate(-1)}><ChevronLeft size={16} /></Button>
                    <Button variant="ghost" size="2" onClick={() => navigate(1)}><ChevronRight size={16} /></Button>
                </Flex>
            </Flex>

            <Grid columns="7" gap="1">
                {dayNames.map((d) => (
                    <Box key={d} p="2" style={{ textAlign: 'center' }}>
                        <Text size="1" weight="bold" color="gray">{d}</Text>
                    </Box>
                ))}

                {grid.flatMap((week) =>
                    week.days.map((day) => {
                        const events = eventsByDate.get(day.date) || [];
                        return (
                            <Box
                                key={day.date}
                                p="2"
                                style={{
                                    minHeight: 90,
                                    background: day.isCurrentMonth ? 'var(--color-background)' : 'var(--gray-a2)',
                                    borderRadius: 4,
                                    border: day.isCurrentMonth ? '1px solid var(--gray-a3)' : 'none',
                                }}
                            >
                                <Text
                                    size="1"
                                    weight="bold"
                                    color={day.isCurrentMonth ? undefined : 'gray'}
                                    mb="1"
                                    as="div"
                                >
                                    {day.date.split('-')[2]}
                                </Text>
                                <Flex direction="column" gap="1" style={{ overflow: 'hidden' }}>
                                    {events.slice(0, 3).map((ev) => (
                                        <Link
                                            key={`${ev.id}-${ev.start}`}
                                            href={`/admin/calendar/${ev.id}`}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <Badge
                                                color={statusChipColor(ev.status)}
                                                size="1"
                                                style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            >
                                                {ev.title}
                                            </Badge>
                                        </Link>
                                    ))}
                                    {events.length > 3 ? (
                                        <Text size="1" color="gray">+{events.length - 3} more</Text>
                                    ) : null}
                                </Flex>
                            </Box>
                        );
                    })
                )}
            </Grid>
        </Flex>
    );
}
