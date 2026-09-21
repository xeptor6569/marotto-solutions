/**
 * Currency formatting for the whole app. The currency and number locale are
 * business settings (Settings → Business); nothing may hardcode "$".
 *
 * Server components: `const money = await getMoneyFormatter()` (branding.ts).
 * Client components: `const { format } = useMoney()` (MoneyProvider).
 * Pure helpers: pass a MoneyFormat through, defaulting to DEFAULT_MONEY_FORMAT.
 */

export interface MoneyFormat {
    /** ISO 4217 code, e.g. "USD", "EUR", "GBP", "CAD", "AUD". */
    currency: string;
    /** BCP 47 locale used for digit grouping and symbol placement, e.g. "en-US". */
    locale: string;
}

export const DEFAULT_MONEY_FORMAT: MoneyFormat = { currency: 'USD', locale: 'en-US' };

/** Common currencies offered in Settings; any valid ISO code is accepted. */
export const CURRENCY_OPTIONS: { code: string; label: string }[] = [
    { code: 'USD', label: 'US Dollar (USD)' },
    { code: 'CAD', label: 'Canadian Dollar (CAD)' },
    { code: 'EUR', label: 'Euro (EUR)' },
    { code: 'GBP', label: 'British Pound (GBP)' },
    { code: 'AUD', label: 'Australian Dollar (AUD)' },
    { code: 'NZD', label: 'New Zealand Dollar (NZD)' },
    { code: 'MXN', label: 'Mexican Peso (MXN)' },
    { code: 'BRL', label: 'Brazilian Real (BRL)' },
    { code: 'INR', label: 'Indian Rupee (INR)' },
    { code: 'JPY', label: 'Japanese Yen (JPY)' },
    { code: 'CHF', label: 'Swiss Franc (CHF)' },
    { code: 'SEK', label: 'Swedish Krona (SEK)' },
    { code: 'NOK', label: 'Norwegian Krone (NOK)' },
    { code: 'DKK', label: 'Danish Krone (DKK)' },
    { code: 'PLN', label: 'Polish Złoty (PLN)' },
    { code: 'ZAR', label: 'South African Rand (ZAR)' },
    { code: 'SGD', label: 'Singapore Dollar (SGD)' },
    { code: 'HKD', label: 'Hong Kong Dollar (HKD)' },
    { code: 'AED', label: 'UAE Dirham (AED)' },
    { code: 'PHP', label: 'Philippine Peso (PHP)' },
];

/** Stripe (and most processors) treat these as having no minor unit. */
const ZERO_DECIMAL_CURRENCIES = new Set([
    'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

export function isZeroDecimalCurrency(currency: string): boolean {
    return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase());
}

export function isValidCurrencyCode(value: unknown): value is string {
    if (typeof value !== 'string' || !/^[A-Za-z]{3}$/.test(value)) return false;
    try {
        new Intl.NumberFormat('en-US', { style: 'currency', currency: value.toUpperCase() });
        return true;
    } catch {
        return false;
    }
}

export function isValidLocale(value: unknown): value is string {
    if (typeof value !== 'string' || !value.trim()) return false;
    try {
        return Intl.getCanonicalLocales(value).length > 0;
    } catch {
        return false;
    }
}

export function resolveMoneyFormat(business?: { currency?: string; locale?: string } | null): MoneyFormat {
    return {
        currency: isValidCurrencyCode(business?.currency) ? business!.currency!.toUpperCase() : DEFAULT_MONEY_FORMAT.currency,
        locale: isValidLocale(business?.locale) ? business!.locale!.trim() : DEFAULT_MONEY_FORMAT.locale,
    };
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(format: MoneyFormat): Intl.NumberFormat {
    const key = `${format.locale}|${format.currency}`;
    let formatter = formatterCache.get(key);
    if (!formatter) {
        formatter = new Intl.NumberFormat(format.locale, { style: 'currency', currency: format.currency });
        formatterCache.set(key, formatter);
    }
    return formatter;
}

/** "$1,234.50", "1.234,50 €", "¥1,500" — per the configured currency and locale. */
export function formatMoney(amount: number, format: MoneyFormat = DEFAULT_MONEY_FORMAT): string {
    const value = Number.isFinite(amount) ? amount : 0;
    try {
        return getFormatter(format).format(value);
    } catch {
        return `${value.toFixed(2)} ${format.currency}`;
    }
}

/** The bare currency symbol ("$", "€", "£") for input adornments. */
export function currencySymbol(format: MoneyFormat = DEFAULT_MONEY_FORMAT): string {
    try {
        const part = getFormatter(format).formatToParts(0).find((p) => p.type === 'currency');
        return part?.value ?? format.currency;
    } catch {
        return format.currency;
    }
}

/** Convert a major-unit amount to the processor's minor unit (cents), honoring zero-decimal currencies. */
export function toMinorUnits(amount: number, currency: string): number {
    return isZeroDecimalCurrency(currency) ? Math.round(amount) : Math.round(amount * 100);
}

export type MoneyFormatter = (amount: number) => string;

export function createMoneyFormatter(format: MoneyFormat): MoneyFormatter {
    return (amount: number) => formatMoney(amount, format);
}
