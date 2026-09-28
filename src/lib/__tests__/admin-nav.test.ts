import { describe, expect, it } from 'vitest';
import { activeNavItem, adminBreadcrumbs, adminParentHref } from '@/lib/admin-nav';

describe('adminBreadcrumbs', () => {
    it('dashboard is a single crumb with no parent', () => {
        expect(adminBreadcrumbs('/admin')).toEqual([{ label: 'Dashboard', href: '/admin' }]);
        expect(adminParentHref('/admin')).toBeNull();
    });

    it('document routes read as section, number, action', () => {
        expect(adminBreadcrumbs('/admin/invoices/INV-0042/edit')).toEqual([
            { label: 'Invoices', href: '/admin/invoices' },
            { label: 'INV-0042', href: '/admin/invoices/INV-0042' },
            { label: 'Edit', href: '/admin/invoices/INV-0042/edit' },
        ]);
        expect(adminParentHref('/admin/invoices/INV-0042/edit')).toBe('/admin/invoices/INV-0042');
        expect(adminParentHref('/admin/invoices/INV-0042')).toBe('/admin/invoices');
    });

    it('opaque ids become "Details" and create routes become "New"', () => {
        expect(adminBreadcrumbs('/admin/jobs/3f2b8c1e-9a4d-4e21-b6f0-1c2d3e4f5a6b').map((c) => c.label))
            .toEqual(['Jobs', 'Details']);
        expect(adminBreadcrumbs('/admin/jobs/create').map((c) => c.label)).toEqual(['Jobs', 'New']);
    });

    it('routes owned through matchPrefixes keep their own path', () => {
        expect(activeNavItem('/admin/leads/LEAD-1')?.label).toBe('Clients');
        expect(adminBreadcrumbs('/admin/leads/LEAD-1')).toEqual([
            { label: 'Clients', href: '/admin/clients' },
            { label: 'LEAD-1', href: '/admin/leads/LEAD-1' },
        ]);
    });

    it('tools and trailing slashes resolve', () => {
        expect(adminBreadcrumbs('/admin/system/api/').map((c) => c.label)).toEqual(['System', 'API']);
        expect(activeNavItem('/admin/settings')?.label).toBe('Settings');
    });
});
