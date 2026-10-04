import type { ThemeRadius } from './theme-presets';

/**
 * A Look is the structural half of the theme: typography, corner shape,
 * density, and surface treatment. It combines with a color preset (accent +
 * gray) and the per-visitor light/dark choice. The visual rules for each Look
 * live in src/styles/looks.css, keyed by `data-look` / `data-look-scope`.
 */

export type LookId = 'studio' | 'ledger' | 'instrument' | 'workshop' | 'soft';

export type ThemeScaling = '90%' | '95%' | '100%' | '105%' | '110%';

export type PanelBackground = 'solid' | 'translucent';

/** `default` keeps the Look's own scaling; the others step one notch either way. */
export type ThemeDensity = 'compact' | 'default' | 'comfortable';

export interface ThemeLook {
    id: LookId;
    label: string;
    description: string;
    /** Human-readable type pairing shown on the Look card. */
    typeface: string;
    radius: ThemeRadius;
    scaling: ThemeScaling;
    panelBackground: PanelBackground;
    /** Color preset pre-selected when an admin picks this Look. */
    suggestedPresetId: string;
}

export const LOOKS: ThemeLook[] = [
    {
        id: 'studio',
        label: 'Studio',
        description: 'Clean and balanced. Crisp sans-serif, soft elevation, medium corners.',
        typeface: 'Geist · Geist Mono',
        radius: 'medium',
        scaling: '100%',
        panelBackground: 'solid',
        suggestedPresetId: 'classic-indigo',
    },
    {
        id: 'ledger',
        label: 'Ledger',
        description: 'Editorial and paper-like. Serif headings, hairline rules, small-caps labels.',
        typeface: 'Newsreader · Geist',
        radius: 'small',
        scaling: '100%',
        panelBackground: 'solid',
        suggestedPresetId: 'ledger-green',
    },
    {
        id: 'instrument',
        label: 'Instrument',
        description: 'Dense and precise. Monospaced figures, sharp corners, graph-paper canvas.',
        typeface: 'Geist · Geist Mono figures',
        radius: 'small',
        scaling: '95%',
        panelBackground: 'solid',
        suggestedPresetId: 'signal',
    },
    {
        id: 'workshop',
        label: 'Workshop',
        description: 'Bold and tactile. Chunky grotesque headings, generous spacing, warm canvas.',
        typeface: 'Bricolage Grotesque · Geist',
        radius: 'large',
        scaling: '105%',
        panelBackground: 'solid',
        suggestedPresetId: 'sunset-amber',
    },
    {
        id: 'soft',
        label: 'Soft',
        description: 'Airy and calm. Frosted panels, rounded controls, a gentle tinted glow.',
        typeface: 'Geist',
        radius: 'full',
        scaling: '100%',
        panelBackground: 'translucent',
        suggestedPresetId: 'dusk',
    },
];

export const DEFAULT_LOOK_ID: LookId = 'studio';

export const DENSITIES: ThemeDensity[] = ['compact', 'default', 'comfortable'];

const SCALING_STEPS: ThemeScaling[] = ['90%', '95%', '100%', '105%', '110%'];

export function getLook(id: string | undefined): ThemeLook | undefined {
    return LOOKS.find((look) => look.id === id);
}

export function parseLook(value: unknown): ThemeLook {
    return getLook(typeof value === 'string' ? value : undefined) ?? (getLook(DEFAULT_LOOK_ID) as ThemeLook);
}

export function parseDensity(value: unknown): ThemeDensity {
    return DENSITIES.includes(value as ThemeDensity) ? (value as ThemeDensity) : 'default';
}

/** The Look's scaling nudged one step denser or roomier, clamped to Radix's range. */
export function scalingForDensity(look: ThemeLook, density: ThemeDensity): ThemeScaling {
    const index = SCALING_STEPS.indexOf(look.scaling);
    const offset = density === 'compact' ? -1 : density === 'comfortable' ? 1 : 0;
    const next = Math.min(SCALING_STEPS.length - 1, Math.max(0, index + offset));
    return SCALING_STEPS[next];
}
