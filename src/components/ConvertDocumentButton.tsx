'use client';

import { useState, useTransition } from 'react';
import {
    AlertDialog,
    Button,
    DropdownMenu,
    Flex,
    Text,
} from '@radix-ui/themes';
import { ArrowRightLeft } from 'lucide-react';
import { createConvertedDocumentAction } from '@/app/actions';
import { convertTargets } from '@/lib/convert-document';
import { DOC_LABEL } from '@/lib/document-labels';
import type { DocumentType } from '@/lib/types';

export default function ConvertDocumentButton({
    sourceDocumentId,
    sourceType,
    hasPendingApproval,
}: {
    sourceDocumentId: string;
    sourceType: DocumentType;
    hasPendingApproval: boolean;
}) {
    const targets = convertTargets(sourceType);
    const [error, setError] = useState('');
    const [confirmTarget, setConfirmTarget] = useState<DocumentType | null>(null);
    const [pending, startTransition] = useTransition();

    if (targets.length === 0) return null;

    const runConversion = (targetType: DocumentType, confirmPending = false) => {
        setError('');
        startTransition(async () => {
            const result = await createConvertedDocumentAction({
                sourceDocumentId,
                targetType,
                confirmPending,
            });
            // Success ends in a server redirect; only failures return here.
            if (!result.success) {
                setError(result.error || 'Could not convert document.');
            }
        });
    };

    const handleSelect = (targetType: DocumentType) => {
        if (targetType === 'invoice' && hasPendingApproval) {
            setConfirmTarget(targetType);
            return;
        }
        runConversion(targetType);
    };

    return (
        <>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <Button variant="soft" size="2" loading={pending}>
                        <ArrowRightLeft size={14} aria-hidden />
                        Convert
                        <DropdownMenu.TriggerIcon />
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    {targets.map((target) => (
                        <DropdownMenu.Item key={target} onSelect={() => handleSelect(target)}>
                            To {DOC_LABEL[target].toLowerCase()}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Root>

            {error ? (
                <Text size="1" color="red" role="alert">
                    {error}
                </Text>
            ) : null}

            <AlertDialog.Root
                open={confirmTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setConfirmTarget(null);
                }}
            >
                <AlertDialog.Content maxWidth="420px">
                    <AlertDialog.Title>Include scope pending approval?</AlertDialog.Title>
                    <AlertDialog.Description size="2">
                        This {DOC_LABEL[sourceType].toLowerCase()} has line items still pending
                        client approval. Converting to an invoice will bill all line items.
                        Continue?
                    </AlertDialog.Description>
                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                            <Button variant="soft" color="gray">Cancel</Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                            <Button
                                onClick={() => {
                                    const target = confirmTarget;
                                    setConfirmTarget(null);
                                    if (target) runConversion(target, true);
                                }}
                            >
                                Bill all & create invoice
                            </Button>
                        </AlertDialog.Action>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </>
    );
}
