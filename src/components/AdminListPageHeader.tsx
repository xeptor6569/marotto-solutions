import type { ReactNode } from "react";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";

export default function AdminListPageHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <Flex
            justify="between"
            align={{ initial: "stretch", sm: "center" }}
            direction={{ initial: "column", sm: "row" }}
            gap="3"
            mb="5"
        >
            <Box style={{ minWidth: 0 }}>
                <Heading size="6">{title}</Heading>
                {description ? (
                    <Text as="p" size="2" color="gray" mt="1">{description}</Text>
                ) : null}
            </Box>
            {actions ? (
                <Flex gap="2" wrap="wrap" justify={{ initial: "start", sm: "end" }} align="center">
                    {actions}
                </Flex>
            ) : null}
        </Flex>
    );
}
