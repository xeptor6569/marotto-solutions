import { redirect } from 'next/navigation';
import { Box, Callout, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { AlertCircle } from 'lucide-react';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import SetupForm from './setup-form';
import { listTimeZones } from '@/lib/timezones';

export const metadata = { title: 'Setup' };
export const dynamic = 'force-dynamic';

/**
 * First-run wizard. Reachable only while the install has no user accounts;
 * once an admin exists it always forwards to sign-in.
 */
export default async function SetupPage() {
    const dbConfigured = isDatabaseConfigured();
    let userCount: number | null = null;

    if (dbConfigured) {
        try {
            userCount = await prisma.user.count();
        } catch {
            userCount = null;
        }
        if (userCount !== null && userCount > 0) {
            redirect('/auth/signin');
        }
    }

    return (
        <div className="setup-shell look-canvas">
        <Container size="3" px="4" py={{ initial: '5', sm: '8' }}>
            <Flex direction="column" gap="5">
                <Flex direction="column" gap="1" className="setup-intro">
                    <span className="ui-eyebrow">First-time setup</span>
                    <Heading size="8">Welcome — let&apos;s get you set up</Heading>
                    <Text size="3" color="gray" style={{ maxWidth: 560 }}>
                        Four quick steps: your account, your business, and how everything should look. It takes about two minutes.
                    </Text>
                </Flex>

                {!dbConfigured ? (
                    <Callout.Root color="amber">
                        <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
                        <Callout.Text>
                            <code>DATABASE_URL</code> is not configured, so accounts cannot be created yet.
                            Start Postgres (e.g. <code>docker compose up -d postgres</code>), run the
                            migrations, and reload this page.
                        </Callout.Text>
                    </Callout.Root>
                ) : userCount === null ? (
                    <Callout.Root color="red">
                        <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
                        <Callout.Text>
                            The database is configured but unreachable. Check that Postgres is running and
                            migrations have been applied (<code>npm run prisma:migrate:deploy</code>), then reload.
                        </Callout.Text>
                    </Callout.Root>
                ) : (
                    <Box>
                        <SetupForm timeZones={listTimeZones()} />
                    </Box>
                )}
            </Flex>
        </Container>
        </div>
    );
}
