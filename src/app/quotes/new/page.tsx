import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import { requireAdminPage } from "@/lib/require-admin-session";

export default async function NewQuotePage() {
    await requireAdminPage('/quotes/new');
    const nextNumber = await getNextNumber('quote');
    const { clients, jobs, paymentMethods, documentFormMode, presets } = await getDocumentFormPickers();

    return (
        <Container size="3" p="5">
            <NewDocumentForm
                nextNumber={nextNumber}
                type="quote"
                clients={clients}
                jobs={jobs}
                paymentMethods={paymentMethods}
                presets={presets}
                formMode={documentFormMode}
            />
        </Container>
    );
}
