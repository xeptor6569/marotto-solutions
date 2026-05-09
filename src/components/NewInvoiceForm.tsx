'use client';

import { Heading, Card, Button, Flex, Box, Text, TextField, Grid, Table, TextArea, Badge } from "@radix-ui/themes";
import { PlusIcon, TrashIcon, SaveIcon } from "lucide-react";
import { useState, useTransition } from 'react';
import { createInvoiceAction, createJobAction } from '@/app/actions';
import { DocumentData, LineItem, PaymentEntry, PaymentKind, JobOption } from "@/lib/types";
import { ClientOption } from "@/lib/clients";
import type { LeadOption } from "@/lib/leads";

const nativeSelectStyle = { width: "100%", marginTop: 6, borderRadius: 8, minHeight: 36, padding: "0 10px" } as const;

export default function NewDocumentForm({
    nextNumber,
    type,
    initialData,
    redirectTo,
    clients = [],
    leads = [],
    jobs = [],
}: {
    nextNumber: number,
    type: 'invoice' | 'estimate' | 'quote' | 'receipt',
    initialData?: DocumentData,
    redirectTo?: string,
    clients?: ClientOption[],
    leads?: LeadOption[],
    jobs?: JobOption[],
}) {
    const [lineItems, setLineItems] = useState<LineItem[]>([
        ...(initialData?.lineItems?.length
            ? initialData.lineItems
            : [{ id: '1', description: 'Service', details: '', quantity: 1, unitPrice: 0, total: 0 }])
    ]);

    const currentStatus = initialData?.status || 'draft';
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
    const docLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const notesLabel =
        type === 'estimate' ? 'Project Description' :
        type === 'quote' ? 'Scope & terms' :
        'Notes';
    const actionButtons = type === 'invoice'
        ? [
            { intent: 'draft', label: 'Save Draft', variant: 'soft' as const },
            { intent: 'sent', label: 'Save as Sent', variant: 'solid' as const },
            { intent: 'paid', label: 'Save as Paid', variant: 'outline' as const },
            { intent: 'record_payment', label: 'Record Payment', variant: 'outline' as const },
        ]
        : type === 'estimate'
            ? [
                { intent: 'draft', label: 'Save Draft', variant: 'soft' as const },
                { intent: 'sent', label: 'Save & Finalize', variant: 'solid' as const },
            ]
        : type === 'quote'
            ? [
                { intent: 'draft', label: 'Save Draft', variant: 'soft' as const },
                { intent: 'sent', label: 'Issue quote', variant: 'solid' as const },
            ]
            : [
                { intent: currentStatus, label: `Save ${docLabel}`, variant: 'solid' as const },
            ];

    const addLineItem = () => {
        setLineItems([...lineItems, { id: crypto.randomUUID(), description: '', details: '', quantity: 1, unitPrice: 0, total: 0 }]);
    };

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
        setLineItems(lineItems.map(item => {
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

    const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    const paidAmount = (initialData?.paidAmount ?? payments.reduce((acc, payment) => acc + payment.amount, 0));
    const balanceDue = Math.max(0, subtotal - paidAmount);

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
        setCustomerInputValue('customerPhone', selected.phone || '');
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
        setCustomerInputValue('customerPhone', '');
        setCustomerInputValue('customerAddress', selected.address || '');
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
            setSelectedJobId(option.id);
            setNewJobName('');
            setNewJobDescription('');
        });
    };

    return (
        <form action={createInvoiceAction}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="documentId" value={initialData?.id || ''} />
            <input type="hidden" name="createdAt" value={initialData?.createdAt || ''} />
            <input type="hidden" name="redirectTo" value={redirectTo || `/admin`} />
            <input type="hidden" name="currentStatus" value={currentStatus} />
            <input type="hidden" name="clientId" value={selectedClientId} />
            <input type="hidden" name="leadId" value={selectedLeadId} />
            <input type="hidden" name="jobId" value={selectedJobId} />
            <input type="hidden" name="paymentsJson" value={JSON.stringify(payments)} />
            <input type="hidden" name="paidAmount" value={paidAmount} />
            <input type="hidden" name="balanceDue" value={balanceDue} />
            <Flex direction="column" gap="5">
                <Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'start', md: 'center' }} gap="3">
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
                            <Text size="2" color="gray">Current status</Text>
                            <Badge color={currentStatus === 'paid' ? 'green' : currentStatus === 'sent' ? 'blue' : currentStatus === 'void' ? 'red' : 'orange'}>
                                {currentStatus}
                            </Badge>
                        </Flex>
                    </Box>
                    <input type="hidden" name="number" value={initialData?.number || nextNumber} />
                    <Flex gap="2" wrap="wrap">
                        {actionButtons.map((button) => (
                            <Button key={button.label} type="submit" name="intent" value={button.intent} variant={button.variant} size="2">
                                <SaveIcon size={16} /> {button.label}
                            </Button>
                        ))}
                    </Flex>
                </Flex>

                <Grid columns={{ initial: '1', md: '2' }} gap="4">
                    <Card>
                        <Heading size="3" mb="3">Customer Information</Heading>
                        <Flex direction="column" gap="3">
                            {jobOptions.length > 0 ? (
                                <Box>
                                    <Text as="label" size="2">Select existing job</Text>
                                    <select
                                        value={selectedJobId}
                                        onChange={(e) => setSelectedJobId(e.target.value)}
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
                            {(leads.length > 0 || clients.length > 0) ? (
                                <Text size="1" color="gray">
                                    Link a client record or saved client so documents can be matched to the same person when they sign in later.
                                </Text>
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
                                <TextField.Root name="customerPhone" type="tel" placeholder="Optional" defaultValue={initialData?.customer?.phone} />
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
                        placeholder={type === "estimate"
                            ? "Describe the project scope, material choices, and any assumptions."
                            : type === "quote"
                                ? "State what is included, timing, warranty, payment expectations, or other binding terms."
                                : "Optional notes to include on this document."}
                        rows={type === "estimate" || type === "quote" ? 7 : 4}
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
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeaderCell width="50%">Description</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Qty</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>{type === 'quote' ? 'Unit price' : 'Price'}</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {lineItems.map((item, index) => (
                                <Table.Row key={item.id}>
                                    <Table.Cell>
                                        <TextField.Root
                                            value={item.description}
                                            onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                                            placeholder="Description"
                                        />
                                        <Box mt="2">
                                            <TextArea
                                                value={item.details || ''}
                                                onChange={e => updateLineItem(item.id, 'details', e.target.value)}
                                                placeholder={
                                                    type === 'estimate'
                                                        ? 'Add scope, install approach, material option notes, or client-facing details.'
                                                        : type === 'quote'
                                                            ? 'Optional details: scope, included materials, exclusions, or assumptions.'
                                                            : type === 'invoice'
                                                                ? 'Optional details about this line (work performed, materials, hours, etc.).'
                                                                : 'Optional details to include with this line item.'
                                                }
                                                rows={type === 'estimate' ? 4 : 3}
                                            />
                                        </Box>
                                        {/* Hidden inputs to pass array data to Server Action */}
                                        <input type="hidden" name={`items[${index}][description]`} value={item.description} />
                                        <input type="hidden" name={`items[${index}][details]`} value={item.details || ''} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <TextField.Root
                                            type="number"
                                            min="0"
                                            value={item.quantity}
                                            onChange={e => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                                        />
                                        <input type="hidden" name={`items[${index}][quantity]`} value={item.quantity} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <TextField.Root
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={e => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                                        />
                                        <input type="hidden" name={`items[${index}][unitPrice]`} value={item.unitPrice} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Text>${item.total.toFixed(2)}</Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Button type="button" variant="ghost" color="red" onClick={() => removeLineItem(item.id)}>
                                            <TrashIcon size={16} />
                                        </Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                    <Flex justify="between" align="center" mt="4">
                        <Button type="button" variant="soft" onClick={addLineItem}><PlusIcon size={16} /> Add Item</Button>
                        <Heading size="4">Total: ${subtotal.toFixed(2)}</Heading>
                    </Flex>
                </Card>

                {type === 'invoice' ? (
                    <Card>
                        <Heading size="3" mb="3">Payments</Heading>
                        <Text size="2" color="gray">Paid: ${paidAmount.toFixed(2)} · Balance due: ${balanceDue.toFixed(2)}</Text>
                        {payments.length > 0 ? (
                            <Box mt="3">
                                {payments.map((payment) => (
                                    <Text key={payment.id} as="div" size="2">
                                        {new Date(payment.date).toLocaleDateString()} - ${payment.amount.toFixed(2)} ({payment.kind.replace('_', ' ')})
                                        {payment.receiptId ? ` -> ${payment.receiptId}` : ''}
                                    </Text>
                                ))}
                            </Box>
                        ) : null}
                        <Grid columns={{ initial: '1', md: '2' }} gap="3" mt="3">
                            <Box>
                                <Text as="label" size="2">Amount</Text>
                                <TextField.Root name="paymentAmount" type="number" min="0" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Date</Text>
                                <TextField.Root name="paymentDate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Method</Text>
                                <TextField.Root name="paymentMethod" placeholder="Cash, check, zelle..." value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Payment Type</Text>
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
                            <Text as="label" size="2">Payment Notes</Text>
                            <TextArea name="paymentNotes" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
                        </Box>
                        <Text size="1" color="gray" mt="2" as="p">
                            Use &quot;Record Payment&quot; to save this invoice, append payment history, and auto-create a receipt.
                        </Text>
                    </Card>
                ) : null}
            </Flex>
        </form>
    );
}
