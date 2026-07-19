'use client';

import { useMemo, useState, useTransition } from 'react';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { updateDocumentOptionSelectionAction } from '@/app/actions';
import type {
    DocumentChoiceGroup,
    DocumentOptionSelection,
    DocumentPackage,
} from '@/lib/types';
import { choiceTotal, packageTotal } from '@/lib/document-options';

export default function DocumentOptionSelectionForm({
    documentId,
    packages,
    choiceGroups,
    initialSelection,
}: {
    documentId: string;
    packages: DocumentPackage[];
    choiceGroups: DocumentChoiceGroup[];
    initialSelection?: DocumentOptionSelection;
}) {
    const [packageId, setPackageId] = useState<string>(initialSelection?.packageId || '');
    const [choices, setChoices] = useState<Record<string, string>>(initialSelection?.choices || {});
    const [error, setError] = useState('');
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const dirty = useMemo(() => {
        const initialPkg = initialSelection?.packageId || '';
        const initialChoices = initialSelection?.choices || {};
        if (packageId !== initialPkg) return true;
        const keys = new Set([...Object.keys(choices), ...Object.keys(initialChoices)]);
        for (const key of keys) {
            if ((choices[key] || '') !== (initialChoices[key] || '')) return true;
        }
        return false;
    }, [packageId, choices, initialSelection]);

    const save = () => {
        setError('');
        startTransition(async () => {
            const result = await updateDocumentOptionSelectionAction({
                documentId,
                packageId: packageId || null,
                choices,
            });
            if (!result.success) {
                setError(result.error || 'Could not save selection.');
                return;
            }
            setSavedAt(new Date().toISOString());
        });
    };

    return (
        <Box className="doc-section no-print" mt="3">
            <div className="doc-section-label">Select options (admin)</div>
            <Text size="2" color="gray" as="p" mb="3">
                Mark the package and material choices the client chose. Convert and deposit use this selection.
                {/* Future: client select on public share link writes the same optionSelection fields. */}
            </Text>

            {packages.length > 0 ? (
                <Box mb="3">
                    <Text size="2" weight="bold" as="div" mb="2">Package</Text>
                    <Flex direction="column" gap="2">
                        {packages.map((pkg) => (
                            <label
                                key={pkg.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 10,
                                    minHeight: 44,
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="admin-package"
                                    checked={packageId === pkg.id}
                                    onChange={() => setPackageId(pkg.id)}
                                    style={{ marginTop: 4 }}
                                />
                                <Box>
                                    <Flex align="center" gap="2" wrap="wrap">
                                        <Text size="2" weight="medium">{pkg.label}</Text>
                                        {pkg.recommended ? <Badge size="1" color="blue">Recommended</Badge> : null}
                                        <Text size="2" color="gray">${packageTotal(pkg).toFixed(2)}</Text>
                                    </Flex>
                                    {pkg.description ? (
                                        <Text size="1" color="gray" as="p">{pkg.description}</Text>
                                    ) : null}
                                </Box>
                            </label>
                        ))}
                    </Flex>
                </Box>
            ) : null}

            {choiceGroups.map((group) => (
                <Box key={group.id} mb="3">
                    <Flex align="center" gap="2" mb="2" wrap="wrap">
                        <Text size="2" weight="bold">{group.label}</Text>
                        {group.required === false ? (
                            <Badge size="1" color="gray">Optional</Badge>
                        ) : (
                            <Badge size="1" color="orange">Required</Badge>
                        )}
                    </Flex>
                    {group.description ? (
                        <Text size="1" color="gray" as="p" mb="2">{group.description}</Text>
                    ) : null}
                    <Flex direction="column" gap="2">
                        {group.choices.map((choice) => (
                            <label
                                key={choice.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 10,
                                    minHeight: 44,
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="radio"
                                    name={`admin-choice-${group.id}`}
                                    checked={choices[group.id] === choice.id}
                                    onChange={() =>
                                        setChoices((prev) => ({ ...prev, [group.id]: choice.id }))
                                    }
                                    style={{ marginTop: 4 }}
                                />
                                <Box>
                                    <Flex align="center" gap="2" wrap="wrap">
                                        <Text size="2" weight="medium">{choice.label}</Text>
                                        <Text size="2" color="gray">${choiceTotal(choice).toFixed(2)}</Text>
                                    </Flex>
                                    {choice.description ? (
                                        <Text size="1" color="gray" as="p">{choice.description}</Text>
                                    ) : null}
                                </Box>
                            </label>
                        ))}
                    </Flex>
                </Box>
            ))}

            <Flex align="center" gap="3" wrap="wrap">
                <Button type="button" onClick={save} loading={pending} disabled={!dirty && !savedAt}>
                    Save selection
                </Button>
                {savedAt && !dirty ? (
                    <Text size="1" color="green">Selection saved</Text>
                ) : dirty ? (
                    <Text size="1" color="orange">Unsaved changes</Text>
                ) : null}
            </Flex>
            {error ? (
                <Text size="1" color="red" role="alert" mt="2" as="p">{error}</Text>
            ) : null}
        </Box>
    );
}
