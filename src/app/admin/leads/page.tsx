import { Container, Flex, Heading } from "@radix-ui/themes";
import { getDocuments } from "@/lib/data";
import BackButton from "@/components/BackButton";
import AdminDocumentList from "@/components/AdminDocumentList";

export default async function AdminLeadsPage() {
    const leads = await getDocuments("lead");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <Flex
                justify="between"
                align={{ initial: "stretch", sm: "center" }}
                direction={{ initial: "column", sm: "row" }}
                gap="3"
                mb="5"
            >
                <Heading size="7">Leads</Heading>
                <BackButton href="/admin" />
            </Flex>

            <AdminDocumentList type="lead" docs={leads} />
        </Container>
    );
}
