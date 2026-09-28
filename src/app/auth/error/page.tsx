import Link from 'next/link';
import { Button, Code, Text } from '@radix-ui/themes';
import { ShieldAlert } from 'lucide-react';
import StatusPage from '@/components/ui/StatusPage';
import { getBranding } from '@/lib/branding';

const ERROR_HINTS: Record<string, { title: string; hint: string }> = {
    Configuration: {
        title: 'Sign-in is misconfigured',
        hint: 'The server auth settings need attention (often AUTH_URL / NEXTAUTH_URL, NEXTAUTH_SECRET, or trustHost). Check the server environment and logs.',
    },
    Verification: {
        title: 'That code didn’t work',
        hint: 'The sign-in code is invalid, expired, or was already used. Request a new code and enter it within 10 minutes.',
    },
    AccessDenied: {
        title: 'Access denied',
        hint: 'This account isn’t allowed to sign in here.',
    },
    Default: {
        title: 'Couldn’t sign you in',
        hint: 'Something went wrong while signing in. Please try again.',
    },
};

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const params = await searchParams;
    const errorCode = (params.error || 'Default').trim() || 'Default';
    const { title, hint } = ERROR_HINTS[errorCode] || ERROR_HINTS.Default;
    const { business } = await getBranding();

    return (
        <div className="look-canvas" style={{ minHeight: '100dvh' }}>
            <StatusPage
                icon={<ShieldAlert size={26} />}
                eyebrow={business.name}
                title={title}
                description={hint}
                actions={<Button asChild size="3"><Link href="/auth/signin">Back to sign in</Link></Button>}
            >
                {errorCode !== 'Default' ? (
                    <Text size="1" color="gray">Error code: <Code variant="ghost">{errorCode}</Code></Text>
                ) : null}
            </StatusPage>
        </div>
    );
}
