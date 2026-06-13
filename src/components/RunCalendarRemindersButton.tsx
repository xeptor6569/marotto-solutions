'use client';

import { useState, useTransition } from 'react';
import { Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { Bell } from 'lucide-react';

export default function RunCalendarRemindersButton() {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState<{ sent: number; errors: number } | null>(null);
    const [pending, startTransition] = useTransition();

    const handleRun = () => {
        setResult(null);
        startTransition(async () => {
            try {
                const res = await fetch('/api/cron/calendar', {
                    method: 'POST',
                    headers: { 'X-Cron-Secret': process.env.NEXT_PUBLIC_CRON_SECRET || 'local-dev' },
                });
                const data = await res.json();
                setResult({ sent: data.remindersSent ?? 0, errors: data.errors ?? 0 });
            } catch {
                setResult({ sent: 0, errors: 1 });
            }
        });
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger>
                <Button variant="soft" size="2">
                    <Bell size={14} /> Reminders
                </Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="400px">
                <Dialog.Title>Run calendar reminders</Dialog.Title>
                <Dialog.Description size="2" mb="3">
                    Manually trigger the calendar reminder check. This is normally handled by the cron sidecar every hour.
                </Dialog.Description>
                {result ? (
                    <Text size="2" mb="3" as="p">
                        {result.sent} reminder{result.sent === 1 ? '' : 's'} sent.
                        {result.errors > 0 ? ` ${result.errors} error${result.errors === 1 ? '' : 's'}.` : ''}
                    </Text>
                ) : null}
                <Flex gap="3" justify="end">
                    <Dialog.Close>
                        <Button variant="soft" color="gray" type="button">Close</Button>
                    </Dialog.Close>
                    <Button onClick={handleRun} loading={pending} disabled={pending}>
                        Run now
                    </Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
