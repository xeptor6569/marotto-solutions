import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import { getClientOptions } from "@/lib/clients";

export default async function NewQuotePage() {
    const nextNumber = await getNextNumber('quote');
    const clients = await getClientOptions();

    return (
        <Container size="3" p="5">
            <NewDocumentForm nextNumber={nextNumber} type="quote" clients={clients} />
        </Container>
    );
}
