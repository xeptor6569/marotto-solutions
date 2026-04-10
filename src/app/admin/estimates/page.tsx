import { Container, Flex, Heading, Button } from "@radix-ui/themes";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDocuments } from "@/lib/data";
import BackButton from "@/components/BackButton";
import AdminDocumentList from "@/components/AdminDocumentList";

export default async function AdminEstimatesPage() {
    const estimates = await getDocuments("estimate");

    return (
        <Container size="4" p="5">
            <Flex justify="between" align="center" mb="5">
                <Heading size="7">Estimates</Heading>
                <Flex gap="2">
                    <Button asChild>
                        <Link href="/admin/estimates/new"><Plus size={16} /> New Estimate</Link>
                    </Button>
                    <BackButton href="/admin" />
                </Flex>
            </Flex>

            <AdminDocumentList type="estimate" docs={estimates} />
        </Container>
    );
}
