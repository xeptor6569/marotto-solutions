import fs from 'fs/promises';
import path from 'path';
import { AppConfig, BillingConfig } from './types';
import { DEFAULT_DOCUMENT_FORM_MODE, parseDocumentFormMode } from './document-form-mode';

// Settings live under the persistent `data/` volume so the runtime user
// (e.g. the unprivileged `nextjs` user inside Docker) can always write to it
// even though `/app` itself is owned by root. The legacy path is checked as a
// migration source so existing self-hosted installs keep their billing config.
const CONFIG_PATH = path.join(process.cwd(), 'data', 'config', 'settings.json');
const LEGACY_CONFIG_PATH = path.join(process.cwd(), 'config', 'settings.json');

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

export async function getAppConfig(): Promise<Partial<AppConfig>> {
    const parsed = await readConfigFromDisk();
    if (!parsed) {
        return {
            billing: getDefaultBillingConfig(),
            businessTimezone: 'America/New_York',
            documentFormMode: DEFAULT_DOCUMENT_FORM_MODE,
        };
    }
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
    };
}

export async function saveAppConfig(config: Partial<AppConfig>) {
    await ensureConfigDir();
    const current = await getAppConfig();
    const newConfig = { ...current, ...config };
    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
    return newConfig;
}
