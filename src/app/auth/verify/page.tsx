import Link from 'next/link';
import { Button } from '@radix-ui/themes';
import { MailCheck } from 'lucide-react';
import StatusPage from '@/components/ui/StatusPage';
import { getBranding } from '@/lib/branding';

export default async function VerifyRequestPage() {
    const { business } = await getBranding();
    return (
        <div className="look-canvas" style={{ minHeight: '100dvh' }}>
            <StatusPage
                icon={<MailCheck size={26} />}
                eyebrow={business.name}
                title="Check your email"
                description="We sent you a 6-digit sign-in code. Go back to the sign-in screen and type it in — there's no link to open."
                actions={<Button asChild size="3"><Link href="/auth/signin">Enter the code</Link></Button>}
            />
        </div>
    );
}
