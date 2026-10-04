import Link from 'next/link';
import { Button } from '@radix-ui/themes';
import { FileQuestion, Gauge } from 'lucide-react';
import StatusPage from '@/components/ui/StatusPage';

export default function AdminNotFound() {
    return (
        <StatusPage
            icon={<FileQuestion size={26} />}
            eyebrow="Not found"
            title="We couldn't find that record"
            description="It may have been deleted, renamed, or the link is from another install. Lists keep older items too — try searching there."
            actions={(
                <>
                    <Button asChild size="3"><Link href="/admin"><Gauge size={16} /> Back to dashboard</Link></Button>
                    <Button asChild size="3" variant="soft" color="gray"><Link href="/admin/invoices">Browse invoices</Link></Button>
                </>
            )}
        />
    );
}
