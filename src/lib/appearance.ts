import { cookies } from 'next/headers';
import { parseAppearance } from './theme-presets';
import type { ThemeAppearance } from './types';

/**
 * Per-visitor light/dark preference, stored in a cookie so the server can
 * render the correct theme with no flash. The installation-wide default
 * (branding.defaultAppearance) applies when the visitor has not chosen.
 */

export const APPEARANCE_COOKIE = 'appearance';

export async function getAppearancePreference(
    defaultAppearance: ThemeAppearance,
): Promise<ThemeAppearance> {
    const cookieStore = await cookies();
    const raw = cookieStore.get(APPEARANCE_COOKIE)?.value;
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return parseAppearance(defaultAppearance);
}
