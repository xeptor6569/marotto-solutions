import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import { getDocumentFormPickers } from "@/lib/document-form-pickers";
import PageHeader from '@/components/ui/PageHeader';
import { parseDocumentRouteSeed } from "@/lib/document-route-seed";

export default async function NewQuotePage({
    searchParams,
}: {
    searchParams?: Promise<{ jobId?: string; clientId?: string; redirectTo?: string }>;
}) {
    const params = (await searchParams) || {};
    const { seed, redirectTo } = parseDocumentRouteSeed(params);
    const nextNumber = await getNextNumber("quote");
    const { clients, jobs, paymentMethods, documentFormMode, presets, paper } = await getDocumentFormPickers();
    const backHref = redirectTo || "/admin/quotes";

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <PageHeader title="New quote" back={{ href: backHref, label: "Back" }} />
            <NewDocumentForm
                nextNumber={nextNumber}
                type="quote"
                clients={clients}
                jobs={jobs}
                paymentMethods={paymentMethods}
                presets={presets}
                formMode={documentFormMode}
                paper={paper}
                seed={seed}
                redirectTo={redirectTo}
            />
        </Container>
    );
}
