import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, Box, Button, Card, Flex, Table, Text, Theme } from "@radix-ui/themes";
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
import type { DocumentData, LineItem, PaymentMethodKey } from "@/lib/types";
import type { MoneyFormatter } from "@/lib/money";
import { DOC_LABEL } from "@/lib/document-labels";
import { buildInvoicePaymentMethods, type DocumentPaperContext } from "@/lib/document-paper";
import { paymentLinkForMethod, paymentMethodUsesManualDetails } from "@/lib/payment-links";
import { workflowStatusColor, workflowStatusLabel } from "@/lib/workflow-status";
import {
    agreedScopeLineTotal,
    hasPendingApprovalLines,
    pendingApprovalLineTotal,
} from "@/lib/pending-client-approval";
import {
    choiceTotal,
    documentHasOptions,
    hasRecommendedDefaults,
    isOptionSelectionComplete,
    lineItemsTotal,
    packageTotal,
    resolveSelectedLineItems,
    startingFromTotal,
} from "@/lib/document-options";
import { formatHours } from "@/lib/job-estimated-hours";
import MarkdownContent from "@/components/MarkdownContent";
import PaymentDeepLinkButton from "@/components/PaymentDeepLinkButton";
import StripeCheckoutPay from "@/components/StripeCheckoutPay";

function LineItemsTable({ items, money }: { items: LineItem[]; money: MoneyFormatter }) {
    if (!items.length) {
        return <p className="doc-section-note">No line items.</p>;
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
                            <Table.Cell align="right">{money(Number(item.unitPrice) || 0)}</Table.Cell>
                            <Table.Cell align="right">
                                {item.discountPercent ? (
                                    <Box>
                                        <span className="doc-line-strike">
                                            {money((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0))}
                                        </span>
                                        <span className="doc-line-title">{money(Number(item.total) || 0)}</span>
                                    </Box>
                                ) : (
                                    <>{money(Number(item.total) || 0)}</>
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

/**
 * The printable letter-headed document. Pure presentation: server pages and
 * the client-side editor preview both render it from the same data.
 */
export default function DocumentPaper({
    doc,
    context,
    money,
    publicMode = false,
    preview = false,
    shareToken = "",
    linkedJobName,
    optionSelectionSlot,
}: {
    doc: DocumentData;
    context: DocumentPaperContext;
    money: MoneyFormatter;
    /** Client share view: job reference stays plain text. */
    publicMode?: boolean;
    /** Editor live preview: pay controls render inert, no links out. */
    preview?: boolean;
    shareToken?: string;
    linkedJobName?: string | null;
    /** Admin-only controls rendered inside the options section (e.g. option selection form). */
    optionSelectionSlot?: ReactNode;
}) {
    const { business, branding, billing, stripeConfigured } = context;
    const docTitle = DOC_LABEL[doc.type] ?? "Document";
    const billToLabel = doc.type === "receipt" ? "Received From" : "Bill To";
    const activePaymentMethods = doc.type === "invoice"
        ? buildInvoicePaymentMethods(billing.paymentMethods, doc, stripeConfigured)
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
    const showSplitTotals = (doc.type === "quote" || doc.type === "estimate") && pendingLines;
    const agreedSubtotal = agreedScopeLineTotal(resolvedLines);
    const pendingSubtotal = pendingApprovalLineTotal(resolvedLines);
    const displayTotal = hasOptions
        ? (selectionComplete ? resolvedTotal : startingFromTotal(doc))
        : doc.total;
    const invoiceAmountDue = showInvoiceAmountDue ? balanceDue : displayTotal;
    const startingFrom = hasOptions ? startingFromTotal(doc) : displayTotal;
    const showRecommendedTotal = hasOptions && !selectionComplete && hasRecommendedDefaults(doc);
    const jobId = doc.jobId || doc.customer?.jobId;
    const showPaymentSection = doc.type === "invoice"
        && (activePaymentMethods.length > 0 || billing.paymentInstructions || billing.checkPayableTo);

    return (
        /* Printable documents are always light-on-white "paper", so the Radix
           tokens inside are pinned to light regardless of the visitor's theme. */
        <Theme appearance="light" asChild>
            <Card
                size="2"
                className="doc-card print-document"
                style={{ "--doc-accent": branding.documentAccentColor } as React.CSSProperties}
            >
                <div className="receipt-content">
                    <div className="doc-header">
                        <Box className="doc-brand">
                            {branding.showLogoOnDocuments && branding.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={branding.logoUrl} alt={business.name} className="doc-brand-logo" />
                            ) : (
                                <>
                                    <p className="doc-brand-name">{branding.letterhead.line1}</p>
                                    {branding.letterhead.line2 ? (
                                        <div className="doc-brand-sub">{branding.letterhead.line2}</div>
                                    ) : null}
                                </>
                            )}
                            <div className="doc-brand-address">
                                {business.addressLine1 ? <div>{business.addressLine1}</div> : null}
                                {business.addressLine2 ? <div>{business.addressLine2}</div> : null}
                                {business.phoneDisplay ? <div>{business.phoneDisplay}</div> : null}
                                {business.email ? <div>{business.email}</div> : null}
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
                        <div className="doc-party-name">{doc.customer.name || (preview ? "Client name" : "")}</div>
                        {doc.customer.address ? (
                            <div className="doc-party-detail">{doc.customer.address}</div>
                        ) : null}
                        {doc.customer.email ? <div className="doc-party-detail">{doc.customer.email}</div> : null}
                        {doc.customer.phone ? <div className="doc-party-detail">{doc.customer.phone}</div> : null}
                        {doc.customer.leadId && doc.type !== "lead" && !publicMode ? (
                            <div className="doc-party-meta">Linked client record: {doc.customer.leadId}</div>
                        ) : null}
                        {doc.type === "lead" ? (
                            <div className="doc-party-meta">
                                Client stage: {doc.customer.clientStage === "potential_client" ? "Potential Client" : "Lead"}
                            </div>
                        ) : null}
                        {jobId && linkedJobName ? (
                            <div className="doc-party-meta">
                                {publicMode || preview ? "Job: " : "Linked job: "}
                                {publicMode || preview ? (
                                    linkedJobName
                                ) : (
                                    <Link href={`/admin/jobs/${jobId}`} style={{ color: "var(--doc-accent)" }}>
                                        {linkedJobName}
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
                    <LineItemsTable items={lineItems} money={money} />

                    {packages.length > 0 ? (
                        <Box className="doc-section" mt="4">
                            <div className="doc-section-label">Project packages</div>
                            <p className="doc-section-note" style={{ marginBottom: 12 }}>
                                Choose one approach for how the project can be done.
                            </p>
                            <Flex direction="column" gap="4">
                                {packages.map((pkg) => {
                                    const selected = doc.optionSelection?.packageId === pkg.id;
                                    return (
                                        <Box
                                            key={pkg.id}
                                            className="doc-option-card"
                                            data-selected={selected || undefined}
                                        >
                                            <Flex align="center" gap="2" wrap="wrap" mb="2">
                                                <Text weight="bold" className="doc-option-heading">{pkg.label}</Text>
                                                {pkg.recommended ? <Badge size="1" color="blue">Recommended</Badge> : null}
                                                {selected ? <Badge size="1" color="green">Selected</Badge> : null}
                                                <span className="doc-option-price">{money(packageTotal(pkg))}</span>
                                            </Flex>
                                            {pkg.description ? (
                                                <Box className="doc-option-description" mb="2">
                                                    <MarkdownContent>{pkg.description}</MarkdownContent>
                                                </Box>
                                            ) : null}
                                            <LineItemsTable items={pkg.lineItems} money={money} />
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
                                            <Text weight="bold" className="doc-option-heading">{group.label}</Text>
                                            {group.required === false ? (
                                                <Badge size="1" color="gray">Optional</Badge>
                                            ) : null}
                                        </Flex>
                                        {group.description ? (
                                            <Box className="doc-option-description" mb="2">
                                                <MarkdownContent>{group.description}</MarkdownContent>
                                            </Box>
                                        ) : null}
                                        <Flex direction="column" gap="3">
                                            {group.choices.map((choice) => {
                                                const selected = doc.optionSelection?.choices?.[group.id] === choice.id;
                                                return (
                                                    <Box
                                                        key={choice.id}
                                                        className="doc-option-card doc-option-card--choice"
                                                        data-selected={selected || undefined}
                                                    >
                                                        <Flex align="center" gap="2" wrap="wrap" mb="2">
                                                            <Text weight="bold" className="doc-option-heading">{choice.label}</Text>
                                                            {choice.recommended ? <Badge size="1" color="blue">Recommended</Badge> : null}
                                                            {selected ? <Badge size="1" color="green">Selected</Badge> : null}
                                                            <span className="doc-option-price">{money(choiceTotal(choice))}</span>
                                                        </Flex>
                                                        {choice.description ? (
                                                            <Box className="doc-option-description" mb="2">
                                                                <MarkdownContent>{choice.description}</MarkdownContent>
                                                            </Box>
                                                        ) : null}
                                                        <LineItemsTable items={choice.lineItems} money={money} />
                                                    </Box>
                                                );
                                            })}
                                        </Flex>
                                    </Box>
                                ))}
                            </Flex>
                        </Box>
                    ) : null}

                    {hasOptions ? optionSelectionSlot : null}

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

                    {showPaymentSection ? (
                        <Box className="doc-section payment-options" id="payment-options">
                            <div className="doc-section-label">Payment Options</div>
                            {activePaymentMethods.length > 0 ? (
                                <>
                                    <Box className="no-print payment-options-screen" mt="2">
                                        {activePaymentMethods.map(([key, method]) => {
                                            const useStripeCheckout =
                                                key === "stripe" && stripeConfigured && Boolean(shareToken || preview);

                                            if (useStripeCheckout && !preview) {
                                                return (
                                                    <Card key={key} variant="surface" className="payment-option-card">
                                                        <StripeCheckoutPay
                                                            shareToken={shareToken}
                                                            invoiceId={doc.id}
                                                            invoiceTotal={doc.total}
                                                            balanceDue={invoiceAmountDue}
                                                            label={method.label || "Stripe"}
                                                            note={method.note || doc.paymentOverrides?.stripeNote}
                                                        />
                                                    </Card>
                                                );
                                            }

                                            const isCheck = key === "check";
                                            const detailParts: string[] = [];
                                            if (method.value && !useStripeCheckout) detailParts.push(method.value);
                                            if (isCheck && billing.checkPayableTo) {
                                                detailParts.push(`Payable to: ${billing.checkPayableTo}`);
                                            }
                                            const primary = detailParts.join(" · ");
                                            const payLink = useStripeCheckout
                                                ? "#"
                                                : paymentLinkForMethod(key, method, invoiceAmountDue, doc.id);
                                            return (
                                                <Card key={key} variant="surface" className="payment-option-card">
                                                    <Flex direction="column" gap="2">
                                                        <Flex justify="between" align="center" gap="2" wrap="wrap">
                                                            <Flex align="center" gap="2">
                                                                <span className="payment-option-icon">{paymentMethodIcon(key)}</span>
                                                                <div className="doc-option-heading">{method.label}</div>
                                                            </Flex>
                                                            {method.comingSoon ? <Badge color="gray" size="1">Coming soon</Badge> : null}
                                                        </Flex>
                                                        {primary ? (
                                                            <Text as="div" size="1" className="payment-option-detail">{primary}</Text>
                                                        ) : null}
                                                        {payLink ? (
                                                            preview ? (
                                                                <Button size="2" disabled tabIndex={-1}>
                                                                    Pay {money(invoiceAmountDue)}
                                                                </Button>
                                                            ) : (
                                                                <PaymentDeepLinkButton
                                                                    methodKey={key}
                                                                    externalHref={payLink}
                                                                    amount={invoiceAmountDue}
                                                                />
                                                            )
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
                                                        <Text as="div" size="1" className="payment-option-note">{method.note}</Text>
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
                                                if (key === "check" && billing.checkPayableTo) {
                                                    detailParts.push(`Payable to: ${billing.checkPayableTo}`);
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
                            {billing.paymentInstructions ? (
                                <Box mt="2">
                                    <div className="doc-meta-label">Payment Instructions</div>
                                    <div className="doc-section-note" style={{ whiteSpace: "pre-line", marginTop: 2 }}>
                                        {billing.paymentInstructions}
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
                                        <span>{money(grossSubtotal)}</span>
                                    </div>
                                    <div className="doc-total-row">
                                        <span style={{ color: "#15803d", fontWeight: 600 }}>Discount savings</span>
                                        <span style={{ color: "#15803d", fontWeight: 600 }}>−{money(discountSavings)}</span>
                                    </div>
                                </>
                            ) : null}
                            {doc.type === "invoice" ? (
                                <>
                                    <div className="doc-total-row">
                                        <span>Subtotal</span>
                                        <span>{money(doc.subtotal)}</span>
                                    </div>
                                    <div className="doc-total-row">
                                        <span>Paid</span>
                                        <span>{money(paidAmount)}</span>
                                    </div>
                                </>
                            ) : null}
                            {hasOptions && !selectionComplete && doc.type !== "invoice" ? (
                                <div className="doc-total-row">
                                    <span>{showRecommendedTotal ? "Recommended" : "Starting from"}</span>
                                    <span>{money(startingFrom)}</span>
                                </div>
                            ) : null}
                            {hasOptions && selectionComplete && doc.type !== "invoice" ? (
                                <div className="doc-total-row">
                                    <span>Selected configuration</span>
                                    <span>{money(resolvedTotal)}</span>
                                </div>
                            ) : null}
                            {showSplitTotals ? (
                                <>
                                    <div className="doc-total-row">
                                        <span>Agreed scope subtotal</span>
                                        <span>{money(agreedSubtotal)}</span>
                                    </div>
                                    <div className="doc-total-row">
                                        <span>Additional scope (pending approval)</span>
                                        <span>{money(pendingSubtotal)}</span>
                                    </div>
                                </>
                            ) : doc.type !== "invoice" && !hasOptions ? (
                                <div className="doc-total-row">
                                    <span>Subtotal</span>
                                    <span>{money(doc.subtotal)}</span>
                                </div>
                            ) : null}
                            <div className="doc-total-due">
                                <span>
                                    {showInvoiceAmountDue
                                        ? "Amount Due"
                                        : showSplitTotals
                                            ? "Total if all approved"
                                            : hasOptions && !selectionComplete
                                                ? (showRecommendedTotal ? "Recommended total" : "From")
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
                                    {money(invoiceAmountDue)}
                                </span>
                            </div>
                            {showInvoiceAmountDue && paidAmount > 0 ? (
                                <div className="doc-total-footnote">
                                    <span>Original Invoice Total</span>
                                    <span>{money(doc.total)}</span>
                                </div>
                            ) : null}
                        </Box>
                    </div>
                </div>
            </Card>
        </Theme>
    );
}
