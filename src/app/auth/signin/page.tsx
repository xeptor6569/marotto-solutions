'use client';

import { Container, Card, Heading, Text, Flex, TextField, Button, Callout } from '@radix-ui/themes';
import { Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'magic' | 'password'>('password');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mode === 'magic') {
                const result = await signIn('nodemailer', {
                    email,
                    redirect: false,
                    callbackUrl: '/admin',
                });

                if (result?.error) {
                    setError('Failed to send magic link. Please try again.');
                } else {
                    setSent(true);
                }
            } else {
                const result = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                    callbackUrl: '/admin',
                }) as any;

                if (result?.error) {
                    setError('Invalid email or password. Please try again.');
                } else if (result?.url) {
                    window.location.href = result.url;
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="1" style={{ paddingTop: '80px' }}>
            <Flex direction="column" align="center" gap="6">
                {/* Logo/Brand */}
                <Flex direction="column" align="center" gap="2">
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Heading size="8" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Marotto Solutions
                        </Heading>
                    </Link>
                    <Text color="gray" size="4">Admin Dashboard</Text>
                </Flex>

                {/* Sign In Card */}
                <Card size="4" style={{ width: '100%', maxWidth: '400px' }}>
                    {sent ? (
                        <Flex direction="column" align="center" gap="4" py="4">
                            <CheckCircle size={48} color="var(--green-9)" />
                            <Heading size="5">Check your email</Heading>
                            <Text align="center" color="gray">
                                We sent a magic link to <strong>{email}</strong>. Click the link in the email to sign in.
                            </Text>
                            <Button variant="soft" onClick={() => {
                                setSent(false);
                                setEmail('');
                            }}>
                                Use a different email
                            </Button>
                        </Flex>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <Flex direction="column" gap="4">
                                <Flex direction="column" gap="2">
                                    <Heading size="6">Sign in to continue</Heading>
                                    <Text color="gray" size="2">
                                        {mode === 'magic'
                                            ? "Enter your email and we'll send you a magic link to sign in."
                                            : "Enter your credentials to access the admin dashboard."}
                                    </Text>
                                </Flex>

                                {error && (
                                    <Callout.Root color="red">
                                        <Callout.Icon>
                                            <AlertCircle size={16} />
                                        </Callout.Icon>
                                        <Callout.Text>{error}</Callout.Text>
                                    </Callout.Root>
                                )}

                                <Flex direction="column" gap="1">
                                    <Text as="label" size="2" weight="bold">Email Address</Text>
                                    <TextField.Root
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        size="3"
                                    >
                                        <TextField.Slot>
                                            <Mail size={16} />
                                        </TextField.Slot>
                                    </TextField.Root>
                                </Flex>

                                {mode === 'password' && (
                                    <Flex direction="column" gap="1">
                                        <Text as="label" size="2" weight="bold">Password</Text>
                                        <TextField.Root
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            size="3"
                                        />
                                    </Flex>
                                )}

                                <Button type="submit" size="3" loading={loading} disabled={loading || !email || (mode === 'password' && !password)}>
                                    {mode === 'magic' ? 'Send Magic Link' : 'Sign In'} <ArrowRight size={16} />
                                </Button>

                                <Flex direction="column" gap="2" pt="2" style={{ borderTop: '1px solid var(--gray-5)' }}>
                                    <Text align="center" size="2" color="gray">
                                        {mode === 'magic' ? "Know your password?" : "Don't have a password?"}
                                    </Text>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="2"
                                        onClick={() => setMode(mode === 'magic' ? 'password' : 'magic')}
                                    >
                                        {mode === 'magic' ? 'Sign in with Password' : 'Send a Magic Link instead'}
                                    </Button>
                                </Flex>

                                <Text align="center" size="1" color="gray">
                                    By signing in, you agree to our terms of service.
                                </Text>
                            </Flex>
                        </form>
                    )}
                </Card>

                <Link href="/" style={{ textDecoration: 'none' }}>
                    <Text size="2" color="gray">← Back to homepage</Text>
                </Link>
            </Flex>
        </Container>
    );
}
