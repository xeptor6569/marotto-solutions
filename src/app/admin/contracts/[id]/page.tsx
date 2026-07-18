import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Box, Button, Card, Container, Flex, Grid, Heading, Table, Text } from '@radix-ui/themes';
import { Edit, ExternalLink } from 'lucide-react';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import ContractStatusButtons from '@/components/ContractStatusButtons';
import {
    ensureContractShareToken,
    getContractById,
    getContractProgress,
    getInvoicesForContract,
    summarizeContractCadence,
    summarizeRecurringTotal,
} from '@/lib/contracts';
import { buildSharePath } from '@/lib/share-token';

function statusColor(status: string) {
    if (status === 'active') return 'green' as const;
    if (status === 'paused') return 'amber' as const;
    if (status === 'ended') return 'gray' as const;
    return 'red' as const;
}

export default async function AdminContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const loaded = await getContractById(id);
    if (!loaded) {
        notFound();
    }
    const contract = await ensureContractShareToken(loaded);
    const invoices = await getInvoicesForContract(contract.id);
    const progress = getContractProgress(contract);
    const recurringTotal = summarizeRecurringTotal(contract);
    const cadence = summarizeContractCadence(contract);
    const hasUsageLines = contract.lines.some((line) => line.kind === 'usage');
    const publicSharePath = buildSharePath(contract.shareToken);

    return (
        <Container size="4" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title={contract.title}
                actions={(
                    <>
                        <Button asChild size="2">
                            <Link href={`/admin/contracts/${contract.id}/edit`}><Edit size={14} /> Edit</Link>
                        </Button>
                        <Button asChild size="2" variant="soft">
                            <Link href={publicSharePath}><ExternalLink size={14} /> Public preview</Link>
                        </Button>
                        <BackButton href="/admin/contracts" />
                    </>
                )}
            />

            <Flex direction="column" gap="4">
                <Card>
                    <Flex justify="between" align="start" gap="3" wrap="wrap">
                        <Box style={{ minWidth: 0 }}>
                            <Text size="1" color="gray">Contract id</Text>
                            <Heading size="4">{contract.displayId}</Heading>
                            <Text as="div" size="2" color="gray">{contract.title}</Text>
                        </Box>
                        <Badge size="2" color={statusColor(contract.status)}>{contract.status}</Badge>
                    </Flex>
                    <Box mt="3">
                        <ContractStatusButtons
                            contractId={contract.id}
                            contractDisplayId={contract.displayId}
                            status={contract.status}
                        />
                    </Box>
                </Card>

                <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
                    <Card>
                        <Heading size="3" mb="2">Customer</Heading>
                        <Text as="div" weight="bold">{contract.customerName}</Text>
                        {contract.customerEmail ? <Text as="div" size="2">{contract.customerEmail}</Text> : null}
                        {contract.customerPhone ? <Text as="div" size="2">{contract.customerPhone}</Text> : null}
                        {contract.customerAddress ? (
                            <Text as="div" size="2" style={{ whiteSpace: 'pre-line' }}>{contract.customerAddress}</Text>
                        ) : null}
                        {contract.clientId ? (
                            <Text as="div" size="1" color="gray" mt="2">Client: {contract.clientId}</Text>
                        ) : null}
                        {contract.leadId ? (
                            <Text as="div" size="1" color="gray">Lead: {contract.leadId}</Text>
                        ) : null}
                        {contract.jobId ? (
                            <Text as="div" size="1" color="gray">Job: {contract.jobId}</Text>
                        ) : null}
                    </Card>

                    <Card>
                        <Heading size="3" mb="2">Schedule</Heading>
                        <Text as="div" size="2"><strong>Cadence:</strong> {cadence}</Text>
                        <Text as="div" size="2"><strong>Start:</strong> {contract.startDate.toLocaleDateString()}</Text>
                        <Text as="div" size="2">
                            <strong>End:</strong> {contract.endDate ? contract.endDate.toLocaleDateString() : 'Open-ended'}
                        </Text>
                        <Text as="div" size="2"><strong>Next due:</strong> {contract.nextDueDate.toLocaleDateString()}</Text>
                        <Text as="div" size="2"><strong>Last issued:</strong> {contract.lastIssuedDate ? contract.lastIssuedDate.toLocaleDateString() : 'Never'}</Text>
                        <Text as="div" size="2" mt="2">{progress.progressLabel}</Text>
                        <Flex mt="2" gap="2" wrap="wrap">
                            {contract.autoRenew ? <Badge color="green">Auto-renew</Badge> : <Badge color="gray">No auto-renew</Badge>}
                            {contract.autoSend ? <Badge color="blue">Auto-send</Badge> : <Badge color="gray">Manual send</Badge>}
                        </Flex>
                        {hasUsageLines && contract.autoSend ? (
                            <Text as="div" size="1" color="amber" mt="2">
                                Auto-send is gated: this contract has usage lines that need review before each cycle is sent.
                            </Text>
                        ) : null}
                    </Card>

                    <Card>
                        <Heading size="3" mb="2">Recurring per cycle</Heading>
                        <Heading size="6">${recurringTotal.toFixed(2)}</Heading>
                        <Text as="div" size="1" color="gray">
                            Sum of recurring line items. Usage lines are added when each cycle invoice is reviewed.
                        </Text>
                        {contract.paymentTerms ? (
                            <Text as="div" size="2" mt="3"><strong>Payment terms:</strong> {contract.paymentTerms}</Text>
                        ) : null}
                    </Card>
                </Grid>

                {contract.notes ? (
                    <Card>
                        <Heading size="3" mb="2">Notes / scope</Heading>
                        <Text as="div" style={{ whiteSpace: 'pre-line' }}>{contract.notes}</Text>
                    </Card>
                ) : null}

                <Card>
                    <Heading size="3" mb="3">Line items</Heading>
                    <Box style={{ overflowX: 'auto' }}>
                        <Table.Root style={{ minWidth: 720 }}>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell>Kind</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right">Qty</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right">Unit price</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right">Cycle total</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {contract.lines.map((line) => {
                                    const cycleTotal = line.kind === 'recurring' ? line.quantity * line.unitPrice : 0;
                                    return (
                                        <Table.Row key={line.id}>
                                            <Table.Cell>
                                                <Badge color={line.kind === 'recurring' ? 'blue' : 'amber'}>{line.kind}</Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text weight="bold">{line.description}</Text>
                                                {line.details ? (
                                                    <Text as="div" size="1" color="gray" style={{ whiteSpace: 'pre-line' }}>{line.details}</Text>
                                                ) : null}
                                            </Table.Cell>
                                            <Table.Cell align="right">{line.quantity}</Table.Cell>
                                            <Table.Cell align="right">${line.unitPrice.toFixed(2)}</Table.Cell>
                                            <Table.Cell align="right">
                                                {line.kind === 'recurring' ? `$${cycleTotal.toFixed(2)}` : <Text size="1" color="gray">usage</Text>}
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                </Card>

                <Card>
                    <Heading size="3" mb="3">Generated invoices ({invoices.length})</Heading>
                    {invoices.length === 0 ? (
                        <Text size="2" color="gray">No invoices issued yet. Use &quot;Issue next invoice&quot; above to generate the first cycle.</Text>
                    ) : (
                        <Box style={{ overflowX: 'auto' }}>
                            <Table.Root style={{ minWidth: 640 }}>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeaderCell>Cycle</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Invoice</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell align="right">Total</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {invoices.map((invoice) => (
                                        <Table.Row key={invoice.id}>
                                            <Table.Cell>{invoice.contractCycle ?? '—'}</Table.Cell>
                                            <Table.Cell>
                                                <Text weight="bold">{invoice.id}</Text>
                                                {invoice.title ? <Text as="div" size="1">{invoice.title}</Text> : null}
                                            </Table.Cell>
                                            <Table.Cell>{new Date(invoice.date).toLocaleDateString()}</Table.Cell>
                                            <Table.Cell align="right">${invoice.total.toFixed(2)}</Table.Cell>
                                            <Table.Cell>
                                                <Badge color={invoice.status === 'paid' ? 'green' : invoice.status === 'sent' ? 'blue' : invoice.status === 'void' ? 'red' : 'orange'}>
                                                    {invoice.status}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Button asChild size="2" variant="soft">
                                                    <Link href={`/admin/invoices/${invoice.id}`}>Open</Link>
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    )}
                </Card>
            </Flex>
        </Container>
    );
}
