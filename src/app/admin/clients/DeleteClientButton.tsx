'use client';

import { AlertDialog, Button, Flex } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deleteClient } from './actions';
import { useRouter } from 'next/navigation';

export default function DeleteClientButton({
    clientId,
    clientName,
    size = '1',
    fullWidth = false,
}: {
    clientId: string;
    clientName: string;
    size?: '1' | '2' | '3';
    fullWidth?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteClient(clientId);
        setLoading(false);

        if (result.success) {
            setOpen(false);
            router.refresh();
        }
    };

    return (
        <AlertDialog.Root open={open} onOpenChange={setOpen}>
            <AlertDialog.Trigger>
                <Button size={size} variant="soft" color="red" style={fullWidth ? { width: '100%' } : undefined}>
                    <Trash2 size={14} />
                </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content style={{ maxWidth: 450 }}>
                <AlertDialog.Title>Delete Client?</AlertDialog.Title>
                <AlertDialog.Description size="2">
                    Are you sure you want to delete <strong>{clientName}</strong>? This action cannot be undone.
                </AlertDialog.Description>

                <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                        <Button variant="soft" color="gray">
                            Cancel
                        </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                        <Button variant="solid" color="red" onClick={handleDelete} loading={loading}>
                            Delete Client
                        </Button>
                    </AlertDialog.Action>
                </Flex>
            </AlertDialog.Content>
        </AlertDialog.Root>
    );
}
