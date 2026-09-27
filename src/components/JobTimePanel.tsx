'use client';

import { useState, useTransition } from 'react';
import { Badge, Box, Button, Card, Flex, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import {
    createJobTimeLogAction,
    deleteJobTimeLogAction,
} from '@/app/admin/jobs/actions';
import { formatHours } from '@/lib/job-estimated-hours';
import type { JobEstimatedHoursSummary } from '@/lib/job-estimated-hours';
import type { JobTimeLogRecord } from '@/lib/job-time-logs';
import { sumLoggedHours } from '@/lib/job-time-logs';
import Link from 'next/link';

export default function JobTimePanel({
    jobId,
    estimated,
    timeLogs,
}: {
    jobId: string;
    estimated: JobEstimatedHoursSummary;
    timeLogs: JobTimeLogRecord[];
}) {
    const router = useRouter();
    const [hours, setHours] = useState('');
    const [note, setNote] = useState('');
    const [loggedAt, setLoggedAt] = useState(() => new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    const loggedTotal = sumLoggedHours(timeLogs);
    const remaining = Math.round((estimated.totalHours - loggedTotal) * 100) / 100;

    const onLog = () => {
        setError('');
        startTransition(async () => {
            const result = await createJobTimeLogAction({
                jobId,
                hours: Number(hours),
                note,
                loggedAt,
            });
            if (!result.success) {
                setError(result.error || 'Could not log time.');
                return;
            }
            setHours('');
            setNote('');
            router.refresh();
        });
    };

    const onDelete = (timeLogId: string) => {
        setError('');
        startTransition(async () => {
            const result = await deleteJobTimeLogAction({ jobId, timeLogId });
            if (!result.success) {
                setError(result.error || 'Could not delete entry.');
                return;
            }
            router.refresh();
        });
    };

    return (
        <Card>
            <Heading size="4" mb="3">Time</Heading>

            <Flex gap="3" wrap="wrap" mb="4">
                <Box
                    style={{
                        border: '1px solid var(--gray-a5)',
                        borderRadius: 12,
                        padding: 12,
                        minWidth: 140,
                        flex: '1 1 140px',
                        background: 'var(--gray-a2)',
                    }}
                >
                    <Text as="div" size="1" color="gray">Estimated</Text>
                    <Text as="div" size="5" weight="bold">{formatHours(estimated.totalHours)}</Text>
                </Box>
                <Box
                    style={{
                        border: '1px solid var(--gray-a5)',
                        borderRadius: 12,
                        padding: 12,
                        minWidth: 140,
                        flex: '1 1 140px',
                        background: 'var(--gray-a2)',
                    }}
                >
                    <Text as="div" size="1" color="gray">Logged</Text>
                    <Text as="div" size="5" weight="bold">{formatHours(loggedTotal)}</Text>
                </Box>
                <Box
                    style={{
                        border: '1px solid var(--gray-a5)',
                        borderRadius: 12,
                        padding: 12,
                        minWidth: 140,
                        flex: '1 1 140px',
                        background: 'var(--gray-a2)',
                    }}
                >
                    <Text as="div" size="1" color="gray">Remaining</Text>
                    <Text as="div" size="5" weight="bold" color={remaining < 0 ? 'red' : undefined}>
                        {formatHours(remaining)}
                    </Text>
                </Box>
            </Flex>

            {estimated.contributions.length > 0 ? (
                <Box mb="4">
                    <Text as="div" size="2" weight="bold" mb="2">From estimates / quotes</Text>
                    <Flex direction="column" gap="2">
                        {estimated.contributions.map((item) => (
                            <Flex key={item.documentId} justify="between" gap="2" wrap="wrap">
                                <Text size="2">
                                    <Link
                                        href={`/admin/${item.type}s/${item.documentId}?fromJob=${jobId}`}
                                        style={{ color: 'var(--accent-11)' }}
                                    >
                                        {item.documentId}
                                        {item.title ? ` — ${item.title}` : ''}
                                    </Link>
                                </Text>
                                <Text size="2" color="gray">{formatHours(item.estimatedHours)}</Text>
                            </Flex>
                        ))}
                    </Flex>
                </Box>
            ) : (
                <Text as="p" size="2" color="gray" mb="4">
                    No estimated hours on linked estimates or quotes yet.
                </Text>
            )}

            <Box
                mb="4"
                style={{
                    borderTop: '1px solid var(--gray-a5)',
                    paddingTop: 16,
                }}
            >
                <Text as="div" size="2" weight="bold" mb="2">Log time</Text>
                <Flex direction="column" gap="3">
                    <Flex gap="3" wrap="wrap">
                        <Box style={{ flex: '1 1 120px' }}>
                            <Text as="label" size="2">Hours</Text>
                            <TextField.Root
                                type="number"
                                inputMode="decimal"
                                min="0.25"
                                step="0.25"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                placeholder="2"
                            />
                        </Box>
                        <Box style={{ flex: '1 1 160px' }}>
                            <Text as="label" size="2">Date</Text>
                            <TextField.Root
                                type="date"
                                value={loggedAt}
                                onChange={(e) => setLoggedAt(e.target.value)}
                            />
                        </Box>
                    </Flex>
                    <Box>
                        <Text as="label" size="2">Note</Text>
                        <TextArea
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Optional — what was done"
                        />
                    </Box>
                    <Button type="button" onClick={onLog} disabled={isPending || !hours} style={{ minHeight: 44, alignSelf: 'flex-start' }}>
                        {isPending ? 'Saving…' : 'Add time entry'}
                    </Button>
                    {error ? <Text color="red" size="2" role="alert">{error}</Text> : null}
                </Flex>
            </Box>

            <Box>
                <Text as="div" size="2" weight="bold" mb="2">Time log</Text>
                {timeLogs.length === 0 ? (
                    <Text size="2" color="gray">No time logged yet.</Text>
                ) : (
                    <Flex direction="column" gap="2">
                        {timeLogs.map((log) => (
                            <Box
                                key={log.id}
                                style={{
                                    border: '1px solid var(--gray-a5)',
                                    borderRadius: 12,
                                    padding: 12,
                                    background: 'var(--gray-a2)',
                                }}
                            >
                                <Flex justify="between" align="start" gap="2" wrap="wrap">
                                    <Box style={{ minWidth: 0, flex: '1 1 180px' }}>
                                        <Flex align="center" gap="2" wrap="wrap">
                                            <Text size="2" weight="bold">{formatHours(log.hours)}</Text>
                                            <Badge size="1" variant="soft">
                                                {new Date(log.loggedAt).toLocaleDateString()}
                                            </Badge>
                                        </Flex>
                                        {log.note ? (
                                            <Text as="div" size="2" mt="1" style={{ whiteSpace: 'pre-line' }}>
                                                {log.note}
                                            </Text>
                                        ) : null}
                                    </Box>
                                    <Button
                                        type="button"
                                        size="2"
                                        variant="soft"
                                        color="red"
                                        disabled={isPending}
                                        onClick={() => onDelete(log.id)}
                                        style={{ minHeight: 44 }}
                                    >
                                        Delete
                                    </Button>
                                </Flex>
                            </Box>
                        ))}
                    </Flex>
                )}
            </Box>
        </Card>
    );
}
