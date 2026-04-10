import fs from 'fs/promises';
import path from 'path';
import { AppConfig, BillingConfig } from './types';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'settings.json');

export function getDefaultBillingConfig(): BillingConfig {
    return {
        checkPayableTo: '',
        paymentInstructions: '',
        paymentMethods: {
            cash: { enabled: true, label: 'Cash', note: '' },
            check: { enabled: true, label: 'Check', note: '' },
            zelle: { enabled: true, label: 'Zelle', value: '', note: '' },
            cashApp: { enabled: true, label: 'Cash App', value: '', note: '' },
            paypal: { enabled: true, label: 'PayPal', value: '', note: '' },
            venmo: { enabled: true, label: 'Venmo', value: '', note: '' },
            applePay: { enabled: true, label: 'Apple Pay', value: '', note: '' },
            stripe: { enabled: true, label: 'Stripe', value: '', note: '', comingSoon: true },
        },
    };
}

// Ensure config dir exists
async function ensureConfigDir() {
    const dir = path.dirname(CONFIG_PATH);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

export async function getAppConfig(): Promise<Partial<AppConfig>> {
    try {
        await ensureConfigDir();
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        const parsed = JSON.parse(data) as Partial<AppConfig>;
        return {
            ...parsed,
            billing: {
                ...getDefaultBillingConfig(),
                ...parsed.billing,
                paymentMethods: {
                    ...getDefaultBillingConfig().paymentMethods,
                    ...parsed.billing?.paymentMethods,
                },
            },
        };
    } catch {
        return {
            billing: getDefaultBillingConfig(),
        };
    }
}

export async function saveAppConfig(config: Partial<AppConfig>) {
    await ensureConfigDir();
    const current = await getAppConfig();
    const newConfig = { ...current, ...config };
    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
    return newConfig;
}
