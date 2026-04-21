import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import { getClientOptions } from "@/lib/clients";

export default async function NewReceiptPage() {
    const nextNumber = await getNextNumber('receipt');
    const clients = await getClientOptions();

    return (
        <Container size="3" p="5">
            <NewDocumentForm nextNumber={nextNumber} type="receipt" clients={clients} />
        </Container>
    );
}
