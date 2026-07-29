'use client';

import { useState, useTransition } from 'react';
import {
    AlertDialog,
    Button,
    Flex,
    Text,
    TextField,
} from '@radix-ui/themes';
import { BookmarkPlus } from 'lucide-react';
import {
    createPresetFromDocumentAction,
    createPresetFromLinesAction,
} from '@/app/admin/presets/actions';
import type { LineItem, PresetDocumentType } from '@/lib/types';

type SaveAsPresetButtonProps =
    | {
        mode: 'document';
        documentId: string;
        defaultName?: string;
    }
    | {
        mode: 'inline';
        documentType: PresetDocumentType;
        title?: string;
        notes?: string;
        lineItems: LineItem[];
        defaultName?: string;
    };

export default function SaveAsPresetButton(props: SaveAsPresetButtonProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(props.defaultName || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pending, startTransition] = useTransition();

    const onOpen = () => {
        setError('');
        setSuccess('');
        setName(props.defaultName || '');
        setOpen(true);
    };

    const onSave = () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Preset name is required.');
            return;
        }
        setError('');
        setSuccess('');
        startTransition(async () => {
            const result = props.mode === 'document'
                ? await createPresetFromDocumentAction({
                    documentId: props.documentId,
                    name: trimmed,
                })
                : await createPresetFromLinesAction({
                    name: trimmed,
                    documentType: props.documentType,
                    title: props.title,
                    notes: props.notes,
                    lineItems: props.lineItems,
                });

            if (!result.success) {
                setError(result.error || 'Could not save preset.');
                return;
            }
            setSuccess('Preset saved.');
            setOpen(false);
        });
    };

    return (
        <>
            <Button
                type="button"
                variant="soft"
                onClick={onOpen}
                style={{ minHeight: 44 }}
            >
                <BookmarkPlus size={14} aria-hidden />
                Save as preset
            </Button>

            {success ? (
                <Text size="1" color="green" role="status">{success}</Text>
            ) : null}

            <AlertDialog.Root open={open} onOpenChange={setOpen}>
                <AlertDialog.Content maxWidth="420px">
                    <AlertDialog.Title>Save as preset</AlertDialog.Title>
                    <AlertDialog.Description>
                        Save these line items as a reusable preset. Customer details are not included.
                    </AlertDialog.Description>
                    <BoxField
                        name={name}
                        onChange={setName}
                        error={error}
                    />
                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                            <Button variant="soft" color="gray" disabled={pending}>Cancel</Button>
                        </AlertDialog.Cancel>
                        <Button loading={pending} onClick={onSave}>
                            Save preset
                        </Button>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </>
    );
}

function BoxField({
    name,
    onChange,
    error,
}: {
    name: string;
    onChange: (value: string) => void;
    error: string;
}) {
    return (
        <Flex direction="column" gap="2" mt="3">
            <Text as="label" size="2" weight="medium">Preset name</Text>
            <TextField.Root
                value={name}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Weekly lawn mowing"
                autoFocus
            />
            {error ? (
                <Text size="2" color="red" role="alert">{error}</Text>
            ) : null}
        </Flex>
    );
}
