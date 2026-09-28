'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { Box, Button, Card, Flex, IconButton, Table, Text, TextField } from "@radix-ui/themes";
import { ChevronRight, Paperclip, Search, X } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import FilterChips, { type FilterChipOption } from "@/components/FilterChips";
import StatusBadge from "@/components/ui/StatusBadge";
import { statusDisplay } from "@/lib/status-display";
import type { JobDocumentCounts } from "@/lib/jobs";

export interface AdminJobsListItem {
    id: string;
    name: string;
    description: string | null;
    status: string;
    updatedAt: string;
    counts: JobDocumentCounts;
    attachmentCount: number;
}

const STATUS_ORDER = ["active", "paused", "closed"];

function countsSummary(counts: JobDocumentCounts): string {
    const parts = [
        counts.estimates ? `${counts.estimates} est` : null,
        counts.quotes ? `${counts.quotes} quote${counts.quotes === 1 ? "" : "s"}` : null,
        counts.invoices ? `${counts.invoices} inv` : null,
        counts.receipts ? `${counts.receipts} rct` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" · ") : "No documents yet";
}

function updatedLabel(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminJobsList({ jobs }: { jobs: AdminJobsListItem[] }) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");

    const statusOptions = useMemo<FilterChipOption<string>[]>(() => {
        const counts = new Map<string, number>();
        for (const job of jobs) {
            counts.set(job.status, (counts.get(job.status) || 0) + 1);
        }
        const present = Array.from(counts.keys()).sort((a, b) => {
            const ai = STATUS_ORDER.indexOf(a);
            const bi = STATUS_ORDER.indexOf(b);
            return (ai === -1 ? STATUS_ORDER.length : ai) - (bi === -1 ? STATUS_ORDER.length : bi);
        });
        return [
            { value: "all", label: "All", count: jobs.length },
            ...present.map((s) => ({ value: s, label: statusDisplay("job", s).label, count: counts.get(s) })),
        ];
    }, [jobs]);

    const filteredJobs = useMemo(() => {
        const q = query.trim().toLowerCase();
        return jobs.filter((job) => {
            const matchesQuery = !q
                || job.name.toLowerCase().includes(q)
                || job.id.toLowerCase().includes(q)
                || (job.description || "").toLowerCase().includes(q)
                || job.status.toLowerCase().includes(q);
            const matchesStatus = status === "all" || job.status === status;
            return matchesQuery && matchesStatus;
        });
    }, [jobs, query, status]);

    const filtersActive = query.trim() !== "" || status !== "all";
    const clearFilters = () => {
        setQuery("");
        setStatus("all");
    };

    return (
        <Flex direction="column" gap="4">
            <Card size="2" className="list-filter-card">
                <Flex gap="4" wrap="wrap" align="end">
                    <Box style={{ flex: 1, minWidth: "min(100%, 220px)" }}>
                        <TextField.Root
                            size="3"
                            placeholder="Search jobs by name or description…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search jobs"
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
                    <FilterChips label="Status" options={statusOptions} value={status} onChange={setStatus} />
                </Flex>
            </Card>

            <Flex align="center" justify="between" gap="3" wrap="wrap">
                <Text size="2" color="gray">
                    Showing <span className="ui-figure">{filteredJobs.length}</span> of <span className="ui-figure">{jobs.length}</span> {jobs.length === 1 ? "job" : "jobs"}
                </Text>
                {filtersActive ? (
                    <Button size="1" variant="ghost" color="gray" onClick={clearFilters}>Clear filters</Button>
                ) : null}
            </Flex>

            {filteredJobs.length === 0 ? (
                <EmptyState
                    compact
                    icon={Search}
                    title="No jobs match your filters"
                    description="Try a different search term or switch back to all statuses."
                    action={<Button size="2" variant="soft" onClick={clearFilters}>Clear filters</Button>}
                />
            ) : (
                <>
                    <div className="list-mobile">
                        {filteredJobs.map((job) => (
                            <div key={job.id} className="list-row-card">
                                <div className="list-row-card-main">
                                    <Link href={`/admin/jobs/${job.id}`} className="list-row-card-link">
                                        <Text as="div" size="2" weight="bold" truncate>{job.name}</Text>
                                    </Link>
                                    <Text as="div" size="1" color="gray" truncate>{countsSummary(job.counts)}</Text>
                                    <Flex align="center" gap="3" mt="1">
                                        <Text size="1" color="gray">Updated {updatedLabel(job.updatedAt)}</Text>
                                        {job.attachmentCount ? (
                                            <Flex align="center" gap="1" style={{ color: "var(--gray-10)" }}>
                                                <Paperclip size={12} aria-hidden />
                                                <Text size="1" className="ui-figure">{job.attachmentCount}</Text>
                                            </Flex>
                                        ) : null}
                                    </Flex>
                                </div>
                                <div className="list-row-card-aside">
                                    <StatusBadge kind="job" status={job.status} />
                                    <ChevronRight size={16} color="var(--gray-9)" aria-hidden />
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card className="list-desktop list-table-card">
                        <div className="list-table-scroll">
                            <Table.Root style={{ minWidth: 760 }}>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeaderCell>Job</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Documents</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell align="right">Files</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Updated</Table.ColumnHeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {filteredJobs.map((job) => (
                                        <Table.Row key={job.id} align="center">
                                            <Table.Cell>
                                                <Link href={`/admin/jobs/${job.id}`} className="row-link">{job.name}</Link>
                                                {job.description ? <Text as="div" size="1" color="gray" truncate style={{ maxWidth: 360 }}>{job.description}</Text> : null}
                                            </Table.Cell>
                                            <Table.Cell><StatusBadge kind="job" status={job.status} /></Table.Cell>
                                            <Table.Cell><Text size="2" color="gray">{countsSummary(job.counts)}</Text></Table.Cell>
                                            <Table.Cell align="right"><Text size="2" className="ui-figure">{job.attachmentCount}</Text></Table.Cell>
                                            <Table.Cell><Text size="2" className="ui-figure">{updatedLabel(job.updatedAt)}</Text></Table.Cell>
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
