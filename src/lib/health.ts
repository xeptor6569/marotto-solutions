import { getAppEnv, type AppEnv } from './app-env';
import { getAppConfig } from './config';
import { isDatabaseConfigured, prisma } from './prisma';

/**
 * Health and diagnostics, shared by the /api/health endpoint and the
 * admin System page. The deep report surfaces the runtime state that is
 * otherwise invisible from inside the UI — most importantly which side of the
 * hybrid persistence split is active, since documents live in WebDAV or local
 * JSON while everything else is in Postgres, and document numbering silently
 * changes strategy with it.
 */

export interface ShallowHealth {
    ok: boolean;
    env: AppEnv;
    commit: string | null;
    time: string;
}

export interface DeepHealth extends ShallowHealth {
    node: string;
    uptimeSeconds: number;
    database: {
        configured: boolean;
        reachable: boolean | null;
        error: string | null;
    };
    documents: {
        storage: 'webdav' | 'local-json' | 'unknown';
        numbering: 'atomic-document-counter' | 'filesystem-scan';
    };
    email: {
        configured: boolean;
        target: string | null;
        from: string | null;
        /** True when mail is being captured by a sink instead of delivered. */
        sink: boolean;
    };
    stripe: {
        mode: 'live' | 'test' | 'not-configured' | 'unknown';
        webhookConfigured: boolean;
    };
    urls: {
        nextauth: string | null;
        site: string | null;
    };
    cron: {
        secretConfigured: boolean;
    };
}

/**
 * Redact an SMTP connection string down to something safe to display.
 * `smtp://user:pass@host:587` becomes `smtp://host:587`.
 */
function describeSmtpTarget(raw: string | undefined): string | null {
    const value = raw?.trim();
    if (!value) return null;
    try {
        const url = new URL(value);
        return `${url.protocol}//${url.host}`;
    } catch {
        // Not a URL (nodemailer also accepts other forms). Report only whether
        // it is set rather than risk echoing credentials.
        return 'configured';
    }
}

function describeStripeMode(): DeepHealth['stripe']['mode'] {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) return 'not-configured';
    if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) return 'test';
    if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) return 'live';
    return 'unknown';
}

export function getShallowHealth(): ShallowHealth {
    return {
        ok: true,
        env: getAppEnv(),
        commit: process.env.APP_COMMIT_SHA?.trim() || null,
        time: new Date().toISOString(),
    };
}

export async function getDeepHealth(): Promise<DeepHealth> {
    const shallow = getShallowHealth();

    const databaseConfigured = isDatabaseConfigured();
    let databaseReachable: boolean | null = null;
    let databaseError: string | null = null;
    if (databaseConfigured) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            databaseReachable = true;
        } catch (error) {
            databaseReachable = false;
            databaseError = error instanceof Error ? error.message : 'Unknown error';
        }
    }

    let documentStorage: DeepHealth['documents']['storage'] = 'unknown';
    try {
        const config = await getAppConfig();
        documentStorage = config.webdavUrl && config.webdavUsername ? 'webdav' : 'local-json';
    } catch {
        documentStorage = 'unknown';
    }

    const smtpTarget = describeSmtpTarget(process.env.EMAIL_SERVER);

    return {
        ...shallow,
        node: process.version,
        uptimeSeconds: Math.round(process.uptime()),
        database: {
            configured: databaseConfigured,
            reachable: databaseReachable,
            error: databaseError,
        },
        documents: {
            storage: documentStorage,
            numbering: databaseConfigured ? 'atomic-document-counter' : 'filesystem-scan',
        },
        email: {
            configured: Boolean(process.env.EMAIL_SERVER?.trim()),
            target: smtpTarget,
            from: process.env.EMAIL_FROM?.trim() || null,
            sink: Boolean(smtpTarget && /mailpit|mailhog|localhost|127\.0\.0\.1/i.test(smtpTarget)),
        },
        stripe: {
            mode: describeStripeMode(),
            webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
        },
        urls: {
            nextauth: process.env.NEXTAUTH_URL?.trim() || null,
            site: process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
        },
        cron: {
            secretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
        },
    };
}
