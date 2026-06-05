import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import AdminListPageHeader from "@/components/AdminListPageHeader";
import BackButton from "@/components/BackButton";
import ClientPageForm from "../ClientPageForm";

export default function CreateClientPage() {
    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="New client"
                description="Add a client you can reuse across estimates, quotes, invoices, and receipts."
                actions={
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/clients">All clients</Link>
                        </Button>
                        <BackButton href="/admin" label="Admin home" />
                    </>
                }
            />
            <ClientPageForm />
        </Container>
    );
}
