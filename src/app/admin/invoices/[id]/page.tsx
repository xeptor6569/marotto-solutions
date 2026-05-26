import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import DocumentPreview from "@/components/DocumentPreview";

export default async function AdminInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc || doc.type !== "invoice") {
        notFound();
    }

    return <DocumentPreview doc={doc} showBackButton backHref="/admin/invoices" editHref={`/admin/invoices/${doc.id}/edit`} />;
}
