'use client';

import { Flex, Grid, Text } from '@radix-ui/themes';
import { CUSTOM_THEME_PRESET_ID, THEME_PRESETS } from '@/lib/theme-presets';

function Swatch({ accent, gray }: { accent: string; gray: string }) {
    return (
        <span className="preset-swatch" aria-hidden>
            <span style={{ background: `var(--${accent}-9)` }} />
            <span style={{ background: `var(--${gray}-5)` }} />
        </span>
    );
}

/** Compact radio chips for the color presets, plus an optional Custom chip. */
export default function ColorPresetPicker({
    value,
    onChange,
    allowCustom = true,
    name = 'themePreset',
}: {
    value: string;
    onChange: (presetId: string) => void;
    allowCustom?: boolean;
    name?: string;
}) {
    return (
        <Grid columns={{ initial: '1', xs: '2', md: '3' }} gap="2" role="radiogroup" aria-label="Color preset">
            {THEME_PRESETS.map((preset) => (
                <label key={preset.id} className="choice-chip" data-selected={value === preset.id || undefined}>
                    <input
                        type="radio"
                        name={name}
                        value={preset.id}
                        checked={value === preset.id}
                        onChange={() => onChange(preset.id)}
                        className="visually-hidden"
                    />
                    <Swatch accent={preset.accentColor} gray={preset.grayColor} />
                    <Flex direction="column" style={{ minWidth: 0 }}>
                        <Text size="2" weight="medium" truncate>{preset.label}</Text>
                        <Text size="1" color="gray" truncate>{preset.description}</Text>
                    </Flex>
                </label>
            ))}
            {allowCustom ? (
                <label className="choice-chip" data-selected={value === CUSTOM_THEME_PRESET_ID || undefined}>
                    <input
                        type="radio"
                        name={name}
                        value={CUSTOM_THEME_PRESET_ID}
                        checked={value === CUSTOM_THEME_PRESET_ID}
                        onChange={() => onChange(CUSTOM_THEME_PRESET_ID)}
                        className="visually-hidden"
                    />
                    <span className="preset-swatch preset-swatch--custom" aria-hidden />
                    <Flex direction="column" style={{ minWidth: 0 }}>
                        <Text size="2" weight="medium">Custom</Text>
                        <Text size="1" color="gray" truncate>Your own accent, gray, and corners.</Text>
                    </Flex>
                </label>
            ) : null}
        </Grid>
    );
}
