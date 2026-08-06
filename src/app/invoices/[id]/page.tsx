import DocumentPreview from "@/components/DocumentPreview";
import { resolveLegacyDocumentShare } from "@/lib/legacy-share-redirect";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await resolveLegacyDocumentShare(id, "invoice");

    return (
        <DocumentPreview
            doc={doc}
            showBackButton
            backHref="/dashboard"
            editHref={doc.status === "draft" ? `/admin/invoices/${doc.id}/edit` : undefined}
        />
    );
}
