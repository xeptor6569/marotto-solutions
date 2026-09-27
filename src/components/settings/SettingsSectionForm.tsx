'use client';

import { useActionState } from 'react';
import { Box, Button, Callout, Flex, Text } from '@radix-ui/themes';
import { CheckCircle, XCircle } from 'lucide-react';
import { LabelWithHelp } from '@/components/HelpTip';
import {
    saveSettingsSectionAction,
    type SettingsActionState,
} from '@/app/admin/settings/actions';
import type { ReactNode } from 'react';

const initialState: SettingsActionState = { success: false };

/** Shared submit plumbing for one settings tab: status callouts + save button. */
export default function SettingsSectionForm({
    section,
    children,
    submitLabel = 'Save changes',
}: {
    section: string;
    children: ReactNode;
    submitLabel?: string;
}) {
    const [state, formAction, isPending] = useActionState(saveSettingsSectionAction, initialState);

    return (
        <form action={formAction}>
            <input type="hidden" name="section" value={section} />
            <Flex direction="column" gap="4">
                {state?.error ? (
                    <Callout.Root color="red">
                        <Callout.Icon><XCircle size={16} /></Callout.Icon>
                        <Callout.Text>{state.error}</Callout.Text>
                    </Callout.Root>
                ) : null}
                {state?.success ? (
                    <Callout.Root color="green">
                        <Callout.Icon><CheckCircle size={16} /></Callout.Icon>
                        <Callout.Text>Settings saved.</Callout.Text>
                    </Callout.Root>
                ) : null}
                {children}
                <Box>
                    <Button type="submit" loading={isPending} size="3">{submitLabel}</Button>
                </Box>
            </Flex>
        </form>
    );
}

export function Field({
    label,
    hint,
    help,
    helpTopic,
    children,
}: {
    label: string;
    hint?: string;
    /** Longer explanation behind a "?" icon next to the label. */
    help?: ReactNode;
    helpTopic?: string;
    children: ReactNode;
}) {
    return (
        <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="bold">
                <LabelWithHelp help={help} topic={helpTopic}>{label}</LabelWithHelp>
            </Text>
            {children}
            {hint ? <Text size="1" color="gray">{hint}</Text> : null}
        </Flex>
    );
}
