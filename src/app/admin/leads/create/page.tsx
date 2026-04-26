import { Container, Button } from "@radix-ui/themes";
import Link from "next/link";
import NewLeadForm from "@/components/NewLeadForm";
import AdminListPageHeader from "@/components/AdminListPageHeader";
import BackButton from "@/components/BackButton";

export default function CreateLeadPage() {
    return (
        <Container size="3" p={{ initial: "3", sm: "5" }}>
            <AdminListPageHeader
                title="New lead"
                actions={
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/leads">All leads</Link>
                        </Button>
                        <BackButton href="/admin" />
                    </>
                }
            />
            <NewLeadForm />
        </Container>
    );
}
