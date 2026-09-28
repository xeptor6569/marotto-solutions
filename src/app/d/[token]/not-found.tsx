import { Button } from '@radix-ui/themes';
import { Link2Off, Mail, Phone } from 'lucide-react';
import StatusPage from '@/components/ui/StatusPage';
import { getBranding } from '@/lib/branding';

export default async function SharedDocumentNotFound() {
    const { business } = await getBranding();
    const hasContact = Boolean(business.phoneHref || business.email);

    return (
        <div className="look-canvas" style={{ minHeight: '100dvh' }}>
            <StatusPage
                icon={<Link2Off size={26} />}
                eyebrow={business.name}
                title="This link isn't available"
                description={`The document may have been replaced or withdrawn. ${hasContact ? `Contact ${business.name} and they can send you a fresh link.` : 'Ask the sender for a fresh link.'}`}
                actions={hasContact ? (
                    <>
                        {business.phoneHref ? (
                            <Button asChild size="3"><a href={business.phoneHref}><Phone size={16} /> Call {business.phoneDisplay || 'us'}</a></Button>
                        ) : null}
                        {business.email ? (
                            <Button asChild size="3" variant="soft"><a href={`mailto:${business.email}`}><Mail size={16} /> Email</a></Button>
                        ) : null}
                    </>
                ) : undefined}
            />
        </div>
    );
}
