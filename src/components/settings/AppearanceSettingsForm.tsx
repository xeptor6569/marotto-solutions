'use client';

import { useState } from 'react';
import { Box, Flex, Grid, SegmentedControl, Select, Text, TextField } from '@radix-ui/themes';
import SettingsSectionForm, { Field } from './SettingsSectionForm';
import LookPicker from '@/components/theme/LookPicker';
import ColorPresetPicker from '@/components/theme/ColorPresetPicker';
import ThemePreview from '@/components/theme/ThemePreview';
import {
    ACCENT_COLORS,
    CUSTOM_THEME_PRESET_ID,
    GRAY_COLORS,
    RADII,
    resolveTheme,
    type AccentColor,
    type GrayColor,
    type ThemeRadius,
} from '@/lib/theme-presets';
import { getLook, type LookId, type ThemeDensity } from '@/lib/theme-looks';
import { resolveBusiness, resolveLetterhead } from '@/lib/branding-core';
import type { AppConfig } from '@/lib/types';

export default function AppearanceSettingsForm({
    config,
    logoUrl,
}: {
    config: Partial<AppConfig>;
    logoUrl: string | null;
}) {
    const branding = config.branding;
    const saved = resolveTheme(branding);
    const [lookId, setLookId] = useState<LookId>(saved.lookId);
    const [presetId, setPresetId] = useState(saved.presetId);
    const [density, setDensity] = useState<ThemeDensity>(saved.density);
    const [customAccent, setCustomAccent] = useState<AccentColor>(saved.accentColor);
    const [customGray, setCustomGray] = useState<GrayColor>(saved.grayColor);
    const [customRadius, setCustomRadius] = useState<ThemeRadius>(saved.radius);
    const [letterheadLine1, setLetterheadLine1] = useState(branding?.letterheadLine1 || '');
    const [letterheadLine2, setLetterheadLine2] = useState(branding?.letterheadLine2 || '');
    const [documentAccent, setDocumentAccent] = useState(branding?.documentAccentColor || '#1e3a5f');
    const isCustom = presetId === CUSTOM_THEME_PRESET_ID;

    const preview = resolveTheme({
        themePreset: presetId,
        accentColor: customAccent,
        grayColor: customGray,
        radius: customRadius,
        look: lookId,
        density,
    });
    const business = resolveBusiness(config.business);
    const letterhead = resolveLetterhead({ letterheadLine1, letterheadLine2 }, business);

    const chooseLook = (next: LookId) => {
        setLookId(next);
        const look = getLook(next);
        if (!look) return;
        // Suggest the Look's color pairing, but never discard hand-picked custom colors.
        if (!isCustom) setPresetId(look.suggestedPresetId);
        else setCustomRadius(look.radius);
    };

    return (
        <SettingsSectionForm section="appearance">
            <div className="appearance-layout">
                <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
                    <Text size="2" color="gray">
                        Pick a Look for type, shape, and density, then a color. Team members and clients can still switch between light and dark on their own device.
                    </Text>

                    <Field
                        label="Look"
                        help="The Look controls typefaces, corner shape, spacing, and surfaces across the admin, setup, and client pages. Choosing one suggests a matching color, which you can change below."
                        helpTopic="branding-theming"
                    >
                        <LookPicker
                            value={lookId}
                            onChange={chooseLook}
                            accentColor={preview.accentColor}
                            grayColor={preview.grayColor}
                        />
                    </Field>

                    <Field label="Color">
                        <ColorPresetPicker value={presetId} onChange={setPresetId} />
                    </Field>

                    {isCustom ? (
                        <Grid columns={{ initial: '1', sm: '3' }} gap="4">
                            <Field label="Accent color">
                                <Select.Root name="accentColor" value={customAccent} onValueChange={(v) => setCustomAccent(v as AccentColor)}>
                                    <Select.Trigger />
                                    <Select.Content>
                                        {ACCENT_COLORS.map((color) => (
                                            <Select.Item key={color} value={color}>
                                                <Flex align="center" gap="2">
                                                    <span className="color-dot" style={{ background: `var(--${color}-9)` }} aria-hidden />
                                                    {color}
                                                </Flex>
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Root>
                            </Field>
                            <Field label="Gray scale">
                                <Select.Root name="grayColor" value={customGray} onValueChange={(v) => setCustomGray(v as GrayColor)}>
                                    <Select.Trigger />
                                    <Select.Content>
                                        {GRAY_COLORS.map((color) => (
                                            <Select.Item key={color} value={color}>
                                                <Flex align="center" gap="2">
                                                    <span className="color-dot" style={{ background: `var(--${color}-8)` }} aria-hidden />
                                                    {color}
                                                </Flex>
                                            </Select.Item>
                                        ))}
                                    </Select.Content>
                                </Select.Root>
                            </Field>
                            <Field label="Corner radius">
                                <Select.Root name="radius" value={customRadius} onValueChange={(v) => setCustomRadius(v as ThemeRadius)}>
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

                    <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                        <Field
                            label="Density"
                            hint="Compact fits more on screen; comfortable gives larger touch targets."
                        >
                            <input type="hidden" name="density" value={density} />
                            <SegmentedControl.Root value={density} onValueChange={(v) => setDensity(v as ThemeDensity)}>
                                <SegmentedControl.Item value="compact">Compact</SegmentedControl.Item>
                                <SegmentedControl.Item value="default">Default</SegmentedControl.Item>
                                <SegmentedControl.Item value="comfortable">Roomy</SegmentedControl.Item>
                            </SegmentedControl.Root>
                        </Field>
                        <Field
                            label="Default appearance"
                            hint="For visitors who have not chosen light or dark themselves."
                            help={`"System" follows each device's own setting. Anyone can switch with the sun/moon button, and their choice is remembered on that device. Printed documents are always light.`}
                            helpTopic="branding-theming"
                        >
                            <Select.Root name="defaultAppearance" defaultValue={branding?.defaultAppearance || 'system'}>
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="system">System (follow device)</Select.Item>
                                    <Select.Item value="light">Light</Select.Item>
                                    <Select.Item value="dark">Dark</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Field>
                    </Grid>

                    <Box className="settings-subsection">
                        <Text size="3" weight="bold" as="div" mb="2">Logo</Text>
                        <Flex direction="column" gap="3">
                            {logoUrl ? (
                                <Flex align="center" gap="3" wrap="wrap">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={logoUrl} alt="Current logo" className="settings-logo-preview" />
                                    <label className="inline-check">
                                        <input type="checkbox" name="removeLogo" />
                                        Remove logo
                                    </label>
                                </Flex>
                            ) : null}
                            <Field label={logoUrl ? 'Replace logo' : 'Upload logo'} hint="PNG, JPEG, WebP, SVG, or GIF up to 2MB. Shown in the header, sign-in page, client pages, and optionally on documents.">
                                <input type="file" name="logoFile" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" />
                            </Field>
                            <label className="inline-check">
                                <input
                                    type="checkbox"
                                    name="showLogoOnDocuments"
                                    defaultChecked={branding?.showLogoOnDocuments ?? false}
                                />
                                Use the logo on printed documents instead of the text letterhead
                            </label>
                        </Flex>
                    </Box>

                    <Box className="settings-subsection">
                        <Text size="3" weight="bold" as="div" mb="2">Document letterhead</Text>
                        <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                            <Field label="Letterhead line 1" hint="Large first line on invoices and contracts. Defaults to the first word of your business name.">
                                <TextField.Root
                                    name="letterheadLine1"
                                    value={letterheadLine1}
                                    onChange={(e) => setLetterheadLine1(e.target.value)}
                                    placeholder="ACME"
                                />
                            </Field>
                            <Field label="Letterhead line 2" hint="Smaller second line. Defaults to the rest of the name.">
                                <TextField.Root
                                    name="letterheadLine2"
                                    value={letterheadLine2}
                                    onChange={(e) => setLetterheadLine2(e.target.value)}
                                    placeholder="CONTRACTING"
                                />
                            </Field>
                        </Grid>
                        <Box mt="3" style={{ maxWidth: 260 }}>
                            <Field
                                label="Document accent color"
                                hint="Rules, headings, and totals on printed documents."
                                help="Printed and PDF documents use this instead of the app color, so your paperwork can match your brand even if the app uses a different preset. The letterhead typeface follows the Look."
                                helpTopic="branding-theming"
                            >
                                <input
                                    type="color"
                                    name="documentAccentColor"
                                    value={documentAccent}
                                    onChange={(e) => setDocumentAccent(e.target.value)}
                                    className="color-input"
                                />
                            </Field>
                        </Box>
                    </Box>
                </Flex>

                <aside className="appearance-preview">
                    <ThemePreview
                        settings={preview}
                        businessName={business.name}
                        letterhead={letterhead}
                        documentAccentColor={documentAccent}
                    />
                </aside>
            </div>
        </SettingsSectionForm>
    );
}
