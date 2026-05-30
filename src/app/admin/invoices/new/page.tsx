import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import BackButton from "@/components/BackButton";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function NewInvoicePage() {
    const nextNumber = await getNextNumber("invoice");
    const { clients, leads, jobs, paymentMethods } = await getDocumentFormPickers();

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader title="New invoice" actions={<BackButton href="/admin/invoices" />} />
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
