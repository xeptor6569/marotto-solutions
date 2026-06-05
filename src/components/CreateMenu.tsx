'use client';

import Link from 'next/link';
import { Button, DropdownMenu } from '@radix-ui/themes';
import { ChevronDown, CirclePlus } from 'lucide-react';

export default function CreateMenu({ size = '2' }: { size?: '1' | '2' | '3' | '4' }) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <Button variant="solid" size={size}>
                    <CirclePlus size={14} aria-hidden />
                    Create
                    <ChevronDown size={14} aria-hidden />
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <DropdownMenu.Item asChild>
                    <Link href="/admin/clients/create">Client</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/leads/create">Lead</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item asChild>
                    <Link href="/admin/jobs/create">Job</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/estimates/new">Estimate</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/quotes/new">Quote</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/invoices/new">Invoice</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/receipts/new">Receipt</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/contracts/create">Contract</Link>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
