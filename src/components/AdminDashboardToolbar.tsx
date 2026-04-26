'use client';

import Link from "next/link";
import { Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { ChevronDown, LogOut, Settings, Upload } from "lucide-react";
import { signOutFromAdmin } from "@/app/actions";

export default function AdminDashboardToolbar({ email }: { email: string }) {
    return (
        <Flex direction="column" align={{ initial: "start", md: "end" }} gap="3" style={{ width: "100%" }}>
            <Text size="2" weight="medium" color="gray" style={{ wordBreak: "break-all" }}>
                {email}
            </Text>
            <Flex
                gap="2"
                wrap="wrap"
                justify={{ initial: "start", sm: "end" }}
                align="center"
                style={{ width: "100%" }}
            >
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <Button variant="solid" size="2">
                            Create <ChevronDown size={14} aria-hidden />
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                        <DropdownMenu.Item asChild>
                            <Link href="/admin/leads/create">Lead</Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
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
                    </DropdownMenu.Content>
                </DropdownMenu.Root>

                <Button asChild size="2" variant="soft">
                    <Link href="/admin/import">
                        <Upload size={14} aria-hidden /> Import
                    </Link>
                </Button>
                <Button asChild size="2" variant="outline">
                    <Link href="/admin/settings">
                        <Settings size={14} aria-hidden /> Settings
                    </Link>
                </Button>
                <form action={signOutFromAdmin} style={{ display: "inline-flex" }}>
                    <Button type="submit" variant="ghost" size="2">
                        <LogOut size={14} aria-hidden /> Sign out
                    </Button>
                </form>
            </Flex>
        </Flex>
    );
}
