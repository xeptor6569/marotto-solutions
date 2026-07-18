import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';

/** Require a signed-in session for admin-only sequential document ID routes. */
export async function requireAdminSession(): Promise<void> {
    const session = await auth();
    if (!session) {
        notFound();
    }
}
