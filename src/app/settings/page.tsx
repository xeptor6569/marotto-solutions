import { Container, Heading, Card } from "@radix-ui/themes";
import { getAppConfig } from "@/lib/config";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
    const config = await getAppConfig();

    return (
        <Container size="2" p="5">
            <Heading mb="4">Settings</Heading>
            <Card>
                <SettingsForm config={config} />
            </Card>
        </Container>
    );
}
