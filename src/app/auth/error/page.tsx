import { Container, Card, Heading, Text, Flex, Button } from '@radix-ui/themes';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    return (
        <Container size="1" style={{ paddingTop: '80px' }}>
            <Flex direction="column" align="center" gap="6">
                <Card size="4" style={{ width: '100%', maxWidth: '400px' }}>
                    <Flex direction="column" align="center" gap="4" py="4">
                        <XCircle size={48} color="var(--red-9)" />
                        <Heading size="5">Authentication Error</Heading>
                        <Text align="center" color="gray">
                            There was a problem signing you in. Please try again.
                        </Text>
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
