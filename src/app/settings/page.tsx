import { Container, Heading, Card, Button, Flex } from "@radix-ui/themes";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { getAppConfig } from "@/lib/config";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
    const config = await getAppConfig();

    return (
        <Container size="2" p="5">
            <Flex mb="4" align="center" gap="3">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard"><ArrowLeft size={16} /> Back</Link>
                </Button>
                <Heading>Settings</Heading>
            </Flex>
            <Card>
                <SettingsForm config={config} />
            </Card>
        </Container>
    );
}
