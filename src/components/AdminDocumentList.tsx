'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Box, Button, Card, Flex, Table, Text, TextField } from "@radix-ui/themes";
import { Search } from "lucide-react";
import type { DocumentData } from "@/lib/types";

function badgeColor(status: DocumentData["status"]) {
    if (status === "paid") return "green";
    if (status === "void") return "red";
    if (status === "sent") return "blue";
    return "orange";
}

function docNumberLabel(type: "invoice" | "estimate" | "quote") {
    if (type === "invoice") return "Invoice #";
    if (type === "quote") return "Quote #";
    return "Estimate #";
}

export default function AdminDocumentList({
    type,
    docs,
}: {
    type: "invoice" | "estimate" | "quote";
    docs: DocumentData[];
}) {
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<"all" | DocumentData["status"]>("all");

    const filteredDocs = useMemo(() => {
        return docs.filter((doc) => {
            const q = query.trim().toLowerCase();
            const matchesQuery = !q
                || doc.id.toLowerCase().includes(q)
                || String(doc.number).includes(q)
                || (doc.customer.name || "").toLowerCase().includes(q)
                || (doc.customer.email || "").toLowerCase().includes(q);
            const matchesStatus = status === "all" || doc.status === status;
            return matchesQuery && matchesStatus;
        });
    }, [docs, query, status]);

    const numberLabel = docNumberLabel(type);

    return (
        <Flex direction="column" gap="4" className="admin-document-list">
            <Card>
                <Flex gap="3" wrap="wrap" align="end">
                    <Box style={{ flex: 1, minWidth: "min(100%, 200px)" }}>
                        <Text as="label" size="2">Search</Text>
                        <TextField.Root
                            placeholder={`Search ${type}s by number, id, customer...`}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        >
                            <TextField.Slot>
                                <Search size={14} />
                            </TextField.Slot>
                        </TextField.Root>
                    </Box>

                    <Box style={{ width: "100%", maxWidth: "100%" }}>
                        <Text as="label" size="2">Status</Text>
                        <Box
                            mt="1"
                            style={{
                                overflowX: "auto",
                                WebkitOverflowScrolling: "touch",
                                marginLeft: -2,
                                paddingBottom: 4,
                            }}
                        >
                            <Flex gap="2" wrap="nowrap" pb="1" style={{ width: "max-content", maxWidth: "100%" }}>
                                {(["all", "draft", "sent", "paid", "void"] as const).map((s) => (
                                    <Button
                                        key={s}
                                        size="1"
                                        variant={status === s ? "solid" : "soft"}
                                        onClick={() => setStatus(s)}
                                        style={{ flexShrink: 0 }}
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </Flex>
                        </Box>
                    </Box>
                </Flex>
            </Card>

            {filteredDocs.length === 0 ? (
                <Card>
                    <Flex direction="column" align="center" gap="2" py="7">
                        <Text size="4" color="gray">No {type}s match your filters.</Text>
                    </Flex>
                </Card>
            ) : (
                <>
                    {/* Mobile: stacked cards */}
                    <Flex direction="column" gap="3" className="admin-doc-list-mobile">
                        {filteredDocs.map((doc) => (
                            <Card key={doc.id}>
                                <Flex direction="column" gap="3">
                                    <Flex justify="between" align="start" gap="2" wrap="wrap">
                                        <Box style={{ minWidth: 0, flex: "1 1 140px" }}>
                                            <Text size="1" color="gray" weight="bold">{numberLabel}</Text>
                                            <Text as="div" weight="bold" size="3">#{doc.number}</Text>
                                            {doc.title ? <Text as="div" size="2" color="gray">{doc.title}</Text> : null}
                                            <Text as="div" size="1" color="gray">{doc.id}</Text>
                                        </Box>
                                        <Badge color={badgeColor(doc.status)}>{doc.status}</Badge>
                                    </Flex>
                                    <Box>
                                        <Text size="1" color="gray" weight="bold">Customer</Text>
                                        <Text as="div" weight="medium">{doc.customer.name}</Text>
                                        {doc.customer.email ? (
                                            <Text as="div" size="2" color="gray" style={{ wordBreak: "break-word" }}>{doc.customer.email}</Text>
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
                                    <Flex gap="2" style={{ width: "100%" }}>
                                        <Button asChild size="2" variant="soft" style={{ flex: 1 }}>
                                            <Link href={`/admin/${type}s/${doc.id}`}>Preview</Link>
                                        </Button>
                                        <Button asChild size="2" style={{ flex: 1 }}>
                                            <Link href={`/admin/${type}s/${doc.id}/edit`}>Edit</Link>
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Card>
                        ))}
                    </Flex>

                    {/* Desktop: table */}
                    <Card className="admin-doc-list-desktop" style={{ padding: 0, overflow: "hidden" }}>
                        <Box style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                            <Table.Root style={{ minWidth: 640 }}>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeaderCell>
                                            {numberLabel}
                                        </Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Customer</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell align="right">Total</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {filteredDocs.map((doc) => (
                                        <Table.Row key={doc.id}>
                                            <Table.Cell>
                                                <Text weight="bold">#{doc.number}</Text>
                                                {doc.title ? <Text as="div" size="1">{doc.title}</Text> : null}
                                                <Text as="div" size="1" color="gray">{doc.id}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text weight="bold">{doc.customer.name}</Text>
                                                {doc.customer.email ? <Text as="div" size="1" color="gray">{doc.customer.email}</Text> : null}
                                            </Table.Cell>
                                            <Table.Cell>{new Date(doc.date).toLocaleDateString()}</Table.Cell>
                                            <Table.Cell align="right">${doc.total.toFixed(2)}</Table.Cell>
                                            <Table.Cell>
                                                <Badge color={badgeColor(doc.status)}>{doc.status}</Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Flex gap="2" wrap="wrap">
                                                    <Button asChild size="1" variant="soft">
                                                        <Link href={`/admin/${type}s/${doc.id}`}>Preview</Link>
                                                    </Button>
                                                    <Button asChild size="1">
                                                        <Link href={`/admin/${type}s/${doc.id}/edit`}>Edit</Link>
                                                    </Button>
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
                @media (min-width: 768px) {
                    .admin-doc-list-mobile { display: none !important; }
                    .admin-doc-list-desktop { display: block !important; }
                }
            `}</style>
        </Flex>
    );
}
