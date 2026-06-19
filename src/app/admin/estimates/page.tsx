import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import { Plus, LayoutGrid } from "lucide-react";
import { getDocuments } from "@/lib/data";
import BackButton from "@/components/BackButton";
import AdminDocumentList from "@/components/AdminDocumentList";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function AdminEstimatesPage() {
    const estimates = await getDocuments("estimate");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="Estimates"
                actions={
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/estimates/board"><LayoutGrid size={14} /> Board view</Link>
                        </Button>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/estimates/new"><Plus size={14} /> New estimate</Link>
                        </Button>
                        <BackButton href="/admin" />
                    </>
                }
            />

            <AdminDocumentList type="estimate" docs={estimates} />
        </Container>
    );
}
