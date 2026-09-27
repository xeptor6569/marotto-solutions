'use client';

import { useActionState } from 'react';
import { Box, Button, Callout, Flex, Text, TextField } from '@radix-ui/themes';
import { CheckCircle, XCircle } from 'lucide-react';
import {
    changeAccountPasswordAction,
    type PasswordActionState,
} from '@/app/admin/settings/actions';
import { Field } from './SettingsSectionForm';

const initialState: PasswordActionState = { success: false };

export default function AccountSettingsForm({
    email,
    hasPassword,
}: {
    email: string;
    hasPassword: boolean;
}) {
    const [state, formAction, isPending] = useActionState(changeAccountPasswordAction, initialState);

    return (
        <form action={formAction}>
            <Flex direction="column" gap="4">
                <Text as="p" size="2" color="gray">
                    Signed in as <Text weight="medium">{email || 'unknown'}</Text>.
                    {hasPassword
                        ? ' Enter your current password, then choose a new one.'
                        : ' You currently sign in with a one-time email code. Set a password to also use email/password on the sign-in page.'}
                </Text>

                {state?.error ? (
                    <Callout.Root color="red">
                        <Callout.Icon><XCircle size={16} /></Callout.Icon>
                        <Callout.Text>{state.error}</Callout.Text>
                    </Callout.Root>
                ) : null}
                {state?.success ? (
                    <Callout.Root color="green">
                        <Callout.Icon><CheckCircle size={16} /></Callout.Icon>
                        <Callout.Text>{state.message || 'Password updated.'}</Callout.Text>
                    </Callout.Root>
                ) : null}

                <Box style={{ maxWidth: 420 }}>
                    <Flex direction="column" gap="4">
                        {hasPassword ? (
                            <Field label="Current password">
                                <TextField.Root
                                    name="currentPassword"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                />
                            </Field>
                        ) : null}
                        <Field label={hasPassword ? 'New password' : 'Password'} hint="At least 8 characters.">
                            <TextField.Root
                                name="newPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                            />
                        </Field>
                        <Field label="Confirm password">
                            <TextField.Root
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                            />
                        </Field>
                    </Flex>
                </Box>

                <Box>
                    <Button type="submit" size="3" loading={isPending}>
                        {hasPassword ? 'Update password' : 'Set password'}
                    </Button>
                </Box>
            </Flex>
        </form>
    );
}
