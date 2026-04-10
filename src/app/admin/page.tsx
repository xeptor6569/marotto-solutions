import { Container, Heading, Text, Flex, Button, Card, Grid, Badge, Box, DropdownMenu } from "@radix-ui/themes";
import { SettingsIcon, ChevronDown, Upload, LogOut, FileText, ReceiptText, ClipboardList, Users } from "lucide-react";
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
            <Flex direction={{ initial: "column", md: "row" }} justify="between" align={{ initial: "start", md: "center" }} gap="4" mb="5">
                <Box>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Heading size="8">Marotto Solutions</Heading>
                    </Link>
                    <Text size="3" color="gray">Admin dashboard for documents, receipts, and incoming leads.</Text>
                </Box>
                <Flex gap="3" align="center" wrap="wrap" justify={{ initial: "start", md: "end" }}>
                    <Flex direction="column" align={{ initial: "start", md: "end" }} gap="1">
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
                        <Link href="/admin/settings"><SettingsIcon size={16} /> Settings</Link>
                    </Button>
                </Flex>
            </Flex>

            <Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="4" mb="5">
                <Card>
                    <Flex align="center" gap="3">
                        <Box style={{ color: "var(--blue-9)" }}><FileText size={18} /></Box>
                        <Box>
                            <Text size="2" color="gray">Invoices</Text>
                            <Heading size="6">{invoices.length}</Heading>
                        </Box>
                    </Flex>
                </Card>
                <Card>
                    <Flex align="center" gap="3">
                        <Box style={{ color: "var(--amber-9)" }}><ClipboardList size={18} /></Box>
                        <Box>
                            <Text size="2" color="gray">Active Estimates</Text>
                            <Heading size="6">{activeEstimates.length}</Heading>
                        </Box>
                    </Flex>
                </Card>
                <Card>
                    <Flex align="center" gap="3">
                        <Box style={{ color: "var(--green-9)" }}><ReceiptText size={18} /></Box>
                        <Box>
                            <Text size="2" color="gray">Receipts</Text>
                            <Heading size="6">{receipts.length}</Heading>
                        </Box>
                    </Flex>
                </Card>
                <Card>
                    <Flex align="center" gap="3">
                        <Box style={{ color: "var(--violet-9)" }}><Users size={18} /></Box>
                        <Box>
                            <Text size="2" color="gray">Leads</Text>
                            <Heading size="6">{leads.length}</Heading>
                        </Box>
                    </Flex>
                </Card>
            </Grid>

            <Grid columns={{ initial: '1', md: '2', lg: '4' }} gap="4">
                {/* Recent Invoices */}
                <Card>
                    <Flex justify="between" align="center" mb="3">
                        <Heading size="4">Recent Invoices</Heading>
                        <Button asChild size="1" variant="soft">
                            <Link href="/admin/invoices">View all</Link>
                        </Button>
                    </Flex>
                    {recentInvoices.length === 0 ? (
                        <Text size="2" color="gray">No recent invoices found.</Text>
                    ) : (
                        <Flex direction="column" gap="2">
                            {recentInvoices.map(inv => (
                                <Flex key={inv.id} justify="between" align="center" asChild>
                                    <Link href={`/admin/invoices/${inv.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Text size="2" weight="bold">#{inv.number} - {inv.customer.name}</Text>
                                            {inv.title ? <Box><Text size="1">{inv.title}</Text></Box> : null}
                                            <Box><Text size="1" color="gray">{new Date(inv.date).toLocaleDateString()}</Text></Box>
                                        </Box>
                                        <Badge color={inv.status === 'paid' ? 'green' : 'orange'}>{inv.status}</Badge>
                                    </Link>
                                </Flex>
                            ))}
                        </Flex>
                    )}
                </Card>

                {/* Active Estimates */}
                <Card>
                    <Flex justify="between" align="center" mb="3">
                        <Heading size="4">Active Estimates</Heading>
                        <Button asChild size="1" variant="soft">
                            <Link href="/admin/estimates">View all</Link>
                        </Button>
                    </Flex>
                    {activeEstimates.length === 0 ? (
                        <Text size="2" color="gray">No active estimates.</Text>
                    ) : (
                        <Flex direction="column" gap="2">
                            {activeEstimates.map(est => (
                                <Flex key={est.id} justify="between" align="center" asChild>
                                    <Link href={`/admin/estimates/${est.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Text size="2" weight="bold">#{est.number} - {est.customer.name}</Text>
                                            {est.title ? <Box><Text size="1">{est.title}</Text></Box> : null}
                                            <Box><Text size="1" color="gray">{new Date(est.date).toLocaleDateString()}</Text></Box>
                                        </Box>
                                        <Badge color="blue">{est.status}</Badge>
                                    </Link>
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
