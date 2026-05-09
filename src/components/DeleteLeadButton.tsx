'use client';

import { AlertDialog, Button, Callout, Flex } from '@radix-ui/themes';
import { Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteLeadAction } from '@/app/actions';

interface DeleteLeadButtonProps {
    leadId: string;
    leadName: string;
    size?: '1' | '2' | '3';
    fullWidth?: boolean;
    redirectTo?: string;
    label?: string;
}

export default function DeleteLeadButton({
    leadId,
    leadName,
    size = '2',
    fullWidth = false,
    redirectTo,
    label,
}: DeleteLeadButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        const result = await deleteLeadAction({ id: leadId });
        setLoading(false);
        if (result.success) {
            setOpen(false);
            if (redirectTo) {
                router.push(redirectTo);
            } else {
                router.refresh();
            }
        } else {
            setError(result.error || 'Failed to delete client');
        }
    };

    return (
        <AlertDialog.Root open={open} onOpenChange={setOpen}>
            <AlertDialog.Trigger>
                <Button
                    size={size}
                    variant="soft"
                    color="red"
                    style={fullWidth ? { width: '100%' } : undefined}
                >
                    <Trash2 size={14} /> {label}
                </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content style={{ maxWidth: 450 }}>
                <AlertDialog.Title>Delete client?</AlertDialog.Title>
                <AlertDialog.Description size="2">
                    Permanently delete <strong>{leadName}</strong> ({leadId})? Documents linked to this lead are not removed, but the client record will be lost.
                </AlertDialog.Description>

                {error ? (
                    <Callout.Root color="red" mt="3">
                        <Callout.Icon><XCircle size={16} /></Callout.Icon>
                        <Callout.Text>{error}</Callout.Text>
                    </Callout.Root>
                ) : null}

                <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                        <Button variant="soft" color="gray">Cancel</Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                        <Button variant="solid" color="red" onClick={handleDelete} loading={loading}>
                            Delete client
                        </Button>
                    </AlertDialog.Action>
                </Flex>
            </AlertDialog.Content>
        </AlertDialog.Root>
    );
}
