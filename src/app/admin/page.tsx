import { Container, Heading, Text, Flex, Button, Card, Grid, Link as RadixLink, Badge, Box, DropdownMenu } from "@radix-ui/themes";
import { SettingsIcon, ChevronDown, Upload, LogOut, ArrowLeft, Users } from "lucide-react";
import Link from 'next/link';
import { getDocuments } from "@/lib/data";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
    const session = await auth();

    if (!session) {
        redirect('/auth/signin');
    }

    const invoices = await getDocuments('invoice');
    const estimates = await getDocuments('estimate');
    const receipts = await getDocuments('receipt');
    const leads = await getDocuments('lead');

    const recentInvoices = invoices.slice(0, 5);
    const activeEstimates = estimates.filter(e => e.status !== 'void').slice(0, 5);
    const recentReceipts = receipts.slice(0, 5);
    const recentLeads = leads.slice(0, 5);

    return (
        <Container size="4" p="5">
            <Flex justify="between" align="center" mb="5">
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Heading size="8">Marotto Solutions</Heading>
                </Link>
                <Flex gap="3" align="center">
                    <Flex direction="column" align="end" gap="1">
                        <Text size="2" weight="bold">{session.user?.email}</Text>
                        <form action={async () => {
                            'use server';
                            await signOut({ redirectTo: '/' });
                        }}>
                            <Button variant="ghost" size="1" type="submit">
                                <LogOut size={14} /> Sign out
                            </Button>
                        </form>
                    </Flex>

                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <Button variant="solid" size="3">
                                Create New <ChevronDown size={16} />
                            </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <DropdownMenu.Item asChild>
                                <Link href="/admin/estimates/new">Estimate</Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild>
                                <Link href="/admin/invoices/new">Invoice</Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild>
                                <Link href="/admin/receipts/new">Receipt</Link>
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>

                    <Button size="3" variant="soft" asChild>
                        <Link href="/admin/import"><Upload size={16} /> Import</Link>
                    </Button>

                    <Button size="3" variant="outline" asChild>
                        <Link href="/admin/settings"><SettingsIcon size={16} /></Link>
                    </Button>
                </Flex>
            </Flex>

            <Grid columns={{ initial: '1', md: '2', lg: '4' }} gap="4">
                {/* Recent Invoices */}
                <Card>
                    <Heading size="4" mb="3">Recent Invoices</Heading>
                    {recentInvoices.length === 0 ? (
                        <Text size="2" color="gray">No recent invoices found.</Text>
                    ) : (
                        <Flex direction="column" gap="2">
                            {recentInvoices.map(inv => (
                                <Flex key={inv.id} justify="between" align="center">
                                    <Box>
                                        <Text size="2" weight="bold">#{inv.number} - {inv.customer.name}</Text>
                                        <Box><Text size="1" color="gray">{new Date(inv.date).toLocaleDateString()}</Text></Box>
                                    </Box>
                                    <Badge color={inv.status === 'paid' ? 'green' : 'orange'}>{inv.status}</Badge>
                                </Flex>
                            ))}
                        </Flex>
                    )}
                </Card>

                {/* Active Estimates */}
                <Card>
                    <Heading size="4" mb="3">Active Estimates</Heading>
                    {activeEstimates.length === 0 ? (
                        <Text size="2" color="gray">No active estimates.</Text>
                    ) : (
                        <Flex direction="column" gap="2">
                            {activeEstimates.map(est => (
                                <Flex key={est.id} justify="between" align="center">
                                    <Box>
                                        <Text size="2" weight="bold">#{est.number} - {est.customer.name}</Text>
                                        <Box><Text size="1" color="gray">{new Date(est.date).toLocaleDateString()}</Text></Box>
                                    </Box>
                                    <Badge color="blue">{est.status}</Badge>
                                </Flex>
                            ))}
                        </Flex>
                    )}
                </Card>

                {/* Recent Receipts */}
                <Card>
                    <Heading size="4" mb="3">Recent Receipts</Heading>
                    {recentReceipts.length === 0 ? (
                        <Text size="2" color="gray">No recent receipts.</Text>
                    ) : (
                        <Flex direction="column" gap="2">
                            {recentReceipts.slice(0, 5).map(r => (
                                <Flex key={r.id} justify="between" align="center" asChild>
                                    <Link href={`/admin/receipts/${r.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Text size="2" weight="bold">#{r.id}</Text>
                                            <Box><Text size="1" color="gray">{new Date(r.date).toLocaleDateString()}</Text></Box>
                                        </Box>
                                        <Badge color="green">${r.total}</Badge>
                                    </Link>
                                </Flex>
                            ))}
                        </Flex>
                    )}
                </Card>

                {/* Recent Leads */}
                <Card>
                    <Heading size="4" mb="3">Recent Leads</Heading>
                    {recentLeads.length === 0 ? (
                        <Text size="2" color="gray">No leads yet.</Text>
                    ) : (
                        <Flex direction="column" gap="2">
                            {recentLeads.map(lead => (
                                <Flex key={lead.id} direction="column" gap="1">
                                    <Text size="2" weight="bold">{lead.customer.name}</Text>
                                    <Text size="1" color="gray">{new Date(lead.date).toLocaleDateString()}</Text>
                                </Flex>
                            ))}
                        </Flex>
                    )}
                </Card>
            </Grid>
        </Container>
    );
}
