import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";

export default async function NewQuotePage() {
    const nextNumber = await getNextNumber('quote');

    return (
        <Container size="3" p="5">
            <NewDocumentForm nextNumber={nextNumber} type="quote" />
        </Container>
    );
}
