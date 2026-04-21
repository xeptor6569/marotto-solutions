'use client';

import { Box, Button, Card, Flex, Table, Text } from "@radix-ui/themes";
import { Mail, Phone, MapPin, Edit } from "lucide-react";
import ClientForm from "@/app/admin/clients/ClientForm";
import DeleteClientButton from "@/app/admin/clients/DeleteClientButton";

export type AdminClientRow = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    /** ISO string when passed from a Server Component to this client list */
    createdAt: string | Date;
};

export default function AdminClientsList({ clients }: { clients: AdminClientRow[] }) {
    return (
        <>
            <Flex direction="column" gap="3" className="admin-clients-mobile">
                {clients.map((client) => (
                    <Card key={client.id}>
                        <Flex direction="column" gap="3">
                            <Box>
                                <Text weight="bold" size="3">{client.name}</Text>
                                {client.notes ? (
                                    <Text as="div" size="2" color="gray" mt="1" style={{ whiteSpace: "pre-line" }}>{client.notes}</Text>
                                ) : null}
                            </Box>
                            <Flex direction="column" gap="2">
                                {client.email ? (
                                    <Flex align="center" gap="2" style={{ minWidth: 0 }}>
                                        <Mail size={14} style={{ flexShrink: 0 }} />
                                        <Text size="2" style={{ wordBreak: "break-word" }}>{client.email}</Text>
                                    </Flex>
                                ) : null}
                                {client.phone ? (
                                    <Flex align="center" gap="2">
                                        <Phone size={14} style={{ flexShrink: 0 }} />
                                        <Text size="2">{client.phone}</Text>
                                    </Flex>
                                ) : null}
                                {!client.email && !client.phone ? (
                                    <Text size="2" color="gray">No contact on file</Text>
                                ) : null}
                                {client.address ? (
                                    <Flex align="start" gap="2">
                                        <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                                        <Text size="2" style={{ whiteSpace: "pre-line" }}>{client.address}</Text>
                                    </Flex>
                                ) : null}
                            </Flex>
                            <Text size="1" color="gray">Added {new Date(client.createdAt).toLocaleDateString()}</Text>
                            <Flex gap="2" style={{ width: "100%" }}>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <ClientForm
                                        client={client}
                                        trigger={
                                            <Button size="2" variant="soft" style={{ width: "100%" }}>
                                                <Edit size={14} /> Edit
                                            </Button>
                                        }
                                    />
                                </Box>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <DeleteClientButton clientId={client.id} clientName={client.name} size="2" fullWidth />
                                </Box>
                            </Flex>
                        </Flex>
                    </Card>
                ))}
            </Flex>

            <Card className="admin-clients-desktop" style={{ padding: 0, overflow: "hidden" }}>
                <Box style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                    <Table.Root style={{ minWidth: 720 }}>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Address</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {clients.map((client) => (
                                <Table.Row key={client.id}>
                                    <Table.Cell>
                                        <Text weight="bold">{client.name}</Text>
                                        {client.notes ? (
                                            <Text as="div" size="1" color="gray">{client.notes}</Text>
                                        ) : null}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Flex direction="column" gap="1">
                                            {client.email && (
                                                <Flex align="center" gap="1">
                                                    <Mail size={14} />
                                                    <Text size="2">{client.email}</Text>
                                                </Flex>
                                            )}
                                            {client.phone && (
                                                <Flex align="center" gap="1">
                                                    <Phone size={14} />
                                                    <Text size="2">{client.phone}</Text>
                                                </Flex>
                                            )}
                                            {!client.email && !client.phone && (
                                                <Text size="2" color="gray">—</Text>
                                            )}
                                        </Flex>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {client.address ? (
                                            <Flex align="start" gap="1">
                                                <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                                                <Text size="2" style={{ whiteSpace: "pre-line" }}>{client.address}</Text>
                                            </Flex>
                                        ) : (
                                            <Text size="2" color="gray">—</Text>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Text size="2">{new Date(client.createdAt).toLocaleDateString()}</Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Flex gap="2">
                                            <ClientForm
                                                client={client}
                                                trigger={
                                                    <Button size="1" variant="soft">
                                                        <Edit size={14} />
                                                    </Button>
                                                }
                                            />
                                            <DeleteClientButton clientId={client.id} clientName={client.name} />
                                        </Flex>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>
            </Card>

            <style>{`
                .admin-clients-mobile { display: flex; }
                .admin-clients-desktop { display: none; }
                @media (min-width: 768px) {
                    .admin-clients-mobile { display: none !important; }
                    .admin-clients-desktop { display: block !important; }
                }
            `}</style>
        </>
    );
}
