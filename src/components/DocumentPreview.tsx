import { Box, Button, Card, Container, Flex, Heading, Table, Text } from "@radix-ui/themes";
import Link from "next/link";
import type { DocumentData } from "@/lib/types";
import { getAppConfig } from "@/lib/config";
import { DOC_LABEL } from "@/lib/document-labels";
import { auth } from "@/lib/auth";
import PrintButton from "@/components/PrintButton";
import ShareButton from "@/components/ShareButton";
import EmailDocumentButton from "@/components/EmailDocumentButton";
import BackButton from "@/components/BackButton";

function getStatusColor(status: DocumentData["status"]) {
    if (status === "paid") return "#166534";
    if (status === "void") return "#b91c1c";
    if (status === "sent") return "#1d4ed8";
    return "#92400e";
}

function getDisplayName(doc: DocumentData) {
    return doc.title ? `${doc.id} - ${doc.title}` : doc.id;
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
        ? Object.values(config.billing?.paymentMethods || {}).filter((method) => method.enabled)
        : [];

    return (
        <Container size="3" p="5" className="print-container">
            <Flex justify="between" mb="4" className="no-print">
                {showBackButton ? <BackButton href={backHref} /> : <Box />}
                <Flex gap="2">
                    {editHref ? (
                        <Button asChild variant="soft">
                            <Link href={editHref}>Edit {docTitle}</Link>
                        </Button>
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
                        />
                    ) : null}
                    <PrintButton label={docTitle} />
                </Flex>
            </Flex>

            <Card size="3" style={{ padding: "40px", background: "white", color: "#111827", border: "1px solid #d1d5db" }}>
                <div className="receipt-content">
                    <Flex justify="between" align="start" mb="6">
                        <Box>
                            <Heading size="8" style={{ color: "#111827", marginBottom: 4 }}>MAROTTO</Heading>
                            <Text size="3" weight="bold" style={{ color: "#374151", letterSpacing: "2px" }}>SOLUTIONS</Text>
                            <Box mt="4">
                                <Text as="div" size="2" style={{ color: "#1f2937" }}>28 E Mountain Ridge MHP</Text>
                                <Text as="div" size="2" style={{ color: "#1f2937" }}>Wilkes Barre, PA 18702</Text>
                                <Text as="div" size="2" style={{ color: "#1f2937" }}>(570) 332-9262</Text>
                            </Box>
                        </Box>
                        <Box style={{ textAlign: "right" }}>
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
                    </Box>

                    <Table.Root variant="surface" style={{ width: "100%", marginBottom: "30px" }}>
                        <Table.Header>
                            <Table.Row style={{ background: "#f3f4f6" }}>
                                <Table.ColumnHeaderCell style={{ color: "#1f2937" }}>Description</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell align="right" style={{ color: "#1f2937" }}>Qty</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell align="right" style={{ color: "#1f2937" }}>Unit</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell align="right" style={{ color: "#1f2937" }}>Amount</Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {doc.lineItems.map((item) => (
                                <Table.Row key={item.id}>
                                    <Table.Cell>
                                        <Text weight="bold" style={{ color: "#111827" }}>{item.description}</Text>
                                        {item.details ? (
                                            <Text as="div" size="2" mt="2" style={{ color: "#374151", whiteSpace: "pre-line", lineHeight: 1.5 }}>
                                                {item.details}
                                            </Text>
                                        ) : null}
                                    </Table.Cell>
                                    <Table.Cell align="right"><Text style={{ color: "#111827" }}>{item.quantity}</Text></Table.Cell>
                                    <Table.Cell align="right"><Text style={{ color: "#111827" }}>${item.unitPrice.toFixed(2)}</Text></Table.Cell>
                                    <Table.Cell align="right"><Text style={{ color: "#111827" }}>${item.total.toFixed(2)}</Text></Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>

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
                                    {activePaymentMethods.map((method) => {
                                        const isCheck = method.label === "Check";
                                        const detailParts: string[] = [];
                                        if (method.value) detailParts.push(method.value);
                                        if (isCheck && config.billing?.checkPayableTo) {
                                            detailParts.push(`Payable to: ${config.billing.checkPayableTo}`);
                                        }
                                        const primary = detailParts.join(" · ");
                                        return (
                                            <Box key={`${method.label}-${method.value || method.note || "method"}`}>
                                                <Text as="div" size="2" style={{ color: "#111827", lineHeight: 1.35 }}>
                                                    <Text weight="bold" as="span">{method.label}</Text>
                                                    {method.comingSoon ? (
                                                        <Text as="span" size="1" style={{ color: "#6b7280" }}> (coming soon)</Text>
                                                    ) : null}
                                                    {primary ? (
                                                        <Text as="span" style={{ color: "#1f2937" }}>: {primary}</Text>
                                                    ) : null}
                                                </Text>
                                                {method.note ? (
                                                    <Text
                                                        as="div"
                                                        size="1"
                                                        style={{ color: "#6b7280", lineHeight: 1.35, marginTop: 1, whiteSpace: "pre-line" }}
                                                    >
                                                        {method.note}
                                                    </Text>
                                                ) : null}
                                            </Box>
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
                            </Text>
                        </Box>
                    ) : null}

                    <Flex justify="between" align="end">
                        <Box>
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
                        </Box>

                        <Box style={{ width: "240px" }}>
                            <Flex justify="between" py="2">
                                <Text size="2" style={{ color: "#4b5563" }}>Subtotal</Text>
                                <Text size="2" style={{ color: "#111827" }}>${doc.subtotal.toFixed(2)}</Text>
                            </Flex>
                            <Flex justify="between" py="2" style={{ borderTop: "2px solid #111827" }}>
                                <Text size="4" weight="bold" style={{ color: "#111827" }}>Total</Text>
                                <Text size="6" weight="bold" style={{ color: getStatusColor(doc.status) }}>${doc.total.toFixed(2)}</Text>
                            </Flex>
                        </Box>
                    </Flex>
                </div>
            </Card>

            <style>{`
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
