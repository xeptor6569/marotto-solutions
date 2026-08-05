'use client';

import { Flex, Button, Heading, Box, Text, TextField, Callout, TextArea, Grid, Card } from "@radix-ui/themes";
import { useActionState, useState } from 'react'; // React 19 / Next 16
import { saveSettingsAction } from "@/app/actions";
import { AppConfig, PaymentMethodKey } from "@/lib/types";
import { CheckCircle, XCircle, ChevronUp, ChevronDown } from "lucide-react";

type SaveSettingsState = { success: boolean; error?: string };

const initialState: SaveSettingsState = { success: false };

const ALL_METHOD_KEYS: PaymentMethodKey[] = ['cash', 'check', 'zelle', 'cashApp', 'paypal', 'venmo', 'applePay', 'stripe'];

const paymentMethodFields: Record<PaymentMethodKey, { valueLabel: string; noteLabel: string }> = {
    cash: { valueLabel: 'Label Override', noteLabel: 'Cash Note' },
    check: { valueLabel: 'Payable To', noteLabel: 'Check Note' },
    zelle: { valueLabel: 'Zelle Handle', noteLabel: 'Zelle Note' },
    cashApp: { valueLabel: 'Cash App Handle', noteLabel: 'Cash App Note' },
    paypal: { valueLabel: 'PayPal Link / Handle', noteLabel: 'PayPal Note' },
    venmo: { valueLabel: 'Venmo Handle', noteLabel: 'Venmo Note' },
    applePay: { valueLabel: 'Apple Pay Number / Email', noteLabel: 'Apple Pay Note' },
    stripe: { valueLabel: 'Stripe Link', noteLabel: 'Stripe Note' },
};

function initialMethodOrder(config: Partial<AppConfig>): PaymentMethodKey[] {
    const methods = config.billing?.paymentMethods;
    return [...ALL_METHOD_KEYS].sort((a, b) => {
        const pa = methods?.[a]?.position ?? ALL_METHOD_KEYS.indexOf(a);
        const pb = methods?.[b]?.position ?? ALL_METHOD_KEYS.indexOf(b);
        return pa - pb;
    });
}

export default function SettingsForm({ config }: { config: Partial<AppConfig> }) {
    const [order, setOrder] = useState<PaymentMethodKey[]>(() => initialMethodOrder(config));

    const moveMethod = (index: number, direction: -1 | 1) => {
        setOrder((prev) => {
            const target = index + direction;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const [state, formAction, isPending] = useActionState(
        async (_prevState: SaveSettingsState, formData: FormData): Promise<SaveSettingsState> => {
            return saveSettingsAction(formData);
        },
        initialState,
    );

    return (
        <form action={formAction}>
            <Flex direction="column" gap="4">
                {state?.error && (
                    <Callout.Root color="red">
                        <Callout.Icon><XCircle size={16} /></Callout.Icon>
                        <Callout.Text>{state.error}</Callout.Text>
                    </Callout.Root>
                )}
                {state?.success && (
                    <Callout.Root color="green">
                        <Callout.Icon><CheckCircle size={16} /></Callout.Icon>
                        <Callout.Text>Settings saved successfully.</Callout.Text>
                    </Callout.Root>
                )}

                <Heading size="3">WebDAV Configuration</Heading>
                <Box>
                    <Text as="label" size="2" weight="bold">Nextcloud WebDAV URL</Text>
                    <TextField.Root
                        name="webdavUrl"
                        defaultValue={config.webdavUrl || ""}
                        placeholder="https://cloud.example.com/remote.php/dav/files/myname/"
                    />
                </Box>
                <Box>
                    <Text as="label" size="2" weight="bold">Username</Text>
                    <TextField.Root
                        name="webdavUsername"
                        defaultValue={config.webdavUsername || ""}
                    />
                </Box>
                <Box>
                    <Text as="label" size="2" weight="bold">Password / App Token</Text>
                    <TextField.Root
                        name="webdavPassword"
                        type="password"
                        defaultValue={config.webdavPassword || ""}
                    />
                </Box>

                <Heading size="3">Calendar</Heading>
                <Box>
                    <Text as="label" size="2" weight="bold">Business Timezone</Text>
                    <TextField.Root
                        name="businessTimezone"
                        defaultValue={config.businessTimezone || "America/New_York"}
                        placeholder="America/New_York"
                    />
                    <Text as="p" size="1" color="gray" mt="1">All calendar times are shown in this timezone. Use an IANA identifier (e.g. America/New_York, America/Chicago, America/Los_Angeles).</Text>
                </Box>

                <Heading size="3">Documents</Heading>
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

                <Heading size="3">Billing Configuration</Heading>
                <Box>
                    <Text as="label" size="2" weight="bold">Checks Payable To</Text>
                    <TextField.Root
                        name="checkPayableTo"
                        defaultValue={config.billing?.checkPayableTo || ""}
                        placeholder="Marotto Solutions"
                    />
                </Box>
                <Box>
                    <Text as="label" size="2" weight="bold">General Payment Instructions</Text>
                    <TextArea
                        name="paymentInstructions"
                        defaultValue={config.billing?.paymentInstructions || ""}
                        placeholder="Payment is due by the listed due date. Please include the invoice number with your payment."
                        rows={4}
                    />
                </Box>

                <Box>
                    <Heading size="4">Payment Methods</Heading>
                    <Text as="p" size="2" color="gray" mt="1">
                        Use the arrows to set the order methods appear on invoices. Disabled methods are hidden from clients.
                    </Text>
                </Box>
                <input type="hidden" name="paymentMethodOrder" value={order.join(',')} />
                <Grid columns={{ initial: '1', md: '2' }} gap="3">
                    {order.map((key, index) => {
                        const { valueLabel, noteLabel } = paymentMethodFields[key];
                        const method = config.billing?.paymentMethods?.[key];
                        return (
                            <Card key={key} variant="surface">
                                <Flex direction="column" gap="3">
                                    <Flex justify="between" align="center" gap="2">
                                        <Flex align="center" gap="2">
                                            <Flex direction="column">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="1"
                                                    disabled={index === 0}
                                                    onClick={() => moveMethod(index, -1)}
                                                    aria-label={`Move ${method?.label || key} up`}
                                                >
                                                    <ChevronUp size={16} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="1"
                                                    disabled={index === order.length - 1}
                                                    onClick={() => moveMethod(index, 1)}
                                                    aria-label={`Move ${method?.label || key} down`}
                                                >
                                                    <ChevronDown size={16} />
                                                </Button>
                                            </Flex>
                                            <Text size="3" weight="bold">{method?.label || key}</Text>
                                            <Text size="1" color="gray">#{index + 1}</Text>
                                        </Flex>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                                            <input type="checkbox" name={`billing.${key}.enabled`} defaultChecked={method?.enabled ?? true} />
                                            Enabled
                                        </label>
                                    </Flex>
                                    <Box>
                                        <Text as="label" size="2" weight="bold">{valueLabel}</Text>
                                        <TextField.Root
                                            name={`billing.${key}.value`}
                                            defaultValue={method?.value || ""}
                                            placeholder={key === 'check' ? config.billing?.checkPayableTo || "Marotto Solutions" : ""}
                                        />
                                    </Box>
                                    <Box>
                                        <Text as="label" size="2" weight="bold">{noteLabel}</Text>
                                        <TextArea
                                            name={`billing.${key}.note`}
                                            defaultValue={method?.note || ""}
                                            placeholder="Optional note shown under this payment method."
                                            rows={3}
                                        />
                                    </Box>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                                        <input type="checkbox" name={`billing.${key}.comingSoon`} defaultChecked={method?.comingSoon ?? false} />
                                        Mark as coming soon
                                    </label>
                                </Flex>
                            </Card>
                        );
                    })}
                </Grid>

                <Button type="submit" loading={isPending}>Save Settings</Button>
            </Flex>
        </form>
    );
}
