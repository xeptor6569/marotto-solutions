'use client';

import { useMemo, useState } from "react";
import { Badge, Box, Button, Card, DropdownMenu, Flex, IconButton, Table, Text, TextField } from "@radix-ui/themes";
import { Briefcase, Edit, Mail, MapPin, MoreHorizontal, Phone, Search, X } from "lucide-react";
import Link from "next/link";
import ClientForm from "@/app/admin/clients/ClientForm";
import DeleteClientButton from "@/app/admin/clients/DeleteClientButton";
import PromoteClientButton from "@/app/admin/clients/PromoteClientButton";
import EmptyState from "@/components/EmptyState";
import FilterChips, { type FilterChipOption } from "@/components/FilterChips";

export type AdminClientRow = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    isProspect: boolean;
    /** ISO string when passed from a Server Component to this client list */
    createdAt: string | Date;
};

type ClientFilter = "all" | "clients" | "prospects";

function newJobHref(client: AdminClientRow): string {
    return `/admin/jobs/create?clientId=${encodeURIComponent(client.id)}&name=${encodeURIComponent(`${client.name} job`)}`;
}

function telHref(phone: string): string {
    return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export default function AdminClientsList({ clients }: { clients: AdminClientRow[] }) {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<ClientFilter>("all");

    const prospectCount = clients.filter((c) => c.isProspect).length;
    const filterOptions: FilterChipOption<ClientFilter>[] = prospectCount > 0
        ? [
            { value: "all", label: "All", count: clients.length },
            { value: "clients", label: "Clients", count: clients.length - prospectCount },
            { value: "prospects", label: "Prospects", count: prospectCount },
        ]
        : [];

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return clients.filter((client) => {
            const matchesQuery = !q
                || client.name.toLowerCase().includes(q)
                || (client.email || "").toLowerCase().includes(q)
                || (client.phone || "").toLowerCase().includes(q)
                || (client.address || "").toLowerCase().includes(q)
                || (client.notes || "").toLowerCase().includes(q);
            const matchesFilter = filter === "all"
                || (filter === "prospects" ? client.isProspect : !client.isProspect);
            return matchesQuery && matchesFilter;
        });
    }, [clients, query, filter]);

    const filtersActive = query.trim() !== "" || filter !== "all";

    return (
        <Flex direction="column" gap="4">
            <Card size="2" className="list-filter-card">
                <Flex gap="4" wrap="wrap" align="end">
                    <Box style={{ flex: 1, minWidth: "min(100%, 220px)" }}>
                        <TextField.Root
                            size="3"
                            placeholder="Search by name, email, phone, or address…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search clients"
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
                    <FilterChips label="Show" options={filterOptions} value={filter} onChange={setFilter} />
                </Flex>
            </Card>

            {filtered.length === 0 ? (
                <EmptyState
                    compact
                    icon={Search}
                    title="No clients match"
                    description="Try a different name, email, or phone number."
                    action={filtersActive ? (
                        <Button size="2" variant="soft" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</Button>
                    ) : undefined}
                />
            ) : (
                <>
                    <div className="list-mobile">
                        {filtered.map((client) => (
                            <div key={client.id} className="list-row-card list-row-card--stacked">
                                <Flex justify="between" align="start" gap="2">
                                    <Box style={{ minWidth: 0 }}>
                                        <Flex align="center" gap="2" wrap="wrap">
                                            <Text size="3" weight="bold">{client.name}</Text>
                                            {client.isProspect ? <Badge color="amber" variant="soft" radius="full">Prospect</Badge> : null}
                                        </Flex>
                                        {client.address ? (
                                            <Text as="div" size="1" color="gray" truncate>{client.address.split("\n")[0]}</Text>
                                        ) : null}
                                        {client.notes ? (
                                            <Text as="div" size="1" color="gray" mt="1" className="clamp-2">{client.notes}</Text>
                                        ) : null}
                                    </Box>
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger>
                                            <IconButton variant="ghost" color="gray" size="2" aria-label={`More actions for ${client.name}`}>
                                                <MoreHorizontal size={18} />
                                            </IconButton>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content align="end">
                                            <DropdownMenu.Item asChild>
                                                <Link href={newJobHref(client)}><Briefcase size={14} /> New job</Link>
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                </Flex>
                                <div className="contact-actions">
                                    {client.phone ? (
                                        <Button asChild size="2" variant="soft">
                                            <a href={telHref(client.phone)}><Phone size={14} /> Call</a>
                                        </Button>
                                    ) : null}
                                    {client.email ? (
                                        <Button asChild size="2" variant="soft">
                                            <a href={`mailto:${client.email}`}><Mail size={14} /> Email</a>
                                        </Button>
                                    ) : null}
                                    <ClientForm
                                        client={client}
                                        trigger={<Button size="2" variant="soft" color="gray"><Edit size={14} /> Edit</Button>}
                                    />
                                    {client.isProspect ? (
                                        <PromoteClientButton clientId={client.id} clientName={client.name} size="2" />
                                    ) : (
                                        <DeleteClientButton clientId={client.id} clientName={client.name} size="2" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card className="list-desktop list-table-card">
                        <div className="list-table-scroll">
                            <Table.Root style={{ minWidth: 760 }}>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Address</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Added</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell><span className="visually-hidden">Actions</span></Table.ColumnHeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {filtered.map((client) => (
                                        <Table.Row key={client.id} align="center">
                                            <Table.Cell>
                                                <Flex align="center" gap="2" wrap="wrap">
                                                    <Text weight="bold">{client.name}</Text>
                                                    {client.isProspect ? (
                                                        <Badge color="amber" variant="soft" size="1" radius="full">Prospect</Badge>
                                                    ) : null}
                                                </Flex>
                                                {client.notes ? (
                                                    <Text as="div" size="1" color="gray" truncate style={{ maxWidth: 280 }}>{client.notes}</Text>
                                                ) : null}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Flex direction="column" gap="1">
                                                    {client.email ? (
                                                        <a href={`mailto:${client.email}`} className="contact-link">
                                                            <Mail size={13} aria-hidden /> {client.email}
                                                        </a>
                                                    ) : null}
                                                    {client.phone ? (
                                                        <a href={telHref(client.phone)} className="contact-link">
                                                            <Phone size={13} aria-hidden /> {client.phone}
                                                        </a>
                                                    ) : null}
                                                    {!client.email && !client.phone ? <Text size="2" color="gray">—</Text> : null}
                                                </Flex>
                                            </Table.Cell>
                                            <Table.Cell>
                                                {client.address ? (
                                                    <Flex align="start" gap="1">
                                                        <MapPin size={13} style={{ marginTop: 3, flexShrink: 0, color: "var(--gray-10)" }} aria-hidden />
                                                        <Text size="2" style={{ whiteSpace: "pre-line" }}>{client.address}</Text>
                                                    </Flex>
                                                ) : (
                                                    <Text size="2" color="gray">—</Text>
                                                )}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size="2" className="ui-figure">
                                                    {new Date(client.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Flex gap="2" justify="end" align="center">
                                                    {client.isProspect ? (
                                                        <PromoteClientButton clientId={client.id} clientName={client.name} size="1" />
                                                    ) : null}
                                                    <Button asChild size="1" variant="soft">
                                                        <Link href={newJobHref(client)}><Briefcase size={12} /> Job</Link>
                                                    </Button>
                                                    <ClientForm
                                                        client={client}
                                                        trigger={
                                                            <IconButton size="1" variant="soft" color="gray" aria-label={`Edit ${client.name}`}>
                                                                <Edit size={13} />
                                                            </IconButton>
                                                        }
                                                    />
                                                    <DeleteClientButton clientId={client.id} clientName={client.name} />
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
