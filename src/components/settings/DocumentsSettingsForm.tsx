'use client';

import { useState } from 'react';
import { Box, Flex, Grid, Text, TextField } from '@radix-ui/themes';
import SettingsSectionForm, { Field } from './SettingsSectionForm';
import { DOC_LABEL } from '@/lib/document-labels';
import {
    DEFAULT_NUMBER_PADDING,
    DEFAULT_PREFIXES,
    DEFAULT_START_NUMBERS,
    NUMBERED_DOCUMENT_TYPES,
} from '@/lib/document-numbering';
import type { AppConfig, NumberedDocumentType } from '@/lib/types';

export default function DocumentsSettingsForm({ config }: { config: Partial<AppConfig> }) {
    const numbering = config.numbering;
    const [prefixes, setPrefixes] = useState<Record<NumberedDocumentType, string>>(() => ({
        invoice: numbering?.prefixes?.invoice || DEFAULT_PREFIXES.invoice,
        estimate: numbering?.prefixes?.estimate || DEFAULT_PREFIXES.estimate,
        quote: numbering?.prefixes?.quote || DEFAULT_PREFIXES.quote,
        receipt: numbering?.prefixes?.receipt || DEFAULT_PREFIXES.receipt,
    }));
    const [padding, setPadding] = useState(String(numbering?.padding ?? DEFAULT_NUMBER_PADDING));
    const paddingNumber = Math.min(8, Math.max(3, Number(padding) || DEFAULT_NUMBER_PADDING));

    return (
        <SettingsSectionForm section="documents">
            <Box>
                <Text as="label" size="2" weight="bold">Create / edit view</Text>
                <Text as="p" size="1" color="gray" mt="1" mb="2">
                    Choose how invoice, estimate, quote, and receipt editors are laid out.
                </Text>
                <Flex direction="column" gap="2">
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 44, cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name="documentFormMode"
                            value="guided"
                            defaultChecked={(config.documentFormMode || 'guided') === 'guided'}
                            style={{ marginTop: 4 }}
                        />
                        <Box>
                            <Text as="div" size="2" weight="medium">Guided flow</Text>
                            <Text as="div" size="1" color="gray">
                                One step at a time: Customer → Details → Items → Review. Best on phones.
                            </Text>
                        </Box>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minHeight: 44, cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name="documentFormMode"
                            value="full"
                            defaultChecked={config.documentFormMode === 'full'}
                            style={{ marginTop: 4 }}
                        />
                        <Box>
                            <Text as="div" size="2" weight="medium">Full page</Text>
                            <Text as="div" size="1" color="gray">
                                Show every section on one page with jump navigation. Best on desktop.
                            </Text>
                        </Box>
                    </label>
                </Flex>
            </Box>

            <Box style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: 16 }}>
                <Text size="3" weight="bold" as="div">Document numbering</Text>
                <Text as="p" size="1" color="gray" mt="1" mb="3">
                    Each document type gets a prefix and a sequence. Changing a prefix only affects new documents;
                    the start number applies when no documents of that type exist yet — numbers never go backwards.
                </Text>
                <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                    {NUMBERED_DOCUMENT_TYPES.map((type) => {
                        const preview = `${prefixes[type] || DEFAULT_PREFIXES[type]}-${String(numbering?.startNumbers?.[type] ?? DEFAULT_START_NUMBERS[type]).padStart(paddingNumber, '0')}`;
                        return (
                            <Box
                                key={type}
                                p="3"
                                style={{ border: '1px solid var(--gray-a5)', borderRadius: 'var(--radius-3)', background: 'var(--color-panel)' }}
                            >
                                <Flex justify="between" align="center" mb="2" gap="2">
                                    <Text size="2" weight="bold">{DOC_LABEL[type]}s</Text>
                                    <Text size="1" color="gray" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>{preview}</Text>
                                </Flex>
                                <Grid columns="2" gap="2">
                                    <Field label="Prefix">
                                        <TextField.Root
                                            name={`prefix.${type}`}
                                            value={prefixes[type]}
                                            onChange={(e) => setPrefixes((prev) => ({ ...prev, [type]: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) }))}
                                            placeholder={DEFAULT_PREFIXES[type]}
                                            maxLength={8}
                                            style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
                                        />
                                    </Field>
                                    <Field label="Start at">
                                        <TextField.Root
                                            name={`startNumber.${type}`}
                                            type="number"
                                            inputMode="numeric"
                                            min={1}
                                            step={1}
                                            defaultValue={numbering?.startNumbers?.[type] ?? DEFAULT_START_NUMBERS[type]}
                                        />
                                    </Field>
                                </Grid>
                            </Box>
                        );
                    })}
                </Grid>
                <Box mt="3" style={{ maxWidth: 220 }}>
                    <Field label="Number width" hint="Digits in the numeric part (3–8), e.g. 4 → 0001.">
                        <TextField.Root
                            name="numberPadding"
                            type="number"
                            inputMode="numeric"
                            min={3}
                            max={8}
                            value={padding}
                            onChange={(e) => setPadding(e.target.value)}
                        />
                    </Field>
                </Box>
            </Box>
        </SettingsSectionForm>
    );
}
