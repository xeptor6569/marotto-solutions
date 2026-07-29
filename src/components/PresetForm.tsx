'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    Callout,
    Card,
    Flex,
    Heading,
    Text,
    TextArea,
    TextField,
} from '@radix-ui/themes';
import { PlusIcon, SaveIcon, XCircle } from 'lucide-react';
import {
    createPresetFormAction,
    updatePresetFormAction,
} from '@/app/admin/presets/actions';
import DocumentLineItemEditor, {
    emptyLineItem,
    recalcLineItem,
} from '@/components/DocumentLineItemEditor';
import { DOC_LABEL } from '@/lib/document-labels';
import { PRESET_DOCUMENT_TYPES } from '@/lib/preset-utils';
import type { DocumentPreset, LineItem, PresetDocumentType } from '@/lib/types';

export default function PresetForm({
    initialData,
    error,
    saved,
}: {
    initialData?: DocumentPreset;
    error?: string;
    saved?: boolean;
}) {
    const isEdit = !!initialData;
    const [name, setName] = useState(initialData?.name || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [documentTypes, setDocumentTypes] = useState<PresetDocumentType[]>(
        initialData?.documentTypes ?? [],
    );
    const [lineItems, setLineItems] = useState<LineItem[]>(() => {
        if (initialData?.lineItems?.length) {
            return initialData.lineItems.map((item) => ({
                ...item,
                details: item.details ?? '',
            }));
        }
        return [emptyLineItem()];
    });

    const toggleType = (type: PresetDocumentType) => {
        setDocumentTypes((current) =>
            current.includes(type)
                ? current.filter((t) => t !== type)
                : [...current, type],
        );
    };

    const addLineItem = () => setLineItems((items) => [...items, emptyLineItem()]);

    const removeLineItem = (id: string) => {
        setLineItems((items) => (items.length > 1 ? items.filter((item) => item.id !== id) : items));
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number | boolean) => {
        setLineItems((items) =>
            items.map((item) => (item.id === id ? recalcLineItem(item, field, value) : item)),
        );
    };

    const moveLineItemUp = (index: number) => {
        if (index === 0) return;
        setLineItems((items) => {
            const next = [...items];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            return next;
        });
    };

    const moveLineItemDown = (index: number) => {
        setLineItems((items) => {
            if (index >= items.length - 1) return items;
            const next = [...items];
            [next[index], next[index + 1]] = [next[index + 1], next[index]];
            return next;
        });
    };

    const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    const action = isEdit ? updatePresetFormAction : createPresetFormAction;

    return (
        <form action={action}>
            {isEdit ? <input type="hidden" name="presetId" value={initialData.id} /> : null}

            {error ? (
                <Callout.Root color="red" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            ) : null}

            {saved ? (
                <Callout.Root color="green" mb="3">
                    <Callout.Text>Preset saved.</Callout.Text>
                </Callout.Root>
            ) : null}

            <Flex direction="column" gap="4">
                <Card>
                    <Heading size="3" mb="3">Preset details</Heading>
                    <Flex direction="column" gap="3">
                        <Box>
                            <Text as="label" size="2" weight="medium">Name</Text>
                            <TextField.Root
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Weekly lawn mowing"
                                required
                                mt="1"
                            />
                        </Box>
                        <Box>
                            <Text as="label" size="2" weight="medium">Default document title (optional)</Text>
                            <TextField.Root
                                name="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Applied when starting a new document"
                                mt="1"
                            />
                        </Box>
                        <Box>
                            <Text as="div" size="2" weight="medium" mb="2">
                                Applicable document types
                            </Text>
                            <Text size="1" color="gray" mb="2" as="p">
                                Leave all unchecked to use this preset on every document type.
                            </Text>
                            <Flex gap="3" wrap="wrap">
                                {PRESET_DOCUMENT_TYPES.map((type) => (
                                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
                                        <input
                                            type="checkbox"
                                            name="documentTypes"
                                            value={type}
                                            checked={documentTypes.includes(type)}
                                            onChange={() => toggleType(type)}
                                        />
                                        {DOC_LABEL[type]}
                                    </label>
                                ))}
                            </Flex>
                        </Box>
                        <Box>
                            <Text as="label" size="2" weight="medium">Default notes (optional)</Text>
                            <TextArea
                                name="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                mt="1"
                                placeholder="Optional notes filled onto new documents"
                            />
                        </Box>
                    </Flex>
                </Card>

                <Card>
                    <Heading size="3" mb="3">Line items</Heading>
                    <Flex direction="column" gap="3">
                        {lineItems.map((item, index) => (
                            <DocumentLineItemEditor
                                key={item.id}
                                item={item}
                                index={index}
                                totalCount={lineItems.length}
                                namePrefix={`items[${index}]`}
                                showPendingApproval={false}
                                onChange={(field, value) => updateLineItem(item.id, field, value)}
                                onMoveUp={() => moveLineItemUp(index)}
                                onMoveDown={() => moveLineItemDown(index)}
                                onRemove={() => removeLineItem(item.id)}
                                canRemove={lineItems.length > 1}
                            />
                        ))}
                    </Flex>
                    <Flex justify="between" align="center" mt="4" wrap="wrap" gap="2">
                        <Button type="button" variant="soft" onClick={addLineItem} style={{ minHeight: 44 }}>
                            <PlusIcon size={16} /> Add item
                        </Button>
                        <Text size="4" weight="bold">Total: ${subtotal.toFixed(2)}</Text>
                    </Flex>
                </Card>

                <Flex justify="end">
                    <Button type="submit" size="3" style={{ minHeight: 44 }}>
                        <SaveIcon size={16} />
                        {isEdit ? 'Save preset' : 'Create preset'}
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
}
