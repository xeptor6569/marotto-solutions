import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm"; // Assuming I didn't rename the file yet, just component default export
import { getNextNumber } from "@/lib/data";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";

export default async function NewInvoicePage() {
    const nextNumber = await getNextNumber('invoice');
    const { clients, leads, jobs, paymentMethods } = await getDocumentFormPickers();

    return (
        <Container size="3" p="5">
            <NewDocumentForm
                nextNumber={nextNumber}
                type="invoice"
                clients={clients}
                leads={leads}
                jobs={jobs}
                paymentMethods={paymentMethods}
            />
        </Container>
    );
}
