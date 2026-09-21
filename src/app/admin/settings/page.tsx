import { Container, Heading, Card, Flex } from "@radix-ui/themes";
import { getAppConfig } from "@/lib/config";
import { requireAdminPage } from "@/lib/require-admin-session";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import SettingsForm from "./settings-form";
import AccountPasswordForm from "./account-password-form";
import BackButton from "@/components/BackButton";

export default async function SettingsPage() {
    const session = await requireAdminPage("/admin/settings");
    const config = await getAppConfig();

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
        <Container size="2" p="5">
            <Flex mb="4" justify="between" align="center">
                <Heading>Settings</Heading>
                <BackButton />
            </Flex>
            <Flex direction="column" gap="4">
                {email ? (
                    <Card>
                        <AccountPasswordForm email={email} hasPassword={hasPassword} />
                    </Card>
                ) : null}
                <Card>
                    <SettingsForm config={config} />
                </Card>
            </Flex>
        </Container>
    );
}
