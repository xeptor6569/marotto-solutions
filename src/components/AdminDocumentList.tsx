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

export default function AdminDocumentList({
    type,
    docs,
}: {
    type: "invoice" | "estimate";
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

    return (
        <Flex direction="column" gap="4">
            <Card>
                <Flex gap="3" wrap="wrap" align="end">
                    <Box style={{ flex: 1, minWidth: 260 }}>
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

                    <Box>
                        <Text as="label" size="2">Status</Text>
                        <Flex gap="2" mt="1">
                            {(["all", "draft", "sent", "paid", "void"] as const).map((s) => (
                                <Button
                                    key={s}
                                    size="1"
                                    variant={status === s ? "solid" : "soft"}
                                    onClick={() => setStatus(s)}
                                >
                                    {s}
                                </Button>
                            ))}
                        </Flex>
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
                <Card>
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeaderCell>{type === "invoice" ? "Invoice #" : "Estimate #"}</Table.ColumnHeaderCell>
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
                                        <Flex gap="2">
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
                </Card>
            )}
        </Flex>
    );
}
