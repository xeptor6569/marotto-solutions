import type { ReactNode } from 'react';
import { Flex, Heading, Text } from '@radix-ui/themes';

/** Centered full-page message for not-found / error / expired-link states. */
export default function StatusPage({
    icon,
    eyebrow,
    title,
    description,
    actions,
    children,
}: {
    icon: ReactNode;
    eyebrow?: string;
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div className="status-page">
            <Flex direction="column" align="center" gap="4" className="status-page-inner">
                <span className="status-page-icon" aria-hidden>{icon}</span>
                <Flex direction="column" align="center" gap="2">
                    {eyebrow ? <span className="ui-eyebrow">{eyebrow}</span> : null}
                    <Heading size="7" as="h1" align="center">{title}</Heading>
                    {description ? <Text size="3" color="gray" align="center" as="p">{description}</Text> : null}
                </Flex>
                {actions ? <Flex gap="2" wrap="wrap" justify="center">{actions}</Flex> : null}
                {children}
            </Flex>
        </div>
    );
}
