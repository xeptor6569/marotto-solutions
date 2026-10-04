import type { ThemeAppearance } from './types';
import {
    parseDensity,
    parseLook,
    scalingForDensity,
    type LookId,
    type PanelBackground,
    type ThemeDensity,
    type ThemeScaling,
} from './theme-looks';

/**
 * Curated Radix Themes color combinations selectable in Settings → Appearance.
 * A preset is the site-wide color; the Look (theme-looks.ts) decides type,
 * shape, and density, and light/dark stays a per-visitor choice on top.
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
}

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: 'classic-indigo',
        label: 'Classic Indigo',
        description: 'Calm indigo with cool slate grays — the original look.',
        accentColor: 'indigo',
        grayColor: 'slate',
    },
    {
        id: 'ledger-green',
        label: 'Ledger Green',
        description: 'Bookkeeping green on warm sand.',
        accentColor: 'jade',
        grayColor: 'sand',
    },
    {
        id: 'signal',
        label: 'Signal',
        description: 'Graphite slate with a sharp orange signal color.',
        accentColor: 'orange',
        grayColor: 'slate',
    },
    {
        id: 'ocean-teal',
        label: 'Ocean Teal',
        description: 'Fresh teal with soft sage grays.',
        accentColor: 'teal',
        grayColor: 'sage',
    },
    {
        id: 'forest',
        label: 'Forest',
        description: 'Grounded greens with olive grays.',
        accentColor: 'grass',
        grayColor: 'olive',
    },
    {
        id: 'sunset-amber',
        label: 'Sunset Amber',
        description: 'Warm amber with sandy neutrals.',
        accentColor: 'amber',
        grayColor: 'sand',
    },
    {
        id: 'ruby',
        label: 'Ruby',
        description: 'Bold ruby red with warm mauve grays.',
        accentColor: 'ruby',
        grayColor: 'mauve',
    },
    {
        id: 'dusk',
        label: 'Dusk',
        description: 'Soft violet with rosy mauve neutrals.',
        accentColor: 'violet',
        grayColor: 'mauve',
    },
    {
        id: 'steel-blue',
        label: 'Steel Blue',
        description: 'Crisp blue with pure neutral grays.',
        accentColor: 'blue',
        grayColor: 'gray',
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
    lookId: LookId;
    density: ThemeDensity;
    scaling: ThemeScaling;
    panelBackground: PanelBackground;
}

/**
 * Resolve a BrandingConfig-ish shape into concrete Radix Theme props.
 * Corner radius follows the Look unless the Custom preset sets its own.
 */
export function resolveTheme(branding: {
    themePreset?: string;
    accentColor?: string;
    grayColor?: string;
    radius?: string;
    defaultAppearance?: string;
    look?: string;
    density?: string;
} | undefined): ResolvedTheme {
    const look = parseLook(branding?.look);
    const density = parseDensity(branding?.density);
    const structure = {
        defaultAppearance: parseAppearance(branding?.defaultAppearance),
        lookId: look.id,
        density,
        scaling: scalingForDensity(look, density),
        panelBackground: look.panelBackground,
    };

    const presetId = branding?.themePreset || DEFAULT_THEME_PRESET_ID;
    const preset = getThemePreset(presetId);
    if (preset) {
        return {
            presetId: preset.id,
            accentColor: preset.accentColor,
            grayColor: preset.grayColor,
            radius: look.radius,
            ...structure,
        };
    }
    // 'custom' (or unknown id): honor the raw values with safe fallbacks.
    return {
        presetId: CUSTOM_THEME_PRESET_ID,
        accentColor: parseAccentColor(branding?.accentColor),
        grayColor: parseGrayColor(branding?.grayColor),
        radius: parseThemeRadius(branding?.radius, look.radius),
        ...structure,
    };
}
