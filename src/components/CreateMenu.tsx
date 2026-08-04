'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button, DropdownMenu } from '@radix-ui/themes';
import { ChevronDown, CirclePlus } from 'lucide-react';

function withQuery(
    href: string,
    params: { jobId?: string; clientId?: string; redirectTo?: string },
) {
    const q = new URLSearchParams();
    if (params.jobId) q.set('jobId', params.jobId);
    if (params.clientId) q.set('clientId', params.clientId);
    if (params.redirectTo) q.set('redirectTo', params.redirectTo);
    const qs = q.toString();
    return qs ? `${href}?${qs}` : href;
}

export default function CreateMenu({
    size = '2',
    jobId,
    clientId,
    redirectTo,
    documentsOnly = false,
    trigger,
    side = 'bottom',
}: {
    size?: '1' | '2' | '3' | '4';
    jobId?: string;
    clientId?: string;
    redirectTo?: string;
    /** When true, only show document/contract create links (for job hub). */
    documentsOnly?: boolean;
    /** Replaces the default button, e.g. the compact slot in the mobile bottom nav. */
    trigger?: ReactNode;
    side?: 'top' | 'bottom';
}) {
    const seed = { jobId, clientId, redirectTo };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                {trigger ?? (
                    <Button variant="solid" size={size} style={{ minHeight: 44 }}>
                        <CirclePlus size={14} aria-hidden />
                        {documentsOnly ? 'Create document' : 'Create'}
                        <ChevronDown size={14} aria-hidden />
                    </Button>
                )}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" side={side} sideOffset={8}>
                {!documentsOnly ? (
                    <>
                        <DropdownMenu.Item asChild>
                            <Link href="/admin/clients/create">Client</Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item asChild>
                            <Link href="/admin/jobs/create">Job</Link>
                        </DropdownMenu.Item>
                    </>
                ) : null}
                <DropdownMenu.Item asChild>
                    <Link href={withQuery('/admin/estimates/new', seed)}>Estimate</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href={withQuery('/admin/quotes/new', seed)}>Quote</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href={withQuery('/admin/invoices/new', seed)}>Invoice</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href={withQuery('/admin/receipts/new', seed)}>Receipt</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href={withQuery('/admin/contracts/create', seed)}>Contract</Link>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
