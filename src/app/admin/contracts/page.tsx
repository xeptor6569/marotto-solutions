import Link from 'next/link';
import { Badge, Box, Button, Callout, Card, Container, Table, Text } from '@radix-ui/themes';
import { Plus, XCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import EmptyState from '@/components/EmptyState';
import RunSchedulerButton from '@/components/RunSchedulerButton';
import {
    getContracts,
    summarizeContractCadence,
    summarizeRecurringTotal,
    getContractProgress,
    type ContractRecord,
} from '@/lib/contracts';
import { isDatabaseConfigured } from '@/lib/prisma';

export default async function AdminContractsPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string; runResult?: string }>;
}) {
    const params = (await searchParams) || {};
    const dbReady = isDatabaseConfigured();
    const contracts = dbReady ? await getContracts() : [];
    const error = params.error;

    const formatDate = (value: Date | null | undefined) => {
        if (!value) return '—';
        return new Date(value).toLocaleDateString();
    };

    const statusColor = (status: ContractRecord['status']) => {
        if (status === 'active') return 'green';
        if (status === 'paused') return 'amber';
        if (status === 'ended') return 'gray';
        return 'red';
    };

    return (
        <Container size="4" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title="Service contracts"
                actions={(
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/contracts/create"><Plus size={14} /> New contract</Link>
                        </Button>
                        <RunSchedulerButton />
                        <BackButton href="/admin" />
                    </>
                )}
            />

            {!dbReady ? (
                <Callout.Root color="amber" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>
                        Service contracts require <code>DATABASE_URL</code> to be set. Configure Postgres and run <code>prisma migrate deploy</code>.
                    </Callout.Text>
                </Callout.Root>
            ) : null}

            {error ? (
                <Callout.Root color="red" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            ) : null}

            {contracts.length === 0 ? (
                <EmptyState
                    title="No service contracts yet"
                    description="Capture recurring agreements (e.g. on-call IT) and let the scheduler issue invoices each cycle."
                    action={dbReady ? (
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/contracts/create"><Plus size={14} /> Create first contract</Link>
                        </Button>
                    ) : null}
                />
            ) : (
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <Box style={{ overflowX: 'auto' }}>
                        <Table.Root style={{ minWidth: 980 }}>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell>Contract</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Customer</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Cadence</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Next due</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Progress</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right">Per cycle</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {contracts.map((contract) => {
                                    const progress = getContractProgress(contract);
                                    return (
                                        <Table.Row key={contract.id}>
                                            <Table.Cell>
                                                <Text weight="bold" as="div">{contract.displayId}</Text>
                                                <Text size="2" as="div">{contract.title}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text as="div">{contract.customerName}</Text>
                                                {contract.customerEmail ? (
                                                    <Text as="div" size="1" color="gray">{contract.customerEmail}</Text>
                                                ) : null}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size="2">{summarizeContractCadence(contract)}</Text>
                                            </Table.Cell>
                                            <Table.Cell>{formatDate(contract.nextDueDate)}</Table.Cell>
                                            <Table.Cell>
                                                <Text size="2">{progress.progressLabel}</Text>
                                            </Table.Cell>
                                            <Table.Cell align="right">
                                                ${summarizeRecurringTotal(contract).toFixed(2)}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge color={statusColor(contract.status)}>{contract.status}</Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Button asChild size="2" variant="soft">
                                                    <Link href={`/admin/contracts/${contract.id}`}>Open</Link>
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                </Card>
            )}
        </Container>
    );
}
