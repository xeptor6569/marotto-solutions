import { Container, Flex, Heading, Button, Card, Text } from "@radix-ui/themes";
import { Plus } from "lucide-react";
import { getClients } from "./actions";
import ClientForm from "./ClientForm";
import BackButton from "@/components/BackButton";
import AdminClientsList from "@/components/AdminClientsList";

export default async function ClientsPage() {
    const result = await getClients();
    const clients = (result.success && result.clients) ? result.clients : [];

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <Flex
                justify="between"
                align={{ initial: "stretch", sm: "center" }}
                direction={{ initial: "column", sm: "row" }}
                gap="3"
                mb="5"
            >
                <Heading size="7">Clients</Heading>
                <Flex gap="2" wrap="wrap" justify={{ initial: "start", sm: "end" }}>
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
                <AdminClientsList clients={clients} />
            )}
        </Container>
    );
}
