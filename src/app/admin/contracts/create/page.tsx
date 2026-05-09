import Link from 'next/link';
import { Button, Callout, Container } from '@radix-ui/themes';
import { XCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import ContractForm from '@/components/ContractForm';
import { getDocumentFormPickers } from '@/lib/document-form-pickers';
import { isDatabaseConfigured } from '@/lib/prisma';

export default async function CreateContractPage({
    searchParams,
}: {
    searchParams?: Promise<{
        error?: string;
        clientId?: string;
        leadId?: string;
        jobId?: string;
        title?: string;
    }>;
}) {
    const params = (await searchParams) || {};
    const dbReady = isDatabaseConfigured();
    const { clients, leads, jobs } = dbReady
        ? await getDocumentFormPickers()
        : { clients: [], leads: [], jobs: [] };

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title="New service contract"
                actions={(
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/contracts">All contracts</Link>
                        </Button>
                        <BackButton href="/admin/contracts" />
                    </>
                )}
            />
            {!dbReady ? (
                <Callout.Root color="amber" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>
                        Service contracts require <code>DATABASE_URL</code>. Configure Postgres before continuing.
                    </Callout.Text>
                </Callout.Root>
            ) : (
                <ContractForm
                    error={params.error}
                    clients={clients}
                    leads={leads}
                    jobs={jobs}
                    seed={{
                        clientId: params.clientId,
                        leadId: params.leadId,
                        jobId: params.jobId,
                        title: params.title,
                    }}
                />
            )}
        </Container>
    );
}
