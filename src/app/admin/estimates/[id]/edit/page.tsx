import { Container, Flex, Heading } from "@radix-ui/themes";
import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import NewDocumentForm from "@/components/NewInvoiceForm";
import BackButton from "@/components/BackButton";
import { getClientOptions } from "@/lib/clients";

export default async function EditEstimatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);
    const clients = await getClientOptions();

    if (!doc || doc.type !== "estimate") {
        notFound();
    }

    return (
        <Container size="3" p="5">
            <Flex justify="between" align="center" mb="4">
                <Heading>Edit Estimate</Heading>
                <BackButton href={`/admin/estimates/${doc.id}`} />
            </Flex>
            <NewDocumentForm
                nextNumber={doc.number}
                type="estimate"
                initialData={doc}
                redirectTo={`/admin/estimates/${doc.id}`}
                clients={clients}
            />
        </Container>
    );
}
