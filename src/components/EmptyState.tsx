import type { ReactNode } from "react";
import { Flex, Heading, Text } from "@radix-ui/themes";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/** Friendly zero state: icon, what this space is for, and the next step. */
export default function EmptyState({
    title,
    description,
    action,
    icon: Icon = Inbox,
    compact = false,
}: {
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    icon?: LucideIcon;
    /** Smaller variant for filtered lists and cards. */
    compact?: boolean;
}) {
    return (
        <div className={`empty-state${compact ? " empty-state--compact" : ""}`}>
            <Flex direction="column" align="center" gap="3">
                <span className="empty-state-icon" aria-hidden>
                    <Icon size={compact ? 18 : 22} />
                </span>
                <Flex direction="column" align="center" gap="1">
                    <Heading size={compact ? "3" : "4"} as="h2">{title}</Heading>
                    {description ? (
                        <Text size="2" color="gray" className="empty-state-description">{description}</Text>
                    ) : null}
                </Flex>
                {action ? <Flex gap="2" wrap="wrap" justify="center" mt="1">{action}</Flex> : null}
            </Flex>
        </div>
    );
}
