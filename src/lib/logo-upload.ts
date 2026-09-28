import fs from 'fs/promises';
import path from 'path';
import type { AppConfig } from './types';

/** Uploaded logos live on the persistent data volume and are served by /api/branding/logo. */
const BRANDING_DIR = path.join(process.cwd(), 'data', 'branding');
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_EXT_BY_MIME: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/gif': '.gif',
};

/**
 * Applies the `logoFile` / `removeLogo` form fields: stores a new upload,
 * removes the old file, and returns the logo file name to save in settings.
 */
export async function handleLogoUpload(formData: FormData, current: Partial<AppConfig>): Promise<{ logoFileName?: string; error?: string }> {
    const removeLogo = formData.get('removeLogo') === 'on';
    const file = formData.get('logoFile');
    const currentLogo = current.branding?.logoFileName?.trim() || '';

    const deleteCurrent = async () => {
        if (!currentLogo) return;
        await fs.rm(path.join(BRANDING_DIR, path.basename(currentLogo)), { force: true }).catch(() => {});
    };

    if (removeLogo) {
        await deleteCurrent();
        return { logoFileName: '' };
    }

    if (!(file instanceof File) || file.size === 0) {
        return { logoFileName: currentLogo };
    }
    if (file.size > MAX_LOGO_BYTES) {
        return { error: 'Logo must be 2MB or smaller.' };
    }
    const ext = LOGO_EXT_BY_MIME[file.type];
    if (!ext) {
        return { error: 'Logo must be a PNG, JPEG, WebP, SVG, or GIF image.' };
    }

    await fs.mkdir(BRANDING_DIR, { recursive: true });
    // Timestamped name doubles as a cache-buster for the immutable asset route.
    const fileName = `logo-${Date.now()}${ext}`;
    await fs.writeFile(path.join(BRANDING_DIR, fileName), Buffer.from(await file.arrayBuffer()));
    await deleteCurrent();
    return { logoFileName: fileName };
}
