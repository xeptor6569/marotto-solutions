import Link from 'next/link';
import { Button, Callout, Container } from '@radix-ui/themes';
import { XCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import HelperForm from '@/components/HelperForm';
import { isDatabaseConfigured } from '@/lib/prisma';
import { requireAdminPage } from '@/lib/require-admin-session';

export default async function CreateHelperPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string }>;
}) {
    await requireAdminPage('/admin/helpers/create');
    const params = (await searchParams) || {};
    const dbReady = isDatabaseConfigured();

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title="Add helper"
                actions={(
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/helpers">All helpers</Link>
                        </Button>
                        <BackButton href="/admin/helpers" />
                    </>
                )}
            />
            {!dbReady ? (
                <Callout.Root color="amber" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>
                        Helpers require <code>DATABASE_URL</code>. Configure Postgres before continuing.
                    </Callout.Text>
                </Callout.Root>
            ) : (
                <HelperForm error={params.error} />
            )}
        </Container>
    );
}
