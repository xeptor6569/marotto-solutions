import Link from 'next/link';
import { Button } from '@radix-ui/themes';
import { Compass } from 'lucide-react';
import StatusPage from '@/components/ui/StatusPage';
import { getBranding } from '@/lib/branding';

export default async function NotFound() {
    const { business } = await getBranding();
    return (
        <div className="look-canvas" style={{ minHeight: '100dvh' }}>
            <StatusPage
                icon={<Compass size={26} />}
                eyebrow={business.name}
                title="This page doesn't exist"
                description="The address may be mistyped, or the page has moved."
                actions={<Button asChild size="3"><Link href="/">Go to the homepage</Link></Button>}
            />
        </div>
    );
}
