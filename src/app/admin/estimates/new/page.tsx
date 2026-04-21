import { Container, Flex, Heading } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import BackButton from "@/components/BackButton";
import { getClientOptions } from "@/lib/clients";

export default async function NewEstimatePage() {
    const nextNumber = await getNextNumber('estimate');
    const clients = await getClientOptions();

    return (
        <Container size="3" p="5">
            <Flex justify="between" align="center" mb="4">
                <Heading>Create New Estimate</Heading>
                <BackButton />
            </Flex>
            <NewDocumentForm nextNumber={nextNumber} type="estimate" clients={clients} />
        </Container>
    );
}
