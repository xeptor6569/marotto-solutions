import { Button, Container, Flex, Text, TextArea, TextField } from '@radix-ui/themes';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import { createJobFromFormAction } from '@/app/admin/jobs/actions';

export default async function CreateJobPage({
    searchParams,
}: {
    searchParams?: Promise<{ leadId?: string; clientId?: string; name?: string }>;
}) {
    const params = (await searchParams) || {};
    const seedName = params.name || '';
    const seedLeadId = params.leadId || '';
    const seedClientId = params.clientId || '';

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
                        <select name="status" defaultValue="active" style={{ width: '100%', minHeight: 36, borderRadius: 8, padding: '0 10px', marginTop: 6 }}>
                            <option value="active">active</option>
                            <option value="paused">paused</option>
                            <option value="closed">closed</option>
                        </select>
                    </label>
                    <label>
                        <Text as="div" size="2" weight="bold">Description</Text>
                        <TextArea name="description" rows={4} placeholder="Optional context for this job." />
                    </label>
                    <Button type="submit" size="2">Create job</Button>
                </Flex>
            </form>
        </Container>
    );
}
