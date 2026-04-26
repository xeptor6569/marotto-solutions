import { Container } from "@radix-ui/themes";
import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import NewDocumentForm from "@/components/NewInvoiceForm";
import BackButton from "@/components/BackButton";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function EditEstimatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);
    const { clients, leads } = await getDocumentFormPickers();

    if (!doc || doc.type !== "estimate") {
        notFound();
    }

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="Edit estimate"
                actions={<BackButton href={`/admin/estimates/${doc.id}`} />}
            />
            <NewDocumentForm
                nextNumber={doc.number}
                type="estimate"
                initialData={doc}
                redirectTo={`/admin/estimates/${doc.id}`}
                clients={clients}
                leads={leads}
            />
        </Container>
    );
}
