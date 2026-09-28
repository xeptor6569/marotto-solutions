import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { AlertTriangle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { DocumentData } from "@/lib/types";
import { getAppConfig } from "@/lib/config";
import { ensureDocumentShareToken } from "@/lib/data";
import { DOC_LABEL } from "@/lib/document-labels";
import { buildInvoicePaymentMethods } from "@/lib/document-paper";
import { paperContextFromConfig } from "@/lib/document-paper-server";
import { documentNextStep, type NextStepTone } from "@/lib/document-next-step";
import {
    hasPendingApprovalLines,
    pendingApprovalLineTotal,
    pendingApprovalSummarySentence,
} from "@/lib/pending-client-approval";
import { documentHasOptions, resolveSelectedLineItems } from "@/lib/document-options";
import { documentBalance } from "@/lib/status-display";
import { auth } from "@/lib/auth";
import { buildSharePath } from "@/lib/share-token";
import { getJobById } from "@/lib/jobs";
import { depositBillingBase } from "@/lib/deposit-invoice";
import { convertTargets } from "@/lib/convert-document";
import { getMoneyFormatter } from "@/lib/branding";
import PrintButton from "@/components/PrintButton";
import ShareButton from "@/components/ShareButton";
import EmailDocumentButton from "@/components/EmailDocumentButton";
import CreateDepositInvoiceButton from "@/components/CreateDepositInvoiceButton";
import ConvertDocumentButton from "@/components/ConvertDocumentButton";
import SaveAsPresetButton from "@/components/SaveAsPresetButton";
import DocumentPreviewActions from "@/components/DocumentPreviewActions";
import DocumentOptionSelectionForm from "@/components/DocumentOptionSelectionForm";
import InvoicePaymentsPanel from "@/components/InvoicePaymentsPanel";
import DocumentPaper from "@/components/document/DocumentPaper";
import StatusBadge from "@/components/ui/StatusBadge";
import PaymentReturnStatus from "@/components/client/PaymentReturnStatus";
import ClientPayBar from "@/components/client/ClientPayBar";

function NextStepIcon({ tone }: { tone: NextStepTone }) {
    if (tone === "danger") return <TriangleAlert size={16} />;
    if (tone === "warning") return <AlertTriangle size={16} />;
    if (tone === "success") return <CheckCircle2 size={16} />;
    return <Info size={16} />;
}

export default async function DocumentPreview({
    doc,
    editHref,
    publicMode = false,
    stripeReturn,
    autoOpenSend = false,
}: {
    doc: DocumentData;
    /** Kept for callers; navigation now comes from the shell breadcrumbs. */
    showBackButton?: boolean;
    backHref?: string;
    editHref?: string;
    /** Client-facing share view: print only, no admin actions. */
    publicMode?: boolean;
    /** Stripe Checkout return status from `/d/{token}?stripe=…`. */
    stripeReturn?: "success" | "cancelled" | null;
    /** Open the send dialog on arrival (after "Save & send" in the editor). */
    autoOpenSend?: boolean;
}) {
    const money = await getMoneyFormatter();
    const session = publicMode ? null : await auth();
    const config = await getAppConfig();
    const context = paperContextFromConfig(config);
    const { business } = context;
    const docTitle = DOC_LABEL[doc.type] ?? "Document";

    let sharePath = "/";
    let shareToken = doc.shareToken || "";
    if (!publicMode && doc.type !== "lead") {
        const ensured = await ensureDocumentShareToken(doc);
        sharePath = buildSharePath(ensured.shareToken);
        shareToken = ensured.shareToken;
    }

    const jobId = doc.jobId || doc.customer?.jobId;
    const linkedJob = jobId ? await getJobById(jobId).catch(() => null) : null;
    const hasOptions = documentHasOptions(doc);
    const resolvedLines = hasOptions ? resolveSelectedLineItems(doc) : (doc.lineItems ?? []);
    const pendingLines = hasPendingApprovalLines(resolvedLines);
    const pendingApprovalSummary = pendingLines
        ? pendingApprovalSummarySentence(docTitle, pendingApprovalLineTotal(resolvedLines), business.money)
        : undefined;

    const paper = (
        <DocumentPaper
            doc={doc}
            context={context}
            money={money}
            publicMode={publicMode}
            shareToken={shareToken}
            linkedJobName={linkedJob?.name ?? null}
            optionSelectionSlot={hasOptions && !publicMode ? (
                <DocumentOptionSelectionForm
                    documentId={doc.id}
                    packages={doc.packages ?? []}
                    choiceGroups={doc.choiceGroups ?? []}
                    initialSelection={doc.optionSelection}
                />
            ) : null}
        />
    );

    if (publicMode) {
        const balance = documentBalance(doc);
        const isInvoice = doc.type === "invoice";
        const paid = isInvoice && (doc.status === "paid" || balance <= 0);
        const canPay = isInvoice && !paid && doc.status !== "void"
            && buildInvoicePaymentMethods(context.billing.paymentMethods, doc, context.stripeConfigured).length > 0;
        const headlineAmount = isInvoice ? balance : doc.total;
        const dateLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

        return (
            <Container size="3" p={{ initial: "3", sm: "5" }} className="print-container">
                {stripeReturn ? <PaymentReturnStatus status={stripeReturn} paid={paid} /> : null}

                <section className="client-summary no-print" aria-label={`${docTitle} summary`}>
                    <div className="client-summary-main">
                        <span className="ui-eyebrow">{docTitle} <span className="ui-figure">{doc.id}</span></span>
                        <Heading size="6" as="h1" mt="1">{doc.title?.trim() || `${docTitle} for ${doc.customer.name}`}</Heading>
                        <Text as="p" size="2" color="gray" mt="1">
                            From {business.name} · {dateLabel(doc.date)}
                            {doc.dueDate ? ` · ${isInvoice ? "Due" : "Valid until"} ${dateLabel(doc.dueDate)}` : ""}
                        </Text>
                    </div>
                    <div className="client-summary-amount">
                        <span className="ui-eyebrow">
                            {isInvoice ? (paid ? "Paid in full" : doc.status === "void" ? "Void" : "Amount due") : "Total"}
                        </span>
                        <div className="client-summary-figure ui-display" data-paid={paid || undefined}>{money(headlineAmount)}</div>
                        {isInvoice && !paid && (doc.paidAmount ?? 0) > 0 ? (
                            <Text as="div" size="1" color="gray">{money(doc.paidAmount ?? 0)} of {money(doc.total)} already paid</Text>
                        ) : null}
                        <Flex gap="2" mt="3" wrap="wrap" justify={{ initial: "start", sm: "end" }}>
                            {canPay ? (
                                <Button asChild size="3"><a href="#payment-options">Pay now</a></Button>
                            ) : null}
                            {!isInvoice && (business.phoneHref || business.email) ? (
                                <Button asChild size="3">
                                    <a href={business.phoneHref || `mailto:${business.email}`}>Ready to go ahead? Get in touch</a>
                                </Button>
                            ) : null}
                        </Flex>
                    </div>
                </section>

                <Flex justify="end" mb="3" className="no-print doc-toolbar" gap="2" wrap="wrap">
                    <Flex gap="2" className="doc-toolbar-actions" wrap="wrap">
                        <PrintButton label={docTitle} fileName={`${docTitle} ${doc.id}`} emphasis="pdf" />
                    </Flex>
                </Flex>
                {paper}
                {canPay ? <ClientPayBar amount={balance} /> : null}
            </Container>
        );
    }

    const canDelete = doc.type === "invoice" || doc.type === "estimate" || doc.type === "quote" || doc.type === "receipt";
    const deleteRedirectTo = jobId ? `/admin/jobs/${jobId}` : `/admin/${doc.type}s`;
    const activePaymentMethods = doc.type === "invoice"
        ? buildInvoicePaymentMethods(context.billing.paymentMethods, doc, context.stripeConfigured)
        : [];
    const nextStep = documentNextStep(doc, money);
    const printFileName = `${docTitle} ${doc.id}`;
    const isProposal = doc.type === "estimate" || doc.type === "quote";
    const canConvertToInvoice = convertTargets(doc.type).includes("invoice");
    const unpaidInvoice = doc.type === "invoice" && doc.status === "sent" && documentBalance(doc) > 0;

    type PrimaryKind = "send" | "remind" | "convert" | "pdf";
    const primaryKind: PrimaryKind =
        doc.status === "draft" && doc.type !== "receipt" ? "send"
            : unpaidInvoice ? "remind"
                : isProposal && doc.status === "sent" && canConvertToInvoice ? "convert"
                    : "pdf";

    const emailButton = (variant: "solid" | "soft", label?: string) => (
        <EmailDocumentButton
            documentId={doc.id}
            sharePath={sharePath}
            docTitle={docTitle}
            defaultTo={doc.customer.email}
            canSendViaServer={!!session}
            serverEmailConfigured={!!process.env.EMAIL_SERVER}
            pendingApprovalSummary={pendingApprovalSummary}
            businessName={business.name}
            triggerVariant={variant}
            triggerLabel={label}
            defaultOpen={autoOpenSend}
        />
    );
    const shareButton = (
        <ShareButton label={docTitle} sharePath={sharePath} shareTitle={`${docTitle} ${doc.id}`} businessName={business.name} />
    );

    const primary = primaryKind === "send"
        ? emailButton("solid", `Send ${docTitle.toLowerCase()}`)
        : primaryKind === "remind"
            ? emailButton("solid", "Send reminder")
            : primaryKind === "convert"
                ? <ConvertDocumentButton sourceDocumentId={doc.id} sourceType={doc.type} hasPendingApproval={pendingLines} primary />
                : <PrintButton label={docTitle} fileName={printFileName} emphasis="pdf" />;

    const secondary = (
        <>
            {primaryKind === "convert" || primaryKind === "pdf" ? emailButton("soft", "Email") : null}
            {shareButton}
        </>
    );

    const overflow = [
        isProposal ? (
            <CreateDepositInvoiceButton key="deposit" sourceDocumentId={doc.id} billingBase={depositBillingBase(doc)} sourceLabel={docTitle} />
        ) : null,
        convertTargets(doc.type).length > 0 && primaryKind !== "convert" ? (
            <ConvertDocumentButton key="convert" sourceDocumentId={doc.id} sourceType={doc.type} hasPendingApproval={pendingLines} />
        ) : null,
        doc.type !== "lead" ? (
            <SaveAsPresetButton key="preset" mode="document" documentId={doc.id} defaultName={doc.title || undefined} />
        ) : null,
    ];

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }} className="print-container">
            <header className="doc-page-header no-print">
                <Flex justify="between" align={{ initial: "start", md: "end" }} gap="3" direction={{ initial: "column", md: "row" }}>
                    <Box style={{ minWidth: 0 }}>
                        <span className="ui-eyebrow">{docTitle} <span className="ui-figure">{doc.id}</span></span>
                        <Heading size="6" as="h1" mt="1" className="doc-page-title">{doc.title?.trim() || doc.customer.name || doc.id}</Heading>
                        <Flex align="center" gap="2" mt="2" wrap="wrap">
                            <StatusBadge doc={doc} size="2" />
                            {doc.title?.trim() && doc.customer.name ? (
                                <Text size="2" color="gray">{doc.customer.name}</Text>
                            ) : null}
                            <Text size="2" color="gray" className="ui-figure">· {money(doc.total)}</Text>
                        </Flex>
                    </Box>
                    <DocumentPreviewActions
                        editHref={editHref}
                        docTitle={docTitle}
                        documentId={doc.id}
                        deleteRedirectTo={deleteRedirectTo}
                        canDelete={canDelete}
                        primary={primary}
                        secondary={secondary}
                        overflow={overflow}
                        overflowPrint={primaryKind === "pdf" ? undefined : <PrintButton label={docTitle} fileName={printFileName} />}
                    />
                </Flex>
                <div className="next-step" data-tone={nextStep.tone} role="status">
                    <NextStepIcon tone={nextStep.tone} />
                    <Text size="2">{nextStep.message}</Text>
                </div>
            </header>

            {doc.type === "invoice" ? (
                <InvoicePaymentsPanel
                    invoiceId={doc.id}
                    status={doc.status}
                    total={doc.total}
                    payments={doc.payments ?? []}
                    paymentMethods={activePaymentMethods
                        .filter(([, method]) => method.enabled && !method.comingSoon)
                        .map(([, method]) => method.label)}
                />
            ) : null}

            {paper}
        </Container>
    );
}
