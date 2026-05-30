'use client';

import {
    Heading,
    Card,
    Button,
    Flex,
    Box,
    Text,
    TextField,
    Grid,
    Table,
    TextArea,
    Badge,
    Checkbox,
} from '@radix-ui/themes';
import { PlusIcon, TrashIcon, SaveIcon, SendIcon, MoreHorizontal } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { createInvoiceAction, createJobAction } from '@/app/actions';
import { DocumentData, LineItem, PaymentEntry, PaymentKind, JobOption } from '@/lib/types';
import { ClientOption } from '@/lib/clients';
import type { LeadOption } from '@/lib/leads';
import type { PaymentMethodOption } from '@/lib/document-form-pickers';
import { formatPhoneInput } from '@/lib/phone-format';
import {
    DOCUMENT_STATUSES,
    issueActionLabel,
    statusLabel,
    validateRecordPayment,
} from '@/lib/document-save';

const nativeSelectStyle = { width: '100%', marginTop: 6, borderRadius: 8, minHeight: 36, padding: '0 10px' } as const;

export default function NewDocumentForm({
    nextNumber,
    type,
    initialData,
    redirectTo,
    clients = [],
    leads = [],
    jobs = [],
    paymentMethods = [],
}: {
    nextNumber: number;
    type: 'invoice' | 'estimate' | 'quote' | 'receipt';
    initialData?: DocumentData;
    redirectTo?: string;
    clients?: ClientOption[];
    leads?: LeadOption[];
    jobs?: JobOption[];
    paymentMethods?: PaymentMethodOption[];
}) {
    const [lineItems, setLineItems] = useState<LineItem[]>([
        ...(initialData?.lineItems?.length
            ? initialData.lineItems
            : [{ id: '1', description: 'Service', details: '', quantity: 1, unitPrice: 0, total: 0, pendingClientApproval: false }]),
    ]);

    const [docStatus, setDocStatus] = useState<DocumentData['status']>(initialData?.status || 'draft');
    const [selectedClientId, setSelectedClientId] = useState(initialData?.customer?.clientId || '');
    const [selectedLeadId, setSelectedLeadId] = useState(initialData?.customer?.leadId || '');
    const [selectedJobId, setSelectedJobId] = useState(initialData?.jobId || initialData?.customer?.jobId || '');
    const [jobOptions, setJobOptions] = useState<JobOption[]>(jobs);
    const [newJobName, setNewJobName] = useState('');
    const [newJobDescription, setNewJobDescription] = useState('');
    const [jobError, setJobError] = useState('');
    const [isCreatingJob, startCreateJob] = useTransition();
    const [payments] = useState<PaymentEntry[]>(initialData?.payments || []);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentKind, setPaymentKind] = useState<PaymentKind>('partial');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentError, setPaymentError] = useState('');
    const [showMoreActions, setShowMoreActions] = useState(false);
    const [customerPhone, setCustomerPhone] = useState(() =>
        formatPhoneInput(initialData?.customer?.phone || ''),
    );

    const docLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const notesLabel =
        type === 'estimate' ? 'Project Description' :
        type === 'quote' ? 'Scope & terms' :
        'Notes';
    const showPendingApprovalColumn = type === 'quote' || type === 'estimate';
    const showPayments = type === 'invoice';
    const showIssueAction = type !== 'receipt' && docStatus === 'draft';
    const issueLabel = issueActionLabel(type);

    const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    const paidAmount = initialData?.paidAmount ?? payments.reduce((acc, payment) => acc + payment.amount, 0);
    const balanceDue = Math.max(0, subtotal - paidAmount);

    useEffect(() => {
        if (!paymentAmount && balanceDue > 0) {
            setPaymentAmount(balanceDue.toFixed(2));
        }
    }, [balanceDue, paymentAmount]);

    const setCustomerInputValue = (name: string, value: string) => {
        const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
        if (input) input.value = value;
    };

    const handleLeadChange = (id: string) => {
        setSelectedLeadId(id);
        setSelectedClientId('');
        if (!id) return;
        const selected = leads.find((lead) => lead.id === id);
        if (!selected) return;
        setCustomerInputValue('customerName', selected.name || '');
        setCustomerInputValue('customerEmail', selected.email || '');
        setCustomerPhone(formatPhoneInput(selected.phone || ''));
        setCustomerInputValue('customerAddress', selected.address || '');
    };

    const handleClientChange = (id: string) => {
        setSelectedClientId(id);
        setSelectedLeadId('');
        if (!id) return;
        const selected = clients.find((client) => client.id === id);
        if (!selected) return;
        setCustomerInputValue('customerName', selected.name || '');
        setCustomerInputValue('customerEmail', selected.email || '');
        setCustomerPhone(formatPhoneInput(selected.phone || ''));
        setCustomerInputValue('customerAddress', selected.address || '');
    };

    const applyJobDefaults = (jobId: string) => {
        setSelectedJobId(jobId);
        if (!jobId) return;
        const selectedJob = jobOptions.find((job) => job.id === jobId);
        if (!selectedJob) return;
        if (selectedJob.clientId) {
            handleClientChange(selectedJob.clientId);
            return;
        }
        if (selectedJob.leadId) {
            handleLeadChange(selectedJob.leadId);
        }
    };

    const handleCreateJob = () => {
        const name = newJobName.trim();
        if (!name) {
            setJobError('Job name is required');
            return;
        }
        setJobError('');
        startCreateJob(async () => {
            const result = await createJobAction({
                name,
                description: newJobDescription.trim(),
                clientId: selectedClientId || undefined,
                leadId: selectedLeadId || undefined,
            });
            if (!result.success) {
                setJobError(result.error || 'Unable to create job');
                return;
            }
            const created = result.job;
            const option: JobOption = {
                id: created.id,
                name: created.name,
                status: created.status,
                clientId: created.clientId,
                leadId: created.leadId,
            };
            setJobOptions((prev) => [option, ...prev.filter((item) => item.id !== option.id)]);
            applyJobDefaults(option.id);
            setNewJobName('');
            setNewJobDescription('');
        });
    };

    const addLineItem = () => {
        setLineItems([...lineItems, {
            id: crypto.randomUUID(),
            description: '',
            details: '',
            quantity: 1,
            unitPrice: 0,
            total: 0,
            pendingClientApproval: false,
        }]);
    };

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((item) => item.id !== id));
        }
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number | boolean) => {
        setLineItems(lineItems.map((item) => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updated.total = Number(updated.quantity) * Number(updated.unitPrice);
                }
                return updated;
            }
            return item;
        }));
    };

    const applyPaymentFraction = (fraction: number) => {
        const amount = Math.min(balanceDue, Math.max(0, balanceDue * fraction));
        setPaymentAmount(amount.toFixed(2));
        setPaymentError('');
    };

    const validatePaymentBeforeSubmit = () => {
        const amount = Number(paymentAmount);
        const err = validateRecordPayment(amount, balanceDue);
        setPaymentError(err || '');
        return !err;
    };

    const statusBadgeColor =
        docStatus === 'paid' ? 'green' :
        docStatus === 'sent' ? 'blue' :
        docStatus === 'void' ? 'red' : 'orange';

    return (
        <form
            action={createInvoiceAction}
            className="document-form"
            onSubmit={(e) => {
                const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                const intent = submitter?.value;
                if (intent === 'record_payment' && !validatePaymentBeforeSubmit()) {
                    e.preventDefault();
                }
            }}
        >
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="documentId" value={initialData?.id || ''} />
            <input type="hidden" name="createdAt" value={initialData?.createdAt || ''} />
            <input type="hidden" name="redirectTo" value={redirectTo || '/admin'} />
            <input type="hidden" name="currentStatus" value={initialData?.status || 'draft'} />
            <input type="hidden" name="status" value={docStatus} />
            <input type="hidden" name="clientId" value={selectedClientId} />
            <input type="hidden" name="leadId" value={selectedLeadId} />
            <input type="hidden" name="jobId" value={selectedJobId} />
            <input type="hidden" name="paymentsJson" value={JSON.stringify(payments)} />
            <input type="hidden" name="paidAmount" value={paidAmount} />
            <input type="hidden" name="balanceDue" value={balanceDue} />
            <input type="hidden" name="number" value={initialData?.number || nextNumber} />

            <Flex direction="column" gap="5" className="document-form-body">
                <Box>
                    <Heading>
                        {initialData ? 'Edit' : 'New'} {docLabel} #{initialData?.number || nextNumber}
                    </Heading>
                    {type === 'estimate' ? (
                        <Text size="2" color="gray" mt="2" style={{ maxWidth: 520 }}>
                            Flexible estimate — line items can include options; totals are indicative until scope is finalized.
                        </Text>
                    ) : null}
                    {type === 'quote' ? (
                        <Text size="2" color="gray" mt="2" style={{ maxWidth: 520 }}>
                            Firm quote — the total is the agreed price for the work you describe here and in the line items.
                        </Text>
                    ) : null}
                    <Flex mt="2" gap="2" wrap="wrap" align="center">
                        <Text size="2" color="gray">Status</Text>
                        <Badge color={statusBadgeColor}>{statusLabel(docStatus)}</Badge>
                    </Flex>
                </Box>

                <Grid columns={{ initial: '1', md: '2' }} gap="4">
                    <Card>
                        <Heading size="3" mb="3">Customer Information</Heading>
                        <Flex direction="column" gap="3">
                            {jobOptions.length > 0 ? (
                                <Box>
                                    <Text as="label" size="2">Select existing job</Text>
                                    <select
                                        value={selectedJobId}
                                        onChange={(e) => applyJobDefaults(e.target.value)}
                                        style={nativeSelectStyle}
                                    >
                                        <option value="">None</option>
                                        {jobOptions.map((job) => (
                                            <option key={job.id} value={job.id}>
                                                {job.name} ({job.status})
                                            </option>
                                        ))}
                                    </select>
                                </Box>
                            ) : null}
                            <Box>
                                <Text as="label" size="2">Quick create job</Text>
                                <Flex mt="1" gap="2" direction={{ initial: 'column', sm: 'row' }}>
                                    <TextField.Root
                                        placeholder="Job name"
                                        value={newJobName}
                                        onChange={(e) => setNewJobName(e.target.value)}
                                    />
                                    <Button type="button" variant="soft" onClick={handleCreateJob} disabled={isCreatingJob}>
                                        {isCreatingJob ? 'Creating...' : 'Create Job'}
                                    </Button>
                                </Flex>
                                <TextArea
                                    mt="2"
                                    placeholder="Optional job description"
                                    rows={2}
                                    value={newJobDescription}
                                    onChange={(e) => setNewJobDescription(e.target.value)}
                                />
                                {jobError ? <Text as="p" size="1" color="red" mt="1">{jobError}</Text> : null}
                            </Box>
                            {leads.length > 0 ? (
                                <Box>
                                    <Text as="label" size="2">Select existing client record</Text>
                                    <select
                                        value={selectedLeadId}
                                        onChange={(e) => handleLeadChange(e.target.value)}
                                        style={nativeSelectStyle}
                                    >
                                        <option value="">None</option>
                                        {leads.map((lead) => (
                                            <option key={lead.id} value={lead.id}>
                                                #{lead.number} — {lead.name}{lead.email ? ` (${lead.email})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </Box>
                            ) : null}
                            {clients.length > 0 ? (
                                <Box>
                                    <Text as="label" size="2">Select existing client</Text>
                                    <select
                                        value={selectedClientId}
                                        onChange={(e) => handleClientChange(e.target.value)}
                                        style={nativeSelectStyle}
                                    >
                                        <option value="">None</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </Box>
                            ) : null}
                            <Box>
                                <Text as="label" size="2">Name</Text>
                                <TextField.Root name="customerName" placeholder="Client Name" defaultValue={initialData?.customer?.name} required />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Email</Text>
                                <TextField.Root name="customerEmail" type="email" placeholder="client@example.com" defaultValue={initialData?.customer?.email} />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Phone</Text>
                                <TextField.Root
                                    name="customerPhone"
                                    type="tel"
                                    placeholder="(555) 123-4567"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(formatPhoneInput(e.target.value))}
                                    inputMode="tel"
                                    autoComplete="tel"
                                />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Address</Text>
                                <TextArea name="customerAddress" placeholder="Street, City, Zip" defaultValue={initialData?.customer?.address} />
                            </Box>
                        </Flex>
                    </Card>

                    <Card>
                        <Heading size="3" mb="3">Details</Heading>
                        <Flex direction="column" gap="3">
                            <Box>
                                <Text as="label" size="2">Date</Text>
                                <TextField.Root name="date" type="date" defaultValue={initialData?.date?.split('T')[0] || new Date().toISOString().split('T')[0]} required />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Due Date</Text>
                                <TextField.Root name="dueDate" type="date" defaultValue={initialData?.dueDate?.split('T')[0]} />
                            </Box>
                        </Flex>
                    </Card>
                </Grid>

                <Card>
                    <Heading size="3" mb="3">{notesLabel}</Heading>
                    <TextArea
                        name="notes"
                        placeholder={
                            type === 'estimate'
                                ? 'Describe the project scope, material choices, and any assumptions.'
                                : type === 'quote'
                                    ? 'State what is included, timing, warranty, payment expectations, or other binding terms.'
                                    : 'Optional notes to include on this document.'
                        }
                        rows={type === 'estimate' || type === 'quote' ? 7 : 4}
                        defaultValue={initialData?.notes}
                    />
                </Card>

                <Card>
                    <Heading size="3" mb="3">Items</Heading>
                    {type === 'quote' ? (
                        <Text size="2" color="gray" mb="3" as="p">
                            Enter the agreed quantities and unit prices — the document total is the decided price for the customer.
                        </Text>
                    ) : null}
                    <Box style={{ overflowX: 'auto' }}>
                        <Table.Root style={{ minWidth: 560 }}>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell width={showPendingApprovalColumn ? '42%' : '50%'}>Description</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Qty</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>{type === 'quote' ? 'Unit price' : 'Price'}</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
                                    {showPendingApprovalColumn ? (
                                        <Table.ColumnHeaderCell align="center">Needs approval</Table.ColumnHeaderCell>
                                    ) : null}
                                    <Table.ColumnHeaderCell />
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {lineItems.map((item, index) => (
                                    <Table.Row key={item.id}>
                                        <Table.Cell>
                                            <TextField.Root
                                                value={item.description}
                                                onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                placeholder="Description"
                                            />
                                            <Box mt="2">
                                                <TextArea
                                                    value={item.details || ''}
                                                    onChange={(e) => updateLineItem(item.id, 'details', e.target.value)}
                                                    rows={type === 'estimate' ? 4 : 3}
                                                />
                                            </Box>
                                            <input type="hidden" name={`items[${index}][id]`} value={item.id} />
                                            <input type="hidden" name={`items[${index}][description]`} value={item.description} />
                                            <input type="hidden" name={`items[${index}][details]`} value={item.details || ''} />
                                            <input
                                                type="hidden"
                                                name={`items[${index}][pendingClientApproval]`}
                                                value={showPendingApprovalColumn && item.pendingClientApproval ? '1' : '0'}
                                            />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <TextField.Root
                                                type="number"
                                                min="0"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    const n = parseFloat(v);
                                                    updateLineItem(item.id, 'quantity', v === '' ? 0 : Number.isFinite(n) ? Math.max(0, n) : 0);
                                                }}
                                            />
                                            <input type="hidden" name={`items[${index}][quantity]`} value={item.quantity} />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <TextField.Root
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    const n = parseFloat(v);
                                                    updateLineItem(item.id, 'unitPrice', v === '' ? 0 : Number.isFinite(n) ? Math.max(0, n) : 0);
                                                }}
                                            />
                                            <input type="hidden" name={`items[${index}][unitPrice]`} value={item.unitPrice} />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Text>${item.total.toFixed(2)}</Text>
                                        </Table.Cell>
                                        {showPendingApprovalColumn ? (
                                            <Table.Cell align="center">
                                                <Checkbox
                                                    checked={item.pendingClientApproval === true}
                                                    onCheckedChange={(v) => updateLineItem(item.id, 'pendingClientApproval', v === true)}
                                                />
                                            </Table.Cell>
                                        ) : null}
                                        <Table.Cell>
                                            <Button type="button" variant="ghost" color="red" onClick={() => removeLineItem(item.id)}>
                                                <TrashIcon size={16} />
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    <Flex justify="between" align="center" mt="4" wrap="wrap" gap="2">
                        <Button type="button" variant="soft" onClick={addLineItem}><PlusIcon size={16} /> Add Item</Button>
                        <Text size="4" weight="bold">Total: ${subtotal.toFixed(2)}</Text>
                    </Flex>
                </Card>

                {showPayments ? (
                    <Card>
                        <Flex justify="between" align="start" gap="3" wrap="wrap" mb="3">
                            <Heading size="3">Payments</Heading>
                            <Box style={{ textAlign: 'right' }}>
                                <Text size="1" color="gray">Balance due</Text>
                                <Text as="div" size="6" weight="bold" style={{ color: balanceDue > 0 ? '#b91c1c' : '#166534' }}>
                                    ${balanceDue.toFixed(2)}
                                </Text>
                                <Text size="1" color="gray">
                                    Paid ${paidAmount.toFixed(2)} of ${subtotal.toFixed(2)}
                                </Text>
                            </Box>
                        </Flex>

                        {payments.length > 0 ? (
                            <Flex direction="column" gap="1" mb="3">
                                {payments.map((payment) => (
                                    <Text key={payment.id} size="2" color="gray">
                                        {new Date(payment.date).toLocaleDateString()} — ${payment.amount.toFixed(2)} ({payment.kind.replace('_', ' ')})
                                        {payment.receiptId ? ` · ${payment.receiptId}` : ''}
                                    </Text>
                                ))}
                            </Flex>
                        ) : null}

                        {balanceDue > 0 ? (
                            <>
                                <Flex gap="2" wrap="wrap" mb="3">
                                    <Button type="button" size="1" variant="soft" onClick={() => applyPaymentFraction(0.25)}>25%</Button>
                                    <Button type="button" size="1" variant="soft" onClick={() => applyPaymentFraction(0.5)}>50%</Button>
                                    <Button type="button" size="1" variant="soft" onClick={() => applyPaymentFraction(1)}>Full balance</Button>
                                </Flex>
                                <Grid columns={{ initial: '1', md: '2' }} gap="3">
                                    <Box>
                                        <Text as="label" size="2">Amount</Text>
                                        <TextField.Root
                                            name="paymentAmount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={paymentAmount}
                                            onChange={(e) => {
                                                setPaymentAmount(e.target.value);
                                                setPaymentError('');
                                            }}
                                        />
                                    </Box>
                                    <Box>
                                        <Text as="label" size="2">Date</Text>
                                        <TextField.Root name="paymentDate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                                    </Box>
                                    <Box>
                                        <Text as="label" size="2">Method</Text>
                                        {paymentMethods.length > 0 ? (
                                            <select
                                                name="paymentMethod"
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                style={nativeSelectStyle}
                                            >
                                                <option value="">Select method</option>
                                                {paymentMethods.map((method) => (
                                                    <option key={method.key} value={method.label}>{method.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <TextField.Root
                                                name="paymentMethod"
                                                placeholder="Cash, check, Zelle..."
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                            />
                                        )}
                                    </Box>
                                    <Box>
                                        <Text as="label" size="2">Payment type</Text>
                                        <select
                                            name="paymentKind"
                                            value={paymentKind}
                                            onChange={(e) => setPaymentKind(e.target.value as PaymentKind)}
                                            style={nativeSelectStyle}
                                        >
                                            <option value="partial">Partial payment</option>
                                            <option value="down_payment">Down payment</option>
                                            <option value="final">Final payment</option>
                                        </select>
                                    </Box>
                                </Grid>
                                <Box mt="3">
                                    <Text as="label" size="2">Payment notes</Text>
                                    <TextArea name="paymentNotes" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2} />
                                </Box>
                                {paymentError ? <Text size="2" color="red" mt="2">{paymentError}</Text> : null}
                                <Button
                                    type="submit"
                                    name="intent"
                                    value="record_payment"
                                    variant="solid"
                                    mt="3"
                                    style={{ width: '100%' }}
                                    onClick={() => validatePaymentBeforeSubmit()}
                                >
                                    Record payment &amp; save
                                </Button>
                                <Text size="1" color="gray" mt="2" as="p">
                                    Saves the invoice, records this payment, and creates a receipt automatically.
                                </Text>
                            </>
                        ) : (
                            <Text size="2" color="gray">This invoice is fully paid.</Text>
                        )}
                    </Card>
                ) : null}
            </Flex>

            <Box className="document-form-footer no-print">
                <Card>
                    <Flex direction="column" gap="3">
                        <Flex gap="2" wrap="wrap" align="center">
                            <Box style={{ minWidth: 140, flex: '1 1 140px' }}>
                                <Text as="label" size="1" color="gray">Status</Text>
                                <select
                                    value={docStatus}
                                    onChange={(e) => setDocStatus(e.target.value as DocumentData['status'])}
                                    style={nativeSelectStyle}
                                >
                                    {DOCUMENT_STATUSES.map((s) => (
                                        <option key={s} value={s}>{statusLabel(s)}</option>
                                    ))}
                                </select>
                            </Box>
                            <Button type="submit" name="intent" value="save" variant="soft" style={{ flex: '1 1 120px' }}>
                                <SaveIcon size={16} /> Save
                            </Button>
                            {showIssueAction ? (
                                <Button type="submit" name="intent" value="save_and_send" variant="solid" style={{ flex: '1 1 160px' }}>
                                    <SendIcon size={16} /> {issueLabel}
                                </Button>
                            ) : null}
                            {showPayments ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowMoreActions((v) => !v)}
                                    aria-expanded={showMoreActions}
                                    style={{ flex: '0 0 auto' }}
                                >
                                    <MoreHorizontal size={16} />
                                </Button>
                            ) : null}
                        </Flex>
                        {showMoreActions && showPayments ? (
                            <Button type="submit" name="intent" value="mark_paid_without_payment" variant="outline" size="2">
                                Mark paid (no payment recorded)
                            </Button>
                        ) : null}
                    </Flex>
                </Card>
            </Box>

            <style>{`
                .document-form {
                    position: relative;
                    padding-bottom: 120px;
                }
                .document-form-footer {
                    position: fixed;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 20;
                    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
                    background: linear-gradient(to top, var(--color-background) 85%, transparent);
                    border-top: 1px solid var(--gray-a5);
                }
                .document-form-footer .rt-Card {
                    max-width: 720px;
                    margin: 0 auto;
                }
                @media (min-width: 768px) {
                    .document-form {
                        padding-bottom: 100px;
                    }
                }
            `}</style>
        </form>
    );
}
