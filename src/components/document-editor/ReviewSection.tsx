'use client';

import { Box, Card, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import MarkdownEditor from '@/components/MarkdownEditor';
import HelpTip from '@/components/HelpTip';
import { useMoney } from '@/components/MoneyProvider';
import type { PaymentMethodOption } from '@/lib/document-form-pickers';
import type { PaymentMethodKey } from '@/lib/types';

type EditorDocType = 'invoice' | 'estimate' | 'quote' | 'receipt';

export interface WarrantyFields {
    enabled: boolean;
    title: string;
    text: string;
}

export interface PaymentOverrideFields {
    customizeMethods: boolean;
    enabledMethods: PaymentMethodKey[];
    stripeLink: string;
    stripeNote: string;
}

export default function ReviewSection({
    type,
    warranty,
    onWarrantyChange,
    overrides,
    onOverridesChange,
    paymentMethods,
    paymentCount,
    paidAmount,
    balanceDue,
    subtotal,
    isSaved,
}: {
    type: EditorDocType;
    warranty: WarrantyFields;
    onWarrantyChange: (next: WarrantyFields) => void;
    overrides: PaymentOverrideFields;
    onOverridesChange: (next: PaymentOverrideFields) => void;
    paymentMethods: PaymentMethodOption[];
    paymentCount: number;
    paidAmount: number;
    balanceDue: number;
    subtotal: number;
    isSaved: boolean;
}) {
    const { format: money } = useMoney();

    if (type !== 'invoice') {
        return (
            <Card size="3">
                <Heading size="4" mb="2">Review</Heading>
                <Text as="p" size="2" color="gray">
                    Total <Text weight="bold" className="ui-figure">{money(subtotal)}</Text>. Check the preview, then save as a draft or
                    save and send it to the client.
                </Text>
            </Card>
        );
    }

    const toggleMethod = (key: PaymentMethodKey, on: boolean) => {
        const current = overrides.enabledMethods;
        onOverridesChange({
            ...overrides,
            enabledMethods: on ? (current.includes(key) ? current : [...current, key]) : current.filter((k) => k !== key),
        });
    };

    return (
        <Flex direction="column" gap="4">
            <Card size="3">
                <Flex justify="between" align="center" gap="3" wrap="wrap" mb={warranty.enabled ? '3' : '0'}>
                    <Flex align="center" gap="1">
                        <Heading size="4">Warranty</Heading>
                        <HelpTip title="Warranty">
                            Adds a titled warranty section to the printed invoice, e.g. a workmanship guarantee and its terms.
                            It applies to this invoice only.
                        </HelpTip>
                    </Flex>
                    <label className="inline-check">
                        <input
                            type="checkbox"
                            name="warrantyEnabled"
                            checked={warranty.enabled}
                            onChange={(e) => onWarrantyChange({ ...warranty, enabled: e.target.checked })}
                        />
                        Include on this invoice
                    </label>
                </Flex>
                {warranty.enabled ? (
                    <Flex direction="column" gap="3">
                        <Box>
                            <Text as="label" size="2" weight="medium" htmlFor="editor-warranty-title">Title</Text>
                            <TextField.Root
                                id="editor-warranty-title"
                                mt="1"
                                name="warrantyTitle"
                                placeholder="1 Year Workmanship Warranty"
                                value={warranty.title}
                                onChange={(e) => onWarrantyChange({ ...warranty, title: e.target.value })}
                            />
                        </Box>
                        <MarkdownEditor
                            name="warrantyText"
                            label="Details"
                            value={warranty.text}
                            onChange={(text) => onWarrantyChange({ ...warranty, text })}
                            rows={4}
                            placeholder="1 Year Workmanship Warranty applies to XYZ. Does not include ABC."
                        />
                    </Flex>
                ) : (
                    <>
                        <input type="hidden" name="warrantyTitle" value={warranty.title} />
                        <input type="hidden" name="warrantyText" value={warranty.text} />
                    </>
                )}
            </Card>

            <Card size="3">
                <Heading size="4" mb="1">How the client can pay</Heading>
                <Text size="2" color="gray" mb="3" as="p">
                    By default the invoice lists every payment method enabled in Settings. Override it for this invoice only.
                </Text>
                <Flex direction="column" gap="3">
                    <label className="inline-check">
                        <input
                            type="checkbox"
                            name="customizePaymentMethods"
                            checked={overrides.customizeMethods}
                            onChange={(e) => onOverridesChange({ ...overrides, customizeMethods: e.target.checked })}
                        />
                        Choose which methods appear on this invoice
                    </label>
                    {overrides.customizeMethods ? (
                        paymentMethods.length > 0 ? (
                            <Flex gap="2" wrap="wrap" className="editor-method-chips">
                                {paymentMethods.map((method) => (
                                    <label key={method.key} className="editor-method-chip" data-checked={overrides.enabledMethods.includes(method.key) || undefined}>
                                        <input
                                            type="checkbox"
                                            name={`invoiceMethod.${method.key}`}
                                            checked={overrides.enabledMethods.includes(method.key)}
                                            onChange={(e) => toggleMethod(method.key, e.target.checked)}
                                        />
                                        {method.label}
                                    </label>
                                ))}
                            </Flex>
                        ) : (
                            <Text size="2" color="gray">No payment methods are enabled in Settings yet.</Text>
                        )
                    ) : null}

                    <Box className="settings-subsection">
                        <Text as="label" size="2" weight="medium" htmlFor="editor-stripe-link">Stripe payment link (optional)</Text>
                        <Text size="1" color="gray" as="p" mt="1" mb="2">
                            Only needed when Stripe Checkout is not set up. With <code>STRIPE_SECRET_KEY</code> set, clients pay the balance by card automatically.
                        </Text>
                        <TextField.Root
                            id="editor-stripe-link"
                            name="invoiceStripeLink"
                            type="url"
                            placeholder="https://buy.stripe.com/..."
                            value={overrides.stripeLink}
                            onChange={(e) => onOverridesChange({ ...overrides, stripeLink: e.target.value })}
                        />
                        <TextField.Root
                            mt="2"
                            name="invoiceStripeNote"
                            placeholder="Note, e.g. 3% processing fee applies"
                            value={overrides.stripeNote}
                            onChange={(e) => onOverridesChange({ ...overrides, stripeNote: e.target.value })}
                        />
                    </Box>
                </Flex>
            </Card>

            <Card size="3">
                <Flex justify="between" align="start" gap="3" wrap="wrap">
                    <Box>
                        <Heading size="4" mb="1">Payments</Heading>
                        <Text size="2" color="gray" as="p">
                            {isSaved
                                ? 'Record, review, or undo payments from the invoice page.'
                                : 'Save the invoice first, then record payments from its page.'}
                        </Text>
                        {paymentCount > 0 ? (
                            <Text size="1" color="gray" as="p" mt="1">
                                {paymentCount} payment{paymentCount === 1 ? '' : 's'} recorded so far.
                            </Text>
                        ) : null}
                    </Box>
                    <Box style={{ textAlign: 'right' }}>
                        <span className="ui-eyebrow">Balance due</span>
                        <Text as="div" size="6" className="ui-display" style={{ color: balanceDue > 0 ? 'var(--red-11)' : 'var(--green-11)' }}>
                            {money(balanceDue)}
                        </Text>
                        <Text size="1" color="gray">Paid {money(paidAmount)} of {money(subtotal)}</Text>
                    </Box>
                </Flex>
            </Card>
        </Flex>
    );
}
