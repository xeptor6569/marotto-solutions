import type { ReactNode } from "react";
import { Card, Flex, Text } from "@radix-ui/themes";

export default function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <Card>
            <Flex direction="column" align="center" gap="3" py="8" px="4" style={{ textAlign: "center" }}>
                <Text size="4" color="gray">{title}</Text>
                {description ? (
                    <Text size="2" color="gray" style={{ maxWidth: 420 }}>{description}</Text>
                ) : null}
                {action ? <Flex gap="2" wrap="wrap" justify="center">{action}</Flex> : null}
            </Flex>
        </Card>
    );
}
