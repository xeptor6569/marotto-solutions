import { Container, Flex, Heading, Text, Box } from "@radix-ui/themes";
import { getAppConfig } from "@/lib/config";
import { resolveBrandingFromConfig } from "@/lib/branding";
import SettingsTabs, { parseSettingsTab } from "@/components/settings/SettingsTabs";

export default async function SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const { tab } = await searchParams;
    const config = await getAppConfig();
    const { branding } = resolveBrandingFromConfig(config);

    return (
        <Container size="3" p={{ initial: "4", sm: "5" }}>
            <Flex direction="column" mb="4">
                <Heading size="7">Settings</Heading>
                <Text size="2" color="gray">
                    Business profile, appearance, public site content, billing, and storage.
                </Text>
            </Flex>
            <Box>
                <SettingsTabs
                    config={config}
                    logoUrl={branding.logoUrl}
                    defaultTab={parseSettingsTab(tab)}
                />
            </Box>
        </Container>
    );
}
