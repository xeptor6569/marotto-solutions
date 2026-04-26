import type { ReactNode } from "react";
import { Flex, Heading } from "@radix-ui/themes";

export default function AdminListPageHeader({
    title,
    actions,
}: {
    title: string;
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
            <Heading size="6">{title}</Heading>
            {actions ? (
                <Flex gap="2" wrap="wrap" justify={{ initial: "start", sm: "end" }} align="center">
                    {actions}
                </Flex>
            ) : null}
        </Flex>
    );
}
