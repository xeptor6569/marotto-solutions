import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";

export default async function NewReceiptPage() {
    const nextNumber = await getNextNumber('receipt');
    const { clients, leads, jobs } = await getDocumentFormPickers();

    return (
        <Container size="3" p="5">
            <NewDocumentForm nextNumber={nextNumber} type="receipt" clients={clients} leads={leads} jobs={jobs} />
        </Container>
    );
}
