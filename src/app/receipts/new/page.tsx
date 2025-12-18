import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";

export default async function NewReceiptPage() {
    const nextNumber = await getNextNumber('receipt');

    return (
        <Container size="3" p="5">
            <NewDocumentForm nextNumber={nextNumber} type="receipt" />
        </Container>
    );
}
