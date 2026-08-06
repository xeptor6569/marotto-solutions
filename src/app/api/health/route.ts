import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAppEnv } from '@/lib/app-env';
import { getAppConfig } from '@/lib/config';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { isAdminSession } from '@/lib/require-admin-session';

// Never cached: the whole point is the state of *this* running container.
export const dynamic = 'force-dynamic';

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

function describeStripeMode(): 'live' | 'test' | 'not-configured' | 'unknown' {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) return 'not-configured';
    if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) return 'test';
    if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) return 'live';
    return 'unknown';
}

/**
 * Health and diagnostics.
 *
 * Anonymous callers get a shallow liveness payload with no I/O, which is what
 * the container healthcheck and uptime monitoring use. Admins additionally get
 * the runtime detail that is otherwise invisible from inside the UI — most
 * importantly which side of the hybrid persistence split is actually active,
 * since documents live in WebDAV or local JSON while everything else is in
 * Postgres, and document numbering silently changes strategy with it.
 */
export async function GET() {
    const env = getAppEnv();
    const shallow = {
        ok: true,
        env,
        commit: process.env.APP_COMMIT_SHA?.trim() || null,
        time: new Date().toISOString(),
    };

    let isAdmin = false;
    try {
        isAdmin = isAdminSession(await auth());
    } catch {
        // A broken session must not take down the liveness probe.
        isAdmin = false;
    }

    if (!isAdmin) {
        return NextResponse.json(shallow);
    }

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

    let documentStorage: 'webdav' | 'local-json' | 'unknown' = 'unknown';
    try {
        const config = await getAppConfig();
        documentStorage = config.webdavUrl && config.webdavUsername ? 'webdav' : 'local-json';
    } catch {
        documentStorage = 'unknown';
    }

    const smtpTarget = describeSmtpTarget(process.env.EMAIL_SERVER);

    return NextResponse.json({
        ...shallow,
        node: process.version,
        uptimeSeconds: Math.round(process.uptime()),
        database: {
            configured: databaseConfigured,
            reachable: databaseReachable,
            error: databaseError,
        },
        // Documents live in WebDAV or on the local volume; the numbering path
        // follows the database, not the document store.
        documents: {
            storage: documentStorage,
            numbering: databaseConfigured ? 'atomic-document-counter' : 'filesystem-scan',
        },
        email: {
            configured: Boolean(process.env.EMAIL_SERVER?.trim()),
            target: smtpTarget,
            from: process.env.EMAIL_FROM?.trim() || null,
            // True when mail is being captured instead of delivered.
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
    });
}
