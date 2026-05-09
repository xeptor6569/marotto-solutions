import { NextResponse, type NextRequest } from 'next/server';
import { runContractScheduler } from '@/lib/contracts';
import { sendContractInvoiceEmail } from '@/lib/email';

function unauthorized(message: string) {
    return NextResponse.json({ error: message }, { status: 401 });
}

function checkSecret(request: NextRequest): NextResponse | null {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
        return NextResponse.json(
            { error: 'CRON_SECRET is not set on the server. Cron endpoint is disabled.' },
            { status: 503 },
        );
    }
    const provided = request.headers.get('x-cron-secret') || request.headers.get('authorization');
    const stripped = provided?.startsWith('Bearer ') ? provided.slice(7) : provided;
    if (stripped !== expected) {
        return unauthorized('Invalid or missing X-Cron-Secret header');
    }
    return null;
}

async function runScheduler() {
    const summary = await runContractScheduler({
        now: new Date(),
        sendEmail: async (invoice) => {
            try {
                return await sendContractInvoiceEmail(invoice);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'unknown error';
                return { ok: false, error: message };
            }
        },
    });
    return NextResponse.json({
        issuedCount: summary.issuedCount,
        contractsConsidered: summary.contractsConsidered,
        invoices: summary.invoices,
        errors: summary.errors,
        skipped: summary.skipped,
        ranAt: new Date().toISOString(),
    });
}

export async function POST(request: NextRequest) {
    const guard = checkSecret(request);
    if (guard) return guard;
    try {
        return await runScheduler();
    } catch (error) {
        console.error('Scheduler endpoint failed', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// Allow GET for easy curl-based pings from sidecar containers and basic health checks.
export async function GET(request: NextRequest) {
    return POST(request);
}
