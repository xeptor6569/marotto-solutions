import Link from 'next/link';
import { Badge, Box, Button, Callout, Card, Container, Flex, Table, Text } from '@radix-ui/themes';
import { Plus, XCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import EmptyState from '@/components/EmptyState';
import { listHelpers } from '@/lib/helpers';
import { isDatabaseConfigured } from '@/lib/prisma';
import { requireAdminPage } from '@/lib/require-admin-session';

export default async function AdminHelpersPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string }>;
}) {
    await requireAdminPage('/admin/helpers');
    const params = (await searchParams) || {};
    const dbReady = isDatabaseConfigured();
    const helpers = dbReady ? await listHelpers({ includeInactive: true }) : [];

    return (
        <Container size="4" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title="Helpers"
                actions={(
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/helpers/create"><Plus size={14} /> Add helper</Link>
                        </Button>
                        <BackButton href="/admin" />
                    </>
                )}
            />

            <Text size="2" color="gray" mb="3" as="p">
                Track field helpers and record payouts for your books. Optionally link a payout to a job.
            </Text>

            {!dbReady ? (
                <Callout.Root color="amber" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>
                        Helpers require <code>DATABASE_URL</code>. Configure Postgres and run migrations.
                    </Callout.Text>
                </Callout.Root>
            ) : null}

            {params.error ? (
                <Callout.Root color="red" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>{params.error}</Callout.Text>
                </Callout.Root>
            ) : null}

            {helpers.length === 0 ? (
                <EmptyState
                    title="No helpers yet"
                    description="Add your first helper, then record cash/check/Zelle payouts against them."
                    action={dbReady ? (
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/helpers/create"><Plus size={14} /> Add first helper</Link>
                        </Button>
                    ) : null}
                />
            ) : (
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <Box style={{ overflowX: 'auto' }}>
                        <Table.Root style={{ minWidth: 720 }}>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell>Helper</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Payouts</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right">Total paid</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {helpers.map((helper) => (
                                    <Table.Row key={helper.id}>
                                        <Table.Cell>
                                            <Text weight="medium">{helper.name}</Text>
                                            {helper.notes ? (
                                                <Text as="div" size="1" color="gray" style={{ whiteSpace: 'pre-line' }}>
                                                    {helper.notes}
                                                </Text>
                                            ) : null}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {helper.phone || helper.email ? (
                                                <Flex direction="column" gap="1">
                                                    {helper.phone ? <Text size="2">{helper.phone}</Text> : null}
                                                    {helper.email ? <Text size="1" color="gray">{helper.email}</Text> : null}
                                                </Flex>
                                            ) : (
                                                <Text size="2" color="gray">—</Text>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>{helper.payoutCount}</Table.Cell>
                                        <Table.Cell align="right">${helper.payoutTotal.toFixed(2)}</Table.Cell>
                                        <Table.Cell>
                                            <Badge color={helper.active ? 'green' : 'gray'}>
                                                {helper.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Button asChild size="1" variant="soft">
                                                <Link href={`/admin/helpers/${helper.id}`}>Open</Link>
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                </Card>
            )}
        </Container>
    );
}
