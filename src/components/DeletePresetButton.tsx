'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertDialog, Button, Flex, Text } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';
import { deletePresetAction } from '@/app/admin/presets/actions';

export default function DeletePresetButton({
    presetId,
    presetName,
}: {
    presetId: string;
    presetName: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [pending, startTransition] = useTransition();

    const onConfirm = () => {
        setError('');
        startTransition(async () => {
            const result = await deletePresetAction({ id: presetId });
            if (!result.success) {
                setError(result.error || 'Could not delete preset.');
                return;
            }
            setOpen(false);
            router.push('/admin/presets');
            router.refresh();
        });
    };

    return (
        <>
            <Button
                type="button"
                variant="soft"
                color="red"
                onClick={() => setOpen(true)}
                style={{ minHeight: 44 }}
            >
                <Trash2 size={14} />
                Delete
            </Button>

            <AlertDialog.Root open={open} onOpenChange={setOpen}>
                <AlertDialog.Content maxWidth="420px">
                    <AlertDialog.Title>Delete preset?</AlertDialog.Title>
                    <AlertDialog.Description>
                        Delete “{presetName}”? This cannot be undone. Existing documents are not affected.
                    </AlertDialog.Description>
                    {error ? (
                        <Text size="2" color="red" mt="2" as="p" role="alert">{error}</Text>
                    ) : null}
                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                            <Button variant="soft" color="gray" disabled={pending}>Cancel</Button>
                        </AlertDialog.Cancel>
                        <Button color="red" loading={pending} onClick={onConfirm}>
                            Delete preset
                        </Button>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </>
    );
}
