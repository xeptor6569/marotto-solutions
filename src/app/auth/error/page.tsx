import { Container, Card, Heading, Text, Flex, Button, Code } from '@radix-ui/themes';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

const ERROR_HINTS: Record<string, string> = {
    Configuration:
        'Server auth configuration problem (often trustHost / AUTH_URL / NEXTAUTH_SECRET). Check server env and logs.',
    Verification:
        'This magic link is invalid, expired, or already used. Request a new link and open it once.',
    AccessDenied: 'Sign-in was denied for this account.',
    Default: 'There was a problem signing you in. Please try again.',
};

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const params = await searchParams;
    const errorCode = (params.error || 'Default').trim() || 'Default';
    const hint = ERROR_HINTS[errorCode] || ERROR_HINTS.Default;

    return (
        <Container size="1" style={{ paddingTop: '80px' }}>
            <Flex direction="column" align="center" gap="6">
                <Card size="4" style={{ width: '100%', maxWidth: '400px' }}>
                    <Flex direction="column" align="center" gap="4" py="4">
                        <XCircle size={48} color="var(--red-9)" />
                        <Heading size="5">Authentication Error</Heading>
                        <Text align="center" color="gray">
                            {hint}
                        </Text>
                        {errorCode !== 'Default' ? (
                            <Text size="1" color="gray">
                                Error code: <Code>{errorCode}</Code>
                            </Text>
                        ) : null}
                        <Button asChild>
                            <Link href="/auth/signin">Try again</Link>
                        </Button>
                    </Flex>
                </Card>

                <Link href="/" style={{ textDecoration: 'none' }}>
                    <Text size="2" color="gray">← Back to homepage</Text>
                </Link>
            </Flex>
        </Container>
    );
}
