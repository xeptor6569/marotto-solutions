import fs from 'fs/promises';
import path from 'path';
import {
    AppConfig,
    BillingConfig,
    BrandingConfig,
    BusinessConfig,
    PublicSiteConfig,
} from './types';
import { DEFAULT_DOCUMENT_FORM_MODE, parseDocumentFormMode } from './document-form-mode';
import {
    LEGACY_BRANDING,
    LEGACY_BUSINESS,
    LEGACY_PUBLIC_SITE,
    LEGACY_WEBDAV_ROOT_PATH,
} from './legacy-defaults';
import { DEFAULT_THEME_PRESET_ID } from './theme-presets';

// Settings live under the persistent `data/` volume so the runtime user
// (e.g. the unprivileged `nextjs` user inside Docker) can always write to it
// even though `/app` itself is owned by root. The legacy path is checked as a
// migration source so existing self-hosted installs keep their billing config.
const CONFIG_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json');
const LEGACY_CONFIG_PATH = path.join(process.cwd(), 'config', 'settings.json');

export const DEFAULT_WEBDAV_ROOT_PATH = '/BusinessData';

export function getDefaultBillingConfig(): BillingConfig {
    return {
        checkPayableTo: '',
        paymentInstructions: '',
        paymentMethods: {
            cash: { enabled: true, label: 'Cash', note: '', position: 0 },
            check: { enabled: true, label: 'Check', note: '', position: 1 },
            zelle: { enabled: true, label: 'Zelle', value: '', note: '', position: 2 },
            cashApp: { enabled: true, label: 'Cash App', value: '', note: '', position: 3 },
            paypal: { enabled: true, label: 'PayPal', value: '', note: '', position: 4 },
            venmo: { enabled: true, label: 'Venmo', value: '', note: '', position: 5 },
            applePay: { enabled: true, label: 'Apple Pay', value: '', note: '', position: 6 },
            stripe: {
                enabled: true,
                label: 'Stripe',
                value: '',
                note: 'Pay securely by card. Set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET to enable Checkout.',
                comingSoon: false,
                position: 7,
            },
        },
    };
}

export function getDefaultBusinessConfig(): BusinessConfig {
    return {
        name: '',
        legalName: '',
        tagline: '',
        phoneDisplay: '',
        phoneE164: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        serviceArea: '',
    };
}

export function getDefaultBrandingConfig(): BrandingConfig {
    return {
        themePreset: DEFAULT_THEME_PRESET_ID,
        defaultAppearance: 'system',
        letterheadLine1: '',
        letterheadLine2: '',
        documentAccentColor: '#1e3a5f',
        showLogoOnDocuments: false,
    };
}

export function getDefaultPublicSiteConfig(): PublicSiteConfig {
    return {
        enabled: true,
        heroHeading: '',
        heroSubheading: '',
        highlights: [],
        services: [],
        testimonials: [],
        seoTitle: '',
        seoDescription: '',
        seoKeywords: [],
    };
}

async function ensureConfigDir() {
    const dir = path.dirname(CONFIG_PATH);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

async function readConfigFromDisk(): Promise<Partial<AppConfig> | null> {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        return JSON.parse(data) as Partial<AppConfig>;
    } catch {
        // Try the legacy location for users upgrading from a previous build.
        try {
            const legacy = await fs.readFile(LEGACY_CONFIG_PATH, 'utf-8');
            return JSON.parse(legacy) as Partial<AppConfig>;
        } catch {
            return null;
        }
    }
}

/**
 * Merge a stored partial config with defaults.
 *
 * Exported for tests; production code should call getAppConfig().
 *
 * Migration: a settings file that predates white-labeling (no `business`
 * section) belongs to an install that ran with the original hardcoded
 * branding, so it is seeded with the legacy values — otherwise a deploy
 * would silently unbrand a live site. Fresh installs (no settings file)
 * start from neutral defaults instead.
 */
export function mergeAppConfig(parsed: Partial<AppConfig> | null): Partial<AppConfig> {
    if (!parsed) {
        return {
            billing: getDefaultBillingConfig(),
            business: getDefaultBusinessConfig(),
            branding: getDefaultBrandingConfig(),
            publicSite: getDefaultPublicSiteConfig(),
            businessTimezone: 'America/New_York',
            documentFormMode: DEFAULT_DOCUMENT_FORM_MODE,
            webdavRootPath: DEFAULT_WEBDAV_ROOT_PATH,
        };
    }

    const isPreWhiteLabelInstall = parsed.business === undefined;
    const business = isPreWhiteLabelInstall ? LEGACY_BUSINESS : parsed.business;
    const branding = isPreWhiteLabelInstall ? LEGACY_BRANDING : parsed.branding;
    const publicSite = isPreWhiteLabelInstall ? LEGACY_PUBLIC_SITE : parsed.publicSite;
    const fallbackRootPath = isPreWhiteLabelInstall ? LEGACY_WEBDAV_ROOT_PATH : DEFAULT_WEBDAV_ROOT_PATH;

    return {
        ...parsed,
        documentFormMode: parseDocumentFormMode(parsed.documentFormMode),
        billing: {
            ...getDefaultBillingConfig(),
            ...parsed.billing,
            paymentMethods: {
                ...getDefaultBillingConfig().paymentMethods,
                ...parsed.billing?.paymentMethods,
            },
        },
        business: { ...getDefaultBusinessConfig(), ...business },
        branding: { ...getDefaultBrandingConfig(), ...branding },
        publicSite: { ...getDefaultPublicSiteConfig(), ...publicSite },
        webdavRootPath: parsed.webdavRootPath?.trim() || fallbackRootPath,
    };
}

export async function getAppConfig(): Promise<Partial<AppConfig>> {
    return mergeAppConfig(await readConfigFromDisk());
}

export async function saveAppConfig(config: Partial<AppConfig>) {
    await ensureConfigDir();
    const current = await getAppConfig();
    const newConfig = { ...current, ...config };
    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
    return newConfig;
}
