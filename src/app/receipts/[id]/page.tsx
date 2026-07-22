import DocumentPreview from "@/components/DocumentPreview";
import { resolveLegacyDocumentShare } from "@/lib/legacy-share-redirect";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await resolveLegacyDocumentShare(id, "receipt");

    return (
        <DocumentPreview
            doc={doc}
            showBackButton
            backHref="/dashboard"
            editHref={doc.status === "draft" ? `/admin/receipts/${doc.id}/edit` : undefined}
        />
    );
}
