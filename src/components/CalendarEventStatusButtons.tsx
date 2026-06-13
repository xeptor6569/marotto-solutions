'use client';

import { useState, useTransition } from 'react';
import { Button, Dialog, Flex } from '@radix-ui/themes';
import { XCircle } from 'lucide-react';
import { cancelCalendarEventAction } from '@/app/admin/calendar/actions';
import { useRouter } from 'next/navigation';

export default function CalendarEventStatusButtons({
    eventId,
    status,
}: {
    eventId: string;
    status: string;
}) {
    const router = useRouter();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    if (status === 'cancelled' || status === 'completed') return null;

    const handleCancel = () => {
        startTransition(async () => {
            await cancelCalendarEventAction(eventId);
            router.refresh();
        });
    };

    return (
        <>
            <Button
                size="2"
                variant="soft"
                color="red"
                onClick={() => setConfirmOpen(true)}
                disabled={pending}
            >
                <XCircle size={14} /> Cancel event
            </Button>

            <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
                <Dialog.Content maxWidth="400px">
                    <Dialog.Title>Cancel this event?</Dialog.Title>
                    <Dialog.Description size="2" mb="3">
                        The event will be marked as cancelled and hidden from default views. This can be undone by editing the event.
                    </Dialog.Description>
                    <Flex gap="3" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray" type="button">Keep</Button>
                        </Dialog.Close>
                        <Button
                            color="red"
                            onClick={handleCancel}
                            loading={pending}
                        >
                            Cancel event
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </>
    );
}
