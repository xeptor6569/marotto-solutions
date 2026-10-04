'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Badge, Box, Button, Card, Checkbox, Flex, Heading, IconButton, Text, TextField } from '@radix-ui/themes';
import { ChevronDown, ChevronRight, ChevronUp, Copy, PlusIcon, TrashIcon } from 'lucide-react';
import type { DocumentChoice, DocumentChoiceGroup, DocumentPackage, LineItem } from '@/lib/types';
import DocumentLineItemEditor, {
    emptyLineItem,
    recalcLineItem,
} from '@/components/DocumentLineItemEditor';
import MarkdownEditor from '@/components/MarkdownEditor';
import {
    choiceTotal,
    duplicateChoice,
    duplicateChoiceGroup,
    duplicatePackage,
    packageTotal,
    setRecommendedChoice,
    setRecommendedPackage,
} from '@/lib/document-options';
import { useMoney } from '@/components/MoneyProvider';
import HelpTip from '@/components/HelpTip';

function emptyPackage(): DocumentPackage {
    return {
        id: crypto.randomUUID(),
        label: '',
        description: '',
        recommended: false,
        lineItems: [emptyLineItem()],
    };
}

function emptyChoice(): DocumentChoice {
    return {
        id: crypto.randomUUID(),
        label: '',
        description: '',
        lineItems: [emptyLineItem()],
    };
}

function emptyChoiceGroup(): DocumentChoiceGroup {
    return {
        id: crypto.randomUUID(),
        label: '',
        description: '',
        required: true,
        choices: [emptyChoice()],
    };
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
    const next = index + direction;
    if (next < 0 || next >= list.length) return list;
    const updated = [...list];
    [updated[index], updated[next]] = [updated[next], updated[index]];
    return updated;
}

function insertAfter<T>(list: T[], index: number, item: T): T[] {
    const updated = [...list];
    updated.splice(index + 1, 0, item);
    return updated;
}

function updateListItem<T extends { id: string }>(
    list: T[],
    id: string,
    updater: (item: T) => T,
): T[] {
    return list.map((item) => (item.id === id ? updater(item) : item));
}

function countLabel(count: number, singular: string, plural: string): string {
    return `${count} ${count === 1 ? singular : plural}`;
}

function choiceNames(choices: DocumentChoice[]): string {
    const labels = choices.map((choice) => choice.label.trim()).filter(Boolean);
    if (!labels.length) return countLabel(choices.length, 'choice', 'choices');
    if (labels.length <= 3) return labels.join(' · ');
    return `${labels.slice(0, 2).join(' · ')} · +${labels.length - 2}`;
}

function priceSpan(amounts: number[], money: (amount: number) => string): string {
    if (!amounts.length) return money(0);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    return min === max ? money(min) : `${money(min)}–${money(max)}`;
}

function OptionSummary({
    open,
    title,
    untitled,
    meta,
    price,
    badge,
    onToggle,
    children,
}: {
    open: boolean;
    title: string;
    untitled?: boolean;
    meta?: string;
    price: string;
    badge?: ReactNode;
    onToggle: () => void;
    children: ReactNode;
}) {
    return (
        <div className="option-summary">
            <button
                type="button"
                className="option-summary-main"
                aria-expanded={open}
                onClick={onToggle}
            >
                {open ? <ChevronDown size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
                <span className="option-summary-title" data-untitled={untitled || undefined}>
                    {title}
                </span>
                {badge}
                {meta ? <span className="option-summary-meta">{meta}</span> : null}
                <span className="option-summary-price">{price}</span>
            </button>
            <div className="option-actions">{children}</div>
        </div>
    );
}

function OptionActions({
    label,
    index,
    count,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onRemove,
    canRemove = true,
}: {
    label: string;
    index: number;
    count: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDuplicate: () => void;
    onRemove: () => void;
    canRemove?: boolean;
}) {
    return (
        <>
            <IconButton
                type="button"
                size="2"
                variant="soft"
                color="gray"
                disabled={index === 0}
                onClick={onMoveUp}
                aria-label={`Move ${label} up`}
            >
                <ChevronUp size={18} />
            </IconButton>
            <IconButton
                type="button"
                size="2"
                variant="soft"
                color="gray"
                disabled={index >= count - 1}
                onClick={onMoveDown}
                aria-label={`Move ${label} down`}
            >
                <ChevronDown size={18} />
            </IconButton>
            <IconButton
                type="button"
                size="2"
                variant="soft"
                color="gray"
                onClick={onDuplicate}
                aria-label={`Duplicate ${label}`}
            >
                <Copy size={16} />
            </IconButton>
            <IconButton
                type="button"
                size="2"
                variant="soft"
                color="red"
                disabled={!canRemove}
                onClick={onRemove}
                aria-label={`Remove ${label}`}
            >
                <TrashIcon size={16} />
            </IconButton>
        </>
    );
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
    const { format: money } = useMoney();
    const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
    const [spotlightId, setSpotlightId] = useState<string | null>(null);

    const reveal = (ids: string[]) => {
        setOpenIds((prev) => {
            const next = new Set(prev);
            for (const id of ids) next.add(id);
            return next;
        });
        setSpotlightId(ids[0] ?? null);
    };

    const toggle = (id: string) => {
        setOpenIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

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
                        <Flex align="center" gap="1">
                            <Heading size="3">Packages</Heading>
                            <HelpTip title="Packages" topic="documents">
                                Alternative versions of the job, such as Basic and Premium. Open a row to edit its
                                markdown description and lines. Reorder or duplicate from the row, and mark one package
                                Recommended. The shared document lists every package; record the client&apos;s choice
                                under Select options.
                            </HelpTip>
                        </Flex>
                        <Text size="2" color="gray" as="p" mt="1">
                            One approach for the whole job. The client sees every package; you record their choice later.
                        </Text>
                    </Box>
                    <Button
                        type="button"
                        variant="soft"
                        onClick={() => {
                            const pkg = emptyPackage();
                            onPackagesChange([...packages, pkg]);
                            reveal([pkg.id]);
                        }}
                        style={{ minHeight: 44 }}
                    >
                        <PlusIcon size={16} /> Add package
                    </Button>
                </Flex>

                <div className="option-stack">
                    {packages.map((pkg, pkgIndex) => {
                        const title = pkg.label.trim() || 'Untitled package';
                        const open = openIds.has(pkg.id);
                        return (
                            <OptionCard key={pkg.id} id={pkg.id} spotlightId={spotlightId}>
                                <OptionSummary
                                    open={open}
                                    title={title}
                                    untitled={!pkg.label.trim()}
                                    meta={countLabel(pkg.lineItems.length, 'line', 'lines')}
                                    price={money(packageTotal(pkg))}
                                    badge={pkg.recommended ? <Badge size="1" color="blue">Recommended</Badge> : undefined}
                                    onToggle={() => toggle(pkg.id)}
                                >
                                    <OptionActions
                                        label={title}
                                        index={pkgIndex}
                                        count={packages.length}
                                        onMoveUp={() => onPackagesChange(moveItem(packages, pkgIndex, -1))}
                                        onMoveDown={() => onPackagesChange(moveItem(packages, pkgIndex, 1))}
                                        onDuplicate={() => {
                                            const copy = duplicatePackage(pkg);
                                            onPackagesChange(insertAfter(packages, pkgIndex, copy));
                                            reveal([copy.id]);
                                        }}
                                        onRemove={() => onPackagesChange(packages.filter((item) => item.id !== pkg.id))}
                                    />
                                </OptionSummary>
                                <input type="hidden" name={`packages[${pkgIndex}][id]`} value={pkg.id} />
                                <input type="hidden" name={`packages[${pkgIndex}][label]`} value={pkg.label} />
                                <input type="hidden" name={`packages[${pkgIndex}][description]`} value={pkg.description || ''} />
                                <input type="hidden" name={`packages[${pkgIndex}][recommended]`} value={pkg.recommended ? '1' : '0'} />
                                <div className="option-card-body" hidden={!open}>
                                    <Box>
                                        <Text as="label" size="2">Label</Text>
                                        <TextField.Root
                                            value={pkg.label}
                                            onChange={(e) =>
                                                onPackagesChange(
                                                    updateListItem(packages, pkg.id, (item) => ({
                                                        ...item,
                                                        label: e.target.value,
                                                    })),
                                                )
                                            }
                                            placeholder="Option A — Basic"
                                        />
                                    </Box>
                                    <MarkdownEditor
                                        label="Description"
                                        value={pkg.description || ''}
                                        onChange={(value) =>
                                            onPackagesChange(
                                                updateListItem(packages, pkg.id, (item) => ({
                                                    ...item,
                                                    description: value,
                                                })),
                                            )
                                        }
                                        rows={3}
                                        placeholder="What this approach includes"
                                    />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44 }}>
                                        <Checkbox
                                            checked={pkg.recommended === true}
                                            onCheckedChange={(value) =>
                                                onPackagesChange(
                                                    setRecommendedPackage(packages, pkg.id, value === true),
                                                )
                                            }
                                        />
                                        Recommended
                                        <Text size="1" color="gray">Suggested option. Only one package can be marked.</Text>
                                    </label>
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
                                                    items.map((line) =>
                                                        line.id === item.id ? recalcLineItem(line, field, value) : line,
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
                                                    items.length > 1 ? items.filter((line) => line.id !== item.id) : items,
                                                )
                                            }
                                            canRemove={pkg.lineItems.length > 1}
                                        />
                                    ))}
                                    <Button
                                        type="button"
                                        variant="soft"
                                        onClick={() => updatePackageLines(pkg.id, (items) => [...items, emptyLineItem()])}
                                        style={{ minHeight: 44, alignSelf: 'flex-start' }}
                                    >
                                        <PlusIcon size={16} /> Add line
                                    </Button>
                                </div>
                            </OptionCard>
                        );
                    })}
                    {packages.length === 0 ? (
                        <Text size="2" color="gray">No packages yet. Add one to offer alternate project approaches.</Text>
                    ) : null}
                </div>
            </Card>

            <Card>
                <Flex justify="between" align="center" gap="3" wrap="wrap" mb="2">
                    <Box>
                        <Flex align="center" gap="1">
                            <Heading size="3">Material / method choices</Heading>
                            <HelpTip title="Material / method choices" topic="documents">
                                Either/or decisions inside the job, such as flooring. Each group adds the chosen option
                                on top of the base scope and the selected package. Mark one choice in a group as
                                Recommended; the document total includes those choices until a selection is saved.
                                Descriptions support markdown. Open a row to edit it, or reorder and duplicate from the summary.
                            </HelpTip>
                        </Flex>
                        <Text size="2" color="gray" as="p" mt="1">
                            Choices within the job, priced on top of the base scope and the selected package.
                        </Text>
                    </Box>
                    <Button
                        type="button"
                        variant="soft"
                        onClick={() => {
                            const group = emptyChoiceGroup();
                            onChoiceGroupsChange([...choiceGroups, group]);
                            reveal([group.id, group.choices[0].id]);
                        }}
                        style={{ minHeight: 44 }}
                    >
                        <PlusIcon size={16} /> Add choice group
                    </Button>
                </Flex>

                <div className="option-stack">
                    {choiceGroups.map((group, groupIndex) => {
                        const title = group.label.trim() || 'Untitled group';
                        const open = openIds.has(group.id);
                        return (
                            <OptionCard key={group.id} id={group.id} spotlightId={spotlightId}>
                                <OptionSummary
                                    open={open}
                                    title={title}
                                    untitled={!group.label.trim()}
                                    meta={choiceNames(group.choices)}
                                    price={priceSpan(group.choices.map(choiceTotal), money)}
                                    badge={
                                        group.required === false
                                            ? <Badge size="1" color="gray">Optional</Badge>
                                            : <Badge size="1" color="orange">Required</Badge>
                                    }
                                    onToggle={() => toggle(group.id)}
                                >
                                    <OptionActions
                                        label={title}
                                        index={groupIndex}
                                        count={choiceGroups.length}
                                        onMoveUp={() => onChoiceGroupsChange(moveItem(choiceGroups, groupIndex, -1))}
                                        onMoveDown={() => onChoiceGroupsChange(moveItem(choiceGroups, groupIndex, 1))}
                                        onDuplicate={() => {
                                            const copy = duplicateChoiceGroup(group);
                                            onChoiceGroupsChange(insertAfter(choiceGroups, groupIndex, copy));
                                            reveal([copy.id]);
                                        }}
                                        onRemove={() =>
                                            onChoiceGroupsChange(choiceGroups.filter((item) => item.id !== group.id))
                                        }
                                    />
                                </OptionSummary>
                                <input type="hidden" name={`choiceGroups[${groupIndex}][id]`} value={group.id} />
                                <input type="hidden" name={`choiceGroups[${groupIndex}][label]`} value={group.label} />
                                <input type="hidden" name={`choiceGroups[${groupIndex}][description]`} value={group.description || ''} />
                                <input type="hidden" name={`choiceGroups[${groupIndex}][required]`} value={group.required === false ? '0' : '1'} />
                                <div className="option-card-body" hidden={!open}>
                                    <Box>
                                        <Text as="label" size="2">Group label</Text>
                                        <TextField.Root
                                            value={group.label}
                                            onChange={(e) =>
                                                onChoiceGroupsChange(
                                                    updateListItem(choiceGroups, group.id, (item) => ({
                                                        ...item,
                                                        label: e.target.value,
                                                    })),
                                                )
                                            }
                                            placeholder="Flooring"
                                        />
                                    </Box>
                                    <MarkdownEditor
                                        label="Description"
                                        value={group.description || ''}
                                        onChange={(value) =>
                                            onChoiceGroupsChange(
                                                updateListItem(choiceGroups, group.id, (item) => ({
                                                    ...item,
                                                    description: value,
                                                })),
                                            )
                                        }
                                        rows={2}
                                        placeholder="Optional guidance for this choice"
                                    />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44 }}>
                                        <Checkbox
                                            checked={group.required !== false}
                                            onCheckedChange={(value) =>
                                                onChoiceGroupsChange(
                                                    updateListItem(choiceGroups, group.id, (item) => ({
                                                        ...item,
                                                        required: value === true,
                                                    })),
                                                )
                                            }
                                        />
                                        Required before invoice
                                    </label>
                                    <div className="option-stack">
                                        {group.choices.map((choice, choiceIndex) => {
                                            const choiceTitle = choice.label.trim() || 'Untitled choice';
                                            const choiceOpen = openIds.has(choice.id);
                                            return (
                                                <OptionCard
                                                    key={choice.id}
                                                    id={choice.id}
                                                    nested
                                                    spotlightId={spotlightId}
                                                >
                                                    <OptionSummary
                                                        open={choiceOpen}
                                                        title={choiceTitle}
                                                        untitled={!choice.label.trim()}
                                                        meta={countLabel(choice.lineItems.length, 'line', 'lines')}
                                                        price={money(choiceTotal(choice))}
                                                        badge={choice.recommended ? <Badge size="1" color="blue">Recommended</Badge> : undefined}
                                                        onToggle={() => toggle(choice.id)}
                                                    >
                                                        <OptionActions
                                                            label={choiceTitle}
                                                            index={choiceIndex}
                                                            count={group.choices.length}
                                                            canRemove={group.choices.length > 1}
                                                            onMoveUp={() =>
                                                                onChoiceGroupsChange(
                                                                    updateListItem(choiceGroups, group.id, (item) => ({
                                                                        ...item,
                                                                        choices: moveItem(item.choices, choiceIndex, -1),
                                                                    })),
                                                                )
                                                            }
                                                            onMoveDown={() =>
                                                                onChoiceGroupsChange(
                                                                    updateListItem(choiceGroups, group.id, (item) => ({
                                                                        ...item,
                                                                        choices: moveItem(item.choices, choiceIndex, 1),
                                                                    })),
                                                                )
                                                            }
                                                            onDuplicate={() => {
                                                                const copy = duplicateChoice(choice);
                                                                onChoiceGroupsChange(
                                                                    updateListItem(choiceGroups, group.id, (item) => ({
                                                                        ...item,
                                                                        choices: insertAfter(item.choices, choiceIndex, copy),
                                                                    })),
                                                                );
                                                                reveal([copy.id]);
                                                            }}
                                                            onRemove={() =>
                                                                onChoiceGroupsChange(
                                                                    updateListItem(choiceGroups, group.id, (item) => ({
                                                                        ...item,
                                                                        choices: item.choices.filter((entry) => entry.id !== choice.id),
                                                                    })),
                                                                )
                                                            }
                                                        />
                                                    </OptionSummary>
                                                    <input type="hidden" name={`choiceGroups[${groupIndex}][choices][${choiceIndex}][id]`} value={choice.id} />
                                                    <input type="hidden" name={`choiceGroups[${groupIndex}][choices][${choiceIndex}][label]`} value={choice.label} />
                                                    <input type="hidden" name={`choiceGroups[${groupIndex}][choices][${choiceIndex}][description]`} value={choice.description || ''} />
                                                    <input type="hidden" name={`choiceGroups[${groupIndex}][choices][${choiceIndex}][recommended]`} value={choice.recommended ? '1' : '0'} />
                                                    <div className="option-card-body" hidden={!choiceOpen}>
                                                        <Box>
                                                            <Text as="label" size="2">Choice label</Text>
                                                            <TextField.Root
                                                                value={choice.label}
                                                                onChange={(e) =>
                                                                    onChoiceGroupsChange(
                                                                        updateListItem(choiceGroups, group.id, (item) => ({
                                                                            ...item,
                                                                            choices: updateListItem(item.choices, choice.id, (entry) => ({
                                                                                ...entry,
                                                                                label: e.target.value,
                                                                            })),
                                                                        })),
                                                                    )
                                                                }
                                                                placeholder="Hardwood"
                                                            />
                                                        </Box>
                                                        <MarkdownEditor
                                                            label="Description"
                                                            value={choice.description || ''}
                                                            onChange={(value) =>
                                                                onChoiceGroupsChange(
                                                                    updateListItem(choiceGroups, group.id, (item) => ({
                                                                        ...item,
                                                                        choices: updateListItem(item.choices, choice.id, (entry) => ({
                                                                            ...entry,
                                                                            description: value,
                                                                        })),
                                                                    })),
                                                                )
                                                            }
                                                            rows={2}
                                                            placeholder="Optional details"
                                                        />
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44 }}>
                                                            <Checkbox
                                                                checked={choice.recommended === true}
                                                                onCheckedChange={(value) =>
                                                                    onChoiceGroupsChange(
                                                                        setRecommendedChoice(
                                                                            choiceGroups,
                                                                            group.id,
                                                                            choice.id,
                                                                            value === true,
                                                                        ),
                                                                    )
                                                                }
                                                            />
                                                            Recommended
                                                            <Text size="1" color="gray">Suggested choice. Only one in this group can be marked.</Text>
                                                        </label>
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
                                                                        items.map((line) =>
                                                                            line.id === item.id ? recalcLineItem(line, field, value) : line,
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
                                                                            ? items.filter((line) => line.id !== item.id)
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
                                                    </div>
                                                </OptionCard>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="soft"
                                        onClick={() => {
                                            const choice = emptyChoice();
                                            onChoiceGroupsChange(
                                                updateListItem(choiceGroups, group.id, (item) => ({
                                                    ...item,
                                                    choices: [...item.choices, choice],
                                                })),
                                            );
                                            reveal([choice.id]);
                                        }}
                                        style={{ minHeight: 44, alignSelf: 'flex-start' }}
                                    >
                                        <PlusIcon size={16} /> Add choice
                                    </Button>
                                </div>
                            </OptionCard>
                        );
                    })}
                    {choiceGroups.length === 0 ? (
                        <Text size="2" color="gray">No choice groups yet. Add one for material or method alternatives.</Text>
                    ) : null}
                </div>
            </Card>
        </Flex>
    );
}

function OptionCard({
    id,
    nested,
    spotlightId,
    children,
}: {
    id: string;
    nested?: boolean;
    spotlightId: string | null;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (spotlightId !== id) return;
        const el = ref.current;
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        el?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea')?.focus();
    }, [spotlightId, id]);

    return (
        <div
            ref={ref}
            id={`option-${id}`}
            className={nested ? 'option-card option-card--nested' : 'option-card'}
        >
            {children}
        </div>
    );
}
