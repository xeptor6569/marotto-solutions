import { Button, Callout, Container, Flex, Text, TextArea, TextField } from '@radix-ui/themes';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import { createJobFromFormAction } from '@/app/admin/jobs/actions';

export default async function CreateJobPage({
    searchParams,
}: {
    searchParams?: Promise<{
        leadId?: string;
        clientId?: string;
        name?: string;
        description?: string;
        status?: string;
        error?: string;
    }>;
}) {
    const params = (await searchParams) || {};
    const seedName = params.name || '';
    const seedLeadId = params.leadId || '';
    const seedClientId = params.clientId || '';
    const seedDescription = params.description || '';
    const seedStatus = params.status || 'active';
    const error = params.error || '';

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title="New job"
                actions={(
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/jobs">All jobs</Link>
                        </Button>
                        <BackButton href="/admin/jobs" />
                    </>
                )}
            />
            {error ? (
                <Callout.Root color="red" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            ) : null}
            <form action={createJobFromFormAction}>
                <input type="hidden" name="leadId" value={seedLeadId} />
                <input type="hidden" name="clientId" value={seedClientId} />
                <Flex direction="column" gap="3">
                    <label>
                        <Text as="div" size="2" weight="bold">Name</Text>
                        <TextField.Root name="name" required placeholder="Kitchen remodel - Jones" defaultValue={seedName} />
                    </label>
                    <label>
                        <Text as="div" size="2" weight="bold">Status</Text>
                        <select name="status" defaultValue={seedStatus} style={{ width: '100%', minHeight: 36, borderRadius: 8, padding: '0 10px', marginTop: 6 }}>
                            <option value="active">active</option>
                            <option value="paused">paused</option>
                            <option value="closed">closed</option>
                        </select>
                    </label>
                    <label>
                        <Text as="div" size="2" weight="bold">Description</Text>
                        <TextArea name="description" rows={4} placeholder="Optional context for this job." defaultValue={seedDescription} />
                    </label>
                    <Button type="submit" size="2">Create job</Button>
                </Flex>
            </form>
        </Container>
    );
}
