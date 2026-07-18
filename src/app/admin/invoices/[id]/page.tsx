import { Suspense } from "react";
import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import DocumentPreview from "@/components/DocumentPreview";
import DocumentSaveNotice from "@/components/DocumentSaveNotice";

export default async function AdminInvoicePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ fromJob?: string }>;
}) {
    const { id } = await params;
    const query = (await searchParams) || {};
    const doc = await getDocumentById(id);

    if (!doc || doc.type !== "invoice") {
        notFound();
    }

    const jobId = query.fromJob || doc.jobId || doc.customer?.jobId;
    const backHref = jobId ? `/admin/jobs/${jobId}` : "/admin/invoices";
    const editHref = jobId
        ? `/admin/invoices/${doc.id}/edit?redirectTo=${encodeURIComponent(`/admin/jobs/${jobId}`)}`
        : `/admin/invoices/${doc.id}/edit`;

    return (
        <>
            <Suspense fallback={null}>
                <DocumentSaveNotice docType="invoice" />
            </Suspense>
            <DocumentPreview
                doc={doc}
                showBackButton
                backHref={backHref}
                editHref={editHref}
            />
        </>
    );
}
