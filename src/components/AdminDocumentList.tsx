'use client';

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Box, Button, Callout, Card, Checkbox, Dialog, Flex, Select, Table, Text, TextArea, TextField } from "@radix-ui/themes";
import { ArrowRightLeft, CheckCircle, Copy, Edit, Search, Send, X, XCircle } from "lucide-react";
import type { DocumentData, DocumentType, WorkflowStatus } from "@/lib/types";
import LeadEditDialog from "@/components/LeadEditDialog";
import DeleteLeadButton from "@/components/DeleteLeadButton";
import EmptyState from "@/components/EmptyState";
import FilterChips, { type FilterChipOption } from "@/components/FilterChips";
import { convertDocumentsAction, duplicateDocumentsAction, sendDocumentsAction } from "@/app/admin/document-bulk-actions";
import { convertTargets } from "@/lib/convert-document";
import { DOC_LABEL, documentListLabel } from "@/lib/document-labels";
import { hasPendingApprovalLines } from "@/lib/pending-client-approval";
import { WORKFLOW_STATUSES, workflowStatusLabel, workflowStatusColor } from "@/lib/workflow-status";

export type AdminDocumentListType = "invoice" | "estimate" | "quote" | "receipt" | "lead";

function badgeColor(status: DocumentData["status"]) {
    if (status === "paid") return "green";
    if (status === "void") return "red";
    if (status === "sent") return "blue";
    return "orange";
}

function adminPluralPath(type: AdminDocumentListType): string {
    const paths: Record<AdminDocumentListType, string> = {
        invoice: "invoices",
        estimate: "estimates",
        quote: "quotes",
        receipt: "receipts",
        lead: "leads",
    };
    return paths[type];
}

function adminBase(type: AdminDocumentListType): string {
    return `/admin/${adminPluralPath(type)}`;
}

function docNumberLabel(type: AdminDocumentListType) {
    if (type === "invoice") return "Invoice #";
    if (type === "quote") return "Quote #";
    if (type === "estimate") return "Estimate #";
    if (type === "receipt") return "Receipt #";
    return "Lead #";
}

function searchPlaceholder(type: AdminDocumentListType) {
    if (type === "lead") return "Search leads by id, number, name, email, notes…";
    return `Search ${type}s by number, id, customer…`;
}

function typePluralLabel(type: AdminDocumentListType): string {
    if (type === "receipt") return "receipts";
    return `${type}s`;
}

const STATUS_ORDER: DocumentData["status"][] = ["draft", "sent", "paid", "void"];

const UNDATED = "undated";

type SortKey = "newest" | "oldest" | "total-desc" | "total-asc";

const SORT_LABELS: Record<SortKey, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
    "total-desc": "Highest total",
    "total-asc": "Lowest total",
};

function statusFilterLabel(status: "all" | DocumentData["status"]): string {
    if (status === "all") return "All";
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function documentTime(doc: DocumentData): number {
    const time = new Date(doc.date).getTime();
    return Number.isNaN(time) ? 0 : time;
}

/** Year bucket used by the period filter; documents with an unreadable date fall into "undated". */
function documentYear(doc: DocumentData): string {
    const parsed = new Date(doc.date);
    if (Number.isNaN(parsed.getTime())) return UNDATED;
    return String(parsed.getFullYear());
}

export default function AdminDocumentList({
    type,
    docs,
}: {
    type: AdminDocumentListType;
    docs: DocumentData[];
}) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<"all" | DocumentData["status"]>("all");
    const [workflowFilter, setWorkflowFilter] = useState<"all" | WorkflowStatus>("all");
    const [period, setPeriod] = useState("all");
    const [sort, setSort] = useState<SortKey>("newest");
    const showWorkflow = type === "estimate" || type === "quote";
    const base = adminBase(type);
    const isLead = type === "lead";
    const showEdit = !isLead;
    const enableBulk = !isLead;

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
    const [sendOpen, setSendOpen] = useState(false);
    const [sendMessage, setSendMessage] = useState("");
    const [confirmConvertTarget, setConfirmConvertTarget] = useState<DocumentType | null>(null);

    const conversionTargets = useMemo(() => convertTargets(type as DocumentType), [type]);

    const toggleOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const filteredDocs = useMemo(() => {
        const q = query.trim().toLowerCase();
        const matched = docs.filter((doc) => {
            const matchesQuery = !q
                || doc.id.toLowerCase().includes(q)
                || String(doc.number).includes(q)
                || (doc.title || "").toLowerCase().includes(q)
                || (doc.customer.name || "").toLowerCase().includes(q)
                || (doc.customer.email || "").toLowerCase().includes(q)
                || (doc.notes || "").toLowerCase().includes(q);
            const matchesStatus = status === "all" || doc.status === status;
            const matchesWorkflow = workflowFilter === "all"
                || doc.workflowStatus === workflowFilter
                || (workflowFilter === "backlog" && !doc.workflowStatus);
            const matchesPeriod = period === "all" || documentYear(doc) === period;
            return matchesQuery && matchesStatus && matchesWorkflow && matchesPeriod;
        });

        return matched.sort((a, b) => {
            if (sort === "oldest") return documentTime(a) - documentTime(b) || a.number - b.number;
            if (sort === "total-desc") return b.total - a.total;
            if (sort === "total-asc") return a.total - b.total;
            return documentTime(b) - documentTime(a) || b.number - a.number;
        });
    }, [docs, query, status, workflowFilter, period, sort]);

    const numberLabel = docNumberLabel(type);
    const plural = typePluralLabel(type);

    const statusOptions = useMemo<FilterChipOption<"all" | DocumentData["status"]>[]>(() => {
        const counts = new Map<DocumentData["status"], number>();
        for (const doc of docs) counts.set(doc.status, (counts.get(doc.status) || 0) + 1);
        return [
            { value: "all" as const, label: statusFilterLabel("all"), count: docs.length },
            ...STATUS_ORDER.filter((s) => counts.has(s)).map((s) => ({
                value: s,
                label: statusFilterLabel(s),
                count: counts.get(s),
            })),
        ];
    }, [docs]);

    const workflowOptions = useMemo<FilterChipOption<"all" | WorkflowStatus>[]>(() => {
        const counts = new Map<WorkflowStatus, number>();
        for (const doc of docs) {
            const value = doc.workflowStatus ?? "backlog";
            counts.set(value, (counts.get(value) || 0) + 1);
        }
        return [
            { value: "all" as const, label: "All", count: docs.length },
            ...WORKFLOW_STATUSES.map((s) => ({
                value: s,
                label: workflowStatusLabel(s),
                count: counts.get(s) || 0,
            })),
        ];
    }, [docs]);

    // Older documents are hard to reach in a long list, so offer a jump-to-year filter.
    const periodOptions = useMemo<FilterChipOption<string>[]>(() => {
        const counts = new Map<string, number>();
        for (const doc of docs) {
            const year = documentYear(doc);
            counts.set(year, (counts.get(year) || 0) + 1);
        }
        const years = Array.from(counts.keys())
            .filter((year) => year !== UNDATED)
            .sort((a, b) => Number(b) - Number(a));
        const options: FilterChipOption<string>[] = [
            { value: "all", label: "All time", count: docs.length },
            ...years.map((year) => ({ value: year, label: year, count: counts.get(year) })),
        ];
        if (counts.has(UNDATED)) {
            options.push({ value: UNDATED, label: "No date", count: counts.get(UNDATED) });
        }
        return options;
    }, [docs]);

    const filtersActive = query.trim() !== "" || status !== "all" || workflowFilter !== "all" || period !== "all";

    const clearFilters = () => {
        setQuery("");
        setStatus("all");
        setWorkflowFilter("all");
        setPeriod("all");
    };

    const allVisibleSelected = filteredDocs.length > 0 && filteredDocs.every((d) => selectedIds.has(d.id));
    const someVisibleSelected = filteredDocs.some((d) => selectedIds.has(d.id));

    const toggleAllVisible = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                filteredDocs.forEach((d) => next.delete(d.id));
            } else {
                filteredDocs.forEach((d) => next.add(d.id));
            }
            return next;
        });
    };

    const selectedDocs = useMemo(
        () => docs.filter((d) => selectedIds.has(d.id)),
        [docs, selectedIds],
    );

    const sendSummary = useMemo(() => {
        const recipients = new Set<string>();
        let withoutEmail = 0;
        for (const doc of selectedDocs) {
            const email = doc.customer.email?.trim();
            if (email) recipients.add(email.toLowerCase());
            else withoutEmail++;
        }
        return { recipients: recipients.size, withoutEmail };
    }, [selectedDocs]);

    const handleDuplicate = () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        setFeedback(null);
        startTransition(async () => {
            const result = await duplicateDocumentsAction(ids);
            if (result.success) {
                setFeedback({ success: true, message: `Duplicated ${result.count} ${result.count === 1 ? plural.slice(0, -1) : plural} as drafts.` });
                clearSelection();
                router.refresh();
            } else {
                setFeedback({ success: false, message: result.error || "Failed to duplicate." });
            }
        });
    };

    const runConvert = (targetType: DocumentType, confirmPending = false) => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        setFeedback(null);
        startTransition(async () => {
            const result = await convertDocumentsAction(ids, targetType, confirmPending);
            if (result.success) {
                const targetPlural = `${DOC_LABEL[targetType].toLowerCase()}s`;
                const skippedNote = result.skipped ? ` (${result.skipped} skipped — not convertible)` : "";
                setFeedback({
                    success: true,
                    message: `Converted ${result.count} ${result.count === 1 ? "document" : "documents"} to ${targetPlural} as drafts${skippedNote}.`,
                });
                clearSelection();
                router.refresh();
            } else {
                setFeedback({ success: false, message: result.error || "Failed to convert." });
            }
        });
    };

    const handleConvert = (targetType: DocumentType) => {
        const willBillPending = targetType === "invoice"
            && selectedDocs.some((d) => hasPendingApprovalLines(d.lineItems));
        if (willBillPending) {
            setFeedback(null);
            setConfirmConvertTarget(targetType);
            return;
        }
        runConvert(targetType);
    };

    const handleSend = () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        setFeedback(null);
        startTransition(async () => {
            const result = await sendDocumentsAction(ids, sendMessage);
            if (result.success) {
                const skippedNote = result.skipped ? ` (${result.skipped} skipped with no email)` : "";
                setFeedback({
                    success: true,
                    message: `Sent ${result.documents} ${result.documents === 1 ? "document" : "documents"} to ${result.recipients} ${result.recipients === 1 ? "recipient" : "recipients"}${skippedNote}.`,
                });
                setSendOpen(false);
                setSendMessage("");
                clearSelection();
            } else {
                setFeedback({ success: false, message: result.error || "Failed to send." });
            }
        });
    };

    return (
        <Flex direction="column" gap="4" className="admin-document-list">
            <Card>
                <Flex gap="3" wrap="wrap" align="end">
                    <Box style={{ flex: 1, minWidth: "min(100%, 200px)" }}>
                        <Text as="label" size="2">Search</Text>
                        <TextField.Root
                            placeholder={searchPlaceholder(type)}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        >
                            <TextField.Slot>
                                <Search size={14} />
                            </TextField.Slot>
                        </TextField.Root>
                    </Box>

                    <Box style={{ minWidth: 160 }}>
                        <Text as="label" size="2">Sort</Text>
                        <Box mt="1">
                            <Select.Root value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                                <Select.Trigger aria-label="Sort documents" style={{ width: "100%" }} />
                                <Select.Content>
                                    {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                                        <Select.Item key={key} value={key}>{SORT_LABELS[key]}</Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Root>
                        </Box>
                    </Box>

                    <FilterChips label="Status" options={statusOptions} value={status} onChange={setStatus} />

                    {showWorkflow ? (
                        <FilterChips
                            label="Workflow"
                            options={workflowOptions}
                            value={workflowFilter}
                            onChange={setWorkflowFilter}
                        />
                    ) : null}

                    <FilterChips label="Period" options={periodOptions} value={period} onChange={setPeriod} />
                </Flex>
            </Card>

            <Flex align="center" justify="between" gap="3" wrap="wrap">
                <Text size="2" color="gray">
                    Showing {filteredDocs.length} of {docs.length} {docs.length === 1 ? plural.slice(0, -1) : plural}
                </Text>
                {filtersActive ? (
                    <Button size="1" variant="ghost" color="gray" onClick={clearFilters}>Clear filters</Button>
                ) : null}
            </Flex>

            {feedback ? (
                <Callout.Root color={feedback.success ? "green" : "red"}>
                    <Callout.Icon>{feedback.success ? <CheckCircle size={16} /> : <XCircle size={16} />}</Callout.Icon>
                    <Callout.Text>{feedback.message}</Callout.Text>
                </Callout.Root>
            ) : null}

            {enableBulk && selectedIds.size > 0 ? (
                <Card className="admin-doc-list-toolbar">
                    <Flex align="center" justify="between" gap="3" wrap="wrap">
                        <Text size="2" weight="bold">{selectedIds.size} selected</Text>
                        <Flex gap="2" wrap="wrap">
                            <Button size="2" variant="soft" onClick={handleDuplicate} disabled={isPending}>
                                <Copy size={14} /> Duplicate
                            </Button>
                            {conversionTargets.map((target) => (
                                <Button
                                    key={target}
                                    size="2"
                                    variant="soft"
                                    onClick={() => handleConvert(target)}
                                    disabled={isPending}
                                >
                                    <ArrowRightLeft size={14} /> To {DOC_LABEL[target].toLowerCase()}
                                </Button>
                            ))}
                            <Button size="2" onClick={() => { setFeedback(null); setSendOpen(true); }} disabled={isPending}>
                                <Send size={14} /> Send
                            </Button>
                            <Button size="2" variant="ghost" color="gray" onClick={clearSelection} disabled={isPending}>
                                <X size={14} /> Clear
                            </Button>
                        </Flex>
                    </Flex>
                </Card>
            ) : null}

            <Dialog.Root open={sendOpen} onOpenChange={setSendOpen}>
                <Dialog.Content style={{ maxWidth: 480 }}>
                    <Dialog.Title>Send {selectedIds.size} {selectedIds.size === 1 ? plural.slice(0, -1) : plural}</Dialog.Title>
                    <Dialog.Description size="2" mb="3">
                        Each recipient gets one email containing links to all of their selected documents.
                    </Dialog.Description>
                    <Flex direction="column" gap="3">
                        <Callout.Root color={sendSummary.recipients === 0 ? "red" : "blue"}>
                            <Callout.Icon><Send size={16} /></Callout.Icon>
                            <Callout.Text>
                                {sendSummary.recipients === 0
                                    ? "None of the selected documents have a recipient email."
                                    : `${sendSummary.recipients} ${sendSummary.recipients === 1 ? "recipient" : "recipients"} will be emailed.`}
                                {sendSummary.withoutEmail > 0 ? ` ${sendSummary.withoutEmail} document(s) without an email will be skipped.` : ""}
                            </Callout.Text>
                        </Callout.Root>
                        <Box>
                            <Text as="label" size="2" weight="bold">Optional message</Text>
                            <TextArea
                                placeholder="Add a short note to include in the email…"
                                value={sendMessage}
                                onChange={(e) => setSendMessage(e.target.value)}
                                rows={3}
                            />
                        </Box>
                        <Flex gap="3" mt="1" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray" type="button">Cancel</Button>
                            </Dialog.Close>
                            <Button onClick={handleSend} loading={isPending} disabled={isPending || sendSummary.recipients === 0}>
                                <Send size={14} /> Send emails
                            </Button>
                        </Flex>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root
                open={confirmConvertTarget !== null}
                onOpenChange={(open) => { if (!open) setConfirmConvertTarget(null); }}
            >
                <Dialog.Content style={{ maxWidth: 440 }}>
                    <Dialog.Title>Include scope pending approval?</Dialog.Title>
                    <Dialog.Description size="2" mb="3">
                        Some selected documents have line items still pending client approval.
                        Converting to an invoice will bill all line items. Continue?
                    </Dialog.Description>
                    <Flex gap="3" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray" type="button">Cancel</Button>
                        </Dialog.Close>
                        <Button
                            onClick={() => {
                                const target = confirmConvertTarget;
                                setConfirmConvertTarget(null);
                                if (target) runConvert(target, true);
                            }}
                            loading={isPending}
                        >
                            Bill all & convert
                        </Button>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>

            {filteredDocs.length === 0 ? (
                <EmptyState
                    title={docs.length === 0 ? `No ${plural} yet.` : `No ${plural} match your filters.`}
                    description={docs.length === 0
                        ? undefined
                        : "Older documents stay in this list — try clearing the search, status, or period filters."}
                    action={docs.length === 0 || !filtersActive
                        ? undefined
                        : <Button size="2" variant="soft" onClick={clearFilters}>Clear filters</Button>}
                />
            ) : (
                <>
                    {/* Mobile: stacked cards */}
                    <Flex direction="column" gap="3" className="admin-doc-list-mobile">
                        {filteredDocs.map((doc) => (
                            <Card key={doc.id}>
                                <Flex direction="column" gap="3">
                                    <Flex justify="between" align="start" gap="2" wrap="wrap">
                                        <Flex gap="2" align="start" style={{ minWidth: 0, flex: "1 1 140px" }}>
                                            {enableBulk ? (
                                                <Box pt="1">
                                                    <Checkbox
                                                        checked={selectedIds.has(doc.id)}
                                                        onCheckedChange={() => toggleOne(doc.id)}
                                                        aria-label={`Select ${doc.id}`}
                                                    />
                                                </Box>
                                            ) : null}
                                            <Box style={{ minWidth: 0 }}>
                                                <Text size="1" color="gray" weight="bold">{numberLabel}</Text>
                                                <Text as="div" weight="bold" size="3">{documentListLabel(doc)}</Text>
                                                <Text as="div" size="1" color="gray">{doc.id}</Text>
                                            </Box>
                                        </Flex>
                                        <Badge color={badgeColor(doc.status)}>{doc.status}</Badge>
                                    </Flex>
                                    <Box>
                                        <Text size="1" color="gray" weight="bold">{type === "lead" ? "Contact" : "Customer"}</Text>
                                        <Text as="div" weight="medium">{doc.customer.name}</Text>
                                        {doc.customer.email ? (
                                            <Text as="div" size="2" color="gray" style={{ wordBreak: "break-word" }}>{doc.customer.email}</Text>
                                        ) : null}
                                        {type === "lead" ? (
                                            <Text as="div" size="1" color="gray">
                                                Stage: {doc.customer.clientStage === "potential_client" ? "Potential Client" : "Lead"}
                                            </Text>
                                        ) : null}
                                    </Box>
                                    <Flex justify="between" align="center" gap="2" wrap="wrap">
                                        <Box>
                                            <Text size="1" color="gray">Date</Text>
                                            <Text size="2">{new Date(doc.date).toLocaleDateString()}</Text>
                                        </Box>
                                        <Box style={{ textAlign: "right" }}>
                                            <Text size="1" color="gray">Total</Text>
                                            <Text weight="bold" size="3">${doc.total.toFixed(2)}</Text>
                                        </Box>
                                    </Flex>
                                    <Flex gap="2" wrap="wrap" style={{ width: "100%" }}>
                                        <Button asChild size="2" variant="soft" style={{ flex: 1, minWidth: 110 }}>
                                            <Link href={`${base}/${doc.id}`}>Preview</Link>
                                        </Button>
                                        {showEdit ? (
                                            <Button asChild size="2" style={{ flex: 1, minWidth: 110 }}>
                                                <Link href={`${base}/${doc.id}/edit`}>Edit</Link>
                                            </Button>
                                        ) : null}
                                        {isLead ? (
                                            <>
                                                <Box style={{ flex: 1, minWidth: 110 }}>
                                                    <LeadEditDialog
                                                        lead={doc}
                                                        trigger={
                                                            <Button size="2" variant="soft" style={{ width: "100%" }}>
                                                                <Edit size={14} /> Edit
                                                            </Button>
                                                        }
                                                    />
                                                </Box>
                                                <Box style={{ flex: 1, minWidth: 110 }}>
                                                    <DeleteLeadButton
                                                        leadId={doc.id}
                                                        leadName={doc.customer.name}
                                                        size="2"
                                                        fullWidth
                                                    />
                                                </Box>
                                            </>
                                        ) : null}
                                    </Flex>
                                </Flex>
                            </Card>
                        ))}
                    </Flex>

                    {/* Desktop: table */}
                    <Card className="admin-doc-list-desktop" style={{ padding: 0, overflow: "hidden" }}>
                        <Box style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                            <Table.Root style={{ minWidth: (showEdit ? 640 : 520) + (enableBulk ? 44 : 0) }}>
                                <Table.Header>
                                    <Table.Row>
                                        {enableBulk ? (
                                            <Table.ColumnHeaderCell style={{ width: 40 }}>
                                                <Checkbox
                                                    checked={allVisibleSelected ? true : (someVisibleSelected ? "indeterminate" : false)}
                                                    onCheckedChange={toggleAllVisible}
                                                    aria-label="Select all"
                                                />
                                            </Table.ColumnHeaderCell>
                                        ) : null}
                                        <Table.ColumnHeaderCell>
                                            {numberLabel}
                                        </Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>{type === "lead" ? "Contact" : "Customer"}</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell align="right">Total</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                        {showWorkflow ? <Table.ColumnHeaderCell>Workflow</Table.ColumnHeaderCell> : null}
                                        <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {filteredDocs.map((doc) => (
                                        <Table.Row key={doc.id}>
                                            {enableBulk ? (
                                                <Table.Cell>
                                                    <Checkbox
                                                        checked={selectedIds.has(doc.id)}
                                                        onCheckedChange={() => toggleOne(doc.id)}
                                                        aria-label={`Select ${doc.id}`}
                                                    />
                                                </Table.Cell>
                                            ) : null}
                                            <Table.Cell>
                                                <Text weight="bold">{documentListLabel(doc)}</Text>
                                                <Text as="div" size="1" color="gray">{doc.id}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text weight="bold">{doc.customer.name}</Text>
                                                {doc.customer.email ? <Text as="div" size="1" color="gray">{doc.customer.email}</Text> : null}
                                                {type === "lead" ? (
                                                    <Text as="div" size="1" color="gray">
                                                        {doc.customer.clientStage === "potential_client" ? "Potential Client" : "Lead"}
                                                    </Text>
                                                ) : null}
                                            </Table.Cell>
                                            <Table.Cell>{new Date(doc.date).toLocaleDateString()}</Table.Cell>
                                            <Table.Cell align="right">${doc.total.toFixed(2)}</Table.Cell>
                                            <Table.Cell>
                                                <Badge color={badgeColor(doc.status)}>{doc.status}</Badge>
                                            </Table.Cell>
                                            {showWorkflow ? (
                                                <Table.Cell>
                                                    {doc.workflowStatus ? (
                                                        <Badge color={workflowStatusColor(doc.workflowStatus) as 'gray' | 'orange' | 'blue' | 'green'}>
                                                            {workflowStatusLabel(doc.workflowStatus)}
                                                        </Badge>
                                                    ) : (
                                                        <Text size="1" color="gray">—</Text>
                                                    )}
                                                </Table.Cell>
                                            ) : null}
                                            <Table.Cell>
                                                <Flex gap="2" wrap="wrap">
                                                    <Button asChild size="2" variant="soft">
                                                        <Link href={`${base}/${doc.id}`}>Preview</Link>
                                                    </Button>
                                                    {showEdit ? (
                                                        <Button asChild size="2">
                                                            <Link href={`${base}/${doc.id}/edit`}>Edit</Link>
                                                        </Button>
                                                    ) : null}
                                                    {isLead ? (
                                                        <>
                                                            <LeadEditDialog
                                                                lead={doc}
                                                                trigger={
                                                                    <Button size="2" variant="soft">
                                                                        <Edit size={14} /> Edit
                                                                    </Button>
                                                                }
                                                            />
                                                            <DeleteLeadButton
                                                                leadId={doc.id}
                                                                leadName={doc.customer.name}
                                                            />
                                                        </>
                                                    ) : null}
                                                </Flex>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    </Card>
                </>
            )}

            <style>{`
                .admin-doc-list-mobile { display: flex; }
                .admin-doc-list-desktop { display: none; }
                .admin-doc-list-toolbar {
                    position: sticky;
                    top: 8px;
                    z-index: 10;
                    border: 1px solid var(--accent-7);
                }
                @media (min-width: 768px) {
                    .admin-doc-list-mobile { display: none !important; }
                    .admin-doc-list-desktop { display: block !important; }
                }
            `}</style>
        </Flex>
    );
}
