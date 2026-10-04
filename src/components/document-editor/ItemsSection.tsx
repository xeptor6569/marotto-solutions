'use client';

import { useState } from 'react';
import { AlertDialog, Box, Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { PlusIcon } from 'lucide-react';
import DocumentLineItemEditor from '@/components/DocumentLineItemEditor';
import DocumentOptionsEditor from '@/components/DocumentOptionsEditor';
import SaveAsPresetButton from '@/components/SaveAsPresetButton';
import { LabelWithHelp } from '@/components/HelpTip';
import { useMoney } from '@/components/MoneyProvider';
import type { DocumentChoiceGroup, DocumentPackage, DocumentPreset, LineItem } from '@/lib/types';

type EditorDocType = 'invoice' | 'estimate' | 'quote' | 'receipt';

export type PresetApplyMode = 'replace' | 'append';

export interface ItemTotals {
    subtotal: number;
    baseSubtotal: number;
    grossSubtotal: number;
    discountSavings: number;
}

/** A single blank "Service" line counts as empty, so a preset can replace it silently. */
function hasMeaningfulLines(items: LineItem[]): boolean {
    return items.some((item) => {
        const description = (item.description || '').trim().toLowerCase();
        return (description && description !== 'service') || Number(item.unitPrice) > 0 || (item.details || '').trim();
    });
}

export default function ItemsSection({
    type,
    lineItems,
    onLineChange,
    onAddLine,
    onRemoveLine,
    onMoveLine,
    presets,
    onApplyPreset,
    packages,
    choiceGroups,
    onPackagesChange,
    onChoiceGroupsChange,
    totals,
    totalCaption,
    title,
    notes,
}: {
    type: EditorDocType;
    lineItems: LineItem[];
    onLineChange: (id: string, field: keyof LineItem, value: string | number | boolean) => void;
    onAddLine: () => void;
    onRemoveLine: (id: string) => void;
    onMoveLine: (index: number, direction: -1 | 1) => void;
    presets: DocumentPreset[];
    onApplyPreset: (preset: DocumentPreset, mode: PresetApplyMode) => void;
    packages: DocumentPackage[];
    choiceGroups: DocumentChoiceGroup[];
    onPackagesChange: (packages: DocumentPackage[]) => void;
    onChoiceGroupsChange: (groups: DocumentChoiceGroup[]) => void;
    totals: ItemTotals;
    totalCaption: string;
    title: string;
    notes: string;
}) {
    const { format: money } = useMoney();
    const [pendingPreset, setPendingPreset] = useState<DocumentPreset | null>(null);
    const [presetSelectValue, setPresetSelectValue] = useState('');
    const isProposal = type === 'estimate' || type === 'quote';
    const hasOptions = isProposal && (packages.length > 0 || choiceGroups.length > 0);

    const choosePreset = (presetId: string) => {
        setPresetSelectValue(presetId);
        const preset = presets.find((p) => p.id === presetId);
        if (!preset) return;
        if (hasMeaningfulLines(lineItems)) {
            setPendingPreset(preset);
        } else {
            onApplyPreset(preset, 'replace');
            setPresetSelectValue('');
        }
    };

    const resolvePreset = (mode: PresetApplyMode | null) => {
        if (pendingPreset && mode) onApplyPreset(pendingPreset, mode);
        setPendingPreset(null);
        setPresetSelectValue('');
    };

    return (
        <>
            <Card size="3">
                <Flex justify="between" align="end" gap="3" wrap="wrap" mb="4">
                    <Box>
                        <Heading size="4">{isProposal ? 'Base scope' : 'Line items'}</Heading>
                        {isProposal ? (
                            <Text as="p" size="2" color="gray" mt="1">
                                Work that always applies. Add packages and material choices below for alternatives.
                            </Text>
                        ) : null}
                    </Box>
                    {presets.length > 0 ? (
                        <Box style={{ minWidth: 220, flex: '0 1 280px' }}>
                            <Text as="label" size="1" color="gray" htmlFor="editor-preset">
                                <LabelWithHelp help="Fill line items from a saved template. If the document already has items you can replace them or add the preset's lines below. Manage presets under Tools → Presets." topic="documents">
                                    Use a preset
                                </LabelWithHelp>
                            </Text>
                            <select
                                id="editor-preset"
                                value={presetSelectValue}
                                onChange={(e) => choosePreset(e.target.value)}
                                className="editor-select"
                            >
                                <option value="">Choose a preset…</option>
                                {presets.map((preset) => (
                                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                                ))}
                            </select>
                        </Box>
                    ) : null}
                </Flex>

                <Flex direction="column" gap="3">
                    {lineItems.map((item, index) => (
                        <DocumentLineItemEditor
                            key={item.id}
                            item={item}
                            index={index}
                            totalCount={lineItems.length}
                            namePrefix={`items[${index}]`}
                            showPendingApproval={isProposal}
                            unitPriceLabel={type === 'quote' ? 'Unit price' : 'Price'}
                            detailsRows={type === 'estimate' ? 4 : 3}
                            onChange={(field, value) => onLineChange(item.id, field, value)}
                            onMoveUp={() => onMoveLine(index, -1)}
                            onMoveDown={() => onMoveLine(index, 1)}
                            onRemove={() => onRemoveLine(item.id)}
                            canRemove={lineItems.length > 1}
                        />
                    ))}
                </Flex>

                <Flex justify="between" align="end" mt="4" wrap="wrap" gap="3">
                    <Flex gap="2" wrap="wrap">
                        <Button type="button" variant="soft" onClick={onAddLine} style={{ minHeight: 40 }}>
                            <PlusIcon size={16} /> Add line
                        </Button>
                        <SaveAsPresetButton
                            mode="inline"
                            defaultName={title || undefined}
                            documentType={type}
                            title={title}
                            notes={notes}
                            lineItems={lineItems}
                        />
                    </Flex>
                    <Box className="editor-totals">
                        {totals.discountSavings > 0 ? (
                            <>
                                <div className="editor-total-row"><span>Before discounts</span><span className="ui-figure">{money(totals.grossSubtotal)}</span></div>
                                <div className="editor-total-row editor-total-row--saving"><span>Discounts</span><span className="ui-figure">−{money(totals.discountSavings)}</span></div>
                            </>
                        ) : null}
                        {isProposal && hasOptions ? (
                            <div className="editor-total-row"><span>Base scope</span><span className="ui-figure">{money(totals.baseSubtotal)}</span></div>
                        ) : null}
                        <div className="editor-total-row editor-total-row--grand">
                            <span>{totalCaption}</span>
                            <span className="ui-display">{money(totals.subtotal)}</span>
                        </div>
                    </Box>
                </Flex>
            </Card>

            {isProposal ? (
                <DocumentOptionsEditor
                    packages={packages}
                    choiceGroups={choiceGroups}
                    showPendingApproval={isProposal}
                    unitPriceLabel={type === 'quote' ? 'Unit price' : 'Price'}
                    onPackagesChange={onPackagesChange}
                    onChoiceGroupsChange={onChoiceGroupsChange}
                />
            ) : null}

            <AlertDialog.Root open={pendingPreset !== null} onOpenChange={(open) => { if (!open) resolvePreset(null); }}>
                <AlertDialog.Content maxWidth="440px">
                    <AlertDialog.Title>Use “{pendingPreset?.name}”?</AlertDialog.Title>
                    <AlertDialog.Description size="2">
                        This document already has line items. Replace them with the preset, or add the preset&apos;s
                        {' '}{pendingPreset?.lineItems.length ?? 0} line{pendingPreset?.lineItems.length === 1 ? '' : 's'} below what is there?
                    </AlertDialog.Description>
                    <Flex gap="3" mt="4" justify="end" wrap="wrap">
                        <AlertDialog.Cancel>
                            <Button variant="soft" color="gray">Cancel</Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                            <Button variant="soft" onClick={() => resolvePreset('append')}>Add below</Button>
                        </AlertDialog.Action>
                        <AlertDialog.Action>
                            <Button color="red" variant="solid" onClick={() => resolvePreset('replace')}>Replace items</Button>
                        </AlertDialog.Action>
                    </Flex>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </>
    );
}
