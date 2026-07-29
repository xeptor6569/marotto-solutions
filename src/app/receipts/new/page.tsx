import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import { requireAdminPage } from "@/lib/require-admin-session";

export default async function NewReceiptPage() {
    await requireAdminPage('/receipts/new');
    const nextNumber = await getNextNumber('receipt');
    const { clients, jobs, paymentMethods, documentFormMode, presets } = await getDocumentFormPickers();

    return (
        <Container size="3" p="5">
            <NewDocumentForm
                nextNumber={nextNumber}
                type="receipt"
                clients={clients}
                jobs={jobs}
                paymentMethods={paymentMethods}
                presets={presets}
                formMode={documentFormMode}
            />
        </Container>
    );
}
