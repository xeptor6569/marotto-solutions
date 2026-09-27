'use client';

import { useState } from 'react';
import { Box, Flex, Grid, Select, Text, TextField } from '@radix-ui/themes';
import SettingsSectionForm, { Field } from './SettingsSectionForm';
import {
    ACCENT_COLORS,
    CUSTOM_THEME_PRESET_ID,
    GRAY_COLORS,
    RADII,
    THEME_PRESETS,
} from '@/lib/theme-presets';
import type { AppConfig } from '@/lib/types';

function PresetSwatch({ accent, gray }: { accent: string; gray: string }) {
    return (
        <Flex gap="1" align="center">
            <span
                aria-hidden
                style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: `var(--${accent}-9)`,
                    border: '1px solid var(--gray-a6)',
                }}
            />
            <span
                aria-hidden
                style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: `var(--${gray}-6)`,
                    border: '1px solid var(--gray-a6)',
                }}
            />
        </Flex>
    );
}

export default function AppearanceSettingsForm({
    config,
    logoUrl,
}: {
    config: Partial<AppConfig>;
    logoUrl: string | null;
}) {
    const branding = config.branding;
    const initialPreset = THEME_PRESETS.some((p) => p.id === branding?.themePreset)
        ? (branding?.themePreset as string)
        : CUSTOM_THEME_PRESET_ID;
    const [preset, setPreset] = useState(initialPreset);
    const isCustom = preset === CUSTOM_THEME_PRESET_ID;

    return (
        <SettingsSectionForm section="appearance">
            <Text size="2" color="gray">
                Pick the color theme for the whole app. Visitors and team members can still switch between light and dark on their own device.
            </Text>

            <Field label="Theme preset">
                <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="2">
                    {THEME_PRESETS.map((p) => (
                        <label
                            key={p.id}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: '10px 12px',
                                minHeight: 44,
                                borderRadius: 'var(--radius-3)',
                                border: preset === p.id ? '2px solid var(--accent-9)' : '1px solid var(--gray-a6)',
                                cursor: 'pointer',
                                background: 'var(--color-panel)',
                            }}
                        >
                            <input
                                type="radio"
                                name="themePreset"
                                value={p.id}
                                checked={preset === p.id}
                                onChange={() => setPreset(p.id)}
                                style={{ marginTop: 4 }}
                            />
                            <Box style={{ minWidth: 0 }}>
                                <Flex align="center" gap="2">
                                    <Text size="2" weight="bold">{p.label}</Text>
                                    <PresetSwatch accent={p.accentColor} gray={p.grayColor} />
                                </Flex>
                                <Text size="1" color="gray">{p.description}</Text>
                            </Box>
                        </label>
                    ))}
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '10px 12px',
                            minHeight: 44,
                            borderRadius: 'var(--radius-3)',
                            border: isCustom ? '2px solid var(--accent-9)' : '1px solid var(--gray-a6)',
                            cursor: 'pointer',
                            background: 'var(--color-panel)',
                        }}
                    >
                        <input
                            type="radio"
                            name="themePreset"
                            value={CUSTOM_THEME_PRESET_ID}
                            checked={isCustom}
                            onChange={() => setPreset(CUSTOM_THEME_PRESET_ID)}
                            style={{ marginTop: 4 }}
                        />
                        <Box>
                            <Text size="2" weight="bold">Custom</Text>
                            <Text as="div" size="1" color="gray">Pick your own accent, gray, and corner radius.</Text>
                        </Box>
                    </label>
                </Grid>
            </Field>

            {isCustom ? (
                <Grid columns={{ initial: '1', sm: '3' }} gap="4">
                    <Field label="Accent color">
                        <Select.Root name="accentColor" defaultValue={branding?.accentColor || 'indigo'}>
                            <Select.Trigger />
                            <Select.Content>
                                {ACCENT_COLORS.map((color) => (
                                    <Select.Item key={color} value={color}>
                                        <Flex align="center" gap="2">
                                            <span
                                                aria-hidden
                                                style={{
                                                    width: 14,
                                                    height: 14,
                                                    borderRadius: '50%',
                                                    background: `var(--${color}-9)`,
                                                }}
                                            />
                                            {color}
                                        </Flex>
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </Field>
                    <Field label="Gray scale">
                        <Select.Root name="grayColor" defaultValue={branding?.grayColor || 'slate'}>
                            <Select.Trigger />
                            <Select.Content>
                                {GRAY_COLORS.map((color) => (
                                    <Select.Item key={color} value={color}>{color}</Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </Field>
                    <Field label="Corner radius">
                        <Select.Root name="radius" defaultValue={branding?.radius || 'large'}>
                            <Select.Trigger />
                            <Select.Content>
                                {RADII.map((radius) => (
                                    <Select.Item key={radius} value={radius}>{radius}</Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Root>
                    </Field>
                </Grid>
            ) : null}

            <Field label="Default appearance" hint="Applied to visitors who have not chosen light or dark themselves.">
                <Select.Root name="defaultAppearance" defaultValue={branding?.defaultAppearance || 'system'}>
                    <Select.Trigger style={{ maxWidth: 220 }} />
                    <Select.Content>
                        <Select.Item value="system">System (follow device)</Select.Item>
                        <Select.Item value="light">Light</Select.Item>
                        <Select.Item value="dark">Dark</Select.Item>
                    </Select.Content>
                </Select.Root>
            </Field>

            <Box style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: 16 }}>
                <Text size="3" weight="bold" as="div" mb="2">Logo</Text>
                <Flex direction="column" gap="3">
                    {logoUrl ? (
                        <Flex align="center" gap="3" wrap="wrap">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={logoUrl}
                                alt="Current logo"
                                style={{
                                    height: 48,
                                    width: 'auto',
                                    maxWidth: 200,
                                    borderRadius: 8,
                                    background: 'var(--gray-3)',
                                    padding: 4,
                                }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44, cursor: 'pointer' }}>
                                <input type="checkbox" name="removeLogo" />
                                Remove logo
                            </label>
                        </Flex>
                    ) : null}
                    <Field label={logoUrl ? 'Replace logo' : 'Upload logo'} hint="PNG, JPEG, WebP, SVG, or GIF up to 2MB. Shown in the header, sign-in page, and optionally on documents.">
                        <input type="file" name="logoFile" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" />
                    </Field>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            name="showLogoOnDocuments"
                            defaultChecked={branding?.showLogoOnDocuments ?? false}
                        />
                        Use the logo on printed documents instead of the text letterhead
                    </label>
                </Flex>
            </Box>

            <Box style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: 16 }}>
                <Text size="3" weight="bold" as="div" mb="2">Document letterhead</Text>
                <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                    <Field label="Letterhead line 1" hint="Large first line on invoices and contracts. Defaults to the first word of your business name.">
                        <TextField.Root
                            name="letterheadLine1"
                            defaultValue={branding?.letterheadLine1 || ''}
                            placeholder="ACME"
                        />
                    </Field>
                    <Field label="Letterhead line 2" hint="Smaller second line. Defaults to the rest of the name.">
                        <TextField.Root
                            name="letterheadLine2"
                            defaultValue={branding?.letterheadLine2 || ''}
                            placeholder="CONTRACTING"
                        />
                    </Field>
                </Grid>
                <Box mt="3" style={{ maxWidth: 240 }}>
                    <Field label="Document accent color" hint="Rules, headings, and totals on printed documents.">
                        <input
                            type="color"
                            name="documentAccentColor"
                            defaultValue={branding?.documentAccentColor || '#1e3a5f'}
                            style={{ width: 64, height: 36, border: '1px solid var(--gray-a6)', borderRadius: 6, background: 'transparent', padding: 2 }}
                        />
                    </Field>
                </Box>
            </Box>
        </SettingsSectionForm>
    );
}
