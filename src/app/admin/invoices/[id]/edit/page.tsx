import { Container } from "@radix-ui/themes";
import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import NewDocumentForm from "@/components/NewInvoiceForm";
import BackButton from "@/components/BackButton";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);
    const { clients, leads, jobs, paymentMethods } = await getDocumentFormPickers();

    if (!doc || doc.type !== "invoice") {
        notFound();
    }

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="Edit invoice"
                actions={<BackButton href={`/admin/invoices/${doc.id}`} />}
            />
            <NewDocumentForm
                nextNumber={doc.number}
                type="invoice"
                initialData={doc}
                redirectTo={`/admin/invoices/${doc.id}`}
                clients={clients}
                leads={leads}
                jobs={jobs}
                paymentMethods={paymentMethods}
            />
        </Container>
    );
}
