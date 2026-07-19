import { Badge, Box, Card, Container, Flex, Table } from '@radix-ui/themes';
import BackButton from '@/components/BackButton';
import PrintButton from '@/components/PrintButton';
import ShareButton from '@/components/ShareButton';
import {
    ensureContractShareToken,
    getContractProgress,
    summarizeContractCadence,
    summarizeRecurringTotal,
    type ContractRecord,
} from '@/lib/contracts';
import { buildSharePath } from '@/lib/share-token';

interface Props {
    contract: ContractRecord;
    showBackButton?: boolean;
    backHref?: string;
    /** Client-facing share view: print only, no admin actions. */
    publicMode?: boolean;
}

function statusColor(status: ContractRecord['status']): string {
    if (status === 'active') return '#166534';
    if (status === 'paused') return '#92400e';
    if (status === 'ended') return '#374151';
    return '#b91c1c';
}

export default async function ContractPreview({
    contract: initialContract,
    showBackButton = false,
    backHref = '/',
    publicMode = false,
}: Props) {
    const contract = publicMode
        ? initialContract
        : await ensureContractShareToken(initialContract);
    const cadence = summarizeContractCadence(contract);
    const progress = getContractProgress(contract);
    const recurringTotal = summarizeRecurringTotal(contract);
    const sharePath = buildSharePath(contract.shareToken);
    const shareTitle = `Service Contract ${contract.displayId}`;
    const docTitle = 'Service Agreement';

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }} className="print-container">
            <Flex justify="between" mb="4" className="no-print doc-toolbar" gap="2" wrap="wrap">
                {!publicMode && showBackButton ? <BackButton href={backHref} /> : <Box />}
                <Flex gap="2" className="doc-toolbar-actions" wrap="wrap">
                    {!publicMode ? (
                        <ShareButton label={docTitle} sharePath={sharePath} shareTitle={shareTitle} />
                    ) : null}
                    <PrintButton label={docTitle} fileName={`${docTitle} ${contract.displayId}`} />
                </Flex>
            </Flex>

            <Card size="2" className="doc-card print-document">
                <div className="receipt-content">
                    <div className="doc-header">
                        <Box className="doc-brand">
                            <p className="doc-brand-name">MAROTTO</p>
                            <div className="doc-brand-sub">SOLUTIONS</div>
                            <div className="doc-brand-address">
                                <div>28 E Mountain Ridge MHP</div>
                                <div>Wilkes Barre, PA 18702</div>
                                <div>(570) 332-9262</div>
                            </div>
                        </Box>
                        <Box className="doc-meta">
                            <p className="doc-type">{docTitle}</p>
                            <div className="doc-meta-row">
                                <div className="doc-meta-label">Contract #</div>
                                <div className="doc-meta-value">
                                    {contract.title ? `${contract.displayId} - ${contract.title}` : contract.displayId}
                                </div>
                            </div>
                            <div className="doc-meta-row">
                                <div className="doc-meta-label">Status</div>
                                <div className="doc-meta-value" style={{ textTransform: 'capitalize' }}>
                                    {contract.status}
                                </div>
                            </div>
                            <div className="doc-meta-row">
                                <div className="doc-meta-label">Effective</div>
                                <div className="doc-meta-value">{new Date(contract.startDate).toLocaleDateString()}</div>
                            </div>
                            {contract.endDate ? (
                                <div className="doc-meta-row">
                                    <div className="doc-meta-label">Through</div>
                                    <div className="doc-meta-value">{new Date(contract.endDate).toLocaleDateString()}</div>
                                </div>
                            ) : null}
                        </Box>
                    </div>

                    <Box className="doc-parties">
                        <div className="doc-section-label">Service Recipient</div>
                        <div className="doc-party-name">{contract.customerName}</div>
                        {contract.customerAddress ? (
                            <div className="doc-party-detail">{contract.customerAddress}</div>
                        ) : null}
                        {contract.customerEmail ? (
                            <div className="doc-party-detail">{contract.customerEmail}</div>
                        ) : null}
                        {contract.customerPhone ? (
                            <div className="doc-party-detail">{contract.customerPhone}</div>
                        ) : null}
                    </Box>

                    <div className="doc-term-strip">
                        <div className="doc-term-item">
                            <div className="doc-section-label">Cadence</div>
                            <div className="doc-meta-value">{cadence}</div>
                        </div>
                        <div className="doc-term-item">
                            <div className="doc-section-label">Term</div>
                            <div className="doc-meta-value">
                                {contract.termCycles ? `${contract.termCycles} cycles` : 'Open-ended (until cancelled)'}
                                {contract.autoRenew ? ' · auto-renew' : ''}
                            </div>
                        </div>
                        <div className="doc-term-item">
                            <div className="doc-section-label">Progress</div>
                            <div className="doc-meta-value">{progress.progressLabel}</div>
                        </div>
                        {contract.paymentTerms ? (
                            <div className="doc-term-item">
                                <div className="doc-section-label">Payment terms</div>
                                <div className="doc-meta-value">{contract.paymentTerms}</div>
                            </div>
                        ) : null}
                    </div>

                    <Box className="doc-table-wrap">
                        <Table.Root variant="ghost" className="doc-table">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell>Item</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right">Qty</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right">Unit</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right">Per cycle</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {contract.lines.map((line) => {
                                    const lineTotal = line.kind === 'recurring' ? line.quantity * line.unitPrice : 0;
                                    return (
                                        <Table.Row key={line.id}>
                                            <Table.Cell>
                                                <Flex gap="2" align="center" wrap="wrap">
                                                    <span className="doc-line-title">{line.description}</span>
                                                    <Badge size="1" color={line.kind === 'recurring' ? 'blue' : 'amber'}>{line.kind}</Badge>
                                                </Flex>
                                                {line.details ? (
                                                    <div className="doc-line-details" style={{ whiteSpace: 'pre-line' }}>
                                                        {line.details}
                                                    </div>
                                                ) : null}
                                            </Table.Cell>
                                            <Table.Cell align="right">
                                                {line.kind === 'usage' ? 'as-billed' : line.quantity}
                                            </Table.Cell>
                                            <Table.Cell align="right">${line.unitPrice.toFixed(2)}</Table.Cell>
                                            <Table.Cell align="right">
                                                {line.kind === 'recurring' ? `$${lineTotal.toFixed(2)}` : '—'}
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {contract.notes ? (
                        <Box className="doc-section">
                            <div className="doc-section-label">Scope &amp; terms</div>
                            <div className="doc-section-body" style={{ whiteSpace: 'pre-line' }}>
                                {contract.notes}
                            </div>
                        </Box>
                    ) : null}

                    <div className="doc-summary">
                        <Box className="doc-status">
                            <span className="doc-status-mark" style={{ color: statusColor(contract.status) }}>
                                {contract.status.toUpperCase()}
                            </span>
                        </Box>

                        <Box className="doc-totals">
                            <div className="doc-total-row">
                                <span>Recurring per cycle</span>
                                <span>${recurringTotal.toFixed(2)}</span>
                            </div>
                            {contract.termCycles ? (
                                <div className="doc-total-due">
                                    <span>Term value (recurring)</span>
                                    <span className="doc-total-due-amount">
                                        ${(recurringTotal * contract.termCycles).toFixed(2)}
                                    </span>
                                </div>
                            ) : null}
                        </Box>
                    </div>

                    <Box className="doc-auth">
                        <div className="doc-section-label">Authorization</div>
                        <div className="doc-section-note" style={{ marginTop: 4 }}>
                            By signing below, the parties agree to the services, schedule, and terms above. This agreement may be cancelled in writing by either party with reasonable notice unless otherwise stated in the scope.
                        </div>
                        <div className="doc-auth-lines">
                            <div className="doc-auth-line">Marotto Solutions</div>
                            <div className="doc-auth-line">{contract.customerName}</div>
                        </div>
                    </Box>
                </div>
            </Card>
        </Container>
    );
}
