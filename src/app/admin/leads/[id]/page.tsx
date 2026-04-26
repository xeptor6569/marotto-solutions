import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import DocumentPreview from "@/components/DocumentPreview";
import { Button, Flex } from "@radix-ui/themes";
import Link from "next/link";

export default async function AdminLeadPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc || doc.type !== "lead") {
        notFound();
    }

    return (
        <>
            <Flex justify="end" px={{ initial: "3", sm: "5" }} pt={{ initial: "3", sm: "5" }} className="no-print">
                <Button asChild size="2" variant="soft">
                    <Link
                        href={`/admin/jobs/create?leadId=${encodeURIComponent(doc.id)}&name=${encodeURIComponent(`${doc.customer.name} job`)}`}
                    >
                        Create job from lead
                    </Link>
                </Button>
            </Flex>
            <DocumentPreview
                doc={doc}
                showBackButton
                backHref="/admin/leads"
            />
        </>
    );
}
