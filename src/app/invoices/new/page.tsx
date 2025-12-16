import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm"; // Assuming I didn't rename the file yet, just component default export
import { getNextNumber } from "@/lib/data";

export default async function NewInvoicePage() {
    const nextNumber = await getNextNumber('invoice');

    return (
        <Container size="3" p="5">
            <NewDocumentForm nextNumber={nextNumber} type="invoice" />
        </Container>
    );
}
