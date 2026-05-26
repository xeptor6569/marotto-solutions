import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDocuments } from "@/lib/data";
import BackButton from "@/components/BackButton";
import AdminDocumentList from "@/components/AdminDocumentList";
import AdminListPageHeader from "@/components/AdminListPageHeader";

export default async function AdminLeadsPage() {
    const leads = await getDocuments("lead");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="Clients"
                actions={
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/leads/create"><Plus size={14} /> New client</Link>
                        </Button>
                        <BackButton href="/admin" label="Admin home" />
                    </>
                }
            />

            <AdminDocumentList type="lead" docs={leads} />
        </Container>
    );
}
