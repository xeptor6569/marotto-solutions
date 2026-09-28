import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDocuments } from "@/lib/data";
import AdminDocumentList from "@/components/AdminDocumentList";
import { parseDocumentStatusFilter } from "@/lib/status-display";
import PageHeader from '@/components/ui/PageHeader';

export default async function AdminReceiptsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; q?: string }>;
}) {
    const { status, q } = await searchParams;
    const receipts = await getDocuments("receipt");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <PageHeader
                title="Receipts"
                actions={
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/receipts/new"><Plus size={14} /> New receipt</Link>
                        </Button>
                    </>
                }
            />

            <AdminDocumentList
                type="receipt"
                docs={receipts}
                initialStatus={parseDocumentStatusFilter(status)}
                initialQuery={q ?? ""}
            />
        </Container>
    );
}
