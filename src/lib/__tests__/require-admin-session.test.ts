import { describe, it, expect } from 'vitest';
import { isAdminSession } from '@/lib/admin-auth';
import type { Session } from 'next-auth';

function sessionWithRole(role?: string): Session {
    return {
        user: {
            email: 'admin@example.com',
            role,
        },
        expires: new Date(Date.now() + 60_000).toISOString(),
    };
}

describe('isAdminSession', () => {
    it('rejects null/undefined sessions', () => {
        expect(isAdminSession(null)).toBe(false);
        expect(isAdminSession(undefined)).toBe(false);
    });

    it('accepts admin role and missing role (legacy default)', () => {
        expect(isAdminSession(sessionWithRole('admin'))).toBe(true);
        expect(isAdminSession(sessionWithRole(undefined))).toBe(true);
    });

    it('rejects non-admin roles', () => {
        expect(isAdminSession(sessionWithRole('customer'))).toBe(false);
        expect(isAdminSession(sessionWithRole('user'))).toBe(false);
    });
});
