'use client';

import { useState, useTransition } from 'react';
import { AlertDialog, Button, Callout, Flex, Text } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { CheckCircle, Pause, Play, StopCircle, Trash2, XCircle, Repeat } from 'lucide-react';
import {
    cancelContractAction,
    deleteContractAction,
    endContractAction,
    issueNextInvoiceAction,
    pauseContractAction,
    resumeContractAction,
} from '@/app/admin/contracts/actions';
import type { ContractStatus } from '@/lib/types';

interface Props {
    contractId: string;
    contractDisplayId: string;
    status: ContractStatus;
}

export default function ContractStatusButtons({ contractId, contractDisplayId, status }: Props) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const runAction = (fn: () => Promise<{ success: boolean; error?: string; invoiceId?: string; cycle?: number }>, successMsg: string) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await fn();
            if (!result.success) {
                setError(result.error || 'Action failed');
                return;
            }
            const finalMsg = result.invoiceId
                ? `${successMsg} (cycle ${result.cycle}, invoice ${result.invoiceId})`
                : successMsg;
            setSuccess(finalMsg);
            router.refresh();
        });
    };

    return (
        <Flex direction="column" gap="2">
            <Flex gap="2" wrap="wrap">
                {status === 'active' ? (
                    <Button
                        size="2"
                        variant="solid"
                        color="green"
                        loading={pending}
                        onClick={() => runAction(() => issueNextInvoiceAction({ id: contractId }), 'Invoice issued')}
                    >
                        <Repeat size={14} /> Issue next invoice
                    </Button>
                ) : null}
                {status === 'active' ? (
                    <Button
                        size="2"
                        variant="soft"
                        loading={pending}
                        onClick={() => runAction(() => pauseContractAction({ id: contractId }), 'Contract paused')}
                    >
                        <Pause size={14} /> Pause
                    </Button>
                ) : null}
                {status === 'paused' ? (
                    <Button
                        size="2"
                        variant="solid"
                        loading={pending}
                        onClick={() => runAction(() => resumeContractAction({ id: contractId }), 'Contract resumed')}
                    >
                        <Play size={14} /> Resume
                    </Button>
                ) : null}
                {status !== 'ended' && status !== 'cancelled' ? (
                    <Button
                        size="2"
                        variant="soft"
                        color="orange"
                        loading={pending}
                        onClick={() => runAction(() => endContractAction({ id: contractId }), 'Contract ended')}
                    >
                        <StopCircle size={14} /> End term
                    </Button>
                ) : null}
                {status !== 'cancelled' && status !== 'ended' ? (
                    <Button
                        size="2"
                        variant="soft"
                        color="red"
                        loading={pending}
                        onClick={() => runAction(() => cancelContractAction({ id: contractId }), 'Contract cancelled')}
                    >
                        <XCircle size={14} /> Cancel
                    </Button>
                ) : null}
                <DeleteContractButton
                    contractId={contractId}
                    contractDisplayId={contractDisplayId}
                    onError={(msg) => setError(msg)}
                    onSuccess={() => router.push('/admin/contracts')}
                />
            </Flex>
            {success ? (
                <Callout.Root color="green" size="1">
                    <Callout.Icon><CheckCircle size={14} /></Callout.Icon>
                    <Callout.Text>{success}</Callout.Text>
                </Callout.Root>
            ) : null}
            {error ? (
                <Callout.Root color="red" size="1">
                    <Callout.Icon><XCircle size={14} /></Callout.Icon>
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            ) : null}
        </Flex>
    );
}

interface DeleteProps {
    contractId: string;
    contractDisplayId: string;
    onError?: (message: string) => void;
    onSuccess?: () => void;
}

function DeleteContractButton({ contractId, contractDisplayId, onError, onSuccess }: DeleteProps) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteContractAction({ id: contractId });
            if (!result.success) {
                onError?.(result.error || 'Failed to delete contract');
                return;
            }
            setOpen(false);
            onSuccess?.();
        });
    };

    return (
        <AlertDialog.Root open={open} onOpenChange={setOpen}>
            <AlertDialog.Trigger>
                <Button size="2" variant="soft" color="red">
                    <Trash2 size={14} /> Delete
                </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content style={{ maxWidth: 480 }}>
                <AlertDialog.Title>Delete contract?</AlertDialog.Title>
                <AlertDialog.Description size="2">
                    Permanently delete <strong>{contractDisplayId}</strong>? Issued invoices stay in your records, but no further cycles will be generated.
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                        <Button variant="soft" color="gray">Cancel</Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                        <Button color="red" onClick={handleDelete} loading={pending}>
                            <Text>Delete contract</Text>
                        </Button>
                    </AlertDialog.Action>
                </Flex>
            </AlertDialog.Content>
        </AlertDialog.Root>
    );
}
