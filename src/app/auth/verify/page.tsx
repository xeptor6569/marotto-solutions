import { Container, Card, Heading, Text, Flex, Button } from '@radix-ui/themes';
import { KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function VerifyRequestPage() {
    return (
        <Container size="1" style={{ paddingTop: '80px' }}>
            <Flex direction="column" align="center" gap="6">
                <Card size="4" style={{ width: '100%', maxWidth: '400px' }}>
                    <Flex direction="column" align="center" gap="4" py="4">
                        <KeyRound size={48} color="var(--blue-9)" />
                        <Heading size="5">Check your email</Heading>
                        <Text align="center" color="gray">
                            We sent a 6-digit sign-in code to your email. Return to the sign-in screen in this app and enter the code — you do not need to open a link.
                        </Text>
                        <Button asChild>
                            <Link href="/auth/signin">Enter code</Link>
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
