import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDeepHealth, getShallowHealth } from '@/lib/health';
import { isAdminSession } from '@/lib/require-admin-session';

// Never cached: the whole point is the state of *this* running container.
export const dynamic = 'force-dynamic';

/**
 * Health and diagnostics.
 *
 * Anonymous callers get a shallow liveness payload with no I/O, which is what
 * the container healthcheck and uptime monitoring use. Admins additionally get
 * the full runtime diagnostics (see src/lib/health.ts, shared with the admin
 * System page).
 */
export async function GET() {
    let isAdmin = false;
    try {
        isAdmin = isAdminSession(await auth());
    } catch {
        // A broken session must not take down the liveness probe.
        isAdmin = false;
    }

    if (!isAdmin) {
        return NextResponse.json(getShallowHealth());
    }

    return NextResponse.json(await getDeepHealth());
}
