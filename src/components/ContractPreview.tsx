import { Badge, Box, Card, Container, Flex, Heading, Table, Text } from '@radix-ui/themes';
import BackButton from '@/components/BackButton';
import PrintButton from '@/components/PrintButton';
import ShareButton from '@/components/ShareButton';
import {
    getContractProgress,
    summarizeContractCadence,
    summarizeRecurringTotal,
    type ContractRecord,
} from '@/lib/contracts';

interface Props {
    contract: ContractRecord;
    showBackButton?: boolean;
    backHref?: string;
}

function statusColor(status: ContractRecord['status']): string {
    if (status === 'active') return '#166534';
    if (status === 'paused') return '#92400e';
    if (status === 'ended') return '#374151';
    return '#b91c1c';
}

export default function ContractPreview({ contract, showBackButton = false, backHref = '/' }: Props) {
    const cadence = summarizeContractCadence(contract);
    const progress = getContractProgress(contract);
    const recurringTotal = summarizeRecurringTotal(contract);
    const sharePath = `/contracts/${contract.displayId}`;
    const shareTitle = `Service Contract ${contract.displayId}`;
    const docTitle = 'Service Agreement';

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }} className="print-container">
            <Flex justify="between" mb="4" className="no-print doc-toolbar" gap="2" wrap="wrap">
                {showBackButton ? <BackButton href={backHref} /> : <Box />}
                <Flex gap="2" className="doc-toolbar-actions" wrap="wrap">
                    <ShareButton label={docTitle} sharePath={sharePath} shareTitle={shareTitle} />
                    <PrintButton label={docTitle} />
                </Flex>
            </Flex>

            <Card size="3" className="doc-card" style={{ background: 'white', color: '#111827', border: '1px solid #d1d5db' }}>
                <div className="receipt-content">
                    <Flex justify="between" align="start" mb="6" className="doc-header">
                        <Box>
                            <Heading size="8" style={{ color: '#111827', marginBottom: 4 }}>MAROTTO</Heading>
                            <Text size="3" weight="bold" style={{ color: '#374151', letterSpacing: '2px' }}>SOLUTIONS</Text>
                            <Box mt="4">
                                <Text as="div" size="2" style={{ color: '#1f2937' }}>28 E Mountain Ridge MHP</Text>
                                <Text as="div" size="2" style={{ color: '#1f2937' }}>Wilkes Barre, PA 18702</Text>
                                <Text as="div" size="2" style={{ color: '#1f2937' }}>(570) 332-9262</Text>
                            </Box>
                        </Box>
                        <Box className="doc-meta" style={{ textAlign: 'right' }}>
                            <Heading size="8" style={{ color: '#4b5563', textTransform: 'uppercase' }}>{docTitle}</Heading>
                            <Flex direction="column" mt="2">
                                <Text size="2" weight="bold" style={{ color: '#4b5563' }}>CONTRACT #</Text>
                                <Text size="4" weight="bold" style={{ color: '#111827' }}>
                                    {contract.title ? `${contract.displayId} - ${contract.title}` : contract.displayId}
                                </Text>
                            </Flex>
                            <Flex direction="column" mt="2">
                                <Text size="2" weight="bold" style={{ color: '#4b5563' }}>STATUS</Text>
                                <Badge size="2" color={contract.status === 'active' ? 'green' : contract.status === 'paused' ? 'amber' : contract.status === 'ended' ? 'gray' : 'red'}>
                                    {contract.status}
                                </Badge>
                            </Flex>
                            <Flex direction="column" mt="2">
                                <Text size="2" weight="bold" style={{ color: '#4b5563' }}>EFFECTIVE</Text>
                                <Text size="3" style={{ color: '#111827' }}>{new Date(contract.startDate).toLocaleDateString()}</Text>
                            </Flex>
                            {contract.endDate ? (
                                <Flex direction="column" mt="2">
                                    <Text size="2" weight="bold" style={{ color: '#4b5563' }}>THROUGH</Text>
                                    <Text size="3" style={{ color: '#111827' }}>{new Date(contract.endDate).toLocaleDateString()}</Text>
                                </Flex>
                            ) : null}
                        </Box>
                    </Flex>

                    <Box mb="6" style={{ borderTop: '2px solid #d1d5db', paddingTop: '20px' }}>
                        <Text size="2" weight="bold" style={{ color: '#4b5563', textTransform: 'uppercase' }}>Service Recipient</Text>
                        <Heading size="4" mt="1" style={{ color: '#111827' }}>{contract.customerName}</Heading>
                        {contract.customerAddress ? (
                            <Text as="div" size="2" style={{ whiteSpace: 'pre-line', color: '#1f2937' }}>{contract.customerAddress}</Text>
                        ) : null}
                        {contract.customerEmail ? (
                            <Text as="div" size="2" style={{ color: '#1f2937' }}>{contract.customerEmail}</Text>
                        ) : null}
                        {contract.customerPhone ? (
                            <Text as="div" size="2" style={{ color: '#1f2937' }}>{contract.customerPhone}</Text>
                        ) : null}
                    </Box>

                    <Box
                        mb="6"
                        style={{
                            padding: '16px 20px',
                            border: '1px solid #d1d5db',
                            borderRadius: 12,
                            background: '#f9fafb',
                        }}
                    >
                        <Heading size="4" mb="2" style={{ color: '#111827' }}>Term &amp; cadence</Heading>
                        <Flex direction={{ initial: 'column', md: 'row' }} gap="4" wrap="wrap">
                            <Box>
                                <Text size="1" weight="bold" style={{ color: '#4b5563', textTransform: 'uppercase' }}>Cadence</Text>
                                <Text as="div" size="2" style={{ color: '#111827' }}>{cadence}</Text>
                            </Box>
                            <Box>
                                <Text size="1" weight="bold" style={{ color: '#4b5563', textTransform: 'uppercase' }}>Term</Text>
                                <Text as="div" size="2" style={{ color: '#111827' }}>
                                    {contract.termCycles ? `${contract.termCycles} cycles` : 'Open-ended (until cancelled)'}
                                    {contract.autoRenew ? ' · auto-renew' : ''}
                                </Text>
                            </Box>
                            <Box>
                                <Text size="1" weight="bold" style={{ color: '#4b5563', textTransform: 'uppercase' }}>Progress</Text>
                                <Text as="div" size="2" style={{ color: '#111827' }}>{progress.progressLabel}</Text>
                            </Box>
                            {contract.paymentTerms ? (
                                <Box>
                                    <Text size="1" weight="bold" style={{ color: '#4b5563', textTransform: 'uppercase' }}>Payment terms</Text>
                                    <Text as="div" size="2" style={{ color: '#111827' }}>{contract.paymentTerms}</Text>
                                </Box>
                            ) : null}
                        </Flex>
                    </Box>

                    <Box className="doc-table-wrap">
                        <Table.Root variant="surface" style={{ width: '100%', marginBottom: '24px', minWidth: 560 }}>
                            <Table.Header>
                                <Table.Row style={{ background: '#f3f4f6' }}>
                                    <Table.ColumnHeaderCell style={{ color: '#1f2937' }}>Item</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right" style={{ color: '#1f2937' }}>Qty</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right" style={{ color: '#1f2937' }}>Unit</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right" style={{ color: '#1f2937' }}>Per cycle</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {contract.lines.map((line) => {
                                    const lineTotal = line.kind === 'recurring' ? line.quantity * line.unitPrice : 0;
                                    return (
                                        <Table.Row key={line.id}>
                                            <Table.Cell>
                                                <Flex gap="2" align="center" wrap="wrap">
                                                    <Text weight="bold" style={{ color: '#111827' }}>{line.description}</Text>
                                                    <Badge size="1" color={line.kind === 'recurring' ? 'blue' : 'amber'}>{line.kind}</Badge>
                                                </Flex>
                                                {line.details ? (
                                                    <Text as="div" size="2" mt="2" style={{ color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                                                        {line.details}
                                                    </Text>
                                                ) : null}
                                            </Table.Cell>
                                            <Table.Cell align="right">
                                                <Text style={{ color: '#111827' }}>
                                                    {line.kind === 'usage' ? 'as-billed' : line.quantity}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell align="right">
                                                <Text style={{ color: '#111827' }}>${line.unitPrice.toFixed(2)}</Text>
                                            </Table.Cell>
                                            <Table.Cell align="right">
                                                <Text style={{ color: '#111827' }}>
                                                    {line.kind === 'recurring' ? `$${lineTotal.toFixed(2)}` : '—'}
                                                </Text>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {contract.notes ? (
                        <Box
                            mb="6"
                            style={{
                                padding: '18px 20px',
                                border: '1px solid #d1d5db',
                                borderRadius: 12,
                                background: '#f9fafb',
                            }}
                        >
                            <Text size="2" weight="bold" style={{ color: '#374151', textTransform: 'uppercase' }}>Scope &amp; terms</Text>
                            <Text as="div" mt="2" style={{ color: '#111827', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                                {contract.notes}
                            </Text>
                        </Box>
                    ) : null}

                    <Flex justify="between" align="end" className="doc-summary">
                        <Box className="doc-status">
                            <Text
                                size="5"
                                weight="bold"
                                style={{
                                    color: statusColor(contract.status),
                                    transform: 'rotate(-10deg)',
                                    display: 'block',
                                    border: `3px solid ${statusColor(contract.status)}`,
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    letterSpacing: '0.08em',
                                }}
                            >
                                {contract.status.toUpperCase()}
                            </Text>
                        </Box>

                        <Box className="doc-totals" style={{ width: '260px' }}>
                            <Flex justify="between" py="2">
                                <Text size="2" style={{ color: '#4b5563' }}>Recurring per cycle</Text>
                                <Text size="2" style={{ color: '#111827' }}>${recurringTotal.toFixed(2)}</Text>
                            </Flex>
                            {contract.termCycles ? (
                                <Flex justify="between" py="2" style={{ borderTop: '2px solid #111827' }}>
                                    <Text size="3" weight="bold" style={{ color: '#111827' }}>Term value (recurring)</Text>
                                    <Text size="4" weight="bold" style={{ color: '#111827' }}>
                                        ${(recurringTotal * contract.termCycles).toFixed(2)}
                                    </Text>
                                </Flex>
                            ) : null}
                        </Box>
                    </Flex>

                    <Box mt="8" style={{ borderTop: '2px solid #d1d5db', paddingTop: '20px' }}>
                        <Text size="2" weight="bold" style={{ color: '#374151', textTransform: 'uppercase' }}>Authorization</Text>
                        <Text as="div" size="2" mt="2" style={{ color: '#111827', lineHeight: 1.5 }}>
                            By signing below, the parties agree to the services, schedule, and terms above. This agreement may be cancelled in writing by either party with reasonable notice unless otherwise stated in the scope.
                        </Text>
                        <Flex mt="6" gap="6" wrap="wrap" justify="between">
                            <Box style={{ flex: 1, minWidth: 200 }}>
                                <Box style={{ borderTop: '1px solid #111827', paddingTop: 6 }}>
                                    <Text size="2" style={{ color: '#374151' }}>Marotto Solutions</Text>
                                </Box>
                            </Box>
                            <Box style={{ flex: 1, minWidth: 200 }}>
                                <Box style={{ borderTop: '1px solid #111827', paddingTop: 6 }}>
                                    <Text size="2" style={{ color: '#374151' }}>{contract.customerName}</Text>
                                </Box>
                            </Box>
                        </Flex>
                    </Box>
                </div>
            </Card>

            <style>{`
              .doc-card { padding: 40px; }
              .doc-table-wrap { overflow-x: auto; }
              @media (max-width: 768px) {
                .doc-card { padding: 18px; }
                .doc-toolbar { align-items: stretch; }
                .doc-toolbar-actions { width: 100%; }
                .doc-toolbar-actions > * { flex: 1 1 calc(50% - 8px); }
                .doc-header { flex-direction: column; gap: 14px; }
                .doc-meta { text-align: left !important; }
                .doc-summary { flex-direction: column; align-items: stretch; gap: 16px; }
                .doc-status { align-self: flex-start; }
                .doc-totals { width: 100% !important; }
              }
              @media print {
                body { background: white; }
                .no-print { display: none !important; }
                .print-container { padding: 0 !important; max-width: none !important; width: 100% !important; margin: 0 !important; }
                .receipt-content { color: black !important; background: white !important; }
                .rt-Card { border: none !important; box-shadow: none !important; background: transparent !important; }
                .receipt-content * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            `}</style>
        </Container>
    );
}
