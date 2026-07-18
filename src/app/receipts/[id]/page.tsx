import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import DocumentPreview from "@/components/DocumentPreview";
import { requireAdminSession } from "@/lib/require-admin-session";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    await requireAdminSession();

    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc || doc.type !== "receipt") {
        notFound();
    }

    return (
        <DocumentPreview
            doc={doc}
            showBackButton
            backHref="/dashboard"
            editHref={doc.status === "draft" ? `/admin/receipts/${doc.id}/edit` : undefined}
        />
    );
}
