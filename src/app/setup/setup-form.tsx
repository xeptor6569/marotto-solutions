'use client';

import { useActionState, useState } from 'react';
import { Box, Button, Callout, Card, Flex, Grid, Heading, Text, TextField } from '@radix-ui/themes';
import { AlertCircle, ArrowRight, Building2, KeyRound } from 'lucide-react';
import { completeSetupAction, type SetupActionState } from './actions';
import { THEME_PRESETS } from '@/lib/theme-presets';

const initialState: SetupActionState = {};

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="bold">{label}</Text>
            {children}
            {hint ? <Text size="1" color="gray">{hint}</Text> : null}
        </Flex>
    );
}

export default function SetupForm() {
    const [state, formAction, isPending] = useActionState(completeSetupAction, initialState);
    const [preset, setPreset] = useState('classic-indigo');

    return (
        <form action={formAction}>
            <Flex direction="column" gap="4">
                {state?.error ? (
                    <Callout.Root color="red">
                        <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
                        <Callout.Text>{state.error}</Callout.Text>
                    </Callout.Root>
                ) : null}

                <Card size="3">
                    <Flex direction="column" gap="4">
                        <Flex align="center" gap="2">
                            <KeyRound size={18} style={{ color: 'var(--accent-9)' }} />
                            <Heading size="4">Your admin account</Heading>
                        </Flex>
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                            <Field label="Your name">
                                <TextField.Root name="adminName" placeholder="Alex Smith" autoComplete="name" size="3" />
                            </Field>
                            <Field label="Email">
                                <TextField.Root name="adminEmail" type="email" inputMode="email" placeholder="you@example.com" autoComplete="email" required size="3" />
                            </Field>
                        </Grid>
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                            <Field label="Password" hint="At least 8 characters.">
                                <TextField.Root name="adminPassword" type="password" autoComplete="new-password" required size="3" />
                            </Field>
                            <Field label="Confirm password">
                                <TextField.Root name="adminPasswordConfirm" type="password" autoComplete="new-password" required size="3" />
                            </Field>
                        </Grid>
                    </Flex>
                </Card>

                <Card size="3">
                    <Flex direction="column" gap="4">
                        <Flex align="center" gap="2">
                            <Building2 size={18} style={{ color: 'var(--accent-9)' }} />
                            <Heading size="4">Your business</Heading>
                        </Flex>
                        <Field label="Business name" hint="You can fill in the full profile (address, logo, public site) later in Settings.">
                            <TextField.Root name="businessName" placeholder="Acme Contracting" autoComplete="organization" required size="3" />
                        </Field>
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                            <Field label="Phone (optional)">
                                <TextField.Root name="phoneDisplay" type="tel" inputMode="tel" placeholder="(555) 555-0100" size="3" />
                            </Field>
                            <Field label="Contact email (optional)">
                                <TextField.Root name="businessEmail" type="email" inputMode="email" placeholder="office@example.com" size="3" />
                            </Field>
                        </Grid>
                        <Field label="Color theme" hint="Changeable any time in Settings → Appearance.">
                            <Flex gap="2" wrap="wrap">
                                {THEME_PRESETS.map((p) => (
                                    <label
                                        key={p.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '8px 12px',
                                            minHeight: 44,
                                            borderRadius: 'var(--radius-3)',
                                            border: preset === p.id ? '2px solid var(--accent-9)' : '1px solid var(--gray-a6)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="themePreset"
                                            value={p.id}
                                            checked={preset === p.id}
                                            onChange={() => setPreset(p.id)}
                                            style={{ position: 'absolute', opacity: 0 }}
                                        />
                                        <span
                                            aria-hidden
                                            style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: '50%',
                                                background: `var(--${p.accentColor}-9)`,
                                            }}
                                        />
                                        <Text size="2">{p.label}</Text>
                                    </label>
                                ))}
                            </Flex>
                        </Field>
                    </Flex>
                </Card>

                <Box>
                    <Button type="submit" size="3" loading={isPending}>
                        Finish setup & sign in <ArrowRight size={16} />
                    </Button>
                </Box>
            </Flex>
        </form>
    );
}
