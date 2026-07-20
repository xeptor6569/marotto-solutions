import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import BackButton from "@/components/BackButton";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import AdminListPageHeader from "@/components/AdminListPageHeader";
import { parseDocumentRouteSeed } from "@/lib/document-route-seed";

export default async function NewReceiptPage({
    searchParams,
}: {
    searchParams?: Promise<{ jobId?: string; clientId?: string; redirectTo?: string }>;
}) {
    const params = (await searchParams) || {};
    const { seed, redirectTo } = parseDocumentRouteSeed(params);
    const nextNumber = await getNextNumber("receipt");
    const { clients, jobs, paymentMethods, documentFormMode } = await getDocumentFormPickers();
    const backHref = redirectTo || "/admin/receipts";

    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader title="New receipt" actions={<BackButton href={backHref} />} />
            <NewDocumentForm
                nextNumber={nextNumber}
                type="receipt"
                clients={clients}
                jobs={jobs}
                paymentMethods={paymentMethods}
                formMode={documentFormMode}
                seed={seed}
                redirectTo={redirectTo}
            />
        </Container>
    );
}
