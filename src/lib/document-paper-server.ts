import { resolveBrandingFromConfig } from './branding-core';
import { getAppConfig } from './config';
import { isStripeConfigured } from './stripe';
import type { DocumentPaperContext } from './document-paper';
import type { AppConfig } from './types';

export function paperContextFromConfig(config: Partial<AppConfig>): DocumentPaperContext {
    const { business, branding } = resolveBrandingFromConfig(config);
    return {
        business,
        branding: {
            letterhead: branding.letterhead,
            logoUrl: branding.logoUrl,
            showLogoOnDocuments: branding.showLogoOnDocuments,
            documentAccentColor: branding.documentAccentColor,
        },
        billing: {
            paymentMethods: config.billing?.paymentMethods ?? {},
            paymentInstructions: config.billing?.paymentInstructions ?? '',
            checkPayableTo: config.billing?.checkPayableTo ?? '',
        },
        stripeConfigured: isStripeConfigured(),
    };
}

export async function getDocumentPaperContext(): Promise<DocumentPaperContext> {
    return paperContextFromConfig(await getAppConfig());
}
