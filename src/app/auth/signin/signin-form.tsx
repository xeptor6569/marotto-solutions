'use client';

import { Box, Container, Card, Heading, Text, Flex, TextField, Button, Callout } from '@radix-ui/themes';
import { Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

type AuthMode = 'otp' | 'password';

export default function SignInForm({
    businessName,
    logoUrl,
}: {
    businessName: string;
    logoUrl?: string | null;
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [awaitingOtp, setAwaitingOtp] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<AuthMode>('password');

    const normalizeOtp = (value: string) => value.replace(/\D/g, '').slice(0, 6);

    const sendOtp = async () => {
        const result = await signIn('nodemailer', {
            email: email.trim(),
            redirect: false,
            callbackUrl: '/admin',
        });

        if (result?.error) {
            setError('Failed to send sign-in code. Please try again.');
            return false;
        }
        setAwaitingOtp(true);
        setOtp('');
        return true;
    };

    const verifyOtp = () => {
        const token = normalizeOtp(otp);
        if (token.length !== 6) {
            setError('Enter the 6-digit code from your email.');
            return;
        }

        // Complete Auth.js email callback on this same origin so a PWA stays in-app.
        const params = new URLSearchParams({
            email: email.trim(),
            token,
            callbackUrl: '/admin',
        });
        window.location.href = `/api/auth/callback/nodemailer?${params.toString()}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mode === 'otp') {
                if (awaitingOtp) {
                    verifyOtp();
                    return;
                }
                await sendOtp();
            } else {
                const result = await signIn('credentials', {
                    email: email.trim(),
                    password,
                    redirect: false,
                    callbackUrl: '/admin',
                });

                if (result?.error) {
                    setError('Invalid email or password. Please try again.');
                } else if (result?.url) {
                    const safeUrl = new URL(result.url, window.location.origin);
                    window.location.href = `${safeUrl.pathname}${safeUrl.search}${safeUrl.hash}`;
                }
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="1" px="4" style={{ paddingTop: 'clamp(32px, 10dvh, 80px)' }}>
            <Box style={{ position: 'absolute', top: 16, right: 16 }}>
                <ThemeToggle size="3" />
            </Box>
            <Flex direction="column" align="center" gap="6">
                <Flex direction="column" align="center" gap="3">
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Flex direction="column" align="center" gap="3">
                            {logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={logoUrl}
                                    alt=""
                                    style={{ height: 56, width: 'auto', borderRadius: 10 }}
                                />
                            ) : null}
                            <Heading size="8" align="center" style={{ color: 'var(--accent-11)' }}>
                                {businessName}
                            </Heading>
                        </Flex>
                    </Link>
                    <Text color="gray" size="4">Admin Dashboard</Text>
                </Flex>

                <Card size="4" style={{ width: '100%', maxWidth: '400px' }}>
                    <form onSubmit={handleSubmit}>
                        <Flex direction="column" gap="4">
                            <Flex direction="column" gap="2">
                                <Heading size="6">Sign in to continue</Heading>
                                <Text color="gray" size="2">
                                    {mode === 'otp'
                                        ? awaitingOtp
                                            ? 'Enter the 6-digit code we emailed you. Stay in this app — no email link needed.'
                                            : "Enter your email and we'll send a 6-digit sign-in code."
                                        : 'Enter your credentials to access the admin dashboard.'}
                                </Text>
                            </Flex>

                            {error ? (
                                <Callout.Root color="red">
                                    <Callout.Icon>
                                        <AlertCircle size={16} />
                                    </Callout.Icon>
                                    <Callout.Text>{error}</Callout.Text>
                                </Callout.Root>
                            ) : null}

                            <Flex direction="column" gap="1">
                                <Text as="label" size="2" weight="bold">Email Address</Text>
                                <TextField.Root
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    size="3"
                                    disabled={mode === 'otp' && awaitingOtp}
                                    autoComplete="email"
                                >
                                    <TextField.Slot>
                                        <Mail size={16} />
                                    </TextField.Slot>
                                </TextField.Root>
                            </Flex>

                            {mode === 'password' ? (
                                <Flex direction="column" gap="1">
                                    <Text as="label" size="2" weight="bold">Password</Text>
                                    <TextField.Root
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        size="3"
                                        autoComplete="current-password"
                                    />
                                </Flex>
                            ) : null}

                            {mode === 'otp' && awaitingOtp ? (
                                <Flex direction="column" gap="1">
                                    <Text as="label" size="2" weight="bold">6-digit code</Text>
                                    <TextField.Root
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        pattern="[0-9]*"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(normalizeOtp(e.target.value))}
                                        required
                                        size="3"
                                        style={{
                                            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
                                            letterSpacing: '0.35em',
                                            fontSize: 22,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <TextField.Slot>
                                            <KeyRound size={16} />
                                        </TextField.Slot>
                                    </TextField.Root>
                                    <Text size="1" color="gray">
                                        Code expires in 10 minutes.
                                    </Text>
                                </Flex>
                            ) : null}

                            <Button
                                type="submit"
                                size="3"
                                loading={loading}
                                disabled={
                                    loading
                                    || !email
                                    || (mode === 'password' && !password)
                                    || (mode === 'otp' && awaitingOtp && otp.length !== 6)
                                }
                            >
                                {mode === 'otp'
                                    ? awaitingOtp
                                        ? 'Verify code'
                                        : 'Send code'
                                    : 'Sign In'}{' '}
                                <ArrowRight size={16} />
                            </Button>

                            {mode === 'otp' && awaitingOtp ? (
                                <Flex gap="2" wrap="wrap" justify="center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="2"
                                        disabled={loading}
                                        onClick={() => {
                                            setAwaitingOtp(false);
                                            setOtp('');
                                            setError('');
                                        }}
                                    >
                                        Use a different email
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="2"
                                        disabled={loading}
                                        onClick={async () => {
                                            setLoading(true);
                                            setError('');
                                            try {
                                                await sendOtp();
                                            } catch {
                                                setError('Failed to resend code. Please try again.');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                    >
                                        Resend code
                                    </Button>
                                </Flex>
                            ) : null}

                            <Flex direction="column" gap="2" pt="2" style={{ borderTop: '1px solid var(--gray-5)' }}>
                                <Text align="center" size="2" color="gray">
                                    {mode === 'otp' ? 'Know your password?' : "Prefer a one-time code?"}
                                </Text>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="2"
                                    onClick={() => {
                                        setMode(mode === 'otp' ? 'password' : 'otp');
                                        setAwaitingOtp(false);
                                        setOtp('');
                                        setError('');
                                    }}
                                >
                                    {mode === 'otp' ? 'Sign in with Password' : 'Send a sign-in code instead'}
                                </Button>
                            </Flex>

                            <Text align="center" size="1" color="gray">
                                By signing in, you agree to our terms of service.
                            </Text>
                        </Flex>
                    </form>
                </Card>

                <Link href="/" style={{ textDecoration: 'none' }}>
                    <Text size="2" color="gray">← Back to homepage</Text>
                </Link>
            </Flex>
        </Container>
    );
}
