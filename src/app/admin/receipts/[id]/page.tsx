import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import DocumentPreview from "@/components/DocumentPreview";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc || doc.type !== 'receipt') {
        notFound();
    }

    return <DocumentPreview doc={doc} showBackButton backHref="/admin/receipts" editHref={`/admin/receipts/${doc.id}/edit`} />;
}
