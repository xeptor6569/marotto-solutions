'use client';

import { useActionState, useDeferredValue, useEffect, useRef, useState, useTransition } from 'react';
import { Box, Button, Callout, Dialog, Flex, Kbd, Text } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight, Eye, SaveIcon, SendIcon, XCircle } from 'lucide-react';
import { createInvoiceAction, createJobAction, type DocumentSaveState } from '@/app/actions';
import type {
    DocumentChoiceGroup,
    DocumentData,
    DocumentFormMode,
    DocumentPackage,
    DocumentPreset,
    JobOption,
    LineItem,
    WorkflowStatus,
} from '@/lib/types';
import { DEFAULT_DOCUMENT_FORM_MODE } from '@/lib/document-form-mode';
import type { ClientOption } from '@/lib/clients';
import type { PaymentMethodOption } from '@/lib/document-form-pickers';
import type { DocumentFormSeed } from '@/lib/document-route-seed';
import type { DocumentPaperContext } from '@/lib/document-paper';
import { formatPhoneInput } from '@/lib/phone-format';
import { documentDisplayTotal } from '@/lib/document-options';
import { applyPresetLineItems, presetMatchesDocumentType } from '@/lib/preset-utils';
import { DOC_LABEL } from '@/lib/document-labels';
import { emptyLineItem, recalcLineItem } from '@/components/DocumentLineItemEditor';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toaster';
import CustomerSection, { type CustomerFields } from '@/components/document-editor/CustomerSection';
import DetailsSection from '@/components/document-editor/DetailsSection';
import ItemsSection, { type PresetApplyMode } from '@/components/document-editor/ItemsSection';
import ReviewSection, { type PaymentOverrideFields, type WarrantyFields } from '@/components/document-editor/ReviewSection';
import EditorPreview from '@/components/document-editor/EditorPreview';

type FormStep = 'customer' | 'details' | 'items' | 'review';

const STEPS: { id: FormStep; label: string }[] = [
    { id: 'customer', label: 'Client' },
    { id: 'details', label: 'Details' },
    { id: 'items', label: 'Items' },
    { id: 'review', label: 'Review' },
];

const initialSaveState: DocumentSaveState = {};

function todayIso(): string {
    return new Date().toISOString().split('T')[0];
}

export default function NewDocumentForm({
    nextNumber,
    type,
    initialData,
    redirectTo,
    clients = [],
    jobs = [],
    paymentMethods = [],
    presets = [],
    seed,
    formMode = DEFAULT_DOCUMENT_FORM_MODE,
    paper,
}: {
    nextNumber: number;
    type: 'invoice' | 'estimate' | 'quote' | 'receipt';
    initialData?: DocumentData;
    redirectTo?: string;
    clients?: ClientOption[];
    jobs?: JobOption[];
    paymentMethods?: PaymentMethodOption[];
    presets?: DocumentPreset[];
    seed?: DocumentFormSeed;
    /** From Settings → Documents. guided = step flow; full = all sections. */
    formMode?: DocumentFormMode;
    /** Letterhead and billing context; enables the live preview. */
    paper?: DocumentPaperContext;
}) {
    const toast = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    const [state, formAction, isPending] = useActionState(createInvoiceAction, initialSaveState);
    const [submitIntent, setSubmitIntent] = useState<'save' | 'save_and_send'>('save');
    const [dirty, setDirty] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [previewOpen, setPreviewOpen] = useState(false);

    const documentFormMode: DocumentFormMode = formMode === 'full' ? 'full' : 'guided';
    const isEditing = Boolean(initialData);
    const docLabel = DOC_LABEL[type];
    const seedJob = seed?.jobId ? jobs.find((j) => j.id === seed.jobId) : undefined;
    const seededJobId = seed?.jobId || initialData?.jobId || initialData?.customer?.jobId || '';
    const seededClientId = seed?.clientId || seedJob?.clientId || initialData?.customer?.clientId || '';
    const seededClient = clients.find((c) => c.id === (seedJob?.clientId || seed?.clientId));

    const [lineItems, setLineItems] = useState<LineItem[]>(
        initialData?.lineItems?.length
            ? initialData.lineItems
            : [{ id: '1', description: 'Service', details: '', quantity: 1, unitPrice: 0, total: 0, pendingClientApproval: false }],
    );
    const [packages, setPackages] = useState<DocumentPackage[]>(initialData?.packages ?? []);
    const [choiceGroups, setChoiceGroups] = useState<DocumentChoiceGroup[]>(initialData?.choiceGroups ?? []);
    const [docStatus, setDocStatus] = useState<DocumentData['status']>(initialData?.status || 'draft');
    const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | undefined>(initialData?.workflowStatus);
    const [selectedClientId, setSelectedClientId] = useState(seededClientId);
    const [selectedJobId, setSelectedJobId] = useState(seededJobId);
    const [jobOptions, setJobOptions] = useState<JobOption[]>(jobs);
    const [jobError, setJobError] = useState('');
    const [isCreatingJob, startCreateJob] = useTransition();
    const payments = initialData?.payments || [];
    const [customer, setCustomer] = useState<CustomerFields>({
        name: initialData?.customer?.name || seededClient?.name || '',
        email: initialData?.customer?.email || seededClient?.email || '',
        phone: formatPhoneInput(initialData?.customer?.phone || seededClient?.phone || ''),
        address: initialData?.customer?.address || seededClient?.address || '',
    });
    const [docTitle, setDocTitle] = useState(initialData?.title || (!initialData && seedJob?.name?.trim()) || '');
    const [docDate, setDocDate] = useState(initialData?.date?.split('T')[0] || todayIso());
    const [dueDate, setDueDate] = useState(initialData?.dueDate?.split('T')[0] || '');
    const [estimatedHours, setEstimatedHours] = useState(
        typeof initialData?.estimatedHours === 'number' ? String(initialData.estimatedHours) : '',
    );
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [step, setStep] = useState<FormStep>('customer');
    const [warranty, setWarranty] = useState<WarrantyFields>({
        enabled: initialData?.warranty?.enabled ?? false,
        title: initialData?.warranty?.title || '',
        text: initialData?.warranty?.text || '',
    });
    const [overrides, setOverrides] = useState<PaymentOverrideFields>({
        customizeMethods: initialData?.paymentOverrides?.customizeMethods ?? false,
        enabledMethods: initialData?.paymentOverrides?.enabledMethods ?? paymentMethods.map((m) => m.key),
        stripeLink: initialData?.paymentOverrides?.stripeLink || '',
        stripeNote: initialData?.paymentOverrides?.stripeNote || '',
    });

    const applicablePresets = presets.filter((preset) => presetMatchesDocumentType(preset, type));
    const jobLocked = Boolean(seed?.jobId);
    const stepIndex = STEPS.findIndex((s) => s.id === step);
    const isProposal = type === 'quote' || type === 'estimate';
    const showSendAction = type !== 'receipt' && docStatus === 'draft';

    const subtotal = isProposal
        ? documentDisplayTotal({ lineItems, packages, choiceGroups, optionSelection: initialData?.optionSelection })
        : lineItems.reduce((acc, item) => acc + item.total, 0);
    const baseSubtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    const grossSubtotal = lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    const discountSavings = Math.max(0, grossSubtotal - baseSubtotal);
    const paidAmount = initialData?.paidAmount ?? payments.reduce((acc, payment) => acc + payment.amount, 0);
    const balanceDue = Math.max(0, subtotal - paidAmount);

    const markDirty = () => setDirty(true);

    // ── Server result: jump to the step that needs fixing (render-time adjustment) and toast it.
    const [handledState, setHandledState] = useState(state);
    if (handledState !== state) {
        setHandledState(state);
        if (state.error && /line item/i.test(state.error)) setStep('items');
        else if (state.error && /client name/i.test(state.error)) setStep('customer');
    }
    useEffect(() => {
        if (state.error) toast({ title: 'Not saved yet', description: state.error, tone: 'error' });
    }, [state, toast]);

    // ── Cmd/Ctrl+S saves without leaving the keyboard.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                if (!isPending) formRef.current?.requestSubmit(saveButtonRef.current ?? undefined);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isPending]);

    // ── Warn before closing the tab with unsaved edits.
    useEffect(() => {
        if (!dirty || isPending) return;
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [dirty, isPending]);

    const fillCustomerFromClient = (client: ClientOption | undefined) => {
        if (!client) return;
        setCustomer({
            name: client.name || '',
            email: client.email || '',
            phone: formatPhoneInput(client.phone || ''),
            address: client.address || '',
        });
    };

    const handleClientChange = (id: string) => {
        setSelectedClientId(id);
        markDirty();
        if (id) fillCustomerFromClient(clients.find((client) => client.id === id));
    };

    const applyJobDefaults = (jobId: string, options: JobOption[] = jobOptions) => {
        setSelectedJobId(jobId);
        markDirty();
        if (!jobId) return;
        const selectedJob = options.find((job) => job.id === jobId);
        if (!selectedJob) return;
        if (selectedJob.clientId) handleClientChange(selectedJob.clientId);
        if (selectedJob.name?.trim()) {
            setDocTitle((current) => (current.trim() ? current : selectedJob.name.trim()));
        }
    };

    const handleCreateJob = (name: string, description: string) => new Promise<boolean>((resolve) => {
        if (!name.trim()) {
            setJobError('Give the job a name');
            resolve(false);
            return;
        }
        setJobError('');
        startCreateJob(async () => {
            const result = await createJobAction({
                name: name.trim(),
                description: description.trim(),
                clientId: selectedClientId || undefined,
            });
            if (!result.success) {
                setJobError(result.error || 'Unable to create job');
                resolve(false);
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
            const nextOptions = [option, ...jobOptions.filter((item) => item.id !== option.id)];
            setJobOptions(nextOptions);
            applyJobDefaults(option.id, nextOptions);
            toast({ title: `Job "${option.name}" created and linked` });
            resolve(true);
        });
    });

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number | boolean) => {
        setLineItems((items) => items.map((item) => (item.id === id ? recalcLineItem(item, field, value) : item)));
    };

    const moveLineItem = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= lineItems.length) return;
        const updated = [...lineItems];
        [updated[index], updated[target]] = [updated[target], updated[index]];
        setLineItems(updated);
        markDirty();
    };

    const applyPreset = (preset: DocumentPreset, mode: PresetApplyMode) => {
        const presetLines = applyPresetLineItems(preset);
        setLineItems((current) => (mode === 'append' ? [...current, ...presetLines] : presetLines));
        if (preset.notes && (mode === 'replace' || !notes.trim())) setNotes(preset.notes);
        if (preset.title && (mode === 'replace' || !docTitle.trim())) setDocTitle(preset.title);
        markDirty();
        toast({
            title: mode === 'append' ? `Added lines from "${preset.name}"` : `Applied "${preset.name}"`,
            tone: 'info',
        });
    };

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

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        // Sections hidden by the guided flow can't show native validation, so check the essentials here.
        if (!customer.name.trim()) {
            event.preventDefault();
            goToStep('customer');
            toast({ title: 'Add the client name first', tone: 'error' });
            return;
        }
        if (!docDate) {
            event.preventDefault();
            goToStep('details');
            toast({ title: 'Pick a document date', tone: 'error' });
        }
    };

    const selectedJobName = jobOptions.find((job) => job.id === selectedJobId)?.name ?? null;
    const draftDoc: DocumentData = {
        id: initialData?.id || `Draft #${nextNumber}`,
        number: initialData?.number || nextNumber,
        type,
        ...(docTitle.trim() ? { title: docTitle.trim() } : {}),
        date: docDate ? new Date(`${docDate}T12:00:00`).toISOString() : new Date().toISOString(),
        ...(dueDate ? { dueDate: new Date(`${dueDate}T12:00:00`).toISOString() } : {}),
        customer: {
            id: selectedClientId || 'draft',
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            jobId: selectedJobId || undefined,
        },
        jobId: selectedJobId || undefined,
        lineItems,
        subtotal,
        total: subtotal,
        notes,
        status: docStatus,
        tags: [],
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payments,
        paidAmount,
        balanceDue,
        ...(warranty.enabled && warranty.text.trim()
            ? { warranty: { enabled: true, title: warranty.title || undefined, text: warranty.text } }
            : {}),
        ...(type === 'invoice' && (overrides.customizeMethods || overrides.stripeLink)
            ? {
                paymentOverrides: {
                    ...(overrides.customizeMethods ? { customizeMethods: true, enabledMethods: overrides.enabledMethods } : {}),
                    ...(overrides.stripeLink ? { stripeLink: overrides.stripeLink, stripeNote: overrides.stripeNote || undefined } : {}),
                },
            }
            : {}),
        ...(isProposal && workflowStatus ? { workflowStatus } : {}),
        ...(isProposal && Number(estimatedHours) > 0 ? { estimatedHours: Number(estimatedHours) } : {}),
        ...(isProposal && packages.length ? { packages } : {}),
        ...(isProposal && choiceGroups.length ? { choiceGroups } : {}),
        ...(initialData?.optionSelection ? { optionSelection: initialData.optionSelection } : {}),
    };
    const previewDoc = useDeferredValue(draftDoc);

    const sectionClass = (id: FormStep) => `document-form-section${step === id ? ' is-active-step' : ''}`;

    return (
        <form
            ref={formRef}
            action={formAction}
            onSubmit={onSubmit}
            onInput={markDirty}
            className={`document-form document-form--${documentFormMode}`}
            data-form-mode={documentFormMode}
            data-preview={paper && showPreview ? 'on' : 'off'}
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

            <div className="editor-layout">
                <div className="editor-main">
                    <Flex align="center" gap="2" wrap="wrap" className="editor-meta">
                        <span className="ui-eyebrow">{docLabel} #{initialData?.number || nextNumber}</span>
                        <StatusBadge kind="document" status={docStatus} />
                        {jobLocked && selectedJobName ? <Text size="1" color="gray">Linked to {selectedJobName}</Text> : null}
                        {dirty && !isPending ? <Text size="1" color="gray" className="editor-unsaved">Unsaved changes</Text> : null}
                        {paper && !showPreview ? (
                            <Button type="button" size="1" variant="ghost" onClick={() => setShowPreview(true)} className="editor-show-preview">
                                <Eye size={13} /> Show preview
                            </Button>
                        ) : null}
                    </Flex>
                    {type === 'estimate' ? (
                        <Text as="p" size="2" color="gray" className="editor-lede">
                            A flexible estimate: totals are indicative until the scope is final. Add packages or material options for alternatives.
                        </Text>
                    ) : null}
                    {type === 'quote' ? (
                        <Text as="p" size="2" color="gray" className="editor-lede">
                            A firm quote: the total is the agreed price for the work described here.
                        </Text>
                    ) : null}

                    {state.error ? (
                        <Callout.Root color="red" mb="4">
                            <Callout.Icon><XCircle size={16} /></Callout.Icon>
                            <Callout.Text>{state.error}</Callout.Text>
                        </Callout.Root>
                    ) : null}

                    <nav className="editor-steps no-print" aria-label="Sections">
                        {STEPS.map((s, i) => (
                            <button
                                key={s.id}
                                type="button"
                                className="editor-step"
                                data-active={step === s.id || undefined}
                                data-complete={documentFormMode === 'guided' && i < stepIndex ? true : undefined}
                                onClick={() => goToStep(s.id)}
                                aria-current={step === s.id ? 'step' : undefined}
                            >
                                <span className="editor-step-index ui-figure">{i + 1}</span>
                                {s.label}
                            </button>
                        ))}
                    </nav>

                    <Flex direction="column" gap="4" className="document-form-body">
                        <Box id="doc-section-customer" className={sectionClass('customer')}>
                            <CustomerSection
                                jobOptions={jobOptions}
                                selectedJobId={selectedJobId}
                                onJobChange={(id) => applyJobDefaults(id)}
                                jobLocked={jobLocked}
                                onCreateJob={handleCreateJob}
                                isCreatingJob={isCreatingJob}
                                jobError={jobError}
                                clients={clients}
                                selectedClientId={selectedClientId}
                                onClientChange={handleClientChange}
                                customer={customer}
                                onCustomerChange={(field, value) => setCustomer((current) => ({
                                    ...current,
                                    [field]: field === 'phone' ? formatPhoneInput(value) : value,
                                }))}
                            />
                        </Box>

                        <Box id="doc-section-details" className={sectionClass('details')}>
                            <DetailsSection
                                type={type}
                                title={docTitle}
                                onTitleChange={setDocTitle}
                                date={docDate}
                                onDateChange={setDocDate}
                                dueDate={dueDate}
                                onDueDateChange={setDueDate}
                                status={docStatus}
                                onStatusChange={setDocStatus}
                                workflowStatus={workflowStatus}
                                onWorkflowStatusChange={setWorkflowStatus}
                                estimatedHours={estimatedHours}
                                onEstimatedHoursChange={setEstimatedHours}
                                notes={notes}
                                onNotesChange={(value) => { setNotes(value); markDirty(); }}
                            />
                        </Box>

                        <Box id="doc-section-items" className={sectionClass('items')}>
                            <Flex direction="column" gap="4">
                                <ItemsSection
                                    type={type}
                                    lineItems={lineItems}
                                    onLineChange={updateLineItem}
                                    onAddLine={() => { setLineItems((items) => [...items, emptyLineItem()]); markDirty(); }}
                                    onRemoveLine={(id) => {
                                        if (lineItems.length > 1) setLineItems((items) => items.filter((item) => item.id !== id));
                                        markDirty();
                                    }}
                                    onMoveLine={moveLineItem}
                                    presets={applicablePresets}
                                    onApplyPreset={applyPreset}
                                    packages={packages}
                                    choiceGroups={choiceGroups}
                                    onPackagesChange={(next) => { setPackages(next); markDirty(); }}
                                    onChoiceGroupsChange={(next) => { setChoiceGroups(next); markDirty(); }}
                                    totals={{ subtotal, baseSubtotal, grossSubtotal, discountSavings }}
                                    title={docTitle}
                                    notes={notes}
                                />
                            </Flex>
                        </Box>

                        <Box id="doc-section-review" className={sectionClass('review')}>
                            <ReviewSection
                                type={type}
                                warranty={warranty}
                                onWarrantyChange={(next) => { setWarranty(next); markDirty(); }}
                                overrides={overrides}
                                onOverridesChange={(next) => { setOverrides(next); markDirty(); }}
                                paymentMethods={paymentMethods}
                                paymentCount={payments.length}
                                paidAmount={paidAmount}
                                balanceDue={balanceDue}
                                subtotal={subtotal}
                                isSaved={isEditing}
                            />
                        </Box>
                    </Flex>

                    <div className="document-form-footer no-print">
                        {documentFormMode === 'guided' ? (
                            <Flex gap="2" className="editor-footer-steps">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    color="gray"
                                    disabled={stepIndex === 0}
                                    onClick={() => goToStep(STEPS[stepIndex - 1].id)}
                                >
                                    <ChevronLeft size={16} /> Back
                                </Button>
                                {stepIndex < STEPS.length - 1 ? (
                                    <Button type="button" variant="soft" onClick={() => goToStep(STEPS[stepIndex + 1].id)}>
                                        {STEPS[stepIndex + 1].label} <ChevronRight size={16} />
                                    </Button>
                                ) : null}
                            </Flex>
                        ) : null}
                        <Flex gap="2" align="center" className="editor-footer-actions">
                            {paper ? (
                                <Button type="button" variant="soft" color="gray" className="editor-preview-button" onClick={() => setPreviewOpen(true)}>
                                    <Eye size={16} /> Preview
                                </Button>
                            ) : null}
                            <Button
                                ref={saveButtonRef}
                                type="submit"
                                name="intent"
                                value="save"
                                variant={showSendAction ? 'soft' : 'solid'}
                                loading={isPending && submitIntent === 'save'}
                                disabled={isPending}
                                onClick={() => setSubmitIntent('save')}
                            >
                                <SaveIcon size={16} /> {isEditing ? 'Save changes' : docStatus === 'draft' ? 'Save draft' : 'Save'}
                                <Kbd size="1" className="editor-kbd">⌘S</Kbd>
                            </Button>
                            {showSendAction ? (
                                <Button
                                    type="submit"
                                    name="intent"
                                    value="save_and_send"
                                    loading={isPending && submitIntent === 'save_and_send'}
                                    disabled={isPending}
                                    onClick={() => setSubmitIntent('save_and_send')}
                                >
                                    <SendIcon size={16} /> Save & send…
                                </Button>
                            ) : null}
                        </Flex>
                    </div>
                </div>

                {paper && showPreview ? (
                    <aside className="editor-preview-pane no-print" aria-label="Live preview">
                        <EditorPreview
                            doc={previewDoc}
                            context={paper}
                            linkedJobName={selectedJobName}
                            onHide={() => setShowPreview(false)}
                        />
                    </aside>
                ) : null}
            </div>

            {paper ? (
                <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
                    <Dialog.Content className="editor-preview-dialog" aria-describedby={undefined}>
                        <Flex justify="between" align="center" mb="3">
                            <Dialog.Title size="3" mb="0">Preview</Dialog.Title>
                            <Dialog.Close>
                                <Button type="button" variant="soft" color="gray">Back to editing</Button>
                            </Dialog.Close>
                        </Flex>
                        <EditorPreview doc={previewDoc} context={paper} linkedJobName={selectedJobName} />
                    </Dialog.Content>
                </Dialog.Root>
            ) : null}
        </form>
    );
}
