import type { ReactNode } from 'react';
import Link from 'next/link';
import { Box, Flex, Heading, Text } from '@radix-ui/themes';
import { ChevronLeft } from 'lucide-react';

/** Page title block: optional back link and eyebrow, title, description, actions. */
export default function PageHeader({
    title,
    eyebrow,
    description,
    actions,
    back,
}: {
    title: ReactNode;
    eyebrow?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    back?: { href: string; label: string };
}) {
    return (
        <Box className="page-header" mb="5">
            {back ? (
                <Link href={back.href} className="page-header-back no-print">
                    <ChevronLeft size={14} aria-hidden />
                    {back.label}
                </Link>
            ) : null}
            <Flex
                justify="between"
                align={{ initial: 'stretch', sm: 'end' }}
                direction={{ initial: 'column', sm: 'row' }}
                gap="3"
            >
                <Box style={{ minWidth: 0 }}>
                    {eyebrow ? <span className="ui-eyebrow page-header-eyebrow">{eyebrow}</span> : null}
                    <Heading size="7" className="page-header-title">{title}</Heading>
                    {description ? (
                        <Text as="p" size="2" color="gray" mt="1" className="page-header-description">{description}</Text>
                    ) : null}
                </Box>
                {actions ? (
                    <Flex gap="2" wrap="wrap" justify={{ initial: 'start', sm: 'end' }} align="center" className="no-print">
                        {actions}
                    </Flex>
                ) : null}
            </Flex>
        </Box>
    );
}
