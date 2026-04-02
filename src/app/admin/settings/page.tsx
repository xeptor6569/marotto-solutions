import { Container, Heading, Card, Button, Flex } from "@radix-ui/themes";
import { getAppConfig } from "@/lib/config";
import SettingsForm from "./settings-form";
import BackButton from "@/components/BackButton";

export default async function SettingsPage() {
    const config = await getAppConfig();

    return (
        <Container size="2" p="5">
            <Flex mb="4" justify="between" align="center">
                <Heading>Settings</Heading>
                <BackButton />
            </Flex>
            <Card>
                <SettingsForm config={config} />
            </Card>
        </Container>
    );
}
