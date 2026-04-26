import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDocuments } from "@/lib/data";
import BackButton from "@/components/BackButton";
import AdminDocumentList from "@/components/AdminDocumentList";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function AdminReceiptsPage() {
    const receipts = await getDocuments("receipt");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="Receipts"
                actions={
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/receipts/new"><Plus size={14} /> New receipt</Link>
                        </Button>
                        <BackButton href="/admin" />
                    </>
                }
            />

            <AdminDocumentList type="receipt" docs={receipts} />
        </Container>
    );
}
