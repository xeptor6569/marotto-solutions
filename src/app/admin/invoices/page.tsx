import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDocuments } from "@/lib/data";
import AdminDocumentList from "@/components/AdminDocumentList";
import { parseDocumentStatusFilter } from "@/lib/status-display";
import PageHeader from '@/components/ui/PageHeader';

export default async function AdminInvoicesPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; q?: string }>;
}) {
    const { status, q } = await searchParams;
    const invoices = await getDocuments("invoice");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <PageHeader
                title="Invoices"
                actions={
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/invoices/new"><Plus size={14} /> New invoice</Link>
                        </Button>
                    </>
                }
            />

            <AdminDocumentList
                type="invoice"
                docs={invoices}
                initialStatus={parseDocumentStatusFilter(status)}
                initialQuery={q ?? ""}
            />
        </Container>
    );
}
