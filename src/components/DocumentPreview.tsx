import { Badge, Box, Button, Card, Container, Flex, Heading, Table, Text } from "@radix-ui/themes";
import Link from "next/link";
import type { AppConfig, DocumentData, PaymentMethodKey, PaymentMethodEntry } from "@/lib/types";
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
import { DOC_LABEL } from "@/lib/document-labels";
import {
    agreedScopeLineTotal,
    hasPendingApprovalLines,
    pendingApprovalLineTotal,
    pendingApprovalSummarySentence,
} from "@/lib/pending-client-approval";
import { auth } from "@/lib/auth";
import PrintButton from "@/components/PrintButton";
import ShareButton from "@/components/ShareButton";
import EmailDocumentButton from "@/components/EmailDocumentButton";
import CreateDepositInvoiceButton from "@/components/CreateDepositInvoiceButton";
import ConvertDocumentButton from "@/components/ConvertDocumentButton";
import BackButton from "@/components/BackButton";
import { depositBillingBase } from "@/lib/deposit-invoice";
import { convertTargets } from "@/lib/convert-document";

function getStatusColor(status: DocumentData["status"]) {
    if (status === "paid") return "#166534";
    if (status === "void") return "#b91c1c";
    if (status === "sent") return "#1d4ed8";
    return "#92400e";
}

function getDisplayName(doc: DocumentData) {
    return doc.title ? `${doc.id} - ${doc.title}` : doc.id;
}

function normalizePhoneDigits(value?: string) {
    return (value || "").replace(/\D/g, "");
}

function normalizeHandle(value?: string) {
    return (value || "").trim().replace(/^@+/, "");
}

function toMoneyAmount(amount: number) {
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    return safeAmount.toFixed(2);
}

function paymentLinkForMethod(
    key: PaymentMethodKey,
    method: PaymentMethodEntry,
    amount: number,
    invoiceId: string,
) {
    if (method.comingSoon) return null;
    const raw = (method.value || "").trim();
    const encodedAmount = encodeURIComponent(toMoneyAmount(amount));
    const encodedNote = encodeURIComponent(`Invoice ${invoiceId}`);

    switch (key) {
        case "paypal": {
            if (!raw) return null;
            if (/^https?:\/\//i.test(raw)) return raw;
            const paypalUser = normalizeHandle(raw);
            return paypalUser
                ? `https://www.paypal.com/paypalme/${encodeURIComponent(paypalUser)}/${encodedAmount}`
                : null;
        }
        case "venmo": {
            const venmoUser = normalizeHandle(raw);
            return venmoUser
                ? `https://venmo.com/${encodeURIComponent(venmoUser)}?txn=pay&amount=${encodedAmount}&note=${encodedNote}`
                : null;
        }
        case "cashApp": {
            const cashTag = normalizeHandle(raw);
            return cashTag
                ? `https://cash.app/$${encodeURIComponent(cashTag)}`
                : null;
        }
        case "zelle": {
            if (!raw) return null;
            if (raw.includes("@")) return `mailto:${raw}?subject=${encodedNote}`;
            const digits = normalizePhoneDigits(raw);
            return digits ? `tel:${digits}` : null;
        }
        case "stripe":
            return /^https?:\/\//i.test(raw) ? raw : null;
        default:
            return null;
    }
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
}: {
    doc: DocumentData;
    showBackButton?: boolean;
    backHref?: string;
    editHref?: string;
}) {
    const session = await auth();
    const config = await getAppConfig();
    const docTitle = DOC_LABEL[doc.type] ?? "Document";
    const billToLabel = doc.type === "receipt" ? "Received From" : "Bill To";
    const sharePath = doc.type === "lead" ? "/" : `/${doc.type}s/${doc.id}`;
    const shareTitle = `${docTitle} ${doc.id}`;
    const activePaymentMethods = doc.type === "invoice"
        ? buildInvoicePaymentMethods(config, doc)
        : [];
    const paidAmount = doc.paidAmount ?? doc.payments?.reduce((acc, payment) => acc + payment.amount, 0) ?? 0;
    const balanceDue = doc.balanceDue ?? Math.max(0, doc.total - paidAmount);
    const showInvoiceAmountDue = doc.type === "invoice";
    const invoiceAmountDue = showInvoiceAmountDue ? balanceDue : doc.total;

    const lineItems = doc.lineItems ?? [];
    const grossSubtotal = lineItems.reduce(
        (acc, item) => acc + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
        0,
    );
    const discountSavings = Math.max(0, grossSubtotal - doc.subtotal);
    const hasDiscounts = discountSavings > 0.0001;
    const pendingLines = hasPendingApprovalLines(lineItems);
    const showSplitTotals =
        (doc.type === "quote" || doc.type === "estimate") && pendingLines;
    const agreedSubtotal = agreedScopeLineTotal(lineItems);
    const pendingSubtotal = pendingApprovalLineTotal(lineItems);
    const pendingApprovalSummary = pendingLines
        ? pendingApprovalSummarySentence(docTitle, pendingSubtotal)
        : undefined;
    const showDepositInvoice = doc.type === "quote" || doc.type === "estimate";
    const depositBase = showDepositInvoice ? depositBillingBase(doc) : 0;
    const showConvert = convertTargets(doc.type).length > 0;

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }} className="print-container">
            <Flex justify="between" mb="4" className="no-print doc-toolbar" gap="2" wrap="wrap">
                {showBackButton ? <BackButton href={backHref} /> : <Box />}
                <Flex gap="2" className="doc-toolbar-actions" wrap="wrap">
                    {editHref ? (
                        <Button asChild variant="soft">
                            <Link href={editHref}>Edit {docTitle}</Link>
                        </Button>
                    ) : null}
                    {showDepositInvoice ? (
                        <CreateDepositInvoiceButton
                            sourceDocumentId={doc.id}
                            billingBase={depositBase}
                            sourceLabel={docTitle}
                        />
                    ) : null}
                    {showConvert ? (
                        <ConvertDocumentButton
                            sourceDocumentId={doc.id}
                            sourceType={doc.type}
                            hasPendingApproval={pendingLines}
                        />
                    ) : null}
                    <ShareButton label={docTitle} sharePath={sharePath} shareTitle={shareTitle} />
                    {doc.type !== "lead" ? (
                        <EmailDocumentButton
                            documentId={doc.id}
                            sharePath={sharePath}
                            docTitle={docTitle}
                            defaultTo={doc.customer.email}
                            canSendViaServer={!!session}
                            serverEmailConfigured={!!process.env.EMAIL_SERVER}
                            pendingApprovalSummary={pendingApprovalSummary}
                        />
                    ) : null}
                    <PrintButton label={docTitle} />
                </Flex>
            </Flex>

            <Card size="3" className="doc-card" style={{ background: "white", color: "#111827", border: "1px solid #d1d5db" }}>
                <div className="receipt-content">
                    <Flex justify="between" align="start" mb="6" className="doc-header">
                        <Box>
                            <Heading size="8" style={{ color: "#111827", marginBottom: 4 }}>MAROTTO</Heading>
                            <Text size="3" weight="bold" style={{ color: "#374151", letterSpacing: "2px" }}>SOLUTIONS</Text>
                            <Box mt="4">
                                <Text as="div" size="2" style={{ color: "#1f2937" }}>28 E Mountain Ridge MHP</Text>
                                <Text as="div" size="2" style={{ color: "#1f2937" }}>Wilkes Barre, PA 18702</Text>
                                <Text as="div" size="2" style={{ color: "#1f2937" }}>(570) 332-9262</Text>
                            </Box>
                        </Box>
                        <Box className="doc-meta" style={{ textAlign: "right" }}>
                            <Heading size="8" style={{ color: "#4b5563", textTransform: "uppercase" }}>{docTitle}</Heading>
                            <Flex direction="column" mt="2">
                                <Text size="2" weight="bold" style={{ color: "#4b5563" }}>{docTitle.toUpperCase()} #</Text>
                                <Text size="4" weight="bold" style={{ color: "#111827" }}>{getDisplayName(doc)}</Text>
                            </Flex>
                            <Flex direction="column" mt="2">
                                <Text size="2" weight="bold" style={{ color: "#4b5563" }}>DATE</Text>
                                <Text size="3" style={{ color: "#111827" }}>{new Date(doc.date).toLocaleDateString()}</Text>
                            </Flex>
                            {doc.dueDate ? (
                                <Flex direction="column" mt="2">
                                    <Text size="2" weight="bold" style={{ color: "#4b5563" }}>DUE DATE</Text>
                                    <Text size="3" style={{ color: "#111827" }}>{new Date(doc.dueDate).toLocaleDateString()}</Text>
                                </Flex>
                            ) : null}
                        </Box>
                    </Flex>

                    <Box mb="6" style={{ borderTop: "2px solid #d1d5db", paddingTop: "20px" }}>
                        <Text size="2" weight="bold" style={{ color: "#4b5563", textTransform: "uppercase" }}>{billToLabel}</Text>
                        <Heading size="4" mt="1" style={{ color: "#111827" }}>{doc.customer.name}</Heading>
                        <Text as="div" size="2" style={{ whiteSpace: "pre-line", color: "#1f2937" }}>{doc.customer.address}</Text>
                        {doc.customer.email ? <Text as="div" size="2" style={{ color: "#1f2937" }}>{doc.customer.email}</Text> : null}
                        {doc.customer.phone ? <Text as="div" size="2" style={{ color: "#1f2937" }}>{doc.customer.phone}</Text> : null}
                        {doc.customer.leadId && doc.type !== "lead" ? (
                            <Text as="div" size="1" color="gray" mt="2">Linked client record: {doc.customer.leadId}</Text>
                        ) : null}
                        {doc.type === "lead" ? (
                            <Text as="div" size="1" color="gray" mt="1">
                                Client stage: {doc.customer.clientStage === "potential_client" ? "Potential Client" : "Lead"}
                            </Text>
                        ) : null}
                        {doc.jobId ? (
                            <Text as="div" size="1" color="gray" mt="1">Linked job: {doc.jobId}</Text>
                        ) : null}
                    </Box>

                    <Box className="doc-table-wrap">
                        <Table.Root variant="surface" style={{ width: "100%", marginBottom: "30px", minWidth: 560 }}>
                            <Table.Header>
                                <Table.Row style={{ background: "#f3f4f6" }}>
                                    <Table.ColumnHeaderCell style={{ color: "#1f2937" }}>Description</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right" style={{ color: "#1f2937" }}>Qty</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right" style={{ color: "#1f2937" }}>Unit</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right" style={{ color: "#1f2937" }}>Amount</Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {lineItems.map((item) => (
                                    <Table.Row key={item.id}>
                                        <Table.Cell>
                                            <Flex align="center" gap="2" wrap="wrap">
                                                <Text weight="bold" style={{ color: "#111827" }}>{item.description}</Text>
                                                {item.discountPercent ? (
                                                    <Badge color="green" size="1">{item.discountPercent}% off</Badge>
                                                ) : null}
                                                {item.pendingClientApproval ? (
                                                    <Badge color="amber" size="1">Pending your approval</Badge>
                                                ) : null}
                                            </Flex>
                                            {item.details ? (
                                                <Text as="div" size="2" mt="2" style={{ color: "#374151", whiteSpace: "pre-line", lineHeight: 1.5 }}>
                                                    {item.details}
                                                </Text>
                                            ) : null}
                                        </Table.Cell>
                                        <Table.Cell align="right"><Text style={{ color: "#111827" }}>{item.quantity ?? 0}</Text></Table.Cell>
                                        <Table.Cell align="right"><Text style={{ color: "#111827" }}>${(Number(item.unitPrice) || 0).toFixed(2)}</Text></Table.Cell>
                                        <Table.Cell align="right">
                                            {item.discountPercent ? (
                                                <Box>
                                                    <Text as="div" size="1" style={{ color: "#9ca3af", textDecoration: "line-through" }}>
                                                        ${((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                                                    </Text>
                                                    <Text as="div" weight="bold" style={{ color: "#111827" }}>${(Number(item.total) || 0).toFixed(2)}</Text>
                                                </Box>
                                            ) : (
                                                <Text style={{ color: "#111827" }}>${(Number(item.total) || 0).toFixed(2)}</Text>
                                            )}
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {doc.notes ? (
                        <Box
                            mb="6"
                            style={{
                                padding: "18px 20px",
                                border: "1px solid #d1d5db",
                                borderRadius: 12,
                                background: "#f9fafb",
                            }}
                        >
                            <Text size="2" weight="bold" style={{ color: "#374151", textTransform: "uppercase" }}>
                                {doc.type === "estimate" ? "Project Details" : doc.type === "quote" ? "Scope & terms" : "Notes"}
                            </Text>
                            <Text as="div" mt="2" style={{ color: "#111827", whiteSpace: "pre-line", lineHeight: 1.6 }}>
                                {doc.notes}
                            </Text>
                        </Box>
                    ) : null}

                    {doc.type === "invoice" && (activePaymentMethods.length > 0 || config.billing?.paymentInstructions || config.billing?.checkPayableTo) ? (
                        <Box
                            mb="4"
                            style={{
                                padding: "12px 16px",
                                border: "1px solid #d1d5db",
                                borderRadius: 8,
                                background: "#ffffff",
                            }}
                        >
                            <Text size="2" weight="bold" style={{ color: "#374151", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                Payment Options
                            </Text>
                            {activePaymentMethods.length > 0 ? (
                                <Box
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
                                                                    color: "#3730a3",
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
                                                        <Button asChild size="2">
                                                            <a href={payLink} target="_blank" rel="noreferrer">
                                                                Pay ${invoiceAmountDue.toFixed(2)}
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                        <Text as="div" size="1" color="gray">
                                                            {isCheck || key === "cash" || key === "applePay"
                                                                ? "Use details above to pay with this method."
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
                            ) : null}
                            {config.billing?.paymentInstructions ? (
                                <Box mt="2">
                                    <Text size="2" weight="bold" style={{ color: "#374151" }}>
                                        Payment Instructions
                                    </Text>
                                    <Text as="div" size="2" mt="1" style={{ color: "#111827", whiteSpace: "pre-line", lineHeight: 1.45 }}>
                                        {config.billing.paymentInstructions}
                                    </Text>
                                </Box>
                            ) : null}
                        </Box>
                    ) : null}

                    {doc.type === "estimate" || doc.type === "quote" ? (
                        <Box
                            mb="4"
                            style={{
                                padding: "12px 16px",
                                border: "1px solid #d1d5db",
                                borderRadius: 8,
                                background: "#fffbeb",
                            }}
                        >
                            <Text size="2" style={{ color: "#78350f", lineHeight: 1.5 }}>
                                {doc.type === "estimate"
                                    ? "Flexible estimate: figures are indicative and may change with final scope, materials, or site conditions."
                                    : "Firm quote: the total below is the agreed price for the work described in this document unless you attach a written change order."}
                                {showSplitTotals ? (
                                    <>
                                        {" "}
                                        Lines marked pending approval are not part of the agreed firm price until you approve them in writing.
                                    </>
                                ) : null}
                            </Text>
                        </Box>
                    ) : null}

                    {doc.warranty?.enabled && doc.warranty.text ? (
                        <Box
                            mb="4"
                            style={{
                                padding: "12px 16px",
                                border: "1px solid #bfdbfe",
                                borderRadius: 8,
                                background: "#eff6ff",
                            }}
                        >
                            <Text size="2" weight="bold" style={{ color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                {doc.warranty.title || "Warranty"}
                            </Text>
                            <Text as="div" size="2" mt="1" style={{ color: "#1f2937", whiteSpace: "pre-line", lineHeight: 1.5 }}>
                                {doc.warranty.text}
                            </Text>
                        </Box>
                    ) : null}

                    <Flex justify="between" align="end" className="doc-summary">
                        <Box className="doc-status">
                            <Text
                                size="5"
                                weight="bold"
                                style={{
                                    color: getStatusColor(doc.status),
                                    transform: "rotate(-10deg)",
                                    display: "block",
                                    border: `3px solid ${getStatusColor(doc.status)}`,
                                    padding: "10px 20px",
                                    borderRadius: 8,
                                    letterSpacing: "0.08em",
                                }}
                            >
                                {doc.status.toUpperCase()}
                            </Text>
                            {(doc.type === 'estimate' || doc.type === 'quote') && doc.workflowStatus ? (
                                <Badge
                                    mt="2"
                                    size="2"
                                    color={workflowStatusColor(doc.workflowStatus) as 'gray' | 'orange' | 'blue' | 'green'}
                                >
                                    {workflowStatusLabel(doc.workflowStatus)}
                                </Badge>
                            ) : null}
                        </Box>

                        <Box className="doc-totals" style={{ width: showSplitTotals ? "min(100%, 320px)" : "240px" }}>
                            {hasDiscounts ? (
                                <>
                                    <Flex justify="between" py="2">
                                        <Text size="2" style={{ color: "#4b5563" }}>Subtotal (before discounts)</Text>
                                        <Text size="2" style={{ color: "#111827" }}>${grossSubtotal.toFixed(2)}</Text>
                                    </Flex>
                                    <Flex justify="between" py="2">
                                        <Text size="2" weight="bold" style={{ color: "#15803d" }}>Discount savings</Text>
                                        <Text size="2" weight="bold" style={{ color: "#15803d" }}>−${discountSavings.toFixed(2)}</Text>
                                    </Flex>
                                </>
                            ) : null}
                            {doc.type === "invoice" ? (
                                <>
                                    <Flex justify="between" py="2">
                                        <Text size="2" style={{ color: "#4b5563" }}>Subtotal</Text>
                                        <Text size="2" style={{ color: "#111827" }}>${doc.subtotal.toFixed(2)}</Text>
                                    </Flex>
                                    <Flex justify="between" py="2">
                                        <Text size="2" style={{ color: "#4b5563" }}>Paid</Text>
                                        <Text size="2" style={{ color: "#111827" }}>${paidAmount.toFixed(2)}</Text>
                                    </Flex>
                                </>
                            ) : null}
                            {showSplitTotals ? (
                                <>
                                    <Flex justify="between" py="2">
                                        <Text size="2" style={{ color: "#4b5563" }}>Agreed scope subtotal</Text>
                                        <Text size="2" style={{ color: "#111827" }}>${agreedSubtotal.toFixed(2)}</Text>
                                    </Flex>
                                    <Flex justify="between" py="2">
                                        <Text size="2" style={{ color: "#4b5563" }}>Additional scope (pending approval)</Text>
                                        <Text size="2" style={{ color: "#111827" }}>${pendingSubtotal.toFixed(2)}</Text>
                                    </Flex>
                                </>
                            ) : doc.type !== "invoice" ? (
                                <Flex justify="between" py="2">
                                    <Text size="2" style={{ color: "#4b5563" }}>Subtotal</Text>
                                    <Text size="2" style={{ color: "#111827" }}>${doc.subtotal.toFixed(2)}</Text>
                                </Flex>
                            ) : null}
                            <Flex justify="between" py="2" style={{ borderTop: "2px solid #111827" }}>
                                <Text size="4" weight="bold" style={{ color: "#111827" }}>
                                    {showInvoiceAmountDue ? "Amount Due" : showSplitTotals ? "Total if all approved" : "Total"}
                                </Text>
                                <Text
                                    size="6"
                                    weight="bold"
                                    style={{ color: showInvoiceAmountDue && invoiceAmountDue > 0 ? "#b91c1c" : getStatusColor(doc.status) }}
                                >
                                    ${invoiceAmountDue.toFixed(2)}
                                </Text>
                            </Flex>
                            {showInvoiceAmountDue && paidAmount > 0 ? (
                                <Flex justify="between" pt="2">
                                    <Text size="1" style={{ color: "#6b7280" }}>Original Invoice Total</Text>
                                    <Text size="1" style={{ color: "#6b7280" }}>${doc.total.toFixed(2)}</Text>
                                </Flex>
                            ) : null}
                        </Box>
                    </Flex>
                </div>
            </Card>

            <style>{`
              .doc-card {
                padding: 40px;
              }
              .doc-table-wrap {
                overflow-x: auto;
              }
              @media (max-width: 768px) {
                .doc-card {
                  padding: 18px;
                }
                .doc-toolbar {
                  align-items: stretch;
                }
                .doc-toolbar-actions {
                  width: 100%;
                }
                .doc-toolbar-actions > * {
                  flex: 1 1 calc(50% - 8px);
                }
                .doc-header {
                  flex-direction: column;
                  gap: 14px;
                }
                .doc-meta {
                  text-align: left !important;
                }
                .doc-summary {
                  flex-direction: column;
                  align-items: stretch;
                  gap: 16px;
                }
                .doc-status {
                  align-self: flex-start;
                }
                .doc-totals {
                  width: 100% !important;
                }
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
