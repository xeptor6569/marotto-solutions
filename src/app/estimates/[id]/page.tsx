import DocumentPreview from "@/components/DocumentPreview";
import { resolveLegacyDocumentShare } from "@/lib/legacy-share-redirect";

export default async function EstimatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await resolveLegacyDocumentShare(id, "estimate");

    return (
        <DocumentPreview
            doc={doc}
            showBackButton
            backHref="/dashboard"
            editHref={doc.status === "draft" ? `/admin/estimates/${doc.id}/edit` : undefined}
        />
    );
}
