import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm"; // I kept filename same for now
import { getNextNumber } from "@/lib/data";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import { requireAdminPage } from "@/lib/require-admin-session";

export default async function NewEstimatePage() {
    await requireAdminPage('/estimates/new');
    const nextNumber = await getNextNumber('estimate');
    const { clients, jobs, paymentMethods } = await getDocumentFormPickers();

    return (
        <Container size="3" p="5">
            <NewDocumentForm nextNumber={nextNumber} type="estimate" clients={clients} jobs={jobs} paymentMethods={paymentMethods} />
        </Container>
    );
}
