'use client';

import { Box, Button, Card, Checkbox, Flex, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from 'lucide-react';
import type { DocumentChoiceGroup, DocumentPackage, LineItem } from '@/lib/types';
import DocumentLineItemEditor, {
    emptyLineItem,
    recalcLineItem,
} from '@/components/DocumentLineItemEditor';
import { choiceTotal, packageTotal } from '@/lib/document-options';

function emptyPackage(): DocumentPackage {
    return {
        id: crypto.randomUUID(),
        label: '',
        description: '',
        recommended: false,
        lineItems: [emptyLineItem()],
    };
}

function emptyChoiceGroup(): DocumentChoiceGroup {
    return {
        id: crypto.randomUUID(),
        label: '',
        description: '',
        required: true,
        choices: [
            {
                id: crypto.randomUUID(),
                label: '',
                description: '',
                lineItems: [emptyLineItem()],
            },
        ],
    };
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
    const next = index + direction;
    if (next < 0 || next >= list.length) return list;
    const updated = [...list];
    [updated[index], updated[next]] = [updated[next], updated[index]];
    return updated;
}

function updateListItem<T extends { id: string }>(
    list: T[],
    id: string,
    updater: (item: T) => T,
): T[] {
    return list.map((item) => (item.id === id ? updater(item) : item));
}

export default function DocumentOptionsEditor({
    packages,
    choiceGroups,
    showPendingApproval,
    unitPriceLabel,
    onPackagesChange,
    onChoiceGroupsChange,
}: {
    packages: DocumentPackage[];
    choiceGroups: DocumentChoiceGroup[];
    showPendingApproval: boolean;
    unitPriceLabel: string;
    onPackagesChange: (packages: DocumentPackage[]) => void;
    onChoiceGroupsChange: (groups: DocumentChoiceGroup[]) => void;
}) {
    const updatePackageLines = (
        packageId: string,
        updater: (items: LineItem[]) => LineItem[],
    ) => {
        onPackagesChange(
            updateListItem(packages, packageId, (pkg) => ({
                ...pkg,
                lineItems: updater(pkg.lineItems),
            })),
        );
    };

    const updateChoiceLines = (
        groupId: string,
        choiceId: string,
        updater: (items: LineItem[]) => LineItem[],
    ) => {
        onChoiceGroupsChange(
            updateListItem(choiceGroups, groupId, (group) => ({
                ...group,
                choices: updateListItem(group.choices, choiceId, (choice) => ({
                    ...choice,
                    lineItems: updater(choice.lineItems),
                })),
            })),
        );
    };

    return (
        <Flex direction="column" gap="4" mt="4">
            <Card>
                <Flex justify="between" align="center" gap="3" wrap="wrap" mb="2">
                    <Box>
                        <Heading size="3">Packages</Heading>
                        <Text size="2" color="gray" as="p" mt="1">
                            Mutually exclusive ways to do the project (Option A / B). Client picks one.
                        </Text>
                    </Box>
                    <Button type="button" variant="soft" onClick={() => onPackagesChange([...packages, emptyPackage()])} style={{ minHeight: 44 }}>
                        <PlusIcon size={16} /> Add package
                    </Button>
                </Flex>

                <Flex direction="column" gap="3">
                    {packages.map((pkg, pkgIndex) => (
                        <Box
                            key={pkg.id}
                            style={{
                                border: '1px solid var(--gray-a6)',
                                borderRadius: 12,
                                padding: 14,
                            }}
                        >
                            <Flex justify="between" align="center" gap="2" mb="3" wrap="wrap">
                                <Text size="2" weight="bold">Package {pkgIndex + 1}</Text>
                                <Flex gap="2" align="center" wrap="wrap">
                                    <Text size="2" color="gray">${packageTotal(pkg).toFixed(2)}</Text>
                                    <Button
                                        type="button"
                                        size="2"
                                        variant="soft"
                                        color="red"
                                        onClick={() => onPackagesChange(packages.filter((p) => p.id !== pkg.id))}
                                        style={{ minHeight: 44 }}
                                    >
                                        <TrashIcon size={16} /> Remove
                                    </Button>
                                </Flex>
                            </Flex>
                            <Flex direction="column" gap="3">
                                <Box>
                                    <Text as="label" size="2">Label</Text>
                                    <TextField.Root
                                        value={pkg.label}
                                        onChange={(e) =>
                                            onPackagesChange(
                                                updateListItem(packages, pkg.id, (p) => ({
                                                    ...p,
                                                    label: e.target.value,
                                                })),
                                            )
                                        }
                                        placeholder="Option A — Basic"
                                    />
                                </Box>
                                <Box>
                                    <Text as="label" size="2">Description</Text>
                                    <TextArea
                                        value={pkg.description || ''}
                                        onChange={(e) =>
                                            onPackagesChange(
                                                updateListItem(packages, pkg.id, (p) => ({
                                                    ...p,
                                                    description: e.target.value,
                                                })),
                                            )
                                        }
                                        placeholder="What this approach includes"
                                        rows={2}
                                    />
                                </Box>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44 }}>
                                    <Checkbox
                                        checked={pkg.recommended === true}
                                        onCheckedChange={(v) =>
                                            onPackagesChange(
                                                updateListItem(packages, pkg.id, (p) => ({
                                                    ...p,
                                                    recommended: v === true,
                                                })),
                                            )
                                        }
                                    />
                                    Recommended
                                </label>

                                <input type="hidden" name={`packages[${pkgIndex}][id]`} value={pkg.id} />
                                <input type="hidden" name={`packages[${pkgIndex}][label]`} value={pkg.label} />
                                <input type="hidden" name={`packages[${pkgIndex}][description]`} value={pkg.description || ''} />
                                <input type="hidden" name={`packages[${pkgIndex}][recommended]`} value={pkg.recommended ? '1' : '0'} />

                                <Flex direction="column" gap="3">
                                    {pkg.lineItems.map((item, itemIndex) => (
                                        <DocumentLineItemEditor
                                            key={item.id}
                                            item={item}
                                            index={itemIndex}
                                            totalCount={pkg.lineItems.length}
                                            namePrefix={`packages[${pkgIndex}][items][${itemIndex}]`}
                                            showPendingApproval={showPendingApproval}
                                            unitPriceLabel={unitPriceLabel}
                                            onChange={(field, value) =>
                                                updatePackageLines(pkg.id, (items) =>
                                                    items.map((li) =>
                                                        li.id === item.id ? recalcLineItem(li, field, value) : li,
                                                    ),
                                                )
                                            }
                                            onMoveUp={() =>
                                                updatePackageLines(pkg.id, (items) => moveItem(items, itemIndex, -1))
                                            }
                                            onMoveDown={() =>
                                                updatePackageLines(pkg.id, (items) => moveItem(items, itemIndex, 1))
                                            }
                                            onRemove={() =>
                                                updatePackageLines(pkg.id, (items) =>
                                                    items.length > 1 ? items.filter((li) => li.id !== item.id) : items,
                                                )
                                            }
                                            canRemove={pkg.lineItems.length > 1}
                                        />
                                    ))}
                                </Flex>
                                <Button
                                    type="button"
                                    variant="soft"
                                    onClick={() =>
                                        updatePackageLines(pkg.id, (items) => [...items, emptyLineItem()])
                                    }
                                    style={{ minHeight: 44, alignSelf: 'flex-start' }}
                                >
                                    <PlusIcon size={16} /> Add line
                                </Button>
                            </Flex>
                        </Box>
                    ))}
                    {packages.length === 0 ? (
                        <Text size="2" color="gray">No packages yet. Add one to offer alternate project approaches.</Text>
                    ) : null}
                </Flex>
            </Card>

            <Card>
                <Flex justify="between" align="center" gap="3" wrap="wrap" mb="2">
                    <Box>
                        <Heading size="3">Material / method choices</Heading>
                        <Text size="2" color="gray" as="p" mt="1">
                            Per-section alternatives (e.g. Flooring: Hardwood vs Laminate) applied on top of base scope and the selected package.
                        </Text>
                    </Box>
                    <Button
                        type="button"
                        variant="soft"
                        onClick={() => onChoiceGroupsChange([...choiceGroups, emptyChoiceGroup()])}
                        style={{ minHeight: 44 }}
                    >
                        <PlusIcon size={16} /> Add choice group
                    </Button>
                </Flex>

                <Flex direction="column" gap="3">
                    {choiceGroups.map((group, groupIndex) => (
                        <Box
                            key={group.id}
                            style={{
                                border: '1px solid var(--gray-a6)',
                                borderRadius: 12,
                                padding: 14,
                            }}
                        >
                            <Flex justify="between" align="center" gap="2" mb="3" wrap="wrap">
                                <Text size="2" weight="bold">Group {groupIndex + 1}</Text>
                                <Button
                                    type="button"
                                    size="2"
                                    variant="soft"
                                    color="red"
                                    onClick={() =>
                                        onChoiceGroupsChange(choiceGroups.filter((g) => g.id !== group.id))
                                    }
                                    style={{ minHeight: 44 }}
                                >
                                    <TrashIcon size={16} /> Remove group
                                </Button>
                            </Flex>

                            <Flex direction="column" gap="3">
                                <Box>
                                    <Text as="label" size="2">Group label</Text>
                                    <TextField.Root
                                        value={group.label}
                                        onChange={(e) =>
                                            onChoiceGroupsChange(
                                                updateListItem(choiceGroups, group.id, (g) => ({
                                                    ...g,
                                                    label: e.target.value,
                                                })),
                                            )
                                        }
                                        placeholder="Flooring"
                                    />
                                </Box>
                                <Box>
                                    <Text as="label" size="2">Description</Text>
                                    <TextArea
                                        value={group.description || ''}
                                        onChange={(e) =>
                                            onChoiceGroupsChange(
                                                updateListItem(choiceGroups, group.id, (g) => ({
                                                    ...g,
                                                    description: e.target.value,
                                                })),
                                            )
                                        }
                                        placeholder="Optional guidance for this choice"
                                        rows={2}
                                    />
                                </Box>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44 }}>
                                    <Checkbox
                                        checked={group.required !== false}
                                        onCheckedChange={(v) =>
                                            onChoiceGroupsChange(
                                                updateListItem(choiceGroups, group.id, (g) => ({
                                                    ...g,
                                                    required: v === true,
                                                })),
                                            )
                                        }
                                    />
                                    Required before invoice
                                </label>

                                <input type="hidden" name={`choiceGroups[${groupIndex}][id]`} value={group.id} />
                                <input type="hidden" name={`choiceGroups[${groupIndex}][label]`} value={group.label} />
                                <input type="hidden" name={`choiceGroups[${groupIndex}][description]`} value={group.description || ''} />
                                <input type="hidden" name={`choiceGroups[${groupIndex}][required]`} value={group.required === false ? '0' : '1'} />

                                {group.choices.map((choice, choiceIndex) => (
                                    <Box
                                        key={choice.id}
                                        style={{
                                            border: '1px dashed var(--gray-a6)',
                                            borderRadius: 10,
                                            padding: 12,
                                        }}
                                    >
                                        <Flex justify="between" align="center" gap="2" mb="2" wrap="wrap">
                                            <Text size="2" weight="medium">Choice {choiceIndex + 1}</Text>
                                            <Flex gap="2" align="center">
                                                <Text size="2" color="gray">${choiceTotal(choice).toFixed(2)}</Text>
                                                <Button
                                                    type="button"
                                                    size="2"
                                                    variant="soft"
                                                    color="red"
                                                    disabled={group.choices.length <= 1}
                                                    onClick={() =>
                                                        onChoiceGroupsChange(
                                                            updateListItem(choiceGroups, group.id, (g) => ({
                                                                ...g,
                                                                choices: g.choices.filter((c) => c.id !== choice.id),
                                                            })),
                                                        )
                                                    }
                                                    style={{ minHeight: 44 }}
                                                >
                                                    <TrashIcon size={16} /> Remove
                                                </Button>
                                            </Flex>
                                        </Flex>
                                        <Flex direction="column" gap="3">
                                            <Box>
                                                <Text as="label" size="2">Choice label</Text>
                                                <TextField.Root
                                                    value={choice.label}
                                                    onChange={(e) =>
                                                        onChoiceGroupsChange(
                                                            updateListItem(choiceGroups, group.id, (g) => ({
                                                                ...g,
                                                                choices: updateListItem(g.choices, choice.id, (c) => ({
                                                                    ...c,
                                                                    label: e.target.value,
                                                                })),
                                                            })),
                                                        )
                                                    }
                                                    placeholder="Hardwood"
                                                />
                                            </Box>
                                            <Box>
                                                <Text as="label" size="2">Description</Text>
                                                <TextArea
                                                    value={choice.description || ''}
                                                    onChange={(e) =>
                                                        onChoiceGroupsChange(
                                                            updateListItem(choiceGroups, group.id, (g) => ({
                                                                ...g,
                                                                choices: updateListItem(g.choices, choice.id, (c) => ({
                                                                    ...c,
                                                                    description: e.target.value,
                                                                })),
                                                            })),
                                                        )
                                                    }
                                                    placeholder="Optional details"
                                                    rows={2}
                                                />
                                            </Box>

                                            <input type="hidden" name={`choiceGroups[${groupIndex}][choices][${choiceIndex}][id]`} value={choice.id} />
                                            <input type="hidden" name={`choiceGroups[${groupIndex}][choices][${choiceIndex}][label]`} value={choice.label} />
                                            <input type="hidden" name={`choiceGroups[${groupIndex}][choices][${choiceIndex}][description]`} value={choice.description || ''} />

                                            {choice.lineItems.map((item, itemIndex) => (
                                                <DocumentLineItemEditor
                                                    key={item.id}
                                                    item={item}
                                                    index={itemIndex}
                                                    totalCount={choice.lineItems.length}
                                                    namePrefix={`choiceGroups[${groupIndex}][choices][${choiceIndex}][items][${itemIndex}]`}
                                                    showPendingApproval={showPendingApproval}
                                                    unitPriceLabel={unitPriceLabel}
                                                    detailsRows={2}
                                                    onChange={(field, value) =>
                                                        updateChoiceLines(group.id, choice.id, (items) =>
                                                            items.map((li) =>
                                                                li.id === item.id ? recalcLineItem(li, field, value) : li,
                                                            ),
                                                        )
                                                    }
                                                    onMoveUp={() =>
                                                        updateChoiceLines(group.id, choice.id, (items) =>
                                                            moveItem(items, itemIndex, -1),
                                                        )
                                                    }
                                                    onMoveDown={() =>
                                                        updateChoiceLines(group.id, choice.id, (items) =>
                                                            moveItem(items, itemIndex, 1),
                                                        )
                                                    }
                                                    onRemove={() =>
                                                        updateChoiceLines(group.id, choice.id, (items) =>
                                                            items.length > 1
                                                                ? items.filter((li) => li.id !== item.id)
                                                                : items,
                                                        )
                                                    }
                                                    canRemove={choice.lineItems.length > 1}
                                                />
                                            ))}
                                            <Button
                                                type="button"
                                                variant="soft"
                                                onClick={() =>
                                                    updateChoiceLines(group.id, choice.id, (items) => [
                                                        ...items,
                                                        emptyLineItem(),
                                                    ])
                                                }
                                                style={{ minHeight: 44, alignSelf: 'flex-start' }}
                                            >
                                                <PlusIcon size={16} /> Add line
                                            </Button>
                                        </Flex>
                                    </Box>
                                ))}

                                <Button
                                    type="button"
                                    variant="soft"
                                    onClick={() =>
                                        onChoiceGroupsChange(
                                            updateListItem(choiceGroups, group.id, (g) => ({
                                                ...g,
                                                choices: [
                                                    ...g.choices,
                                                    {
                                                        id: crypto.randomUUID(),
                                                        label: '',
                                                        description: '',
                                                        lineItems: [emptyLineItem()],
                                                    },
                                                ],
                                            })),
                                        )
                                    }
                                    style={{ minHeight: 44, alignSelf: 'flex-start' }}
                                >
                                    <PlusIcon size={16} /> Add choice
                                </Button>
                            </Flex>
                        </Box>
                    ))}
                    {choiceGroups.length === 0 ? (
                        <Text size="2" color="gray">No choice groups yet. Add one for material or method alternatives.</Text>
                    ) : null}
                </Flex>
            </Card>
        </Flex>
    );
}
