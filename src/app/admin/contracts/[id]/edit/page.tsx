import Link from 'next/link';
import { Button, Container } from '@radix-ui/themes';
import { notFound } from 'next/navigation';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import ContractForm from '@/components/ContractForm';
import { getDocumentFormPickers } from '@/lib/document-form-pickers';
import { getContractById } from '@/lib/contracts';

export default async function EditContractPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ error?: string }>;
}) {
    const { id } = await params;
    const search = (await searchParams) || {};
    const [contract, pickers] = await Promise.all([
        getContractById(id),
        getDocumentFormPickers(),
    ]);
    if (!contract) {
        notFound();
    }

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title={`Edit ${contract.displayId}`}
                actions={(
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href={`/admin/contracts/${contract.id}`}>Back to contract</Link>
                        </Button>
                        <BackButton href="/admin/contracts" />
                    </>
                )}
            />
            <ContractForm
                initialData={contract}
                error={search.error}
                clients={pickers.clients}
                leads={pickers.leads}
                jobs={pickers.jobs}
            />
        </Container>
    );
}
