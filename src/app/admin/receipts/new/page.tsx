import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import BackButton from "@/components/BackButton";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function NewReceiptPage() {
    const nextNumber = await getNextNumber("receipt");
    const { clients, leads, jobs } = await getDocumentFormPickers();

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader title="New receipt" actions={<BackButton href="/admin/receipts" />} />
            <NewDocumentForm nextNumber={nextNumber} type="receipt" clients={clients} leads={leads} jobs={jobs} />
        </Container>
    );
}
