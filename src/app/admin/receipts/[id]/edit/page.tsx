import { Container } from "@radix-ui/themes";
import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import NewDocumentForm from "@/components/NewInvoiceForm";
import BackButton from "@/components/BackButton";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function EditReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);
    const { clients, leads, jobs } = await getDocumentFormPickers();

    if (!doc || doc.type !== "receipt") {
        notFound();
    }

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="Edit receipt"
                actions={<BackButton href={`/admin/receipts/${doc.id}`} />}
            />
            <NewDocumentForm
                nextNumber={doc.number}
                type="receipt"
                initialData={doc}
                redirectTo={`/admin/receipts/${doc.id}`}
                clients={clients}
                leads={leads}
                jobs={jobs}
            />
        </Container>
    );
}
