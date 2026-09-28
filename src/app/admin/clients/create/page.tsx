import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import PageHeader from '@/components/ui/PageHeader';
import ClientPageForm from "../ClientPageForm";

export default function CreateClientPage() {
    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <PageHeader
                title="New client"
                description="Add a client you can reuse across estimates, quotes, invoices, and receipts."
                actions={
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/clients">All clients</Link>
                        </Button>
                    </>
                }
            />
            <ClientPageForm />
        </Container>
    );
}
