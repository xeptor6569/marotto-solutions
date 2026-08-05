import DocumentPreview from "@/components/DocumentPreview";
import { resolveLegacyDocumentShare } from "@/lib/legacy-share-redirect";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await resolveLegacyDocumentShare(id, "quote");

    return (
        <DocumentPreview
            doc={doc}
            showBackButton
            backHref="/dashboard"
            editHref={doc.status === "draft" ? `/admin/quotes/${doc.id}/edit` : undefined}
        />
    );
}
