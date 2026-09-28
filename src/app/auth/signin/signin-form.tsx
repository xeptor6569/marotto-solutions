'use client';

import { Box, Heading, Text, Flex, TextField, Button, Callout } from '@radix-ui/themes';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { businessInitials } from '@/lib/branding-core';

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
        <div className="auth-shell look-canvas">
            <aside className="auth-brand" aria-hidden>
                <div className="auth-brand-inner">
                    <span className="brand-mark auth-brand-mark">
                        {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logoUrl} alt="" />
                        ) : (
                            <span className="brand-mark-initials">{businessInitials(businessName)}</span>
                        )}
                    </span>
                    <Heading size="8" className="auth-brand-name">{businessName}</Heading>
                    <Text as="p" size="3" className="auth-brand-copy">
                        Estimates, invoices, jobs, and payments — in one place.
                    </Text>
                </div>
            </aside>

            <main className="auth-main">
                <Flex justify="end" className="auth-toolbar">
                    <ThemeToggle size="2" />
                </Flex>
                <div className="auth-card">
                    <Flex align="center" gap="3" mb="5" className="auth-mobile-brand">
                        <span className="brand-mark" style={{ width: 36, height: 36 }} aria-hidden>
                            {logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logoUrl} alt="" />
                            ) : (
                                <span className="brand-mark-initials">{businessInitials(businessName)}</span>
                            )}
                        </span>
                        <Text size="3" weight="bold">{businessName}</Text>
                    </Flex>

                    <form onSubmit={handleSubmit}>
                        <Flex direction="column" gap="4">
                            <Box>
                                <Heading size="7">
                                    {mode === 'otp' && awaitingOtp ? 'Check your email' : 'Sign in'}
                                </Heading>
                                <Text as="p" color="gray" size="2" mt="1">
                                    {mode === 'otp'
                                        ? awaitingOtp
                                            ? `We sent a 6-digit code to ${email.trim() || 'your email'}. Enter it here — no link to click.`
                                            : "Enter your email and we'll send a 6-digit sign-in code."
                                        : 'Welcome back. Sign in to your back office.'}
                                </Text>
                            </Box>

                            {error ? (
                                <Callout.Root color="red">
                                    <Callout.Icon>
                                        <AlertCircle size={16} />
                                    </Callout.Icon>
                                    <Callout.Text>{error}</Callout.Text>
                                </Callout.Root>
                            ) : null}

                            <Flex direction="column" gap="1">
                                <Text as="label" size="2" weight="medium" htmlFor="signin-email">Email</Text>
                                <TextField.Root
                                    id="signin-email"
                                    name="email"
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
                                    <Text as="label" size="2" weight="medium" htmlFor="signin-password">Password</Text>
                                    <TextField.Root
                                        id="signin-password"
                                        name="password"
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
                                    <Text as="label" size="2" weight="medium" htmlFor="signin-code">6-digit code</Text>
                                    <TextField.Root
                                        id="signin-code"
                                        name="code"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        pattern="[0-9]*"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(normalizeOtp(e.target.value))}
                                        required
                                        size="3"
                                        className="auth-otp"
                                        autoFocus
                                    >
                                        <TextField.Slot>
                                            <KeyRound size={16} />
                                        </TextField.Slot>
                                    </TextField.Root>
                                    <Text size="1" color="gray">The code expires in 10 minutes.</Text>
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
                                    : 'Sign in'}{' '}
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

                            <div className="auth-divider"><span>or</span></div>

                            <Button
                                type="button"
                                variant="soft"
                                color="gray"
                                size="3"
                                onClick={() => {
                                    setMode(mode === 'otp' ? 'password' : 'otp');
                                    setAwaitingOtp(false);
                                    setOtp('');
                                    setError('');
                                }}
                            >
                                {mode === 'otp' ? <><KeyRound size={16} /> Sign in with password</> : <><Mail size={16} /> Email me a sign-in code</>}
                            </Button>
                        </Flex>
                    </form>

                    <Flex justify="center" mt="6">
                        <Link href="/" className="auth-back-link">
                            <ArrowLeft size={14} /> Back to {businessName}
                        </Link>
                    </Flex>
                </div>
            </main>
        </div>
    );
}
