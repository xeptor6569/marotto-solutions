import { Container } from "@radix-ui/themes";
import NewDocumentForm from "@/components/NewInvoiceForm"; // I kept filename same for now
import { getNextNumber } from "@/lib/data";

export default async function NewEstimatePage() {
    const nextNumber = await getNextNumber('estimate');

    return (
        <Container size="3" p="5">
            <NewDocumentForm nextNumber={nextNumber} type="estimate" />
        </Container>
    );
}
