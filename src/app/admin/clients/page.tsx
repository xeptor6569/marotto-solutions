import { Container, Button } from "@radix-ui/themes";
import { Plus, Users } from "lucide-react";
import { getClients } from "./actions";
import ClientForm from "./ClientForm";
import AdminClientsList from "@/components/AdminClientsList";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from "@/components/EmptyState";

export default async function ClientsPage() {
    const result = await getClients();
    const clients = (result.success && result.clients) ? result.clients : [];
    const prospectCount = clients.filter((c) => c.isProspect).length;
    const description = prospectCount > 0
        ? `${prospectCount} prospect${prospectCount === 1 ? '' : 's'} awaiting promotion to full client`
        : undefined;

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <PageHeader
                title="Clients"
                description={description}
                actions={
                    <>
                        <ClientForm
                            trigger={
                                <Button size="2" variant="solid">
                                    <Plus size={14} /> New client
                                </Button>
                            }
                        />
                    </>
                }
            />

            {clients.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No clients yet"
                    description="Add your first client to start creating estimates, invoices, and receipts for them."
                    action={(
                        <ClientForm
                            trigger={
                                <Button size="2" variant="solid">
                                    <Plus size={14} /> New client
                                </Button>
                            }
                        />
                    )}
                />
            ) : (
                <AdminClientsList clients={clients} />
            )}
        </Container>
    );
}
