import { Container, Flex, Heading, Text, Box } from "@radix-ui/themes";
import { getAppConfig } from "@/lib/config";
import { resolveBrandingFromConfig } from "@/lib/branding";
import HelpLink from "@/components/HelpLink";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { parseSettingsTab } from "@/lib/settings-tabs";

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
            <Flex justify="between" align="start" gap="2" mb="4">
                <Flex direction="column">
                    <Heading size="7">Settings</Heading>
                    <Text size="2" color="gray">
                        Business profile, appearance, public site content, billing, and storage.
                    </Text>
                </Flex>
                <HelpLink topic="branding-theming" />
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
