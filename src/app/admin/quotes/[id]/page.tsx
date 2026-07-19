import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import DocumentPreview from "@/components/DocumentPreview";

export default async function AdminQuotePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ fromJob?: string }>;
}) {
    const { id } = await params;
    const query = (await searchParams) || {};
    const doc = await getDocumentById(id);

    if (!doc || doc.type !== "quote") {
        notFound();
    }

    const jobId = query.fromJob || doc.jobId || doc.customer?.jobId;
    const backHref = jobId ? `/admin/jobs/${jobId}` : "/admin/quotes";
    const editHref = jobId
        ? `/admin/quotes/${doc.id}/edit?redirectTo=${encodeURIComponent(`/admin/jobs/${jobId}`)}`
        : `/admin/quotes/${doc.id}/edit`;

    return (
        <DocumentPreview
            doc={doc}
            showBackButton
            backHref={backHref}
            editHref={editHref}
        />
    );
}
