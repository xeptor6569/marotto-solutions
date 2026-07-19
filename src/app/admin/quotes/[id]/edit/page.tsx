import { Container } from "@radix-ui/themes";
import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import NewDocumentForm from "@/components/NewInvoiceForm";
import BackButton from "@/components/BackButton";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import AdminListPageHeader from "@/components/AdminListPageHeader";
import { parseDocumentRouteSeed } from "@/lib/document-route-seed";

export default async function EditQuotePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ redirectTo?: string; jobId?: string; clientId?: string }>;
}) {
    const { id } = await params;
    const query = (await searchParams) || {};
    const { redirectTo: redirectFromQuery } = parseDocumentRouteSeed(query);
    const doc = await getDocumentById(id);
    const { clients, jobs, paymentMethods } = await getDocumentFormPickers();

    if (!doc || doc.type !== "quote") {
        notFound();
    }

    const jobId = doc.jobId || doc.customer?.jobId;
    const defaultRedirect = `/admin/quotes/${doc.id}`;
    const redirectTo = redirectFromQuery || defaultRedirect;
    const backHref = redirectFromQuery || (jobId ? `/admin/jobs/${jobId}` : defaultRedirect);

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="Edit quote"
                actions={<BackButton href={backHref} />}
            />
            <NewDocumentForm
                nextNumber={doc.number}
                type="quote"
                initialData={doc}
                redirectTo={redirectTo}
                clients={clients}
                jobs={jobs}
                paymentMethods={paymentMethods}
            />
        </Container>
    );
}
