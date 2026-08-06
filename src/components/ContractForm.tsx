'use client';

import { useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Callout,
    Card,
    Flex,
    Grid,
    Heading,
    IconButton,
    Table,
    Text,
    TextArea,
    TextField,
} from '@radix-ui/themes';
import { PlusIcon, TrashIcon, SaveIcon, XCircle, ChevronUp, ChevronDown } from 'lucide-react';
import {
    createContractFormAction,
    updateContractFormAction,
} from '@/app/admin/contracts/actions';
import type { ClientOption } from '@/lib/clients';
import type { LeadOption } from '@/lib/leads';
import type { JobOption } from '@/lib/types';
import type {
    ContractIntervalUnit,
    ContractLineKind,
    ContractStatus,
} from '@/lib/types';
import type { ContractRecord } from '@/lib/contracts';

interface ContractFormProps {
    initialData?: ContractRecord;
    error?: string;
    clients: ClientOption[];
    leads: LeadOption[];
    jobs: JobOption[];
    seed?: { clientId?: string; leadId?: string; jobId?: string; title?: string };
}

interface LineRow {
    id: string;
    kind: ContractLineKind;
    description: string;
    details: string;
    quantity: number;
    unitPrice: number;
}

const nativeSelectStyle = { width: '100%', marginTop: 6, borderRadius: 8, minHeight: 36, padding: '0 10px' } as const;

function isoDateInputValue(value: Date | string | null | undefined): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

function defaultLine(): LineRow {
    return {
        id: crypto.randomUUID(),
        kind: 'recurring',
        description: '',
        details: '',
        quantity: 1,
        unitPrice: 0,
    };
}

export default function ContractForm({ initialData, error, clients, leads, jobs, seed }: ContractFormProps) {
    const isEdit = !!initialData;
    const [title, setTitle] = useState(initialData?.title || seed?.title || '');
    const [status, setStatus] = useState<ContractStatus>(initialData?.status || 'active');
    const [customerName, setCustomerName] = useState(initialData?.customerName || '');
    const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail || '');
    const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '');
    const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || '');
    const [intervalUnit, setIntervalUnit] = useState<ContractIntervalUnit>(initialData?.intervalUnit || 'month');
    const [intervalCount, setIntervalCount] = useState(String(initialData?.intervalCount ?? 1));
    const [startDate, setStartDate] = useState(isoDateInputValue(initialData?.startDate) || new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(isoDateInputValue(initialData?.endDate));
    const [termCycles, setTermCycles] = useState(initialData?.termCycles ? String(initialData.termCycles) : '');
    const [autoRenew, setAutoRenew] = useState(!!initialData?.autoRenew);
    const [autoSend, setAutoSend] = useState(!!initialData?.autoSend);
    const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms || 'Net 15');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || seed?.clientId || '');
    const [selectedLeadId, setSelectedLeadId] = useState(initialData?.leadId || seed?.leadId || '');
    const [selectedJobId, setSelectedJobId] = useState(initialData?.jobId || seed?.jobId || '');
    const [lines, setLines] = useState<LineRow[]>(() => {
        if (initialData?.lines?.length) {
            return initialData.lines.map((line) => ({
                id: line.id,
                kind: line.kind,
                description: line.description,
                details: line.details || '',
                quantity: line.quantity,
                unitPrice: line.unitPrice,
            }));
        }
        return [defaultLine()];
    });

    const filteredJobs = useMemo(() => {
        if (selectedClientId) {
            return jobs.filter((job) => !job.clientId || job.clientId === selectedClientId);
        }
        if (selectedLeadId) {
            return jobs.filter((job) => !job.leadId || job.leadId === selectedLeadId);
        }
        return jobs;
    }, [jobs, selectedClientId, selectedLeadId]);

    const recurringTotal = lines
        .filter((line) => line.kind === 'recurring')
        .reduce((acc, line) => acc + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0);

    const handleClientChange = (id: string) => {
        setSelectedClientId(id);
        if (id) {
            setSelectedLeadId('');
            const client = clients.find((c) => c.id === id);
            if (client) {
                if (!customerName) setCustomerName(client.name);
                if (!customerEmail && client.email) setCustomerEmail(client.email);
                if (!customerPhone && client.phone) setCustomerPhone(client.phone);
                if (!customerAddress && client.address) setCustomerAddress(client.address);
            }
        }
    };

    const handleLeadChange = (id: string) => {
        setSelectedLeadId(id);
        if (id) {
            setSelectedClientId('');
            const lead = leads.find((l) => l.id === id);
            if (lead) {
                if (!customerName) setCustomerName(lead.name);
                if (!customerEmail && lead.email) setCustomerEmail(lead.email);
                if (!customerPhone && lead.phone) setCustomerPhone(lead.phone);
                if (!customerAddress && lead.address) setCustomerAddress(lead.address);
            }
        }
    };

    const updateLine = (id: string, patch: Partial<LineRow>) => {
        setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
    };

    const addLine = () => setLines((prev) => [...prev, defaultLine()]);
    const removeLine = (id: string) => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));

    const moveLineUp = (index: number) => {
        if (index === 0) return;
        setLines((prev) => {
            const updated = [...prev];
            [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
            return updated;
        });
    };

    const moveLineDown = (index: number) => {
        if (index === lines.length - 1) return;
        setLines((prev) => {
            const updated = [...prev];
            [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
            return updated;
        });
    };

    return (
        <form action={isEdit ? updateContractFormAction : createContractFormAction}>
            {isEdit ? <input type="hidden" name="id" value={initialData!.id} /> : null}
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="clientId" value={selectedClientId} />
            <input type="hidden" name="leadId" value={selectedLeadId} />
            <input type="hidden" name="jobId" value={selectedJobId} />
            <Flex direction="column" gap="4">
                {error ? (
                    <Callout.Root color="red">
                        <Callout.Icon><XCircle size={16} /></Callout.Icon>
                        <Callout.Text>{error}</Callout.Text>
                    </Callout.Root>
                ) : null}

                <Flex justify="between" align={{ initial: 'start', md: 'center' }} direction={{ initial: 'column', md: 'row' }} gap="3">
                    <Box>
                        <Heading size="5">
                            {isEdit ? `Edit ${initialData!.displayId}` : 'New service contract'}
                        </Heading>
                        {isEdit ? (
                            <Flex mt="2" gap="2" align="center">
                                <Text size="2" color="gray">Status</Text>
                                <Badge color={status === 'active' ? 'green' : status === 'paused' ? 'amber' : status === 'ended' ? 'gray' : 'red'}>
                                    {status}
                                </Badge>
                            </Flex>
                        ) : null}
                    </Box>
                    <Flex gap="2">
                        <Button type="submit" size="2">
                            <SaveIcon size={16} /> {isEdit ? 'Save changes' : 'Create contract'}
                        </Button>
                    </Flex>
                </Flex>

                <Grid columns={{ initial: '1', md: '2' }} gap="4">
                    <Card>
                        <Heading size="3" mb="3">Contract</Heading>
                        <Flex direction="column" gap="3">
                            <Box>
                                <Text as="label" size="2" weight="bold">Title</Text>
                                <TextField.Root
                                    name="title"
                                    placeholder="On-call IT services"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </Box>
                            {isEdit ? (
                                <Box>
                                    <Text as="label" size="2" weight="bold">Status</Text>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as ContractStatus)}
                                        style={nativeSelectStyle}
                                    >
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="ended">Ended</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </Box>
                            ) : null}
                            <Box>
                                <Text as="label" size="2" weight="bold">Payment terms</Text>
                                <TextField.Root
                                    name="paymentTerms"
                                    placeholder="Net 15"
                                    value={paymentTerms}
                                    onChange={(e) => setPaymentTerms(e.target.value)}
                                />
                                <Text size="1" color="gray" as="div" mt="1">
                                    Used to default the invoice due date (e.g. &quot;Net 15&quot; means 15 days from issue).
                                </Text>
                            </Box>
                            <Flex gap="2" wrap="wrap">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                                    <input
                                        type="checkbox"
                                        name="autoRenew"
                                        checked={autoRenew}
                                        onChange={(e) => setAutoRenew(e.target.checked)}
                                    />
                                    Auto-renew at term end
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                                    <input
                                        type="checkbox"
                                        name="autoSend"
                                        checked={autoSend}
                                        onChange={(e) => setAutoSend(e.target.checked)}
                                    />
                                    Auto-send each cycle
                                </label>
                            </Flex>
                            <Box>
                                <Text as="label" size="2" weight="bold">Notes / scope</Text>
                                <TextArea
                                    name="notes"
                                    placeholder="Coverage, response time, exclusions, signatures..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={6}
                                />
                            </Box>
                        </Flex>
                    </Card>

                    <Card>
                        <Heading size="3" mb="3">Schedule</Heading>
                        <Flex direction="column" gap="3">
                            <Grid columns="2" gap="3">
                                <Box>
                                    <Text as="label" size="2" weight="bold">Every</Text>
                                    <TextField.Root
                                        name="intervalCount"
                                        type="number"
                                        inputMode="decimal"
                                        min="1"
                                        value={intervalCount}
                                        onChange={(e) => setIntervalCount(e.target.value)}
                                    />
                                </Box>
                                <Box>
                                    <Text as="label" size="2" weight="bold">Unit</Text>
                                    <select
                                        name="intervalUnit"
                                        value={intervalUnit}
                                        onChange={(e) => setIntervalUnit(e.target.value as ContractIntervalUnit)}
                                        style={nativeSelectStyle}
                                    >
                                        <option value="day">day(s)</option>
                                        <option value="month">month(s)</option>
                                        <option value="year">year(s)</option>
                                    </select>
                                </Box>
                            </Grid>
                            <Grid columns="2" gap="3">
                                <Box>
                                    <Text as="label" size="2" weight="bold">Start date</Text>
                                    <TextField.Root
                                        name="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                    />
                                </Box>
                                <Box>
                                    <Text as="label" size="2" weight="bold">End date (optional)</Text>
                                    <TextField.Root
                                        name="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </Box>
                            </Grid>
                            <Box>
                                <Text as="label" size="2" weight="bold">Term length (cycles)</Text>
                                <TextField.Root
                                    name="termCycles"
                                    type="number"
                                    inputMode="decimal"
                                    min="1"
                                    placeholder="e.g. 12 for one year of monthly billing"
                                    value={termCycles}
                                    onChange={(e) => setTermCycles(e.target.value)}
                                />
                                <Text size="1" color="gray" as="div" mt="1">
                                    Optional. Leave empty for an open-ended retainer.
                                </Text>
                            </Box>
                        </Flex>
                    </Card>
                </Grid>

                <Card>
                    <Heading size="3" mb="3">Customer</Heading>
                    <Flex direction="column" gap="3">
                        {clients.length > 0 ? (
                            <Box>
                                <Text as="label" size="2">Existing client</Text>
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
                        {leads.length > 0 ? (
                            <Box>
                                <Text as="label" size="2">Existing lead/client record</Text>
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
                        {filteredJobs.length > 0 ? (
                            <Box>
                                <Text as="label" size="2">Linked job (optional)</Text>
                                <select
                                    value={selectedJobId}
                                    onChange={(e) => setSelectedJobId(e.target.value)}
                                    style={nativeSelectStyle}
                                >
                                    <option value="">None</option>
                                    {filteredJobs.map((job) => (
                                        <option key={job.id} value={job.id}>
                                            {job.name} ({job.status})
                                        </option>
                                    ))}
                                </select>
                            </Box>
                        ) : null}
                        <Grid columns={{ initial: '1', md: '2' }} gap="3">
                            <Box>
                                <Text as="label" size="2" weight="bold">Name</Text>
                                <TextField.Root
                                    name="customerName"
                                    placeholder="Business or contact name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    required
                                />
                            </Box>
                            <Box>
                                <Text as="label" size="2" weight="bold">Email</Text>
                                <TextField.Root
                                    name="customerEmail"
                                    type="email"
                                    placeholder="ap@business.com"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                />
                            </Box>
                            <Box>
                                <Text as="label" size="2" weight="bold">Phone</Text>
                                <TextField.Root
                                    name="customerPhone"
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                />
                            </Box>
                            <Box>
                                <Text as="label" size="2" weight="bold">Address</Text>
                                <TextArea
                                    name="customerAddress"
                                    rows={2}
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                />
                            </Box>
                        </Grid>
                    </Flex>
                </Card>

                <Card>
                    <Flex justify="between" align="center" mb="3" wrap="wrap" gap="2">
                        <Heading size="3">Recurring line items</Heading>
                        <Heading size="3" color="gray">
                            ${recurringTotal.toFixed(2)} per cycle
                        </Heading>
                    </Flex>
                    <Text size="2" color="gray" as="p" mb="3">
                        Recurring lines are billed automatically each cycle. Usage lines start at qty 0 and need to be filled in before the cycle invoice is sent (auto-send is skipped if any usage lines are present).
                    </Text>
                    <Box style={{ overflowX: 'auto' }}>
                        <Table.Root style={{ minWidth: 720 }}>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell>Kind</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell width="40%">Description</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Qty</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Unit price</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right">Cycle total</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {lines.map((line, index) => {
                                    const cycleTotal = line.kind === 'recurring' ? line.quantity * line.unitPrice : 0;
                                    return (
                                        <Table.Row key={line.id}>
                                            <Table.Cell>
                                                <select
                                                    value={line.kind}
                                                    onChange={(e) => updateLine(line.id, { kind: e.target.value as ContractLineKind })}
                                                    style={{ width: '100%', minHeight: 32, borderRadius: 6, padding: '0 8px' }}
                                                >
                                                    <option value="recurring">Recurring</option>
                                                    <option value="usage">Usage</option>
                                                </select>
                                                <input type="hidden" name={`lines[${index}][kind]`} value={line.kind} />
                                            </Table.Cell>
                                            <Table.Cell>
                                                <TextField.Root
                                                    value={line.description}
                                                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                                    placeholder="Service description"
                                                />
                                                <Box mt="2">
                                                    <TextArea
                                                        value={line.details}
                                                        onChange={(e) => updateLine(line.id, { details: e.target.value })}
                                                        placeholder={
                                                            line.kind === 'usage'
                                                                ? 'Optional notes shown on each cycle invoice (rate per hour, etc.).'
                                                                : 'Optional details: scope, hours included, response SLAs…'
                                                        }
                                                        rows={3}
                                                    />
                                                </Box>
                                                <input type="hidden" name={`lines[${index}][description]`} value={line.description} />
                                                <input type="hidden" name={`lines[${index}][details]`} value={line.details} />
                                            </Table.Cell>
                                            <Table.Cell>
                                                <TextField.Root
                                                    type="number"
                                                    inputMode="decimal"
                                                    min="0"
                                                    step="0.5"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}
                                                />
                                                <input type="hidden" name={`lines[${index}][quantity]`} value={line.quantity} />
                                            </Table.Cell>
                                            <Table.Cell>
                                                <TextField.Root
                                                    type="number"
                                                    inputMode="decimal"
                                                    min="0"
                                                    step="0.01"
                                                    value={line.unitPrice}
                                                    onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) })}
                                                />
                                                <input type="hidden" name={`lines[${index}][unitPrice]`} value={line.unitPrice} />
                                            </Table.Cell>
                                            <Table.Cell align="right">
                                                {line.kind === 'recurring' ? `$${cycleTotal.toFixed(2)}` : <Text size="1" color="gray">usage</Text>}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Flex direction="column" gap="1">
                                                    <IconButton size="1" variant="ghost" disabled={index === 0} onClick={() => moveLineUp(index)}>
                                                        <ChevronUp size={14} />
                                                    </IconButton>
                                                    <IconButton size="1" variant="ghost" disabled={index === lines.length - 1} onClick={() => moveLineDown(index)}>
                                                        <ChevronDown size={14} />
                                                    </IconButton>
                                                </Flex>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Button type="button" variant="ghost" color="red" onClick={() => removeLine(line.id)}>
                                                    <TrashIcon size={16} />
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    <Flex mt="3" justify="between" align="center">
                        <Button type="button" variant="soft" onClick={addLine}>
                            <PlusIcon size={16} /> Add line
                        </Button>
                    </Flex>
                </Card>

                <Flex justify="end" gap="2" wrap="wrap">
                    <Button type="submit" size="2">
                        <SaveIcon size={16} /> {isEdit ? 'Save changes' : 'Create contract'}
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
}
