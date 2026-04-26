import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import BackButton from "@/components/BackButton";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function NewEstimatePage() {
    const nextNumber = await getNextNumber("estimate");
    const { clients, leads, jobs } = await getDocumentFormPickers();

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader title="New estimate" actions={<BackButton href="/admin/estimates" />} />
            <NewDocumentForm nextNumber={nextNumber} type="estimate" clients={clients} leads={leads} jobs={jobs} />
        </Container>
    );
}
