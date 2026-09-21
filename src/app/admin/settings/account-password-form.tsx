'use client';

import { Flex, Button, Heading, Box, Text, TextField, Callout } from "@radix-ui/themes";
import { useActionState } from 'react';
import { changeAccountPasswordAction } from "@/app/actions";
import { CheckCircle, XCircle } from "lucide-react";

type PasswordState = { success: boolean; error?: string; message?: string };

const initialState: PasswordState = { success: false };

export default function AccountPasswordForm({
    email,
    hasPassword,
}: {
    email: string;
    hasPassword: boolean;
}) {
    const [state, formAction, isPending] = useActionState(
        async (_prev: PasswordState, formData: FormData): Promise<PasswordState> => {
            return changeAccountPasswordAction(formData);
        },
        initialState,
    );

    return (
        <form action={formAction}>
            <Flex direction="column" gap="4">
                <Heading size="3">Account password</Heading>
                <Text as="p" size="2" color="gray">
                    Signed in as <Text weight="medium">{email}</Text>.
                    {hasPassword
                        ? ' Enter your current password, then choose a new one.'
                        : ' You currently sign in with a one-time email code. Set a password to also use email/password on the sign-in page.'}
                </Text>

                {state?.error && (
                    <Callout.Root color="red">
                        <Callout.Icon><XCircle size={16} /></Callout.Icon>
                        <Callout.Text>{state.error}</Callout.Text>
                    </Callout.Root>
                )}
                {state?.success && (
                    <Callout.Root color="green">
                        <Callout.Icon><CheckCircle size={16} /></Callout.Icon>
                        <Callout.Text>{state.message || 'Password updated.'}</Callout.Text>
                    </Callout.Root>
                )}

                {hasPassword && (
                    <Box>
                        <Text as="label" size="2" weight="bold">Current password</Text>
                        <TextField.Root
                            name="currentPassword"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Required if a password is already set"
                        />
                    </Box>
                )}
                <Box>
                    <Text as="label" size="2" weight="bold">
                        {hasPassword ? 'New password' : 'Password'}
                    </Text>
                    <TextField.Root
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
                    />
                </Box>
                <Box>
                    <Text as="label" size="2" weight="bold">Confirm password</Text>
                    <TextField.Root
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                    />
                </Box>

                <Button type="submit" loading={isPending}>
                    {hasPassword ? 'Update password' : 'Set password'}
                </Button>
            </Flex>
        </form>
    );
}
