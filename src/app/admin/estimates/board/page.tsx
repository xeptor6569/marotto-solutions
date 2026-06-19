import { Container, Button, Flex, Heading } from "@radix-ui/themes";
import Link from "next/link";
import { Plus, List } from "lucide-react";
import { getDocuments } from "@/lib/data";
import WorkflowBoard from "@/components/WorkflowBoard";
import BackButton from "@/components/BackButton";

export default async function EstimatesBoardPage() {
    const estimates = await getDocuments("estimate");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <Flex justify="between" align="center" mb="4" wrap="wrap" gap="2">
                <Flex align="center" gap="3">
                    <Heading>Estimates Board</Heading>
                </Flex>
                <Flex gap="2" align="center">
                    <Button asChild size="2" variant="soft">
                        <Link href="/admin/estimates"><List size={14} /> List view</Link>
                    </Button>
                    <Button asChild size="2" variant="solid">
                        <Link href="/admin/estimates/new"><Plus size={14} /> New estimate</Link>
                    </Button>
                    <BackButton href="/admin" />
                </Flex>
            </Flex>

            <WorkflowBoard docs={estimates} type="estimate" />
        </Container>
    );
}
