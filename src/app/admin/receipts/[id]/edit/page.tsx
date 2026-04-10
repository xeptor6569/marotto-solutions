import { Container, Flex, Heading } from "@radix-ui/themes";
import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import NewDocumentForm from "@/components/NewInvoiceForm";
import BackButton from "@/components/BackButton";

export default async function EditReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc || doc.type !== "receipt") {
        notFound();
    }

    return (
        <Container size="3" p="5">
            <Flex justify="between" align="center" mb="4">
                <Heading>Edit Receipt</Heading>
                <BackButton href={`/admin/receipts/${doc.id}`} />
            </Flex>
            <NewDocumentForm
                nextNumber={doc.number}
                type="receipt"
                initialData={doc}
                redirectTo={`/admin/receipts/${doc.id}`}
            />
        </Container>
    );
}
