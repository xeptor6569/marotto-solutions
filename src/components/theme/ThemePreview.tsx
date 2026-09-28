'use client';

import { useState, useSyncExternalStore } from 'react';
import { Badge, Box, Button, Card, Flex, Heading, SegmentedControl, Text, Theme } from '@radix-ui/themes';
import { Moon, Send, Sun } from 'lucide-react';
import { useMoney } from '@/components/MoneyProvider';
import { businessInitials } from '@/lib/branding-core';
import type { AccentColor, GrayColor, ThemeRadius } from '@/lib/theme-presets';
import type { LookId, PanelBackground, ThemeScaling } from '@/lib/theme-looks';

export interface ThemePreviewSettings {
    lookId: LookId;
    accentColor: AccentColor;
    grayColor: GrayColor;
    radius: ThemeRadius;
    scaling: ThemeScaling;
    panelBackground: PanelBackground;
}

function subscribeToAppearance(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
}

function pageAppearance(): 'light' | 'dark' {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** Scoped Theme that renders its children in a Look other than the site-wide one. */
export function LookScope({
    settings,
    appearance,
    className,
    children,
}: {
    settings: ThemePreviewSettings;
    appearance?: 'light' | 'dark';
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <Theme
            data-look-scope={settings.lookId}
            appearance={appearance}
            accentColor={settings.accentColor}
            grayColor={settings.grayColor}
            radius={settings.radius}
            scaling={settings.scaling}
            panelBackground={settings.panelBackground}
            hasBackground={false}
            className={className}
        >
            {children}
        </Theme>
    );
}

/**
 * Miniature of the app (and a document letterhead) in a candidate theme, so
 * admins see a Look before saving it.
 */
export default function ThemePreview({
    settings,
    businessName,
    letterhead,
    documentAccentColor,
}: {
    settings: ThemePreviewSettings;
    businessName: string;
    letterhead?: { line1: string; line2: string };
    documentAccentColor?: string;
}) {
    const { format: money } = useMoney();
    const detected = useSyncExternalStore(subscribeToAppearance, pageAppearance, () => 'light' as const);
    const [override, setOverride] = useState<'light' | 'dark' | null>(null);
    const appearance = override ?? detected;
    const initials = businessInitials(businessName);

    return (
        <Flex direction="column" gap="2">
            <Flex align="center" justify="between" gap="2">
                <span className="ui-eyebrow">Live preview</span>
                <SegmentedControl.Root
                    size="1"
                    value={appearance}
                    onValueChange={(value) => setOverride(value as 'light' | 'dark')}
                    aria-label="Preview appearance"
                >
                    <SegmentedControl.Item value="light"><Sun size={12} aria-label="Light" /></SegmentedControl.Item>
                    <SegmentedControl.Item value="dark"><Moon size={12} aria-label="Dark" /></SegmentedControl.Item>
                </SegmentedControl.Root>
            </Flex>
            <LookScope settings={settings} appearance={appearance} className="theme-preview">
                <Box className="theme-preview-canvas look-canvas">
                    <Flex className="theme-preview-bar" align="center" justify="between" gap="2">
                        <Flex align="center" gap="2" style={{ minWidth: 0 }}>
                            <span className="theme-preview-logo" aria-hidden>{initials}</span>
                            <Text size="2" weight="bold" truncate>{businessName}</Text>
                        </Flex>
                        <Flex gap="1" aria-hidden>
                            <span className="theme-preview-nav is-active">Home</span>
                            <span className="theme-preview-nav">Jobs</span>
                        </Flex>
                    </Flex>
                    <Flex direction="column" gap="3" p="3">
                        <Heading size="5">Good morning</Heading>
                        <Card size="1">
                            <span className="ui-eyebrow">Outstanding</span>
                            <Text as="div" size="6" className="ui-display" mt="1">{money(4280)}</Text>
                            <Flex gap="2" mt="2" align="center">
                                <Badge color="red" variant="soft">2 overdue</Badge>
                                <Text size="1" color="gray">across 5 invoices</Text>
                            </Flex>
                        </Card>
                        <Card size="1">
                            <Flex align="center" justify="between" gap="2">
                                <Box style={{ minWidth: 0 }}>
                                    <Text as="div" size="2" weight="medium" truncate>Kitchen remodel</Text>
                                    <Text as="div" size="1" color="gray" className="ui-figure">INV-0042 · Due Friday</Text>
                                </Box>
                                <Text size="2" weight="medium" className="ui-figure">{money(1850)}</Text>
                            </Flex>
                        </Card>
                        <Flex gap="2" wrap="wrap">
                            <Button size="2"><Send size={14} /> Send invoice</Button>
                            <Button size="2" variant="soft" color="gray">Preview</Button>
                        </Flex>
                    </Flex>
                </Box>
            </LookScope>
            {letterhead ? (
                <LookScope settings={settings} appearance="light" className="theme-preview-paper-scope">
                    <div
                        className="theme-preview-paper"
                        style={{ '--doc-accent': documentAccentColor || '#1e3a5f' } as React.CSSProperties}
                    >
                        <div>
                            <div className="theme-preview-paper-brand">{letterhead.line1}</div>
                            {letterhead.line2 ? <div className="theme-preview-paper-sub">{letterhead.line2}</div> : null}
                        </div>
                        <div className="theme-preview-paper-type">Invoice</div>
                    </div>
                </LookScope>
            ) : null}
        </Flex>
    );
}
