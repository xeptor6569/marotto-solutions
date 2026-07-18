import type { Session } from 'next-auth';

/** True when the session belongs to an admin operator. */
export function isAdminSession(session: Session | null | undefined): session is Session {
    if (!session?.user) return false;
    const role = session.user.role;
    // Current product only has admin users; default role is "admin".
    return !role || role === 'admin';
}
