import { Container, Button, Card, Flex, Text } from "@radix-ui/themes";
import { Plus } from "lucide-react";
import { getClients } from "./actions";
import ClientForm from "./ClientForm";
import BackButton from "@/components/BackButton";
import AdminClientsList from "@/components/AdminClientsList";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function ClientsPage() {
    const result = await getClients();
    const clients = (result.success && result.clients) ? result.clients : [];

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="Clients"
                actions={
                    <>
                        <ClientForm
                            trigger={
                                <Button size="2" variant="solid">
                                    <Plus size={14} /> Add client
                                </Button>
                            }
                        />
                        <BackButton href="/admin" />
                    </>
                }
            />

            {clients.length === 0 ? (
                <Card>
                    <Flex direction="column" align="center" gap="3" py="8">
                        <Text size="4" color="gray">No clients yet</Text>
                        <Text size="2" color="gray">Add your first client to get started</Text>
                        <ClientForm
                            trigger={
                                <Button size="2" variant="solid">
                                    <Plus size={14} /> Add client
                                </Button>
                            }
                        />
                    </Flex>
                </Card>
            ) : (
                <AdminClientsList clients={clients} />
            )}
        </Container>
    );
}
