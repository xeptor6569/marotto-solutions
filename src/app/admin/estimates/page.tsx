import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import { Plus, LayoutGrid } from "lucide-react";
import { getDocuments } from "@/lib/data";
import AdminDocumentList from "@/components/AdminDocumentList";
import { parseDocumentStatusFilter } from "@/lib/status-display";
import PageHeader from '@/components/ui/PageHeader';

export default async function AdminEstimatesPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; q?: string }>;
}) {
    const { status, q } = await searchParams;
    const estimates = await getDocuments("estimate");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <PageHeader
                title="Estimates"
                actions={
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/estimates/board"><LayoutGrid size={14} /> Board view</Link>
                        </Button>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/estimates/new"><Plus size={14} /> New estimate</Link>
                        </Button>
                    </>
                }
            />

            <AdminDocumentList
                type="estimate"
                docs={estimates}
                initialStatus={parseDocumentStatusFilter(status)}
                initialQuery={q ?? ""}
            />
        </Container>
    );
}
