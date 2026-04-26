import { Container } from "@radix-ui/themes";
import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import NewDocumentForm from "@/components/NewInvoiceForm";
import BackButton from "@/components/BackButton";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);
    const { clients, leads, jobs } = await getDocumentFormPickers();

    if (!doc || doc.type !== "quote") {
        notFound();
    }

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="Edit quote"
                actions={<BackButton href={`/admin/quotes/${doc.id}`} />}
            />
            <NewDocumentForm
                nextNumber={doc.number}
                type="quote"
                initialData={doc}
                redirectTo={`/admin/quotes/${doc.id}`}
                clients={clients}
                leads={leads}
                jobs={jobs}
            />
        </Container>
    );
}
