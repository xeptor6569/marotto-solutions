import { Container, Flex, Heading, Button, Card, Table, Text, Badge } from "@radix-ui/themes";
import { Plus, Mail, Phone, MapPin, Trash2, Edit } from "lucide-react";
import { getClients } from "./actions";
import ClientForm from "./ClientForm";
import BackButton from "@/components/BackButton";
import DeleteClientButton from "./DeleteClientButton";

export default async function ClientsPage() {
    const result = await getClients();
    const clients = (result.success && result.clients) ? result.clients : [];

    return (
        <Container size="4" p="5">
            <Flex justify="between" align="center" mb="5">
                <Heading size="7">Clients</Heading>
                <Flex gap="2">
                    <ClientForm
                        trigger={
                            <Button>
                                <Plus size={16} /> Add Client
                            </Button>
                        }
                    />
                    <BackButton />
                </Flex>
            </Flex>

            {clients.length === 0 ? (
                <Card>
                    <Flex direction="column" align="center" gap="3" py="8">
                        <Text size="4" color="gray">No clients yet</Text>
                        <Text size="2" color="gray">Add your first client to get started</Text>
                        <ClientForm
                            trigger={
                                <Button size="3">
                                    <Plus size={16} /> Add Client
                                </Button>
                            }
                        />
                    </Flex>
                </Card>
            ) : (
                <Card>
                    <Table.Root>
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
                                        {client.notes && (
                                            <Text as="div" size="1" color="gray">{client.notes}</Text>
                                        )}
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
                                                <Text size="2" style={{ whiteSpace: 'pre-line' }}>{client.address}</Text>
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
                </Card>
            )}
        </Container>
    );
}
