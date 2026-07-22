import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin-auth';
import { notFound, redirect } from 'next/navigation';
import type { Session } from 'next-auth';

export { isAdminSession } from '@/lib/admin-auth';

/**
 * Require an admin session (e.g. for routes that should 404 when anonymous).
 * Prefer {@link requireAdminPage} for operator pages that should redirect to sign-in.
 */
export async function requireAdminSession(): Promise<Session> {
    const session = await auth();
    if (!isAdminSession(session)) {
        notFound();
    }
    return session;
}

/**
 * Require an admin session for operator pages (settings, import, create forms, etc.).
 * Redirects to sign-in when missing.
 */
export async function requireAdminPage(callbackUrl: string): Promise<Session> {
    const session = await auth();
    if (!isAdminSession(session)) {
        redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    return session;
}

/**
 * Require an admin session for server actions that return `{ success, error }`.
 */
export async function requireAdminAction(): Promise<
    { ok: true; session: Session } | { ok: false; error: string }
> {
    const session = await auth();
    if (!isAdminSession(session)) {
        return { ok: false, error: 'You must be signed in as an admin.' };
    }
    return { ok: true, session };
}

/**
 * Require an admin session for server actions that redirect on success/failure.
 */
export async function requireAdminActionOrRedirect(callbackUrl = '/admin'): Promise<Session> {
    const session = await auth();
    if (!isAdminSession(session)) {
        redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    return session;
}
