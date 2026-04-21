import { Container, Flex, Heading } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm";
import { getNextNumber } from "@/lib/data";
import BackButton from "@/components/BackButton";
import { getClientOptions } from "@/lib/clients";

export default async function NewInvoicePage() {
    const nextNumber = await getNextNumber('invoice');
    const clients = await getClientOptions();

    return (
        <Container size="3" p="5">
            <Flex justify="between" align="center" mb="4">
                <Heading>Create New Invoice</Heading>
                <BackButton />
            </Flex>
            <NewDocumentForm nextNumber={nextNumber} type="invoice" clients={clients} />
        </Container>
    );
}
