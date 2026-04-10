import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import DocumentPreview from "@/components/DocumentPreview";

export default async function AdminEstimatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc || doc.type !== "estimate") {
        notFound();
    }

    return <DocumentPreview doc={doc} showBackButton backHref="/admin" editHref={`/admin/estimates/${doc.id}/edit`} />;
}
