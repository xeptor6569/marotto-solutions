import { getAppConfig } from './config';
import { createMoneyFormatter, type MoneyFormat, type MoneyFormatter } from './money';
import {
    resolveBrandingFromConfig,
    type Branding,
    type ResolvedBusiness,
    type ResolvedPublicSite,
} from './branding-core';
import type { PublicSiteService } from './types';

/**
 * Single source of truth for the installation's brand identity. Components
 * must read business/branding values through here (or receive them as props
 * from a server component that did) — never hardcode them. The pure
 * resolvers live in branding-core.ts so client components can use them too.
 */

export * from './branding-core';

export function getSiteUrl(): string {
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
    return (configuredUrl || 'http://localhost:3000').replace(/\/+$/, '');
}

/** Fully resolved brand identity for server components and server actions. */
export async function getBranding(): Promise<Branding> {
    return resolveBrandingFromConfig(await getAppConfig());
}

export async function getBusiness(): Promise<ResolvedBusiness> {
    return (await getBranding()).business;
}

export async function getPublicSite(): Promise<ResolvedPublicSite> {
    return (await getBranding()).publicSite;
}

/** Configured currency/locale for server-side formatting. */
export async function getMoneyFormat(): Promise<MoneyFormat> {
    return (await getBusiness()).money;
}

/** `const money = await getMoneyFormatter(); money(12.5)` → "$12.50" (per settings). */
export async function getMoneyFormatter(): Promise<MoneyFormatter> {
    return createMoneyFormatter(await getMoneyFormat());
}

export function getPublicSiteService(
    publicSite: ResolvedPublicSite,
    slug: string,
): PublicSiteService | undefined {
    return publicSite.services.find((service) => service.slug === slug);
}

/** Quote-form value → display label for the configured services. */
export function buildServiceLabelMap(publicSite: ResolvedPublicSite): Record<string, string> {
    const map: Record<string, string> = {};
    for (const service of publicSite.services) {
        if (service.formValue) map[service.formValue] = service.shortTitle || service.title;
    }
    map.other = map.other || 'Other';
    return map;
}
