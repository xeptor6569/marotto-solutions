import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDocuments } from "@/lib/data";
import BackButton from "@/components/BackButton";
import AdminDocumentList from "@/components/AdminDocumentList";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function AdminInvoicesPage() {
    const invoices = await getDocuments("invoice");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="Invoices"
                actions={
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/invoices/new"><Plus size={14} /> New invoice</Link>
                        </Button>
                        <BackButton href="/admin" />
                    </>
                }
            />

            <AdminDocumentList type="invoice" docs={invoices} />
        </Container>
    );
}
