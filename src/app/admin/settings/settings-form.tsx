'use client';

import { Flex, Button, Heading, Box, Text, TextField, Callout } from "@radix-ui/themes";
import { useActionState } from 'react'; // React 19 / Next 16
import { saveSettingsAction } from "@/app/actions";
import { AppConfig } from "@/lib/types";
import { Info, CheckCircle, XCircle } from "lucide-react";

const initialState = {
    success: false,
    error: '',
};

export default function SettingsForm({ config }: { config: Partial<AppConfig> }) {
    // Wrapper for action to match state signature if needed, or modify action.
    // Action returns { success, error? }.
    // useActionState signature: (state, payload) => newState.

    // We need to adapt saveSettingsAction to accept state as first arg if we use useActionState
    // But saveSettingsAction currently signature is (FormData) => ...
    // Let's wrapping it.

    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        const result = await saveSettingsAction(formData);
        return result;
    }, initialState);

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
                        <Callout.Text>Settings saved and connected successfully!</Callout.Text>
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

                <Button type="submit" loading={isPending}>Save & Test Connection</Button>
            </Flex>
        </form>
    );
}
