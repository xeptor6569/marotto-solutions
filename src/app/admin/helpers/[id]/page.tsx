import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Box, Button, Callout, Card, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { CheckCircle, XCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import DeleteHelperButton from '@/components/DeleteHelperButton';
import HelperForm from '@/components/HelperForm';
import HelperPayoutPanel from '@/components/HelperPayoutPanel';
import { getHelperById } from '@/lib/helpers';
import { listPayoutsForHelper } from '@/lib/helper-payouts';
import { getJobOptions } from '@/lib/jobs';
import { requireAdminPage } from '@/lib/require-admin-session';

export default async function HelperDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ error?: string; saved?: string }>;
}) {
    await requireAdminPage('/admin/helpers');
    const { id } = await params;
    const query = (await searchParams) || {};
    const [helper, payouts, jobs] = await Promise.all([
        getHelperById(id),
        listPayoutsForHelper(id),
        getJobOptions(),
    ]);
    if (!helper) notFound();

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title={helper.name}
                actions={(
                    <Flex gap="2" wrap="wrap">
                        <DeleteHelperButton helperId={helper.id} helperName={helper.name} />
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/helpers">All helpers</Link>
                        </Button>
                        <BackButton href="/admin/helpers" />
                    </Flex>
                )}
            />

            {query.saved === '1' ? (
                <Callout.Root color="green" mb="3">
                    <Callout.Icon><CheckCircle size={16} /></Callout.Icon>
                    <Callout.Text>Helper saved.</Callout.Text>
                </Callout.Root>
            ) : null}

            {query.error ? (
                <Callout.Root color="red" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>{query.error}</Callout.Text>
                </Callout.Root>
            ) : null}

            <Flex direction="column" gap="4">
                <Card>
                    <Flex justify="between" align="start" gap="3" wrap="wrap">
                        <Box>
                            <Heading size="4">{helper.name}</Heading>
                            <Text as="div" size="1" color="gray">{helper.id}</Text>
                            {helper.phone ? <Text as="div" size="2" mt="2">{helper.phone}</Text> : null}
                            {helper.email ? <Text as="div" size="2" color="gray">{helper.email}</Text> : null}
                        </Box>
                        <Badge color={helper.active ? 'green' : 'gray'}>
                            {helper.active ? 'Active' : 'Inactive'}
                        </Badge>
                    </Flex>
                </Card>

                <HelperPayoutPanel
                    mode="helper"
                    helperId={helper.id}
                    helperName={helper.name}
                    jobs={jobs}
                    payouts={payouts}
                />

                <HelperForm initialData={helper} />
            </Flex>
        </Container>
    );
}
