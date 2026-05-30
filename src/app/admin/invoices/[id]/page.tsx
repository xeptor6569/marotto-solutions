import { Suspense } from "react";
import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import DocumentPreview from "@/components/DocumentPreview";
import DocumentSaveNotice from "@/components/DocumentSaveNotice";

export default async function AdminInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc || doc.type !== "invoice") {
        notFound();
    }

    return (
        <>
            <Suspense fallback={null}>
                <DocumentSaveNotice docType="invoice" />
            </Suspense>
            <DocumentPreview doc={doc} showBackButton backHref="/admin/invoices" editHref={`/admin/invoices/${doc.id}/edit`} />
        </>
    );
}
