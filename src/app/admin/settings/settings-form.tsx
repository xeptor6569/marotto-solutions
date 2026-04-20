'use client';

import { Flex, Button, Heading, Box, Text, TextField, Callout, TextArea, Grid, Card } from "@radix-ui/themes";
import { useActionState } from 'react'; // React 19 / Next 16
import { saveSettingsAction } from "@/app/actions";
import { AppConfig, PaymentMethodKey } from "@/lib/types";
import { CheckCircle, XCircle } from "lucide-react";

type SaveSettingsState = { success: boolean; error?: string };

const initialState: SaveSettingsState = { success: false };

const paymentMethodFields: Array<{ key: PaymentMethodKey; valueLabel: string; noteLabel: string }> = [
    { key: 'cash', valueLabel: 'Label Override', noteLabel: 'Cash Note' },
    { key: 'check', valueLabel: 'Payable To', noteLabel: 'Check Note' },
    { key: 'zelle', valueLabel: 'Zelle Handle', noteLabel: 'Zelle Note' },
    { key: 'cashApp', valueLabel: 'Cash App Handle', noteLabel: 'Cash App Note' },
    { key: 'paypal', valueLabel: 'PayPal Link / Handle', noteLabel: 'PayPal Note' },
    { key: 'venmo', valueLabel: 'Venmo Handle', noteLabel: 'Venmo Note' },
    { key: 'applePay', valueLabel: 'Apple Pay Number / Email', noteLabel: 'Apple Pay Note' },
    { key: 'stripe', valueLabel: 'Stripe Link', noteLabel: 'Stripe Note' },
];

export default function SettingsForm({ config }: { config: Partial<AppConfig> }) {
    // Wrapper for action to match state signature if needed, or modify action.
    // Action returns { success, error? }.
    // useActionState signature: (state, payload) => newState.

    // We need to adapt saveSettingsAction to accept state as first arg if we use useActionState
    // But saveSettingsAction currently signature is (FormData) => ...
    // Let's wrapping it.

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
                        defaultValue={config.webdavUrl || "https://cloud.example.com/remote.php/dav/files/USER/"}
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

                <Grid columns={{ initial: '1', md: '2' }} gap="3">
                    {paymentMethodFields.map(({ key, valueLabel, noteLabel }) => {
                        const method = config.billing?.paymentMethods?.[key];
                        return (
                            <Card key={key} variant="surface">
                                <Flex direction="column" gap="3">
                                    <Flex justify="between" align="center">
                                        <Text size="3" weight="bold">{method?.label || key}</Text>
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
