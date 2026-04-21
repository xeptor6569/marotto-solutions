import { Container, Flex, Heading, Button } from "@radix-ui/themes";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDocuments } from "@/lib/data";
import BackButton from "@/components/BackButton";
import AdminDocumentList from "@/components/AdminDocumentList";

export default async function AdminReceiptsPage() {
    const receipts = await getDocuments("receipt");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <Flex
                justify="between"
                align={{ initial: "stretch", sm: "center" }}
                direction={{ initial: "column", sm: "row" }}
                gap="3"
                mb="5"
            >
                <Heading size="7">Receipts</Heading>
                <Flex gap="2" wrap="wrap" justify={{ initial: "start", sm: "end" }}>
                    <Button asChild>
                        <Link href="/admin/receipts/new"><Plus size={16} /> New Receipt</Link>
                    </Button>
                    <BackButton href="/admin" />
                </Flex>
            </Flex>

            <AdminDocumentList type="receipt" docs={receipts} />
        </Container>
    );
}
