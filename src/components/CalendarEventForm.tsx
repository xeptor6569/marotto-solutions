'use client';

import { useState, useTransition } from 'react';
import {
    Box, Button, Callout, Checkbox, Flex, Select, Text, TextField,
} from '@radix-ui/themes';
import { CheckCircle, XCircle } from 'lucide-react';
import { createCalendarEventAction, updateCalendarEventAction } from '@/app/admin/calendar/actions';
import type { CalendarEventInput, CalendarEventStatus, RecurrenceFrequency, RecurrenceRule } from '@/lib/types';

const STATUS_OPTIONS: { value: CalendarEventStatus; label: string }[] = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
];

type FormState = { success: boolean; error?: string; errors?: Array<{ field: string; message: string }> };

export default function CalendarEventForm({
    mode,
    eventId,
    initialData,
}: {
    mode: 'create' | 'edit';
    eventId?: string;
    initialData: CalendarEventInput;
}) {
    const [title, setTitle] = useState(initialData.title);
    const [description, setDescription] = useState(initialData.description || '');
    const [status, setStatus] = useState<CalendarEventStatus>(initialData.status || 'scheduled');
    const [start, setStart] = useState(initialData.start);
    const [end, setEnd] = useState(initialData.end);
    const [allDay, setAllDay] = useState(initialData.allDay ?? false);
    const [location, setLocation] = useState(initialData.location || '');
    const [assignee] = useState(initialData.assignee || '');

    const [hasRecurrence, setHasRecurrence] = useState(!!initialData.recurrenceRule);
    const [frequency, setFrequency] = useState<RecurrenceFrequency>(initialData.recurrenceRule?.frequency || 'weekly');
    const [interval, setInterval] = useState(String(initialData.recurrenceRule?.interval ?? 1));
    const [until, setUntil] = useState(initialData.recurrenceRule?.until?.split('T')[0] || '');
    const [count, setCount] = useState(initialData.recurrenceRule?.count?.toString() || '');

    const [hasReminder, setHasReminder] = useState(initialData.reminderMinutesBefore !== undefined && initialData.reminderMinutesBefore !== null);
    const [reminderMinutes, setReminderMinutes] = useState(String(initialData.reminderMinutesBefore ?? 60));

    const [pending, startTransition] = useTransition();
    const [state, setState] = useState<FormState | null>(null);

    const buildInput = (): CalendarEventInput => {
        const recurrenceRule: RecurrenceRule | undefined = hasRecurrence
            ? {
                frequency,
                interval: parseInt(interval, 10) || 1,
                ...(until ? { until: `${until}T23:59:59.000Z` } : {}),
                ...(count ? { count: parseInt(count, 10) || undefined } : {}),
            }
            : undefined;

        return {
            title,
            description: description || undefined,
            status,
            start,
            end: allDay ? start : end,
            allDay,
            location: location || undefined,
            assignee: assignee || undefined,
            recurrenceRule,
            reminderMinutesBefore: hasReminder ? parseInt(reminderMinutes, 10) || 60 : null,
        };
    };

    const handleSubmit = () => {
        setState(null);
        startTransition(async () => {
            const input = buildInput();
            if (mode === 'create') {
                const result = await createCalendarEventAction(input);
                setState(result);
            } else if (eventId) {
                const result = await updateCalendarEventAction(eventId, input);
                setState(result);
            }
        });
    };

    return (
        <Flex direction="column" gap="4">
            {state?.error ? (
                <Callout.Root color="red">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>{state.error}</Callout.Text>
                </Callout.Root>
            ) : null}
            {state?.success ? (
                <Callout.Root color="green">
                    <Callout.Icon><CheckCircle size={16} /></Callout.Icon>
                    <Callout.Text>{mode === 'create' ? 'Event created.' : 'Event updated.'}</Callout.Text>
                </Callout.Root>
            ) : null}

            <Box>
                <Text as="label" size="2" weight="bold">Title</Text>
                <TextField.Root
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Site visit"
                    mt="1"
                />
            </Box>

            <Box>
                <Text as="label" size="2" weight="bold">Description</Text>
                <TextField.Root
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional details"
                    mt="1"
                />
            </Box>

            <Flex gap="3" align="center">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Checkbox checked={allDay} onCheckedChange={(v) => setAllDay(v === true)} />
                    All day
                </label>
            </Flex>

            <Flex gap="3">
                <Box style={{ flex: 1 }}>
                    <Text as="label" size="2" weight="bold">{allDay ? 'Date' : 'Start'}</Text>
                    <TextField.Root
                        type={allDay ? 'date' : 'datetime-local'}
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        mt="1"
                    />
                </Box>
                {!allDay ? (
                    <Box style={{ flex: 1 }}>
                        <Text as="label" size="2" weight="bold">End</Text>
                        <TextField.Root
                            type="datetime-local"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            mt="1"
                        />
                    </Box>
                ) : null}
            </Flex>

            <Box>
                <Text as="label" size="2" weight="bold">Location</Text>
                <TextField.Root
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="123 Main St, Wilkes-Barre, PA"
                    mt="1"
                />
            </Box>

            <Box>
                <Text as="label" size="2" weight="bold">Status</Text>
                <Select.Root value={status} onValueChange={(v) => setStatus(v as CalendarEventStatus)}>
                    <Select.Trigger mt="1" style={{ width: '100%' }} />
                    <Select.Content>
                        {STATUS_OPTIONS.map((opt) => (
                            <Select.Item key={opt.value} value={opt.value}>{opt.label}</Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
            </Box>

            <Box>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Checkbox checked={hasRecurrence} onCheckedChange={(v) => setHasRecurrence(v === true)} />
                    Recurring event
                </label>
                {hasRecurrence ? (
                    <Flex direction="column" gap="2" pl="4">
                        <Flex gap="3">
                            <Box style={{ flex: 1 }}>
                                <Text as="label" size="2" weight="bold">Frequency</Text>
                                <Select.Root value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
                                    <Select.Trigger mt="1" style={{ width: '100%' }} />
                                    <Select.Content>
                                        {FREQUENCY_OPTIONS.map((opt) => (
                                            <Select.Item key={opt.value} value={opt.value}>{opt.label}</Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Root>
                            </Box>
                            <Box style={{ flex: 1 }}>
                                <Text as="label" size="2" weight="bold">Every</Text>
                                <TextField.Root
                                    type="number"
                                    min="1"
                                    value={interval}
                                    onChange={(e) => setInterval(e.target.value)}
                                    mt="1"
                                />
                            </Box>
                        </Flex>
                        <Flex gap="3">
                            <Box style={{ flex: 1 }}>
                                <Text as="label" size="2" weight="bold">Until date</Text>
                                <TextField.Root
                                    type="date"
                                    value={until}
                                    onChange={(e) => setUntil(e.target.value)}
                                    mt="1"
                                />
                            </Box>
                            <Box style={{ flex: 1 }}>
                                <Text as="label" size="2" weight="bold">Or max occurrences</Text>
                                <TextField.Root
                                    type="number"
                                    min="1"
                                    value={count}
                                    onChange={(e) => setCount(e.target.value)}
                                    placeholder="Leave blank for no limit"
                                    mt="1"
                                />
                            </Box>
                        </Flex>
                    </Flex>
                ) : null}
            </Box>

            <Box>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Checkbox checked={hasReminder} onCheckedChange={(v) => setHasReminder(v === true)} />
                    Email reminder
                </label>
                {hasReminder ? (
                    <Box pl="4">
                        <Text as="label" size="2" weight="bold">Minutes before start</Text>
                        <TextField.Root
                            type="number"
                            min="0"
                            value={reminderMinutes}
                            onChange={(e) => setReminderMinutes(e.target.value)}
                            mt="1"
                        />
                    </Box>
                ) : null}
            </Box>

            <Flex gap="3" justify="end">
                <Button
                    size="3"
                    onClick={handleSubmit}
                    loading={pending}
                    disabled={pending || !title.trim()}
                >
                    {mode === 'create' ? 'Create event' : 'Save changes'}
                </Button>
            </Flex>
        </Flex>
    );
}
