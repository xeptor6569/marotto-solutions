import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm"; // I kept filename same for now
import { getNextNumber } from "@/lib/data";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";

export default async function NewEstimatePage() {
    const nextNumber = await getNextNumber('estimate');
    const { clients, leads } = await getDocumentFormPickers();

    return (
        <Container size="3" p="5">
            <NewDocumentForm nextNumber={nextNumber} type="estimate" clients={clients} leads={leads} />
        </Container>
    );
}
