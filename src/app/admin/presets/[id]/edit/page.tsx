import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Container, Flex } from '@radix-ui/themes';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import DeletePresetButton from '@/components/DeletePresetButton';
import PresetForm from '@/components/PresetForm';
import { getPresetById } from '@/lib/presets';
import { requireAdminPage } from '@/lib/require-admin-session';

export default async function EditPresetPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ error?: string; saved?: string }>;
}) {
    await requireAdminPage('/admin/presets');
    const { id } = await params;
    const query = (await searchParams) || {};
    const preset = await getPresetById(id);
    if (!preset) notFound();

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title={`Edit preset: ${preset.name}`}
                actions={(
                    <Flex gap="2" wrap="wrap">
                        <DeletePresetButton presetId={preset.id} presetName={preset.name} />
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/presets">All presets</Link>
                        </Button>
                        <BackButton href="/admin/presets" />
                    </Flex>
                )}
            />
            <PresetForm
                initialData={preset}
                error={query.error}
                saved={query.saved === '1'}
            />
        </Container>
    );
}
