'use client';

import { Button, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { Check } from 'lucide-react';
import { useMoney } from '@/components/MoneyProvider';
import { LOOKS, type LookId } from '@/lib/theme-looks';
import type { AccentColor, GrayColor } from '@/lib/theme-presets';
import { LookScope } from './ThemePreview';

/** Radio cards, one per Look, each rendered in its own Look as a sample. */
export default function LookPicker({
    value,
    onChange,
    accentColor,
    grayColor,
    name = 'look',
}: {
    value: LookId;
    onChange: (look: LookId) => void;
    accentColor: AccentColor;
    grayColor: GrayColor;
    name?: string;
}) {
    const { format: money } = useMoney();

    return (
        <Grid columns={{ initial: '1', xs: '2', md: '3' }} gap="3" role="radiogroup" aria-label="Look">
            {LOOKS.map((look) => {
                const selected = value === look.id;
                return (
                    <label key={look.id} className="choice-card" data-selected={selected || undefined}>
                        <input
                            type="radio"
                            name={name}
                            value={look.id}
                            checked={selected}
                            onChange={() => onChange(look.id)}
                            className="visually-hidden"
                        />
                        <LookScope
                            settings={{
                                lookId: look.id,
                                accentColor,
                                grayColor,
                                radius: look.radius,
                                scaling: '100%',
                                panelBackground: look.panelBackground,
                            }}
                            className="look-card-sample look-canvas"
                        >
                            <Flex align="end" justify="between" gap="2" p="3">
                                <Flex direction="column" gap="1">
                                    <Heading size="6" as="h3" aria-hidden>Aa</Heading>
                                    <Text size="3" className="ui-display">{money(1280)}</Text>
                                </Flex>
                                <Button size="1" tabIndex={-1} aria-hidden>Send</Button>
                            </Flex>
                        </LookScope>
                        <Flex direction="column" gap="1" p="3" pt="2">
                            <Flex align="center" justify="between" gap="2">
                                <Text size="2" weight="bold">{look.label}</Text>
                                {selected ? <Check size={16} className="choice-card-check" aria-hidden /> : null}
                            </Flex>
                            <Text size="1" color="gray">{look.description}</Text>
                            <Text size="1" color="gray" className="ui-figure" style={{ opacity: 0.8 }}>{look.typeface}</Text>
                        </Flex>
                    </label>
                );
            })}
        </Grid>
    );
}
