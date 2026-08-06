'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { getAppConfig, saveAppConfig } from '@/lib/config';
import { parseDocumentFormMode } from '@/lib/document-form-mode';
import {
    CUSTOM_THEME_PRESET_ID,
    getThemePreset,
    parseAccentColor,
    parseAppearance,
    parseGrayColor,
    parseThemeRadius,
} from '@/lib/theme-presets';
import { requireAdminAction } from '@/lib/require-admin-session';
import { checkConnection } from '@/lib/webdav';
import type {
    AppConfig,
    BillingConfig,
    PaymentMethodKey,
    PublicSiteConfig,
    PublicSiteHighlight,
    PublicSiteService,
    PublicSiteTestimonial,
} from '@/lib/types';

export type SettingsActionState = { success: boolean; error?: string };

const BRANDING_DIR = path.join(process.cwd(), 'data', 'branding');
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_EXT_BY_MIME: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/gif': '.gif',
};

function str(formData: FormData, key: string): string {
    return ((formData.get(key) as string) || '').trim();
}

function revalidateAll() {
    revalidatePath('/', 'layout');
}

// ─── Business profile ────────────────────────────────────────────────

async function saveBusinessSection(formData: FormData): Promise<SettingsActionState> {
    const update: Partial<AppConfig> = {
        business: {
            name: str(formData, 'businessName'),
            legalName: str(formData, 'legalName'),
            tagline: str(formData, 'tagline'),
            phoneDisplay: str(formData, 'phoneDisplay'),
            phoneE164: str(formData, 'phoneE164'),
            email: str(formData, 'businessEmail'),
            addressLine1: str(formData, 'addressLine1'),
            addressLine2: str(formData, 'addressLine2'),
            serviceArea: str(formData, 'serviceArea'),
        },
        businessTimezone: str(formData, 'businessTimezone') || undefined,
    };
    await saveAppConfig(update);
    return { success: true };
}

// ─── Appearance / branding ───────────────────────────────────────────

async function handleLogoUpload(formData: FormData, current: Partial<AppConfig>): Promise<{ logoFileName?: string; error?: string }> {
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

async function saveAppearanceSection(formData: FormData): Promise<SettingsActionState> {
    const current = await getAppConfig();

    const logoResult = await handleLogoUpload(formData, current);
    if (logoResult.error) {
        return { success: false, error: logoResult.error };
    }

    const presetRaw = str(formData, 'themePreset');
    const preset = getThemePreset(presetRaw);
    const presetId = preset ? preset.id : CUSTOM_THEME_PRESET_ID;

    const documentAccentRaw = str(formData, 'documentAccentColor');
    const documentAccentColor = /^#[0-9a-fA-F]{6}$/.test(documentAccentRaw) ? documentAccentRaw : undefined;

    const update: Partial<AppConfig> = {
        branding: {
            themePreset: presetId,
            accentColor: preset ? preset.accentColor : parseAccentColor(str(formData, 'accentColor')),
            grayColor: preset ? preset.grayColor : parseGrayColor(str(formData, 'grayColor')),
            radius: preset ? preset.radius : parseThemeRadius(str(formData, 'radius')),
            defaultAppearance: parseAppearance(str(formData, 'defaultAppearance')),
            letterheadLine1: str(formData, 'letterheadLine1'),
            letterheadLine2: str(formData, 'letterheadLine2'),
            documentAccentColor: documentAccentColor ?? current.branding?.documentAccentColor,
            logoFileName: logoResult.logoFileName,
            showLogoOnDocuments: formData.get('showLogoOnDocuments') === 'on',
        },
    };
    await saveAppConfig(update);
    return { success: true };
}

// ─── Public site ─────────────────────────────────────────────────────

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

function sanitizeHighlights(raw: unknown): PublicSiteHighlight[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item) => ({
            title: String(item?.title ?? '').trim().slice(0, 120),
            text: String(item?.text ?? '').trim().slice(0, 500),
            icon: String(item?.icon ?? '').trim().slice(0, 40) || undefined,
        }))
        .filter((item) => item.title || item.text)
        .slice(0, 6);
}

function sanitizeLines(raw: unknown, maxItems: number): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((line) => String(line ?? '').trim().slice(0, 200))
        .filter(Boolean)
        .slice(0, maxItems);
}

function sanitizeServices(raw: unknown): PublicSiteService[] {
    if (!Array.isArray(raw)) return [];
    const services: PublicSiteService[] = [];
    const usedSlugs = new Set<string>();
    for (const item of raw) {
        const shortTitle = String(item?.shortTitle ?? '').trim().slice(0, 80);
        if (!shortTitle) continue;
        let slug = slugify(String(item?.slug ?? '').trim() || shortTitle);
        if (!slug) continue;
        while (usedSlugs.has(slug)) slug = `${slug}-2`;
        usedSlugs.add(slug);
        services.push({
            slug,
            formValue: slugify(String(item?.formValue ?? '').trim()) || slug,
            title: String(item?.title ?? '').trim().slice(0, 140) || shortTitle,
            shortTitle,
            description: String(item?.description ?? '').trim().slice(0, 500),
            summary: String(item?.summary ?? '').trim().slice(0, 800),
            highlights: sanitizeLines(item?.highlights, 8),
            idealFor: sanitizeLines(item?.idealFor, 8),
            icon: String(item?.icon ?? '').trim().slice(0, 40) || undefined,
        });
        if (services.length >= 12) break;
    }
    return services;
}

function sanitizeTestimonials(raw: unknown): PublicSiteTestimonial[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item) => ({
            name: String(item?.name ?? '').trim().slice(0, 120),
            service: String(item?.service ?? '').trim().slice(0, 120),
            quote: String(item?.quote ?? '').trim().slice(0, 1200),
        }))
        .filter((item) => item.name && item.quote)
        .slice(0, 12);
}

async function savePublicSiteSection(formData: FormData): Promise<SettingsActionState> {
    let parsed: Record<string, unknown>;
    try {
        parsed = JSON.parse(str(formData, 'publicSiteJson') || '{}');
    } catch {
        return { success: false, error: 'Could not read the public site content. Please retry.' };
    }

    const publicSite: PublicSiteConfig = {
        enabled: Boolean(parsed.enabled),
        heroHeading: String(parsed.heroHeading ?? '').trim().slice(0, 160),
        heroSubheading: String(parsed.heroSubheading ?? '').trim().slice(0, 300),
        seoTitle: String(parsed.seoTitle ?? '').trim().slice(0, 160),
        seoDescription: String(parsed.seoDescription ?? '').trim().slice(0, 320),
        seoKeywords: sanitizeLines(parsed.seoKeywords, 15),
        highlights: sanitizeHighlights(parsed.highlights),
        services: sanitizeServices(parsed.services),
        testimonials: sanitizeTestimonials(parsed.testimonials),
    };

    await saveAppConfig({ publicSite });
    return { success: true };
}

// ─── Billing ─────────────────────────────────────────────────────────

const PAYMENT_METHOD_KEYS: PaymentMethodKey[] = ['cash', 'check', 'zelle', 'cashApp', 'paypal', 'venmo', 'applePay', 'stripe'];

const DEFAULT_METHOD_LABELS: Record<PaymentMethodKey, string> = {
    cash: 'Cash',
    check: 'Check',
    zelle: 'Zelle',
    cashApp: 'Cash App',
    paypal: 'PayPal',
    venmo: 'Venmo',
    applePay: 'Apple Pay',
    stripe: 'Stripe',
};

async function saveBillingSection(formData: FormData): Promise<SettingsActionState> {
    const currentConfig = await getAppConfig();

    const orderRaw = str(formData, 'paymentMethodOrder');
    const orderedKeys = orderRaw
        .split(',')
        .map((k) => k.trim())
        .filter((k): k is PaymentMethodKey => (PAYMENT_METHOD_KEYS as string[]).includes(k));
    const positionByKey = new Map<PaymentMethodKey, number>();
    orderedKeys.forEach((key, index) => positionByKey.set(key, index));
    // Any keys missing from the submitted order keep a stable position after the ordered ones.
    let fallbackPosition = orderedKeys.length;
    for (const key of PAYMENT_METHOD_KEYS) {
        if (!positionByKey.has(key)) {
            positionByKey.set(key, fallbackPosition++);
        }
    }

    const update: Partial<AppConfig> = {
        billing: {
            checkPayableTo: str(formData, 'checkPayableTo'),
            paymentInstructions: str(formData, 'paymentInstructions'),
            paymentMethods: PAYMENT_METHOD_KEYS.reduce((acc, key) => {
                const existing = currentConfig.billing?.paymentMethods?.[key];
                acc[key] = {
                    enabled: formData.has(`billing.${key}.enabled`),
                    label: existing?.label || DEFAULT_METHOD_LABELS[key],
                    value: str(formData, `billing.${key}.value`),
                    note: str(formData, `billing.${key}.note`),
                    comingSoon: formData.has(`billing.${key}.comingSoon`),
                    position: positionByKey.get(key) ?? existing?.position ?? 0,
                };
                return acc;
            }, {} as BillingConfig['paymentMethods']),
        },
    };

    await saveAppConfig(update);
    return { success: true };
}

// ─── Documents ───────────────────────────────────────────────────────

async function saveDocumentsSection(formData: FormData): Promise<SettingsActionState> {
    await saveAppConfig({
        documentFormMode: parseDocumentFormMode(formData.get('documentFormMode')),
    });
    return { success: true };
}

// ─── Storage (WebDAV) ────────────────────────────────────────────────

async function saveStorageSection(formData: FormData): Promise<SettingsActionState> {
    const currentConfig = await getAppConfig();
    const url = str(formData, 'webdavUrl');
    const username = str(formData, 'webdavUsername');
    const password = str(formData, 'webdavPassword');
    const rootPath = str(formData, 'webdavRootPath');

    const update: Partial<AppConfig> = {
        webdavUrl: url,
        webdavUsername: username,
        webdavPassword: password, // Note: Storing plain text password locally. Ideal? No. Functional for self-hosted? Yes.
        webdavRootPath: rootPath || currentConfig.webdavRootPath,
    };

    const webdavConfigChanged =
        url !== (currentConfig.webdavUrl || '')
        || username !== (currentConfig.webdavUsername || '')
        || password !== (currentConfig.webdavPassword || '');

    if (webdavConfigChanged && url && username) {
        const isValid = await Promise.race([
            checkConnection(update as AppConfig, password),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000)),
        ]);
        if (!isValid) {
            return { success: false, error: 'Failed to connect to WebDAV with these credentials.' };
        }
    }

    await saveAppConfig(update);
    return { success: true };
}

// ─── Entry point ─────────────────────────────────────────────────────

export async function saveSettingsSectionAction(
    _prev: SettingsActionState | undefined,
    formData: FormData,
): Promise<SettingsActionState> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const section = str(formData, 'section');
    try {
        let result: SettingsActionState;
        switch (section) {
            case 'business':
                result = await saveBusinessSection(formData);
                break;
            case 'appearance':
                result = await saveAppearanceSection(formData);
                break;
            case 'publicSite':
                result = await savePublicSiteSection(formData);
                break;
            case 'billing':
                result = await saveBillingSection(formData);
                break;
            case 'documents':
                result = await saveDocumentsSection(formData);
                break;
            case 'storage':
                result = await saveStorageSection(formData);
                break;
            default:
                return { success: false, error: 'Unknown settings section.' };
        }
        if (result.success) {
            // Branding affects every route (nav, metadata, documents, public site).
            revalidateAll();
        }
        return result;
    } catch (error) {
        console.error(`Failed to save settings section "${section}"`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to save settings: ${message}` };
    }
}
