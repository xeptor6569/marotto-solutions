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
    TextArea,
    Badge,
} from '@radix-ui/themes';
import { PlusIcon, SaveIcon, SendIcon, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { createInvoiceAction, createJobAction } from '@/app/actions';
import {
    DocumentChoiceGroup,
    DocumentData,
    DocumentFormMode,
    DocumentPackage,
    LineItem,
    PaymentEntry,
    PaymentKind,
    JobOption,
    PaymentMethodKey,
    WorkflowStatus,
} from '@/lib/types';
import { DEFAULT_DOCUMENT_FORM_MODE } from '@/lib/document-form-mode';
import { ClientOption } from '@/lib/clients';
import type { PaymentMethodOption } from '@/lib/document-form-pickers';
import type { DocumentFormSeed } from '@/lib/document-route-seed';
import { formatPhoneInput } from '@/lib/phone-format';
import {
    DOCUMENT_STATUSES,
    issueActionLabel,
    statusLabel,
    validateRecordPayment,
} from '@/lib/document-save';
import { documentDisplayTotal } from '@/lib/document-options';
import MarkdownEditor from '@/components/MarkdownEditor';
import MarkdownContent from '@/components/MarkdownContent';
import DocumentLineItemEditor, {
    emptyLineItem,
    recalcLineItem,
} from '@/components/DocumentLineItemEditor';
import DocumentOptionsEditor from '@/components/DocumentOptionsEditor';

const nativeSelectStyle = {
    width: '100%',
    marginTop: 6,
    borderRadius: 8,
    minHeight: 36,
    padding: '0 10px',
    fontSize: 16,
} as const;

type FormStep = 'customer' | 'details' | 'items' | 'review';

const STEPS: { id: FormStep; label: string }[] = [
    { id: 'customer', label: 'Customer' },
    { id: 'details', label: 'Details' },
    { id: 'items', label: 'Items' },
    { id: 'review', label: 'Review' },
];

export default function NewDocumentForm({
    nextNumber,
    type,
    initialData,
    redirectTo,
    clients = [],
    jobs = [],
    paymentMethods = [],
    seed,
    formMode = DEFAULT_DOCUMENT_FORM_MODE,
}: {
    nextNumber: number;
    type: 'invoice' | 'estimate' | 'quote' | 'receipt';
    initialData?: DocumentData;
    redirectTo?: string;
    clients?: ClientOption[];
    jobs?: JobOption[];
    paymentMethods?: PaymentMethodOption[];
    seed?: DocumentFormSeed;
    /** From Settings → Documents. guided = step flow; full = all sections. */
    formMode?: DocumentFormMode;
}) {
    const documentFormMode: DocumentFormMode = formMode === 'full' ? 'full' : 'guided';
    const seededJobId = seed?.jobId || initialData?.jobId || initialData?.customer?.jobId || '';
    const seededClientId = seed?.clientId || initialData?.customer?.clientId || '';

    const [lineItems, setLineItems] = useState<LineItem[]>([
        ...(initialData?.lineItems?.length
            ? initialData.lineItems
            : [{ id: '1', description: 'Service', details: '', quantity: 1, unitPrice: 0, total: 0, pendingClientApproval: false }]),
    ]);
    const [packages, setPackages] = useState<DocumentPackage[]>(initialData?.packages ?? []);
    const [choiceGroups, setChoiceGroups] = useState<DocumentChoiceGroup[]>(initialData?.choiceGroups ?? []);

    const [docStatus, setDocStatus] = useState<DocumentData['status']>(initialData?.status || 'draft');
    const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | undefined>(initialData?.workflowStatus);
    const [selectedClientId, setSelectedClientId] = useState(seededClientId);
    const [selectedJobId, setSelectedJobId] = useState(seededJobId);
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
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [step, setStep] = useState<FormStep>('customer');

    const [warrantyEnabled, setWarrantyEnabled] = useState<boolean>(initialData?.warranty?.enabled ?? false);
    const [warrantyTitle, setWarrantyTitle] = useState(initialData?.warranty?.title || '');
    const [warrantyText, setWarrantyText] = useState(initialData?.warranty?.text || '');

    const [customizeMethods, setCustomizeMethods] = useState<boolean>(initialData?.paymentOverrides?.customizeMethods ?? false);
    const [enabledMethodKeys, setEnabledMethodKeys] = useState<PaymentMethodKey[]>(
        initialData?.paymentOverrides?.enabledMethods ?? paymentMethods.map((m) => m.key),
    );
    const [stripeLink, setStripeLink] = useState(initialData?.paymentOverrides?.stripeLink || '');
    const [stripeNote, setStripeNote] = useState(initialData?.paymentOverrides?.stripeNote || '');

    const jobLocked = Boolean(seed?.jobId);
    const stepIndex = STEPS.findIndex((s) => s.id === step);

    useEffect(() => {
        if (!seed?.clientId && !seed?.jobId) return;
        if (seed.jobId) {
            const selectedJob = jobs.find((job) => job.id === seed.jobId);
            if (selectedJob?.clientId) {
                const client = clients.find((c) => c.id === selectedJob.clientId);
                if (client) {
                    setSelectedClientId(client.id);
                    queueMicrotask(() => {
                        setCustomerInputValue('customerName', client.name || '');
                        setCustomerInputValue('customerEmail', client.email || '');
                        setCustomerPhone(formatPhoneInput(client.phone || ''));
                        setCustomerInputValue('customerAddress', client.address || '');
                    });
                }
            }
        } else if (seed.clientId) {
            const client = clients.find((c) => c.id === seed.clientId);
            if (client) {
                queueMicrotask(() => {
                    setCustomerInputValue('customerName', client.name || '');
                    setCustomerInputValue('customerEmail', client.email || '');
                    setCustomerPhone(formatPhoneInput(client.phone || ''));
                    setCustomerInputValue('customerAddress', client.address || '');
                });
            }
        }
        // Only apply seed once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleMethodKey = (key: PaymentMethodKey, on: boolean) => {
        setEnabledMethodKeys((prev) => {
            if (on) return prev.includes(key) ? prev : [...prev, key];
            return prev.filter((k) => k !== key);
        });
    };

    const docLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const notesLabel =
        type === 'estimate' ? 'Project Description' :
        type === 'quote' ? 'Scope & terms' :
        'Notes';
    const showPendingApprovalColumn = type === 'quote' || type === 'estimate';
    const showDocumentOptions = type === 'quote' || type === 'estimate';
    const showPayments = type === 'invoice';
    const showIssueAction = type !== 'receipt' && docStatus === 'draft';
    const issueLabel = issueActionLabel(type);

    const subtotal = showDocumentOptions
        ? documentDisplayTotal({
            lineItems,
            packages,
            choiceGroups,
            optionSelection: initialData?.optionSelection,
        })
        : lineItems.reduce((acc, item) => acc + item.total, 0);
    const baseSubtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    const grossSubtotal = lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    const discountSavings = Math.max(0, grossSubtotal - baseSubtotal);
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

    const handleClientChange = (id: string) => {
        setSelectedClientId(id);
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
        setLineItems([...lineItems, emptyLineItem()]);
    };

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((item) => item.id !== id));
        }
    };

    const moveLineItemUp = (index: number) => {
        if (index === 0) return;
        const updated = [...lineItems];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        setLineItems(updated);
    };

    const moveLineItemDown = (index: number) => {
        if (index === lineItems.length - 1) return;
        const updated = [...lineItems];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        setLineItems(updated);
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number | boolean) => {
        setLineItems(lineItems.map((item) =>
            item.id === id ? recalcLineItem(item, field, value) : item,
        ));
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

    const goToStep = (id: FormStep) => {
        setStep(id);
        if (documentFormMode === 'full') {
            requestAnimationFrame(() => {
                document.getElementById(`doc-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            return;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form
            action={createInvoiceAction}
            className={`document-form document-form--${documentFormMode}`}
            data-form-mode={documentFormMode}
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
            <input type="hidden" name="jobId" value={selectedJobId} />
            <input type="hidden" name="paymentsJson" value={JSON.stringify(payments)} />
            <input type="hidden" name="paidAmount" value={paidAmount} />
            <input type="hidden" name="balanceDue" value={balanceDue} />
            <input type="hidden" name="number" value={initialData?.number || nextNumber} />
            <input type="hidden" name="notes" value={notes} />

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
                        {jobLocked && selectedJobId ? (
                            <Badge color="indigo" variant="soft">Linked to job</Badge>
                        ) : null}
                    </Flex>
                </Box>

                <Box className="document-form-section-nav no-print">
                    <Flex gap="2" wrap="wrap">
                        {STEPS.map((s) => (
                            <Button
                                key={s.id}
                                type="button"
                                size="2"
                                variant={step === s.id ? 'solid' : 'soft'}
                                onClick={() => goToStep(s.id)}
                            >
                                {s.label}
                            </Button>
                        ))}
                    </Flex>
                </Box>

                <Box className="document-form-guided-progress no-print">
                    <Text size="2" weight="bold">
                        Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex]?.label}
                    </Text>
                    <Flex gap="1" mt="2" className="document-form-progress-segments" role="navigation" aria-label="Form steps">
                        {STEPS.map((s, i) => (
                            <button
                                key={s.id}
                                type="button"
                                className={`document-form-progress-segment${i < stepIndex ? ' is-complete' : ''}${i === stepIndex ? ' is-active' : ''}`}
                                onClick={() => goToStep(s.id)}
                                aria-label={`Go to ${s.label}`}
                                aria-current={i === stepIndex ? 'step' : undefined}
                            />
                        ))}
                    </Flex>
                </Box>

                <Box
                    id="doc-section-customer"
                    className={`document-form-section ${step === 'customer' ? 'is-active-step' : ''}`}
                    data-step="customer"
                >
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
                                        disabled={jobLocked}
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
                            {!jobLocked ? (
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
                </Box>

                <Box
                    id="doc-section-details"
                    className={`document-form-section ${step === 'details' ? 'is-active-step' : ''}`}
                    data-step="details"
                >
                    <Grid columns={{ initial: '1', md: '2' }} gap="4">
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
                                <Box>
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
                                {(type === 'estimate' || type === 'quote') ? (
                                    <Box>
                                        <Text as="label" size="1" color="gray">Workflow</Text>
                                        <select
                                            value={workflowStatus || ''}
                                            onChange={(e) => setWorkflowStatus(e.target.value as WorkflowStatus || undefined)}
                                            style={nativeSelectStyle}
                                        >
                                            <option value="">None</option>
                                            <option value="backlog">Backlog</option>
                                            <option value="todo">To Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                        <input type="hidden" name="workflowStatus" value={workflowStatus || ''} />
                                    </Box>
                                ) : null}
                                {(type === 'estimate' || type === 'quote') ? (
                                    <Box>
                                        <Text as="label" size="2">Estimated hours</Text>
                                        <TextField.Root
                                            name="estimatedHours"
                                            type="number"
                                            min="0"
                                            step="0.25"
                                            placeholder="e.g. 8"
                                            defaultValue={
                                                typeof initialData?.estimatedHours === 'number'
                                                    ? String(initialData.estimatedHours)
                                                    : ''
                                            }
                                        />
                                        <Text as="div" size="1" color="gray" mt="1">
                                            Labor time to complete. Rolls up on the linked job.
                                        </Text>
                                    </Box>
                                ) : null}
                            </Flex>
                        </Card>
                        <Card>
                            <Heading size="3" mb="3">{notesLabel}</Heading>
                            <MarkdownEditor
                                value={notes}
                                onChange={setNotes}
                                rows={type === 'estimate' || type === 'quote' ? 7 : 4}
                                placeholder={
                                    type === 'estimate'
                                        ? 'Describe the project scope, material choices, and any assumptions.'
                                        : type === 'quote'
                                            ? 'State what is included, timing, warranty, payment expectations, or other binding terms.'
                                            : 'Optional notes to include on this document.'
                                }
                            />
                        </Card>
                    </Grid>
                </Box>

                <Box
                    id="doc-section-items"
                    className={`document-form-section ${step === 'items' ? 'is-active-step' : ''}`}
                    data-step="items"
                >
                    <Card>
                        <Heading size="3" mb="3">{showDocumentOptions ? 'Base scope' : 'Items'}</Heading>
                        {type === 'quote' ? (
                            <Text size="2" color="gray" mb="3" as="p">
                                Enter the agreed quantities and unit prices — the document total is the decided price for the customer.
                            </Text>
                        ) : null}
                        {showDocumentOptions ? (
                            <Text size="2" color="gray" mb="3" as="p">
                                Shared work that always applies. Add packages and material choices below for alternate approaches.
                            </Text>
                        ) : null}
                        <Flex direction="column" gap="3">
                            {lineItems.map((item, index) => (
                                <DocumentLineItemEditor
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    totalCount={lineItems.length}
                                    namePrefix={`items[${index}]`}
                                    showPendingApproval={showPendingApprovalColumn}
                                    unitPriceLabel={type === 'quote' ? 'Unit price' : 'Price'}
                                    detailsRows={type === 'estimate' ? 4 : 3}
                                    onChange={(field, value) => updateLineItem(item.id, field, value)}
                                    onMoveUp={() => moveLineItemUp(index)}
                                    onMoveDown={() => moveLineItemDown(index)}
                                    onRemove={() => removeLineItem(item.id)}
                                    canRemove={lineItems.length > 1}
                                />
                            ))}
                        </Flex>
                        <Flex justify="between" align="center" mt="4" wrap="wrap" gap="2">
                            <Button type="button" variant="soft" onClick={addLineItem} style={{ minHeight: 44 }}>
                                <PlusIcon size={16} /> Add Item
                            </Button>
                            <Box style={{ textAlign: 'right' }}>
                                {discountSavings > 0 ? (
                                    <>
                                        <Text as="div" size="2" color="gray">Base subtotal: ${grossSubtotal.toFixed(2)}</Text>
                                        <Text as="div" size="2" color="green">Discount savings: −${discountSavings.toFixed(2)}</Text>
                                    </>
                                ) : null}
                                {showDocumentOptions ? (
                                    <Text as="div" size="2" color="gray">Base scope: ${baseSubtotal.toFixed(2)}</Text>
                                ) : null}
                                <Text size="4" weight="bold">
                                    {showDocumentOptions && (packages.length > 0 || choiceGroups.length > 0)
                                        ? `From / selected: $${subtotal.toFixed(2)}`
                                        : `Total: $${subtotal.toFixed(2)}`}
                                </Text>
                            </Box>
                        </Flex>
                    </Card>
                    {showDocumentOptions ? (
                        <DocumentOptionsEditor
                            packages={packages}
                            choiceGroups={choiceGroups}
                            showPendingApproval={showPendingApprovalColumn}
                            unitPriceLabel={type === 'quote' ? 'Unit price' : 'Price'}
                            onPackagesChange={setPackages}
                            onChoiceGroupsChange={setChoiceGroups}
                        />
                    ) : null}
                </Box>

                <Box
                    id="doc-section-review"
                    className={`document-form-section ${step === 'review' ? 'is-active-step' : ''}`}
                    data-step="review"
                >
                    {type === 'invoice' ? (
                        <Card mb="4">
                            <Flex justify="between" align="center" gap="3" wrap="wrap" mb="2">
                                <Heading size="3">Warranty</Heading>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44 }}>
                                    <input
                                        type="checkbox"
                                        name="warrantyEnabled"
                                        checked={warrantyEnabled}
                                        onChange={(e) => setWarrantyEnabled(e.target.checked)}
                                    />
                                    Show warranty section on this invoice
                                </label>
                            </Flex>
                            {warrantyEnabled ? (
                                <Flex direction="column" gap="3">
                                    <Box>
                                        <Text as="label" size="2">Warranty title</Text>
                                        <TextField.Root
                                            name="warrantyTitle"
                                            placeholder="1 Year Workmanship Warranty"
                                            value={warrantyTitle}
                                            onChange={(e) => setWarrantyTitle(e.target.value)}
                                        />
                                    </Box>
                                    <MarkdownEditor
                                        name="warrantyText"
                                        label="Warranty details"
                                        value={warrantyText}
                                        onChange={setWarrantyText}
                                        rows={4}
                                        placeholder="1 Year Workmanship Warranty applies to XYZ. Does not include ABC."
                                    />
                                    {warrantyText.trim() ? (
                                        <Box
                                            style={{
                                                padding: '12px 16px',
                                                border: '1px solid var(--blue-a6)',
                                                borderRadius: 8,
                                                background: 'var(--blue-a2)',
                                            }}
                                        >
                                            <Text size="1" color="gray" mb="1" as="div">Preview as shown on the invoice</Text>
                                            <Text size="2" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                {warrantyTitle.trim() || 'Warranty'}
                                            </Text>
                                            <Box mt="1">
                                                <MarkdownContent>{warrantyText}</MarkdownContent>
                                            </Box>
                                        </Box>
                                    ) : null}
                                </Flex>
                            ) : (
                                <>
                                    <Text size="2" color="gray">Enable to add a customizable warranty statement to this invoice.</Text>
                                    <input type="hidden" name="warrantyTitle" value={warrantyTitle} />
                                    <input type="hidden" name="warrantyText" value={warrantyText} />
                                </>
                            )}
                        </Card>
                    ) : null}

                    {type === 'invoice' ? (
                        <Card mb="4">
                            <Heading size="3" mb="2">Payment Options For This Invoice</Heading>
                            <Text size="2" color="gray" mb="3" as="p">
                                By default this invoice shows all enabled payment methods from Settings. Customize below to override for this invoice only.
                            </Text>
                            <Flex direction="column" gap="3">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44 }}>
                                    <input
                                        type="checkbox"
                                        name="customizePaymentMethods"
                                        checked={customizeMethods}
                                        onChange={(e) => setCustomizeMethods(e.target.checked)}
                                    />
                                    Choose which payment methods appear on this invoice
                                </label>
                                {customizeMethods ? (
                                    <Box>
                                        {paymentMethods.length > 0 ? (
                                            <Flex direction="column" gap="2">
                                                {paymentMethods.map((method) => (
                                                    <label key={method.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44 }}>
                                                        <input
                                                            type="checkbox"
                                                            name={`invoiceMethod.${method.key}`}
                                                            checked={enabledMethodKeys.includes(method.key)}
                                                            onChange={(e) => toggleMethodKey(method.key, e.target.checked)}
                                                        />
                                                        {method.label}
                                                    </label>
                                                ))}
                                            </Flex>
                                        ) : (
                                            <Text size="2" color="gray">No enabled payment methods in Settings yet.</Text>
                                        )}
                                    </Box>
                                ) : null}

                                <Box style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: 12 }}>
                                    <Text as="label" size="2" weight="bold">Stripe payment link (this invoice)</Text>
                                    <Text size="1" color="gray" as="p" mt="1" mb="2">
                                        Overrides the general Stripe link from Settings. Paste a Stripe Checkout/Payment Link.
                                    </Text>
                                    <TextField.Root
                                        name="invoiceStripeLink"
                                        type="url"
                                        placeholder="https://buy.stripe.com/..."
                                        value={stripeLink}
                                        onChange={(e) => setStripeLink(e.target.value)}
                                    />
                                    <Box mt="2">
                                        <Text as="label" size="2">Stripe note (optional)</Text>
                                        <TextField.Root
                                            name="invoiceStripeNote"
                                            placeholder="e.g. 3% processing fee applies"
                                            value={stripeNote}
                                            onChange={(e) => setStripeNote(e.target.value)}
                                        />
                                    </Box>
                                </Box>
                            </Flex>
                        </Card>
                    ) : null}

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
                                        <Button type="button" size="2" variant="soft" onClick={() => applyPaymentFraction(0.25)}>25%</Button>
                                        <Button type="button" size="2" variant="soft" onClick={() => applyPaymentFraction(0.5)}>50%</Button>
                                        <Button type="button" size="2" variant="soft" onClick={() => applyPaymentFraction(1)}>Full balance</Button>
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
                                        style={{ width: '100%', minHeight: 44 }}
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
                    ) : (
                        <Card>
                            <Heading size="3" mb="2">Review</Heading>
                            <Text size="2" color="gray" as="p">
                                Total: <Text weight="bold">${subtotal.toFixed(2)}</Text>
                            </Text>
                            <Text size="2" color="gray" as="p" mt="2">
                                Save or issue from the action bar below. Email the client from the preview page after saving.
                            </Text>
                        </Card>
                    )}
                </Box>
            </Flex>

            <Box className="document-form-footer no-print">
                <Card>
                    {documentFormMode === 'guided' ? (
                        <Flex justify="between" align="center" gap="2" mb="2" className="document-form-footer-steps">
                            <Button
                                type="button"
                                size="2"
                                variant="soft"
                                disabled={stepIndex === 0}
                                onClick={() => goToStep(STEPS[stepIndex - 1].id)}
                                style={{ minHeight: 44 }}
                            >
                                <ChevronLeft size={16} /> Back
                            </Button>
                            {stepIndex < STEPS.length - 1 ? (
                                <Button
                                    type="button"
                                    size="2"
                                    variant="soft"
                                    onClick={() => goToStep(STEPS[stepIndex + 1].id)}
                                    style={{ minHeight: 44 }}
                                >
                                    Next <ChevronRight size={16} />
                                </Button>
                            ) : (
                                <Text size="2" color="gray">Done — save below</Text>
                            )}
                        </Flex>
                    ) : null}
                    <Flex gap="2" wrap="wrap" align="center">
                        <Button type="submit" name="intent" value="save" variant="soft" style={{ flex: '1 1 120px', minHeight: 44 }}>
                            <SaveIcon size={16} /> Save
                        </Button>
                        {showIssueAction ? (
                            <Button type="submit" name="intent" value="save_and_send" variant="solid" style={{ flex: '1 1 160px', minHeight: 44 }}>
                                <SendIcon size={16} /> {issueLabel}
                            </Button>
                        ) : null}
                        {showPayments ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setShowMoreActions((v) => !v)}
                                aria-expanded={showMoreActions}
                                style={{ flex: '0 0 auto', minHeight: 44, minWidth: 44 }}
                            >
                                <MoreHorizontal size={16} />
                            </Button>
                        ) : null}
                    </Flex>
                    {showMoreActions && showPayments ? (
                        <Button type="submit" name="intent" value="mark_paid_without_payment" variant="outline" size="2" mt="2" style={{ width: '100%', minHeight: 44 }}>
                            Mark paid (no payment recorded)
                        </Button>
                    ) : null}
                </Card>
            </Box>

            <style>{`
                .document-form {
                    position: relative;
                    padding-bottom: calc(160px + env(safe-area-inset-bottom, 0px));
                }
                .document-form-section-nav {
                    display: block;
                    position: sticky;
                    top: calc(var(--admin-topbar-h, 64px) + env(safe-area-inset-top, 0px));
                    z-index: 30;
                    padding: 8px 0;
                    background: color-mix(in srgb, var(--color-background) 92%, transparent);
                    backdrop-filter: blur(8px);
                }
                .document-form-section {
                    scroll-margin-top: 120px;
                }
                .document-form-guided-progress {
                    display: none;
                }
                .document-form-progress-segments {
                    width: 100%;
                }
                .document-form-progress-segment {
                    flex: 1;
                    height: 6px;
                    min-height: 24px;
                    border: none;
                    padding: 9px 0;
                    border-radius: 2px;
                    background: var(--gray-a5);
                    background-clip: content-box;
                    cursor: pointer;
                }
                .document-form-progress-segment.is-complete,
                .document-form-progress-segment.is-active {
                    background: var(--accent-9);
                    background-clip: content-box;
                }

                /* Guided: one section at a time + progress; hide full-mode jump pills */
                .document-form--guided .document-form-section {
                    display: none;
                }
                .document-form--guided .document-form-section.is-active-step {
                    display: block;
                }
                .document-form--guided .document-form-section-nav {
                    display: none;
                }
                .document-form--guided .document-form-guided-progress {
                    display: block;
                }

                /* Full page: every section visible; jump nav only */
                .document-form--full .document-form-section {
                    display: block !important;
                }
                .document-form--full .document-form-guided-progress {
                    display: none;
                }

                .document-form-footer {
                    position: fixed;
                    left: 0;
                    right: 0;
                    bottom: var(--admin-bottom-nav-h, env(safe-area-inset-bottom, 0px));
                    z-index: 45;
                    padding: 10px 16px;
                    background: linear-gradient(to top, var(--color-background) 85%, transparent);
                    border-top: 1px solid var(--gray-a5);
                }
                .document-form-footer .rt-Card {
                    max-width: 720px;
                    margin: 0 auto;
                }
                @media (max-width: 959px) {
                    .document-form input,
                    .document-form select,
                    .document-form textarea {
                        font-size: 16px !important;
                    }
                    .document-form--guided {
                        padding-bottom: calc(220px + env(safe-area-inset-bottom, 0px));
                    }
                }
                @media (min-width: 960px) {
                    .document-form {
                        padding-bottom: 100px;
                    }
                    .document-form--guided {
                        padding-bottom: 140px;
                    }
                    .document-form-footer {
                        bottom: 0;
                        padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
                    }
                }
            `}</style>
        </form>
    );
}
