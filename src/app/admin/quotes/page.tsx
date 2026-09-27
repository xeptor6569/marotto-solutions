import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import { Plus, LayoutGrid } from "lucide-react";
import { getDocuments } from "@/lib/data";
import AdminDocumentList from "@/components/AdminDocumentList";
import { parseDocumentStatusFilter } from "@/lib/status-display";
import PageHeader from '@/components/ui/PageHeader';

export default async function AdminQuotesPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; q?: string }>;
}) {
    const { status, q } = await searchParams;
    const quotes = await getDocuments("quote");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <PageHeader
                title="Quotes"
                actions={
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/quotes/board"><LayoutGrid size={14} /> Board view</Link>
                        </Button>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/quotes/new"><Plus size={14} /> New quote</Link>
                        </Button>
                    </>
                }
            />

            <AdminDocumentList
                type="quote"
                docs={quotes}
                initialStatus={parseDocumentStatusFilter(status)}
                initialQuery={q ?? ""}
            />
        </Container>
    );
}
