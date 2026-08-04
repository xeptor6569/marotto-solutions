import { Badge, Box, Button, Card, Container, Flex, Table, Text } from "@radix-ui/themes";
import Link from "next/link";
import type {
    AppConfig,
    DocumentData,
    LineItem,
    PaymentMethodKey,
    PaymentMethodEntry,
} from "@/lib/types";
import { workflowStatusLabel, workflowStatusColor } from "@/lib/workflow-status";
import {
    Banknote,
    Building2,
    CircleDollarSign,
    CreditCard,
    HandCoins,
    Landmark,
    Smartphone,
    Wallet,
} from "lucide-react";
import { getAppConfig } from "@/lib/config";
import { ensureDocumentShareToken } from "@/lib/data";
import { DOC_LABEL } from "@/lib/document-labels";
import { paymentLinkForMethod, paymentMethodUsesManualDetails } from "@/lib/payment-links";
import {
    agreedScopeLineTotal,
    hasPendingApprovalLines,
    pendingApprovalLineTotal,
    pendingApprovalSummarySentence,
} from "@/lib/pending-client-approval";
import {
    choiceTotal,
    documentHasOptions,
    isOptionSelectionComplete,
    lineItemsTotal,
    packageTotal,
    resolveSelectedLineItems,
    startingFromTotal,
} from "@/lib/document-options";
import { auth } from "@/lib/auth";
import { buildSharePath } from "@/lib/share-token";
import { getJobById } from "@/lib/jobs";
import PrintButton from "@/components/PrintButton";
import ShareButton from "@/components/ShareButton";
import EmailDocumentButton from "@/components/EmailDocumentButton";
import CreateDepositInvoiceButton from "@/components/CreateDepositInvoiceButton";
import ConvertDocumentButton from "@/components/ConvertDocumentButton";
import SaveAsPresetButton from "@/components/SaveAsPresetButton";
import BackButton from "@/components/BackButton";
import DocumentPreviewActions from "@/components/DocumentPreviewActions";
import DocumentOptionSelectionForm from "@/components/DocumentOptionSelectionForm";
import MarkdownContent from "@/components/MarkdownContent";
import { depositBillingBase } from "@/lib/deposit-invoice";
import { convertTargets } from "@/lib/convert-document";
import { formatHours } from "@/lib/job-estimated-hours";

function LineItemsTable({ items }: { items: LineItem[] }) {
    if (!items.length) {
        return <Text size="2" color="gray">No line items.</Text>;
    }
    return (
        <Box className="doc-table-wrap">
            <Table.Root variant="ghost" className="doc-table">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell align="right">Qty</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell align="right">Unit</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell align="right">Amount</Table.ColumnHeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {items.map((item) => (
                        <Table.Row key={item.id}>
                            <Table.Cell>
                                <Flex align="center" gap="2" wrap="wrap">
                                    <span className="doc-line-title">{item.description}</span>
                                    {item.discountPercent ? (
                                        <Badge color="green" size="1">{item.discountPercent}% off</Badge>
                                    ) : null}
                                    {item.pendingClientApproval ? (
                                        <Badge color="amber" size="1">Pending your approval</Badge>
                                    ) : null}
                                </Flex>
                                {item.details ? (
                                    <Box className="doc-line-details">
                                        <MarkdownContent>{item.details}</MarkdownContent>
                                    </Box>
                                ) : null}
                            </Table.Cell>
                            <Table.Cell align="right">{item.quantity ?? 0}</Table.Cell>
                            <Table.Cell align="right">${(Number(item.unitPrice) || 0).toFixed(2)}</Table.Cell>
                            <Table.Cell align="right">
                                {item.discountPercent ? (
                                    <Box>
                                        <Text as="div" size="1" style={{ color: "#9ca3af", textDecoration: "line-through" }}>
                                            ${((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                                        </Text>
                                        <span className="doc-line-title">${(Number(item.total) || 0).toFixed(2)}</span>
                                    </Box>
                                ) : (
                                    <>${(Number(item.total) || 0).toFixed(2)}</>
                                )}
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}

function getStatusColor(status: DocumentData["status"]) {
    if (status === "paid") return "#166534";
    if (status === "void") return "#b91c1c";
    if (status === "sent") return "#1d4ed8";
    return "#92400e";
}

function getDisplayName(doc: DocumentData) {
    return doc.title ? `${doc.id} — ${doc.title}` : doc.id;
}

function buildInvoicePaymentMethods(
    config: Partial<AppConfig>,
    doc: DocumentData,
): Array<[PaymentMethodKey, PaymentMethodEntry]> {
    const methods = config.billing?.paymentMethods || {};
    const overrides = doc.paymentOverrides;

    let entries = (Object.entries(methods) as Array<[PaymentMethodKey, PaymentMethodEntry]>)
        .map(([key, method]) => [key, { ...method }] as [PaymentMethodKey, PaymentMethodEntry]);

    // Per-invoice Stripe link overrides the global Stripe configuration.
    if (overrides?.stripeLink) {
        const stripeIdx = entries.findIndex(([key]) => key === "stripe");
        const baseStripe: Partial<PaymentMethodEntry> = stripeIdx >= 0 ? entries[stripeIdx][1] : { label: "Stripe", position: 99 };
        const overridden: PaymentMethodEntry = {
            ...baseStripe,
            enabled: true,
            comingSoon: false,
            label: baseStripe.label || "Stripe",
            value: overrides.stripeLink,
            note: overrides.stripeNote || baseStripe.note,
        };
        if (stripeIdx >= 0) entries[stripeIdx] = ["stripe", overridden];
        else entries.push(["stripe", overridden]);
    }

    entries.sort((a, b) => (a[1].position ?? 0) - (b[1].position ?? 0));
    entries = entries.filter(([, method]) => method.enabled);

    if (overrides?.customizeMethods && Array.isArray(overrides.enabledMethods)) {
        const allow = new Set(overrides.enabledMethods);
        entries = entries.filter(([key]) => allow.has(key) || (key === "stripe" && !!overrides.stripeLink));
    }

    return entries;
}

function paymentMethodIcon(key: PaymentMethodKey) {
    switch (key) {
        case "cash":
            return <Banknote size={16} />;
        case "check":
            return <Landmark size={16} />;
        case "zelle":
            return <Building2 size={16} />;
        case "cashApp":
            return <HandCoins size={16} />;
        case "paypal":
            return <Wallet size={16} />;
        case "venmo":
            return <CircleDollarSign size={16} />;
        case "applePay":
            return <Smartphone size={16} />;
        case "stripe":
            return <CreditCard size={16} />;
        default:
            return <CircleDollarSign size={16} />;
    }
}

export default async function DocumentPreview({
    doc,
    showBackButton = false,
    backHref = "/admin",
    editHref,
    publicMode = false,
}: {
    doc: DocumentData;
    showBackButton?: boolean;
    backHref?: string;
    editHref?: string;
    /** Client-facing share view: print only, no admin actions. */
    publicMode?: boolean;
}) {
    const session = publicMode ? null : await auth();
    const config = await getAppConfig();
    const docTitle = DOC_LABEL[doc.type] ?? "Document";
    const billToLabel = doc.type === "receipt" ? "Received From" : "Bill To";
    let sharePath = "/";
    if (!publicMode && doc.type !== "lead") {
        const ensured = await ensureDocumentShareToken(doc);
        sharePath = buildSharePath(ensured.shareToken);
    }
    const shareTitle = `${docTitle} ${doc.id}`;
    const activePaymentMethods = doc.type === "invoice"
        ? buildInvoicePaymentMethods(config, doc)
        : [];
    const paidAmount = doc.paidAmount ?? doc.payments?.reduce((acc, payment) => acc + payment.amount, 0) ?? 0;
    const balanceDue = doc.balanceDue ?? Math.max(0, doc.total - paidAmount);
    const showInvoiceAmountDue = doc.type === "invoice";

    const lineItems = doc.lineItems ?? [];
    const hasOptions = documentHasOptions(doc);
    const packages = doc.packages ?? [];
    const choiceGroups = doc.choiceGroups ?? [];
    const selectionComplete = isOptionSelectionComplete(doc);
    const resolvedLines = hasOptions ? resolveSelectedLineItems(doc) : lineItems;
    const grossSubtotal = resolvedLines.reduce(
        (acc, item) => acc + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
        0,
    );
    const resolvedTotal = lineItemsTotal(resolvedLines);
    const discountSavings = Math.max(0, grossSubtotal - resolvedTotal);
    const hasDiscounts = discountSavings > 0.0001;
    const pendingLines = hasPendingApprovalLines(resolvedLines);
    const showSplitTotals =
        (doc.type === "quote" || doc.type === "estimate") && pendingLines;
    const agreedSubtotal = agreedScopeLineTotal(resolvedLines);
    const pendingSubtotal = pendingApprovalLineTotal(resolvedLines);
    const pendingApprovalSummary = pendingLines
        ? pendingApprovalSummarySentence(docTitle, pendingSubtotal)
        : undefined;
    const showDepositInvoice = !publicMode && (doc.type === "quote" || doc.type === "estimate");
    const depositBase = showDepositInvoice ? depositBillingBase(doc) : 0;
    const showConvert = !publicMode && convertTargets(doc.type).length > 0;
    const displayTotal = hasOptions
        ? (selectionComplete ? resolvedTotal : startingFromTotal(doc))
        : doc.total;
    const invoiceAmountDue = showInvoiceAmountDue ? balanceDue : displayTotal;
    const startingFrom = hasOptions ? startingFromTotal(doc) : displayTotal;
    const jobId = doc.jobId || doc.customer?.jobId;
    const linkedJob = jobId && !publicMode ? await getJobById(jobId) : null;
    const canDelete = !publicMode && (doc.type === "invoice" || doc.type === "estimate" || doc.type === "quote" || doc.type === "receipt");
    const resolvedBackHref = backHref || (jobId ? `/admin/jobs/${jobId}` : "/admin");
    const deleteRedirectTo = jobId ? `/admin/jobs/${jobId}` : `/admin/${doc.type}s`;

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }} className="print-container">
            <Flex justify="between" mb="4" className="no-print doc-toolbar" gap="2" wrap="wrap">
                {!publicMode && showBackButton ? <BackButton href={resolvedBackHref} /> : <Box />}
                {!publicMode ? (
                    <DocumentPreviewActions
                        editHref={editHref}
                        docTitle={docTitle}
                        documentId={doc.id}
                        deleteRedirectTo={deleteRedirectTo}
                        canDelete={canDelete}
                        primaryEmail={
                            doc.type !== "lead" ? (
                                <EmailDocumentButton
                                    documentId={doc.id}
                                    sharePath={sharePath}
                                    docTitle={docTitle}
                                    defaultTo={doc.customer.email}
                                    canSendViaServer={!!session}
                                    serverEmailConfigured={!!process.env.EMAIL_SERVER}
                                    pendingApprovalSummary={pendingApprovalSummary}
                                />
                            ) : null
                        }
                        primaryShare={
                            <ShareButton label={docTitle} sharePath={sharePath} shareTitle={shareTitle} />
                        }
                        overflowDeposit={
                            showDepositInvoice ? (
                                <CreateDepositInvoiceButton
                                    sourceDocumentId={doc.id}
                                    billingBase={depositBase}
                                    sourceLabel={docTitle}
                                />
                            ) : undefined
                        }
                        overflowConvert={
                            showConvert ? (
                                <ConvertDocumentButton
                                    sourceDocumentId={doc.id}
                                    sourceType={doc.type}
                                    hasPendingApproval={pendingLines}
                                />
                            ) : undefined
                        }
                        overflowSavePreset={
                            doc.type !== "lead" ? (
                                <SaveAsPresetButton
                                    mode="document"
                                    documentId={doc.id}
                                    defaultName={doc.title || undefined}
                                />
                            ) : undefined
                        }
                        overflowPrint={
                            <PrintButton label={docTitle} fileName={`${docTitle} ${doc.id}`} />
                        }
                    />
                ) : (
                    <Flex gap="2" className="doc-toolbar-actions" wrap="wrap">
                        <PrintButton label={docTitle} fileName={`${docTitle} ${doc.id}`} />
                    </Flex>
                )}
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
                                <div className="doc-meta-label">{docTitle} #</div>
                                <div className="doc-meta-value">{getDisplayName(doc)}</div>
                            </div>
                            <div className="doc-meta-row">
                                <div className="doc-meta-label">Date</div>
                                <div className="doc-meta-value">{new Date(doc.date).toLocaleDateString()}</div>
                            </div>
                            {doc.dueDate ? (
                                <div className="doc-meta-row">
                                    <div className="doc-meta-label">Due date</div>
                                    <div className="doc-meta-value">{new Date(doc.dueDate).toLocaleDateString()}</div>
                                </div>
                            ) : null}
                            {(doc.type === "estimate" || doc.type === "quote")
                                && typeof doc.estimatedHours === "number"
                                && doc.estimatedHours > 0 ? (
                                <div className="doc-meta-row">
                                    <div className="doc-meta-label">Est. time</div>
                                    <div className="doc-meta-value">{formatHours(doc.estimatedHours)}</div>
                                </div>
                            ) : null}
                        </Box>
                    </div>

                    <Box className="doc-parties">
                        <div className="doc-section-label">{billToLabel}</div>
                        <div className="doc-party-name">{doc.customer.name}</div>
                        {doc.customer.address ? (
                            <div className="doc-party-detail">{doc.customer.address}</div>
                        ) : null}
                        {doc.customer.email ? <div className="doc-party-detail">{doc.customer.email}</div> : null}
                        {doc.customer.phone ? <div className="doc-party-detail">{doc.customer.phone}</div> : null}
                        {doc.customer.leadId && doc.type !== "lead" ? (
                            <div className="doc-party-meta">Linked client record: {doc.customer.leadId}</div>
                        ) : null}
                        {doc.type === "lead" ? (
                            <div className="doc-party-meta">
                                Client stage: {doc.customer.clientStage === "potential_client" ? "Potential Client" : "Lead"}
                            </div>
                        ) : null}
                        {jobId ? (
                            <div className="doc-party-meta">
                                Linked job:{" "}
                                {publicMode ? (
                                    linkedJob?.name || jobId
                                ) : (
                                    <Link href={`/admin/jobs/${jobId}`} style={{ color: "#1e3a5f" }}>
                                        {linkedJob?.name || jobId}
                                    </Link>
                                )}
                            </div>
                        ) : null}
                    </Box>

                    {hasOptions ? (
                        <Box className="doc-section" mb="3">
                            <div className="doc-section-label">Base scope</div>
                        </Box>
                    ) : null}
                    <LineItemsTable items={lineItems} />

                    {packages.length > 0 ? (
                        <Box className="doc-section" mt="4">
                            <div className="doc-section-label">Project packages</div>
                            <Text size="2" color="gray" as="p" mb="3">
                                Choose one approach for how the project can be done.
                            </Text>
                            <Flex direction="column" gap="4">
                                {packages.map((pkg) => {
                                    const selected = doc.optionSelection?.packageId === pkg.id;
                                    return (
                                        <Box
                                            key={pkg.id}
                                            style={{
                                                border: selected ? "2px solid #1e3a5f" : "1px solid var(--gray-a5)",
                                                borderRadius: 10,
                                                padding: 12,
                                            }}
                                        >
                                            <Flex align="center" gap="2" wrap="wrap" mb="2">
                                                <Text weight="bold">{pkg.label}</Text>
                                                {pkg.recommended ? <Badge size="1" color="blue">Recommended</Badge> : null}
                                                {selected ? <Badge size="1" color="green">Selected</Badge> : null}
                                                <Text size="2" color="gray">${packageTotal(pkg).toFixed(2)}</Text>
                                            </Flex>
                                            {pkg.description ? (
                                                <Text size="2" color="gray" as="p" mb="2">{pkg.description}</Text>
                                            ) : null}
                                            <LineItemsTable items={pkg.lineItems} />
                                        </Box>
                                    );
                                })}
                            </Flex>
                        </Box>
                    ) : null}

                    {choiceGroups.length > 0 ? (
                        <Box className="doc-section" mt="4">
                            <div className="doc-section-label">Material & method options</div>
                            <Flex direction="column" gap="4" mt="2">
                                {choiceGroups.map((group) => (
                                    <Box key={group.id}>
                                        <Flex align="center" gap="2" wrap="wrap" mb="2">
                                            <Text weight="bold">{group.label}</Text>
                                            {group.required === false ? (
                                                <Badge size="1" color="gray">Optional</Badge>
                                            ) : null}
                                        </Flex>
                                        {group.description ? (
                                            <Text size="2" color="gray" as="p" mb="2">{group.description}</Text>
                                        ) : null}
                                        <Flex direction="column" gap="3">
                                            {group.choices.map((choice) => {
                                                const selected = doc.optionSelection?.choices?.[group.id] === choice.id;
                                                return (
                                                    <Box
                                                        key={choice.id}
                                                        style={{
                                                            border: selected ? "2px solid #1e3a5f" : "1px dashed var(--gray-a5)",
                                                            borderRadius: 10,
                                                            padding: 12,
                                                        }}
                                                    >
                                                        <Flex align="center" gap="2" wrap="wrap" mb="2">
                                                            <Text weight="medium">{choice.label}</Text>
                                                            {selected ? <Badge size="1" color="green">Selected</Badge> : null}
                                                            <Text size="2" color="gray">${choiceTotal(choice).toFixed(2)}</Text>
                                                        </Flex>
                                                        {choice.description ? (
                                                            <Text size="2" color="gray" as="p" mb="2">{choice.description}</Text>
                                                        ) : null}
                                                        <LineItemsTable items={choice.lineItems} />
                                                    </Box>
                                                );
                                            })}
                                        </Flex>
                                    </Box>
                                ))}
                            </Flex>
                        </Box>
                    ) : null}

                    {hasOptions && !publicMode ? (
                        <DocumentOptionSelectionForm
                            documentId={doc.id}
                            packages={packages}
                            choiceGroups={choiceGroups}
                            initialSelection={doc.optionSelection}
                        />
                    ) : null}

                    {doc.notes ? (
                        <Box className="doc-section">
                            <div className="doc-section-label">
                                {doc.type === "estimate" ? "Project Details" : doc.type === "quote" ? "Scope & terms" : "Notes"}
                            </div>
                            <Box className="doc-section-body">
                                <MarkdownContent>{doc.notes}</MarkdownContent>
                            </Box>
                        </Box>
                    ) : null}

                    {doc.type === "invoice" && (activePaymentMethods.length > 0 || config.billing?.paymentInstructions || config.billing?.checkPayableTo) ? (
                        <Box className="doc-section payment-options">
                            <div className="doc-section-label">Payment Options</div>
                            {activePaymentMethods.length > 0 ? (
                                <>
                                    <Box
                                        className="no-print payment-options-screen"
                                        mt="2"
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                            columnGap: "1.25rem",
                                            rowGap: "0.35rem",
                                        }}
                                    >
                                        {activePaymentMethods.map(([key, method]) => {
                                            const isCheck = key === "check";
                                            const detailParts: string[] = [];
                                            if (method.value) detailParts.push(method.value);
                                            if (isCheck && config.billing?.checkPayableTo) {
                                                detailParts.push(`Payable to: ${config.billing.checkPayableTo}`);
                                            }
                                            const primary = detailParts.join(" · ");
                                            const payLink = paymentLinkForMethod(key, method, invoiceAmountDue, doc.id);
                                            return (
                                                <Card key={key} variant="surface" style={{ padding: 12 }}>
                                                    <Flex direction="column" gap="2">
                                                        <Flex justify="between" align="center" gap="2" wrap="wrap">
                                                            <Flex align="center" gap="2">
                                                                <Box
                                                                    style={{
                                                                        width: 24,
                                                                        height: 24,
                                                                        borderRadius: 999,
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        background: "#eef2ff",
                                                                        color: "#1e3a5f",
                                                                        flexShrink: 0,
                                                                    }}
                                                                >
                                                                    {paymentMethodIcon(key)}
                                                                </Box>
                                                                <Text as="div" size="2" weight="bold" style={{ color: "#111827" }}>
                                                                    {method.label}
                                                                </Text>
                                                            </Flex>
                                                            {method.comingSoon ? <Badge color="gray" size="1">Coming soon</Badge> : null}
                                                        </Flex>
                                                        {primary ? (
                                                            <Text as="div" size="1" style={{ color: "#374151", lineHeight: 1.35, wordBreak: "break-word" }}>
                                                                {primary}
                                                            </Text>
                                                        ) : null}
                                                        {payLink ? (
                                                            <Button asChild size="2" className="no-print">
                                                                <a href={payLink} target="_blank" rel="noreferrer">
                                                                    Pay ${invoiceAmountDue.toFixed(2)}
                                                                </a>
                                                            </Button>
                                                        ) : (
                                                            <Text as="div" size="1" color="gray" className="no-print">
                                                                {paymentMethodUsesManualDetails(key)
                                                                    ? key === "zelle"
                                                                        ? "Send this amount via Zelle in your bank app using the details above."
                                                                        : "Use details above to pay with this method."
                                                                    : "Add a valid link/handle in settings to enable tap-to-pay."}
                                                            </Text>
                                                        )}
                                                    </Flex>
                                                    {method.note ? (
                                                        <Text
                                                            as="div"
                                                            size="1"
                                                            style={{ color: "#6b7280", lineHeight: 1.35, marginTop: 4, whiteSpace: "pre-line" }}
                                                        >
                                                            {method.note}
                                                        </Text>
                                                    ) : null}
                                                </Card>
                                            );
                                        })}
                                    </Box>
                                    <Box className="print-only payment-options-print" mt="1">
                                        {activePaymentMethods
                                            .filter(([, method]) => !method.comingSoon)
                                            .map(([key, method]) => {
                                                const detailParts: string[] = [];
                                                if (method.value) detailParts.push(method.value);
                                                if (key === "check" && config.billing?.checkPayableTo) {
                                                    detailParts.push(`Payable to: ${config.billing.checkPayableTo}`);
                                                }
                                                if (method.note) detailParts.push(method.note.replace(/\s+/g, " ").trim());
                                                return (
                                                    <div key={key} className="payment-options-print-row doc-section-note">
                                                        <strong>{method.label}</strong>
                                                        {detailParts.length > 0 ? ` — ${detailParts.join(" · ")}` : null}
                                                    </div>
                                                );
                                            })}
                                    </Box>
                                </>
                            ) : null}
                            {config.billing?.paymentInstructions ? (
                                <Box mt="2">
                                    <div className="doc-meta-label">Payment Instructions</div>
                                    <div className="doc-section-note" style={{ whiteSpace: "pre-line", marginTop: 2 }}>
                                        {config.billing.paymentInstructions}
                                    </div>
                                </Box>
                            ) : null}
                        </Box>
                    ) : null}

                    {doc.type === "estimate" || doc.type === "quote" ? (
                        <Box className="doc-section">
                            <div className="doc-section-note">
                                {doc.type === "estimate"
                                    ? "Flexible estimate: figures are indicative and may change with final scope, materials, or site conditions."
                                    : "Firm quote: the total below is the agreed price for the work described in this document unless you attach a written change order."}
                                {showSplitTotals ? (
                                    <>
                                        {" "}
                                        Lines marked pending approval are not part of the agreed firm price until you approve them in writing.
                                    </>
                                ) : null}
                            </div>
                        </Box>
                    ) : null}

                    {doc.warranty?.enabled && doc.warranty.text ? (
                        <Box className="doc-section">
                            <div className="doc-section-label">{doc.warranty.title || "Warranty"}</div>
                            <Box className="doc-section-body">
                                <MarkdownContent>{doc.warranty.text}</MarkdownContent>
                            </Box>
                        </Box>
                    ) : null}

                    <div className="doc-summary">
                        <Box className="doc-status">
                            <span className="doc-status-mark" style={{ color: getStatusColor(doc.status) }}>
                                {doc.status.toUpperCase()}
                            </span>
                            {(doc.type === "estimate" || doc.type === "quote") && doc.workflowStatus ? (
                                <Badge
                                    mt="2"
                                    size="1"
                                    color={workflowStatusColor(doc.workflowStatus) as "gray" | "orange" | "blue" | "green"}
                                >
                                    {workflowStatusLabel(doc.workflowStatus)}
                                </Badge>
                            ) : null}
                        </Box>

                        <Box className={showSplitTotals ? "doc-totals doc-totals-wide" : "doc-totals"}>
                            {hasDiscounts ? (
                                <>
                                    <div className="doc-total-row">
                                        <span>Subtotal (before discounts)</span>
                                        <span>${grossSubtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="doc-total-row">
                                        <span style={{ color: "#15803d", fontWeight: 600 }}>Discount savings</span>
                                        <span style={{ color: "#15803d", fontWeight: 600 }}>−${discountSavings.toFixed(2)}</span>
                                    </div>
                                </>
                            ) : null}
                            {doc.type === "invoice" ? (
                                <>
                                    <div className="doc-total-row">
                                        <span>Subtotal</span>
                                        <span>${doc.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="doc-total-row">
                                        <span>Paid</span>
                                        <span>${paidAmount.toFixed(2)}</span>
                                    </div>
                                </>
                            ) : null}
                            {hasOptions && !selectionComplete && doc.type !== "invoice" ? (
                                <div className="doc-total-row">
                                    <span>Starting from</span>
                                    <span>${startingFrom.toFixed(2)}</span>
                                </div>
                            ) : null}
                            {hasOptions && selectionComplete && doc.type !== "invoice" ? (
                                <div className="doc-total-row">
                                    <span>Selected configuration</span>
                                    <span>${resolvedTotal.toFixed(2)}</span>
                                </div>
                            ) : null}
                            {showSplitTotals ? (
                                <>
                                    <div className="doc-total-row">
                                        <span>Agreed scope subtotal</span>
                                        <span>${agreedSubtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="doc-total-row">
                                        <span>Additional scope (pending approval)</span>
                                        <span>${pendingSubtotal.toFixed(2)}</span>
                                    </div>
                                </>
                            ) : doc.type !== "invoice" && !hasOptions ? (
                                <div className="doc-total-row">
                                    <span>Subtotal</span>
                                    <span>${doc.subtotal.toFixed(2)}</span>
                                </div>
                            ) : null}
                            <div className="doc-total-due">
                                <span>
                                    {showInvoiceAmountDue
                                        ? "Amount Due"
                                        : showSplitTotals
                                            ? "Total if all approved"
                                            : hasOptions && !selectionComplete
                                                ? "From"
                                                : hasOptions && selectionComplete
                                                    ? "Selected total"
                                                    : "Total"}
                                </span>
                                <span
                                    className={`doc-total-due-amount${showInvoiceAmountDue && invoiceAmountDue > 0 ? " is-outstanding" : ""}`}
                                    style={
                                        !(showInvoiceAmountDue && invoiceAmountDue > 0)
                                            ? { color: getStatusColor(doc.status) }
                                            : undefined
                                    }
                                >
                                    ${invoiceAmountDue.toFixed(2)}
                                </span>
                            </div>
                            {showInvoiceAmountDue && paidAmount > 0 ? (
                                <div className="doc-total-footnote">
                                    <span>Original Invoice Total</span>
                                    <span>${doc.total.toFixed(2)}</span>
                                </div>
                            ) : null}
                        </Box>
                    </div>
                </div>
            </Card>
        </Container>
    );
}
