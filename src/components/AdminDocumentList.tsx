'use client';

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Callout, Card, Checkbox, Dialog, Flex, IconButton, Select, Table, Text, TextArea, TextField } from "@radix-ui/themes";
import { ArrowRightLeft, CheckCircle, Copy, Edit, Pencil, Plus, Search, Send, X, XCircle } from "lucide-react";
import type { DocumentData, DocumentType, WorkflowStatus } from "@/lib/types";
import LeadEditDialog from "@/components/LeadEditDialog";
import DeleteLeadButton from "@/components/DeleteLeadButton";
import EmptyState from "@/components/EmptyState";
import FilterChips, { type FilterChipOption } from "@/components/FilterChips";
import StatusBadge from "@/components/ui/StatusBadge";
import { convertDocumentsAction, duplicateDocumentsAction, sendDocumentsAction } from "@/app/admin/document-bulk-actions";
import { convertTargets } from "@/lib/convert-document";
import { DOC_LABEL, documentListLabel } from "@/lib/document-labels";
import { hasPendingApprovalLines } from "@/lib/pending-client-approval";
import { WORKFLOW_STATUSES, workflowStatusLabel } from "@/lib/workflow-status";
import { documentDisplayStatus, type DocumentStatusFilter } from "@/lib/status-display";
import { useMoney } from '@/components/MoneyProvider';

export type AdminDocumentListType = "invoice" | "estimate" | "quote" | "receipt" | "lead";

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

function searchPlaceholder(type: AdminDocumentListType) {
    if (type === "lead") return "Search leads by id, number, name, email, notes…";
    return `Search by number, title, or customer…`;
}

function typePluralLabel(type: AdminDocumentListType): string {
    if (type === "receipt") return "receipts";
    return `${type}s`;
}

const STATUS_ORDER: DocumentData["status"][] = ["draft", "sent", "paid", "void"];
const INVOICE_STATUS_FILTERS: DocumentStatusFilter[] = ["open", "overdue", "draft", "paid", "void"];

const STATUS_FILTER_LABELS: Record<DocumentStatusFilter, string> = {
    all: "All",
    open: "Open",
    overdue: "Overdue",
    partial: "Part paid",
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    void: "Void",
};

const UNDATED = "undated";

type SortKey = "newest" | "oldest" | "total-desc" | "total-asc";

const SORT_LABELS: Record<SortKey, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
    "total-desc": "Highest total",
    "total-asc": "Lowest total",
};

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

function matchesStatusFilter(doc: DocumentData, filter: DocumentStatusFilter, now: Date): boolean {
    if (filter === "all") return true;
    if (filter === "open") return doc.status === "sent";
    return documentDisplayStatus(doc, now) === filter;
}

export default function AdminDocumentList({
    type,
    docs,
    initialStatus = "all",
    initialQuery = "",
}: {
    type: AdminDocumentListType;
    docs: DocumentData[];
    /** Seeded from the URL, e.g. /admin/invoices?status=overdue from the dashboard. */
    initialStatus?: DocumentStatusFilter;
    initialQuery?: string;
}) {
    const { format: money } = useMoney();
    const router = useRouter();
    const [now] = useState(() => new Date());
    const [query, setQuery] = useState(initialQuery);
    const [status, setStatus] = useState<DocumentStatusFilter>(initialStatus);
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
            const matchesWorkflow = workflowFilter === "all"
                || doc.workflowStatus === workflowFilter
                || (workflowFilter === "backlog" && !doc.workflowStatus);
            const matchesPeriod = period === "all" || documentYear(doc) === period;
            return matchesQuery && matchesStatusFilter(doc, status, now) && matchesWorkflow && matchesPeriod;
        });

        return matched.sort((a, b) => {
            if (sort === "oldest") return documentTime(a) - documentTime(b) || a.number - b.number;
            if (sort === "total-desc") return b.total - a.total;
            if (sort === "total-asc") return a.total - b.total;
            return documentTime(b) - documentTime(a) || b.number - a.number;
        });
    }, [docs, query, status, workflowFilter, period, sort, now]);

    const plural = typePluralLabel(type);
    const singular = type === "lead" ? "client" : type;

    const statusOptions = useMemo<FilterChipOption<DocumentStatusFilter>[]>(() => {
        const candidates: DocumentStatusFilter[] = type === "invoice" ? INVOICE_STATUS_FILTERS : STATUS_ORDER;
        const options = candidates
            .map((value) => ({
                value,
                label: STATUS_FILTER_LABELS[value],
                count: docs.filter((doc) => matchesStatusFilter(doc, value, now)).length,
            }))
            .filter((option) => option.count > 0 || option.value === status);
        return [{ value: "all", label: "All", count: docs.length }, ...options];
    }, [docs, type, now, status]);

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

    const dateLabel = (doc: DocumentData) => new Date(doc.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

    return (
        <Flex direction="column" gap="4" className="admin-document-list">
            <Card size="2" className="list-filter-card">
                <Flex direction="column" gap="3">
                    <Flex gap="3" wrap="wrap" align="end">
                        <Box style={{ flex: 1, minWidth: "min(100%, 220px)" }}>
                            <TextField.Root
                                size="3"
                                placeholder={searchPlaceholder(type)}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                aria-label={`Search ${plural}`}
                            >
                                <TextField.Slot>
                                    <Search size={16} />
                                </TextField.Slot>
                                {query ? (
                                    <TextField.Slot>
                                        <IconButton size="1" variant="ghost" color="gray" onClick={() => setQuery("")} aria-label="Clear search">
                                            <X size={14} />
                                        </IconButton>
                                    </TextField.Slot>
                                ) : null}
                            </TextField.Root>
                        </Box>
                        <Box style={{ minWidth: 160 }}>
                            <Select.Root value={sort} onValueChange={(value) => setSort(value as SortKey)} size="3">
                                <Select.Trigger aria-label="Sort documents" style={{ width: "100%" }} />
                                <Select.Content>
                                    {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                                        <Select.Item key={key} value={key}>{SORT_LABELS[key]}</Select.Item>
                                    ))}
                                </Select.Content>
                            </Select.Root>
                        </Box>
                    </Flex>
                    <Flex gap="4" wrap="wrap">
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
                </Flex>
            </Card>

            <Flex align="center" justify="between" gap="3" wrap="wrap">
                <Text size="2" color="gray">
                    Showing <span className="ui-figure">{filteredDocs.length}</span> of <span className="ui-figure">{docs.length}</span> {docs.length === 1 ? plural.slice(0, -1) : plural}
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
                <Card className="list-bulk-toolbar">
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
                docs.length === 0 ? (
                    <EmptyState
                        title={`No ${plural} yet`}
                        description={isLead
                            ? "Leads from the public quote form show up here."
                            : `Create your first ${singular} and it will show up here, ready to preview, send, and track.`}
                        action={isLead ? undefined : (
                            <Button asChild size="3">
                                <Link href={`${base}/new`}><Plus size={16} /> New {singular}</Link>
                            </Button>
                        )}
                    />
                ) : (
                    <EmptyState
                        compact
                        icon={Search}
                        title={`No ${plural} match your filters`}
                        description="Older documents stay in this list. Try clearing the search, status, or period filters."
                        action={filtersActive ? <Button size="2" variant="soft" onClick={clearFilters}>Clear filters</Button> : undefined}
                    />
                )
            ) : (
                <>
                    <div className="list-mobile">
                        {filteredDocs.map((doc) => (
                            <div key={doc.id} className="list-row-card">
                                {enableBulk ? (
                                    <Box pt="1" className="list-row-card-actions">
                                        <Checkbox
                                            checked={selectedIds.has(doc.id)}
                                            onCheckedChange={() => toggleOne(doc.id)}
                                            aria-label={`Select ${doc.id}`}
                                        />
                                    </Box>
                                ) : null}
                                <div className="list-row-card-main">
                                    <Link href={`${base}/${doc.id}`} className="list-row-card-link">
                                        <Text as="div" size="2" weight="bold" truncate>{doc.title?.trim() || doc.customer.name || "Untitled"}</Text>
                                    </Link>
                                    <Text as="div" size="1" color="gray" truncate>
                                        {doc.title?.trim() ? `${doc.customer.name} · ` : ""}<span className="ui-figure">{doc.id}</span> · {dateLabel(doc)}
                                    </Text>
                                    {isLead ? (
                                        <Flex gap="2" mt="2" className="list-row-card-actions">
                                            <LeadEditDialog
                                                lead={doc}
                                                trigger={<Button size="1" variant="soft"><Edit size={12} /> Edit</Button>}
                                            />
                                            <DeleteLeadButton leadId={doc.id} leadName={doc.customer.name} size="1" />
                                        </Flex>
                                    ) : null}
                                </div>
                                <div className="list-row-card-aside">
                                    <Text size="3" weight="bold" className="ui-figure">{money(doc.total)}</Text>
                                    <StatusBadge doc={doc} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card className="list-desktop list-table-card">
                        <div className="list-table-scroll">
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
                                        <Table.ColumnHeaderCell>{DOC_LABEL[type]}</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>{type === "lead" ? "Contact" : "Customer"}</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                        {showWorkflow ? <Table.ColumnHeaderCell>Workflow</Table.ColumnHeaderCell> : null}
                                        <Table.ColumnHeaderCell align="right">Total</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell style={{ width: 1 }}><span className="visually-hidden">Actions</span></Table.ColumnHeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {filteredDocs.map((doc) => (
                                        <Table.Row key={doc.id} align="center">
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
                                                <Link href={`${base}/${doc.id}`} className="row-link">{documentListLabel(doc)}</Link>
                                                <Text as="div" size="1" color="gray" className="ui-figure">{doc.id}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text as="div" weight="medium">{doc.customer.name}</Text>
                                                {doc.customer.email ? <Text as="div" size="1" color="gray">{doc.customer.email}</Text> : null}
                                                {type === "lead" ? (
                                                    <Text as="div" size="1" color="gray">
                                                        {doc.customer.clientStage === "potential_client" ? "Potential Client" : "Lead"}
                                                    </Text>
                                                ) : null}
                                            </Table.Cell>
                                            <Table.Cell><Text size="2" className="ui-figure">{dateLabel(doc)}</Text></Table.Cell>
                                            <Table.Cell><StatusBadge doc={doc} /></Table.Cell>
                                            {showWorkflow ? (
                                                <Table.Cell>
                                                    {doc.workflowStatus ? (
                                                        <StatusBadge kind="workflow" status={doc.workflowStatus} />
                                                    ) : (
                                                        <Text size="1" color="gray">—</Text>
                                                    )}
                                                </Table.Cell>
                                            ) : null}
                                            <Table.Cell align="right">
                                                <Text weight="medium" className="ui-figure">{money(doc.total)}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Flex gap="1" justify="end">
                                                    {showEdit ? (
                                                        <IconButton asChild size="2" variant="ghost" color="gray">
                                                            <Link href={`${base}/${doc.id}/edit`} aria-label={`Edit ${doc.id}`}><Pencil size={15} /></Link>
                                                        </IconButton>
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
                        </div>
                    </Card>
                </>
            )}
        </Flex>
    );
}
