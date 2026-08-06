import { getAppConfig } from './config';
import { resolveTheme, type ResolvedTheme } from './theme-presets';
import type {
    AppConfig,
    BrandingConfig,
    BusinessConfig,
    PublicSiteConfig,
    PublicSiteHighlight,
    PublicSiteService,
    PublicSiteTestimonial,
} from './types';

/**
 * Single source of truth for the installation's brand identity. Components
 * must read business/branding values through here (or receive them as props
 * from a server component that did) — never hardcode them.
 */

export const FALLBACK_BUSINESS_NAME = 'Your Business';

export function getSiteUrl(): string {
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
    return (configuredUrl || 'http://localhost:3000').replace(/\/+$/, '');
}

export interface ResolvedBusiness {
    name: string;
    legalName: string;
    tagline: string;
    phoneDisplay: string;
    phoneE164: string;
    /** tel: href, or null when no phone is configured. */
    phoneHref: string | null;
    email: string;
    addressLine1: string;
    addressLine2: string;
    serviceArea: string;
    /** False until the operator sets a business name in Settings. */
    isConfigured: boolean;
}

export function resolveBusiness(business: BusinessConfig | undefined): ResolvedBusiness {
    const name = business?.name?.trim() || '';
    const phoneE164 = business?.phoneE164?.trim() || '';
    const phoneDisplay = business?.phoneDisplay?.trim() || '';
    return {
        name: name || FALLBACK_BUSINESS_NAME,
        legalName: business?.legalName?.trim() || name || FALLBACK_BUSINESS_NAME,
        tagline: business?.tagline?.trim() || '',
        phoneDisplay,
        phoneE164,
        phoneHref: phoneE164 ? `tel:${phoneE164}` : phoneDisplay ? `tel:${phoneDisplay.replace(/[^+\d]/g, '')}` : null,
        email: business?.email?.trim() || '',
        addressLine1: business?.addressLine1?.trim() || '',
        addressLine2: business?.addressLine2?.trim() || '',
        serviceArea: business?.serviceArea?.trim() || '',
        isConfigured: Boolean(name),
    };
}

export interface ResolvedLetterhead {
    /** Primary letterhead line (displayed uppercase on documents). */
    line1: string;
    /** Secondary letterhead line; empty when the name is a single word. */
    line2: string;
}

export function resolveLetterhead(
    branding: BrandingConfig | undefined,
    business: ResolvedBusiness,
): ResolvedLetterhead {
    const line1 = branding?.letterheadLine1?.trim();
    const line2 = branding?.letterheadLine2?.trim();
    if (line1) return { line1, line2: line2 || '' };
    // Derive from the business name: first word on top, remainder below —
    // matches the classic two-line letterhead style.
    const words = business.name.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        return { line1: words[0], line2: words.slice(1).join(' ') };
    }
    return { line1: business.name, line2: '' };
}

export interface ResolvedBranding {
    theme: ResolvedTheme;
    letterhead: ResolvedLetterhead;
    logoFileName: string | null;
    /** URL for the uploaded logo, served by the branding asset route. */
    logoUrl: string | null;
    showLogoOnDocuments: boolean;
    documentAccentColor: string;
}

export function resolveBranding(
    branding: BrandingConfig | undefined,
    business: ResolvedBusiness,
): ResolvedBranding {
    const logoFileName = branding?.logoFileName?.trim() || null;
    return {
        theme: resolveTheme(branding),
        letterhead: resolveLetterhead(branding, business),
        logoFileName,
        logoUrl: logoFileName ? `/api/branding/logo?file=${encodeURIComponent(logoFileName)}` : null,
        showLogoOnDocuments: Boolean(branding?.showLogoOnDocuments && logoFileName),
        documentAccentColor: branding?.documentAccentColor?.trim() || '#1e3a5f',
    };
}

export interface ResolvedPublicSite {
    enabled: boolean;
    heroHeading: string;
    heroSubheading: string;
    highlights: PublicSiteHighlight[];
    services: PublicSiteService[];
    testimonials: PublicSiteTestimonial[];
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
}

export function resolvePublicSite(
    publicSite: PublicSiteConfig | undefined,
    business: ResolvedBusiness,
): ResolvedPublicSite {
    const heroHeading = publicSite?.heroHeading?.trim() || business.tagline || business.name;
    return {
        enabled: publicSite?.enabled ?? true,
        heroHeading,
        heroSubheading: publicSite?.heroSubheading?.trim() || '',
        highlights: publicSite?.highlights ?? [],
        services: publicSite?.services ?? [],
        testimonials: publicSite?.testimonials ?? [],
        seoTitle: publicSite?.seoTitle?.trim() || (business.tagline ? `${business.name} | ${business.tagline}` : business.name),
        seoDescription: publicSite?.seoDescription?.trim() || business.tagline || '',
        seoKeywords: publicSite?.seoKeywords ?? [],
    };
}

export interface Branding {
    business: ResolvedBusiness;
    branding: ResolvedBranding;
    publicSite: ResolvedPublicSite;
}

export function resolveBrandingFromConfig(config: Partial<AppConfig>): Branding {
    const business = resolveBusiness(config.business);
    return {
        business,
        branding: resolveBranding(config.branding, business),
        publicSite: resolvePublicSite(config.publicSite, business),
    };
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
