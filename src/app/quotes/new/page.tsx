import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";

export default async function NewQuotePage() {
    const nextNumber = await getNextNumber('quote');
    const { clients, leads, jobs } = await getDocumentFormPickers();

    return (
        <Container size="3" p="5">
            <NewDocumentForm nextNumber={nextNumber} type="quote" clients={clients} leads={leads} jobs={jobs} />
        </Container>
    );
}
