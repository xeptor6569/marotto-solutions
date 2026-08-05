'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Box, Button, Card, Flex, Table, Text, TextField } from "@radix-ui/themes";
import { ChevronRight, Search } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import FilterChips, { type FilterChipOption } from "@/components/FilterChips";
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

function statusColor(status: string): "green" | "orange" | "gray" {
    if (status === "active") return "green";
    if (status === "paused") return "orange";
    return "gray";
}

function statusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function countsSummary(counts: JobDocumentCounts): string {
    return `${counts.estimates} est · ${counts.quotes} quote · ${counts.invoices} inv · ${counts.receipts} rct · ${counts.leads} lead`;
}

export default function AdminJobsList({ jobs }: { jobs: AdminJobsListItem[] }) {
    const router = useRouter();
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
            ...present.map((s) => ({ value: s, label: statusLabel(s), count: counts.get(s) })),
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
        <Flex direction="column" gap="4" className="admin-jobs-list">
            <Card>
                <Flex gap="3" wrap="wrap" align="end">
                    <Box style={{ flex: 1, minWidth: "min(100%, 200px)" }}>
                        <Text as="label" size="2">Search</Text>
                        <TextField.Root
                            placeholder="Search jobs by name, id, description…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        >
                            <TextField.Slot>
                                <Search size={14} />
                            </TextField.Slot>
                        </TextField.Root>
                    </Box>
                    <FilterChips label="Status" options={statusOptions} value={status} onChange={setStatus} />
                </Flex>
            </Card>

            <Flex align="center" justify="between" gap="3" wrap="wrap">
                <Text size="2" color="gray">
                    Showing {filteredJobs.length} of {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
                </Text>
                {filtersActive ? (
                    <Button size="1" variant="ghost" color="gray" onClick={clearFilters}>Clear filters</Button>
                ) : null}
            </Flex>

            {filteredJobs.length === 0 ? (
                <EmptyState
                    title="No jobs match your filters."
                    description="Try a different search term or switch back to all statuses."
                    action={<Button size="2" variant="soft" onClick={clearFilters}>Clear filters</Button>}
                />
            ) : (
                <>
                    <Flex direction="column" gap="3" className="jobs-list-mobile">
                        {filteredJobs.map((job) => (
                            <Link
                                key={job.id}
                                href={`/admin/jobs/${job.id}`}
                                style={{ textDecoration: "none", color: "inherit", display: "block" }}
                            >
                                <Card className="jobs-list-card">
                                    <Flex direction="column" gap="3">
                                        <Flex justify="between" align="start" gap="2" wrap="wrap">
                                            <Box style={{ minWidth: 0, flex: "1 1 140px" }}>
                                                <Text as="div" weight="bold">{job.name}</Text>
                                                <Text as="div" size="1" color="gray">{job.id}</Text>
                                                {job.description ? <Text as="div" size="2">{job.description}</Text> : null}
                                            </Box>
                                            <Badge color={statusColor(job.status)}>{job.status}</Badge>
                                        </Flex>
                                        <Box>
                                            <Text size="1" color="gray">Docs</Text>
                                            <Text as="div" size="2">{countsSummary(job.counts)}</Text>
                                        </Box>
                                        <Flex justify="between" align="center">
                                            <Text size="2" color="gray">Attachments: {job.attachmentCount}</Text>
                                            <Text size="2" color="gray">{new Date(job.updatedAt).toLocaleDateString()}</Text>
                                        </Flex>
                                        <Flex align="center" gap="1" style={{ color: "var(--accent-11)" }}>
                                            <Text size="2" weight="medium">Open job</Text>
                                            <ChevronRight size={14} />
                                        </Flex>
                                    </Flex>
                                </Card>
                            </Link>
                        ))}
                    </Flex>

                    <Card className="jobs-list-desktop" style={{ padding: 0, overflow: "hidden" }}>
                        <Box style={{ overflowX: "auto" }}>
                            <Table.Root style={{ minWidth: 880 }}>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeaderCell>Job</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Docs</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Attachments</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Updated</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell />
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {filteredJobs.map((job) => (
                                        <Table.Row
                                            key={job.id}
                                            className="jobs-list-row"
                                            onClick={() => router.push(`/admin/jobs/${job.id}`)}
                                        >
                                            <Table.Cell>
                                                <Link
                                                    href={`/admin/jobs/${job.id}`}
                                                    style={{ textDecoration: "none", color: "inherit" }}
                                                >
                                                    <Text as="div" weight="bold">{job.name}</Text>
                                                </Link>
                                                <Text as="div" size="1" color="gray">{job.id}</Text>
                                                {job.description ? <Text as="div" size="1">{job.description}</Text> : null}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge color={statusColor(job.status)}>{job.status}</Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size="2">{countsSummary(job.counts)}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size="2">{job.attachmentCount}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size="2">{new Date(job.updatedAt).toLocaleDateString()}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Flex justify="end" style={{ color: "var(--gray-9)" }}>
                                                    <ChevronRight size={16} />
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
                .jobs-list-mobile { display: flex; }
                .jobs-list-desktop { display: none; }
                .jobs-list-row { cursor: pointer; }
                .jobs-list-card { transition: box-shadow 0.15s ease, border-color 0.15s ease; }
                a:focus-visible .jobs-list-card { outline: 2px solid var(--accent-9); outline-offset: 2px; }
                @media (hover: hover) {
                    a:hover .jobs-list-card { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); }
                    .jobs-list-row:hover { background: var(--gray-a3); }
                }
                @media (min-width: 768px) {
                    .jobs-list-mobile { display: none !important; }
                    .jobs-list-desktop { display: block !important; }
                }
            `}</style>
        </Flex>
    );
}
