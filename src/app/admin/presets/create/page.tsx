import Link from 'next/link';
import { Button, Container } from '@radix-ui/themes';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import PresetForm from '@/components/PresetForm';
import { requireAdminPage } from '@/lib/require-admin-session';

export default async function CreatePresetPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string }>;
}) {
    await requireAdminPage('/admin/presets/create');
    const params = (await searchParams) || {};

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title="New document preset"
                actions={(
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/presets">All presets</Link>
                        </Button>
                        <BackButton href="/admin/presets" />
                    </>
                )}
            />
            <PresetForm error={params.error} />
        </Container>
    );
}
