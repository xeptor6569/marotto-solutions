import { Container, Flex, Heading, Text, Box } from "@radix-ui/themes";
import { getAppConfig } from "@/lib/config";
import { resolveBrandingFromConfig } from "@/lib/branding";
import { requireAdminPage } from "@/lib/require-admin-session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import HelpLink from "@/components/HelpLink";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { parseSettingsTab } from "@/lib/settings-tabs";

export default async function SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const { tab } = await searchParams;
    const session = await requireAdminPage("/admin/settings");
    const config = await getAppConfig();
    const { branding } = resolveBrandingFromConfig(config);

    // OTP-only accounts have no password hash yet; the Account tab adapts.
    const email = (session.user?.email || "").trim();
    let hasPassword = false;
    if (isDatabaseConfigured() && (session.user?.id || email)) {
        const user = session.user?.id
            ? await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { password: true },
            })
            : await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
                select: { password: true },
            });
        hasPassword = Boolean(user?.password);
    }

    return (
        <Container size="3" p={{ initial: "4", sm: "5" }}>
            <Flex justify="between" align="start" gap="2" mb="4">
                <Flex direction="column">
                    <Heading size="7">Settings</Heading>
                    <Text size="2" color="gray">
                        Business profile, appearance, public site content, billing, storage, and your account.
                    </Text>
                </Flex>
                <HelpLink topic="branding-theming" />
            </Flex>
            <Box>
                <SettingsTabs
                    config={config}
                    logoUrl={branding.logoUrl}
                    defaultTab={parseSettingsTab(tab)}
                    account={{ email, hasPassword }}
                />
            </Box>
        </Container>
    );
}
