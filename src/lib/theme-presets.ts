import type { ThemeAppearance } from './types';

/**
 * Curated Radix Themes combinations selectable in Settings → Appearance.
 * A preset is the site-wide default look; light/dark stays a per-visitor
 * choice on top of it.
 */

export type AccentColor =
    | 'gray' | 'gold' | 'bronze' | 'brown' | 'yellow' | 'amber' | 'orange'
    | 'tomato' | 'red' | 'ruby' | 'crimson' | 'pink' | 'plum' | 'purple'
    | 'violet' | 'iris' | 'indigo' | 'blue' | 'cyan' | 'teal' | 'jade'
    | 'green' | 'grass' | 'lime' | 'mint' | 'sky';

export type GrayColor = 'gray' | 'mauve' | 'slate' | 'sage' | 'olive' | 'sand';

export type ThemeRadius = 'none' | 'small' | 'medium' | 'large' | 'full';

const ACCENT_COLORS: AccentColor[] = [
    'gray', 'gold', 'bronze', 'brown', 'yellow', 'amber', 'orange', 'tomato',
    'red', 'ruby', 'crimson', 'pink', 'plum', 'purple', 'violet', 'iris',
    'indigo', 'blue', 'cyan', 'teal', 'jade', 'green', 'grass', 'lime',
    'mint', 'sky',
];

const GRAY_COLORS: GrayColor[] = ['gray', 'mauve', 'slate', 'sage', 'olive', 'sand'];

const RADII: ThemeRadius[] = ['none', 'small', 'medium', 'large', 'full'];

export interface ThemePreset {
    id: string;
    label: string;
    description: string;
    accentColor: AccentColor;
    grayColor: GrayColor;
    radius: ThemeRadius;
}

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: 'classic-indigo',
        label: 'Classic Indigo',
        description: 'Calm indigo with cool slate grays — the original look.',
        accentColor: 'indigo',
        grayColor: 'slate',
        radius: 'large',
    },
    {
        id: 'ocean-teal',
        label: 'Ocean Teal',
        description: 'Fresh teal with soft sage grays.',
        accentColor: 'teal',
        grayColor: 'sage',
        radius: 'large',
    },
    {
        id: 'forest',
        label: 'Forest',
        description: 'Grounded greens with olive grays.',
        accentColor: 'grass',
        grayColor: 'olive',
        radius: 'medium',
    },
    {
        id: 'sunset-amber',
        label: 'Sunset Amber',
        description: 'Warm amber with sandy neutrals.',
        accentColor: 'amber',
        grayColor: 'sand',
        radius: 'medium',
    },
    {
        id: 'ruby',
        label: 'Ruby',
        description: 'Bold ruby red with warm mauve grays.',
        accentColor: 'ruby',
        grayColor: 'mauve',
        radius: 'large',
    },
    {
        id: 'steel-blue',
        label: 'Steel Blue',
        description: 'Crisp blue with pure grays and tighter corners.',
        accentColor: 'blue',
        grayColor: 'gray',
        radius: 'small',
    },
];

export const DEFAULT_THEME_PRESET_ID = 'classic-indigo';
export const CUSTOM_THEME_PRESET_ID = 'custom';

export function getThemePreset(id: string | undefined): ThemePreset | undefined {
    return THEME_PRESETS.find((preset) => preset.id === id);
}

export function parseAccentColor(value: unknown, fallback: AccentColor = 'indigo'): AccentColor {
    return ACCENT_COLORS.includes(value as AccentColor) ? (value as AccentColor) : fallback;
}

export function parseGrayColor(value: unknown, fallback: GrayColor = 'slate'): GrayColor {
    return GRAY_COLORS.includes(value as GrayColor) ? (value as GrayColor) : fallback;
}

export function parseThemeRadius(value: unknown, fallback: ThemeRadius = 'large'): ThemeRadius {
    return RADII.includes(value as ThemeRadius) ? (value as ThemeRadius) : fallback;
}

export function parseAppearance(value: unknown, fallback: ThemeAppearance = 'system'): ThemeAppearance {
    return value === 'light' || value === 'dark' || value === 'system' ? value : fallback;
}

export { ACCENT_COLORS, GRAY_COLORS, RADII };

export interface ResolvedTheme {
    presetId: string;
    accentColor: AccentColor;
    grayColor: GrayColor;
    radius: ThemeRadius;
    defaultAppearance: ThemeAppearance;
}

/** Resolve a BrandingConfig-ish shape into concrete Radix Theme props. */
export function resolveTheme(branding: {
    themePreset?: string;
    accentColor?: string;
    grayColor?: string;
    radius?: string;
    defaultAppearance?: string;
} | undefined): ResolvedTheme {
    const presetId = branding?.themePreset || DEFAULT_THEME_PRESET_ID;
    const preset = getThemePreset(presetId);
    if (preset) {
        return {
            presetId: preset.id,
            accentColor: preset.accentColor,
            grayColor: preset.grayColor,
            radius: preset.radius,
            defaultAppearance: parseAppearance(branding?.defaultAppearance),
        };
    }
    // 'custom' (or unknown id): honor the raw values with safe fallbacks.
    return {
        presetId: CUSTOM_THEME_PRESET_ID,
        accentColor: parseAccentColor(branding?.accentColor),
        grayColor: parseGrayColor(branding?.grayColor),
        radius: parseThemeRadius(branding?.radius),
        defaultAppearance: parseAppearance(branding?.defaultAppearance),
    };
}
