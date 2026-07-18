'use client';

import { useState, useTransition } from 'react';
import { AlertDialog, Button, Flex, Text } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';
import { deleteAdminDocumentAction } from '@/app/actions';

export default function DeleteDocumentButton({
    documentId,
    documentLabel,
    redirectTo,
    variant = 'soft',
    size = '2',
    fullWidth = false,
}: {
    documentId: string;
    documentLabel: string;
    redirectTo?: string;
    variant?: 'soft' | 'solid' | 'outline' | 'ghost';
    size?: '1' | '2' | '3';
    fullWidth?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    const onConfirm = () => {
        setError('');
        startTransition(async () => {
            const result = await deleteAdminDocumentAction({
                id: documentId,
                redirectTo,
            });
            if (!result.success) {
                setError(result.error || 'Unable to delete document');
                return;
            }
            setOpen(false);
        });
    };

    return (
        <AlertDialog.Root open={open} onOpenChange={setOpen}>
            <AlertDialog.Trigger>
                <Button
                    type="button"
                    color="red"
                    variant={variant}
                    size={size}
                    style={fullWidth ? { width: '100%', minHeight: 44 } : { minHeight: 44 }}
                >
                    <Trash2 size={16} />
                    Delete
                </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content maxWidth="420px">
                <AlertDialog.Title>Delete {documentLabel}?</AlertDialog.Title>
                <AlertDialog.Description size="2">
                    This permanently removes {documentId}. This cannot be undone.
                </AlertDialog.Description>
                {error ? (
                    <Text as="p" size="2" color="red" mt="3">{error}</Text>
                ) : null}
                <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                        <Button variant="soft" color="gray" disabled={isPending}>
                            Cancel
                        </Button>
                    </AlertDialog.Cancel>
                    <Button color="red" onClick={onConfirm} disabled={isPending}>
                        {isPending ? 'Deleting…' : 'Delete'}
                    </Button>
                </Flex>
            </AlertDialog.Content>
        </AlertDialog.Root>
    );
}
