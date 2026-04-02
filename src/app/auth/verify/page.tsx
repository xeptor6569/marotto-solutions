import { Container, Card, Heading, Text, Flex } from '@radix-ui/themes';
import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function VerifyRequestPage() {
    return (
        <Container size="1" style={{ paddingTop: '80px' }}>
            <Flex direction="column" align="center" gap="6">
                <Card size="4" style={{ width: '100%', maxWidth: '400px' }}>
                    <Flex direction="column" align="center" gap="4" py="4">
                        <Mail size={48} color="var(--blue-9)" />
                        <Heading size="5">Check your email</Heading>
                        <Text align="center" color="gray">
                            A sign in link has been sent to your email address. Please check your inbox and click the link to continue.
                        </Text>
                        <Text align="center" size="1" color="gray">
                            You can close this window.
                        </Text>
                    </Flex>
                </Card>

                <Link href="/" style={{ textDecoration: 'none' }}>
                    <Text size="2" color="gray">← Back to homepage</Text>
                </Link>
            </Flex>
        </Container>
    );
}
