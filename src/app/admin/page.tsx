import { Container, Heading, Text, Flex, Button, Card, Grid, Badge, Box } from "@radix-ui/themes";
import { FileText, ReceiptText, ClipboardList, Users, BadgeCheck, Briefcase } from "lucide-react";
import Link from 'next/link';
import { getDocuments } from "@/lib/data";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboardToolbar from "@/components/AdminDashboardToolbar";
import { getJobs } from "@/lib/jobs";

export default async function AdminDashboard() {
    const session = await auth();

    if (!session) {
        redirect('/auth/signin');
    }

    const invoices = await getDocuments('invoice');
    const estimates = await getDocuments('estimate');
    const quotes = await getDocuments('quote');
    const receipts = await getDocuments('receipt');
    const leads = await getDocuments('lead');
    const jobs = await getJobs();

    const recentInvoices = invoices.slice(0, 5);
    const activeEstimatesList = estimates.filter((e) => e.status !== "void");
    const activeQuotesList = quotes.filter((q) => q.status !== "void");
    const recentActiveEstimates = activeEstimatesList.slice(0, 5);
    const recentActiveQuotes = activeQuotesList.slice(0, 5);
    const recentReceipts = receipts.slice(0, 5);
    const recentLeads = leads.slice(0, 5);

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <Flex direction={{ initial: "column", md: "row" }} justify="between" align={{ initial: "start", md: "center" }} gap="4" mb="5">
                <Box>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Heading size="8">Marotto Solutions</Heading>
                    </Link>
                    <Text size="3" color="gray">Admin dashboard for invoices, estimates, quotes, receipts, and leads.</Text>
                </Box>
                <AdminDashboardToolbar email={session.user?.email ?? ""} />
            </Flex>

            <Grid columns={{ initial: '1', sm: '2', md: '3', xl: '6' }} gap="4" mb="5">
                <Link href="/admin/invoices" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <Card style={{ height: "100%", cursor: "pointer" }} className="admin-stat-card">
                        <Flex align="center" gap="3">
                            <Box style={{ color: "var(--blue-9)" }}><FileText size={18} /></Box>
                            <Box>
                                <Text size="2" color="gray">Invoices</Text>
                                <Heading size="6">{invoices.length}</Heading>
                            </Box>
                        </Flex>
                    </Card>
                </Link>
                <Link href="/admin/estimates" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <Card style={{ height: "100%", cursor: "pointer" }} className="admin-stat-card">
                        <Flex align="center" gap="3">
                            <Box style={{ color: "var(--amber-9)" }}><ClipboardList size={18} /></Box>
                            <Box>
                                <Text size="2" color="gray">Active Estimates</Text>
                                <Heading size="6">{activeEstimatesList.length}</Heading>
                            </Box>
                        </Flex>
                    </Card>
                </Link>
                <Link href="/admin/quotes" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <Card style={{ height: "100%", cursor: "pointer" }} className="admin-stat-card">
                        <Flex align="center" gap="3">
                            <Box style={{ color: "var(--teal-9)" }}><BadgeCheck size={18} /></Box>
                            <Box>
                                <Text size="2" color="gray">Active Quotes</Text>
                                <Heading size="6">{activeQuotesList.length}</Heading>
                            </Box>
                        </Flex>
                    </Card>
                </Link>
                <Link href="/admin/receipts" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <Card style={{ height: "100%", cursor: "pointer" }} className="admin-stat-card">
                        <Flex align="center" gap="3">
                            <Box style={{ color: "var(--green-9)" }}><ReceiptText size={18} /></Box>
                            <Box>
                                <Text size="2" color="gray">Receipts</Text>
                                <Heading size="6">{receipts.length}</Heading>
                            </Box>
                        </Flex>
                    </Card>
                </Link>
                <Link href="/admin/leads" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <Card style={{ height: "100%", cursor: "pointer" }} className="admin-stat-card">
                        <Flex align="center" gap="3">
                            <Box style={{ color: "var(--violet-9)" }}><Users size={18} /></Box>
                            <Box>
                                <Text size="2" color="gray">Leads</Text>
                                <Heading size="6">{leads.length}</Heading>
                            </Box>
                        </Flex>
                    </Card>
                </Link>
                <Link href="/admin/jobs" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <Card style={{ height: "100%", cursor: "pointer" }} className="admin-stat-card">
                        <Flex align="center" gap="3">
                            <Box style={{ color: "var(--indigo-9)" }}><Briefcase size={18} /></Box>
                            <Box>
                                <Text size="2" color="gray">Jobs</Text>
                                <Heading size="6">{jobs.length}</Heading>
                            </Box>
                        </Flex>
                    </Card>
                </Link>
            </Grid>

            <style>{`
                .admin-stat-card {
                    transition: box-shadow 0.15s ease, border-color 0.15s ease;
                }
                a:focus-visible .admin-stat-card {
                    outline: 2px solid var(--blue-9);
                    outline-offset: 2px;
                }
                @media (hover: hover) {
                    a:hover .admin-stat-card {
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                        border-color: var(--gray-8);
                    }
                }
            `}</style>

            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
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
                                <Link
                                    key={inv.id}
                                    href={`/admin/invoices/${inv.id}`}
                                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                >
                                    <Flex
                                        direction={{ initial: "column", sm: "row" }}
                                        justify="between"
                                        align={{ initial: "start", sm: "center" }}
                                        gap="2"
                                        py="1"
                                    >
                                        <Box style={{ minWidth: 0, flex: 1 }}>
                                            <Text size="2" weight="bold" style={{ wordBreak: "break-word" }}>#{inv.number} — {inv.customer.name}</Text>
                                            {inv.title ? <Box><Text size="1">{inv.title}</Text></Box> : null}
                                            <Box><Text size="1" color="gray">{new Date(inv.date).toLocaleDateString()}</Text></Box>
                                        </Box>
                                        <Badge color={inv.status === 'paid' ? 'green' : 'orange'} style={{ flexShrink: 0 }}>{inv.status}</Badge>
                                    </Flex>
                                </Link>
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
                    {recentActiveEstimates.length === 0 ? (
                        <Text size="2" color="gray">No active estimates.</Text>
                    ) : (
                        <Flex direction="column" gap="2">
                            {recentActiveEstimates.map(est => (
                                <Link
                                    key={est.id}
                                    href={`/admin/estimates/${est.id}`}
                                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                >
                                    <Flex
                                        direction={{ initial: "column", sm: "row" }}
                                        justify="between"
                                        align={{ initial: "start", sm: "center" }}
                                        gap="2"
                                        py="1"
                                    >
                                        <Box style={{ minWidth: 0, flex: 1 }}>
                                            <Text size="2" weight="bold" style={{ wordBreak: "break-word" }}>#{est.number} — {est.customer.name}</Text>
                                            {est.title ? <Box><Text size="1">{est.title}</Text></Box> : null}
                                            <Box><Text size="1" color="gray">{new Date(est.date).toLocaleDateString()}</Text></Box>
                                        </Box>
                                        <Badge color="blue" style={{ flexShrink: 0 }}>{est.status}</Badge>
                                    </Flex>
                                </Link>
                            ))}
                        </Flex>
                    )}
                </Card>

                {/* Active Quotes */}
                <Card>
                    <Flex justify="between" align="center" mb="3">
                        <Heading size="4">Active Quotes</Heading>
                        <Button asChild size="1" variant="soft">
                            <Link href="/admin/quotes">View all</Link>
                        </Button>
                    </Flex>
                    {recentActiveQuotes.length === 0 ? (
                        <Text size="2" color="gray">No active quotes.</Text>
                    ) : (
                        <Flex direction="column" gap="2">
                            {recentActiveQuotes.map((q) => (
                                <Link
                                    key={q.id}
                                    href={`/admin/quotes/${q.id}`}
                                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                >
                                    <Flex
                                        direction={{ initial: "column", sm: "row" }}
                                        justify="between"
                                        align={{ initial: "start", sm: "center" }}
                                        gap="2"
                                        py="1"
                                    >
                                        <Box style={{ minWidth: 0, flex: 1 }}>
                                            <Text size="2" weight="bold" style={{ wordBreak: "break-word" }}>#{q.number} — {q.customer.name}</Text>
                                            {q.title ? <Box><Text size="1">{q.title}</Text></Box> : null}
                                            <Box><Text size="1" color="gray">{new Date(q.date).toLocaleDateString()}</Text></Box>
                                        </Box>
                                        <Badge color="blue" style={{ flexShrink: 0 }}>{q.status}</Badge>
                                    </Flex>
                                </Link>
                            ))}
                        </Flex>
                    )}
                </Card>

                {/* Recent Receipts */}
                <Card>
                    <Flex justify="between" align="center" mb="3">
                        <Heading size="4">Recent Receipts</Heading>
                        <Button asChild size="1" variant="soft">
                            <Link href="/admin/receipts">View all</Link>
                        </Button>
                    </Flex>
                    {recentReceipts.length === 0 ? (
                        <Text size="2" color="gray">No recent receipts.</Text>
                    ) : (
                        <Flex direction="column" gap="2">
                            {recentReceipts.slice(0, 5).map(r => (
                                <Link
                                    key={r.id}
                                    href={`/admin/receipts/${r.id}`}
                                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                >
                                    <Flex
                                        direction={{ initial: "column", sm: "row" }}
                                        justify="between"
                                        align={{ initial: "start", sm: "center" }}
                                        gap="2"
                                        py="1"
                                    >
                                        <Box style={{ minWidth: 0, flex: 1 }}>
                                            <Text size="2" weight="bold">{r.id}</Text>
                                            <Box><Text size="1" color="gray">{new Date(r.date).toLocaleDateString()}</Text></Box>
                                        </Box>
                                        <Badge color="green" style={{ flexShrink: 0 }}>${r.total.toFixed(2)}</Badge>
                                    </Flex>
                                </Link>
                            ))}
                        </Flex>
                    )}
                </Card>

                {/* Recent Leads */}
                <Card>
                    <Flex justify="between" align="center" mb="3">
                        <Heading size="4">Recent Leads</Heading>
                        <Button asChild size="1" variant="soft">
                            <Link href="/admin/leads">View all</Link>
                        </Button>
                    </Flex>
                    {recentLeads.length === 0 ? (
                        <Text size="2" color="gray">No leads yet.</Text>
                    ) : (
                        <Flex direction="column" gap="2">
                            {recentLeads.map((lead) => (
                                <Link
                                    key={lead.id}
                                    href={`/admin/leads/${lead.id}`}
                                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                                >
                                    <Flex direction="column" gap="1" py="1">
                                        <Text size="2" weight="bold" style={{ wordBreak: "break-word" }}>{lead.customer.name}</Text>
                                        <Text size="1" color="gray">{new Date(lead.date).toLocaleDateString()}</Text>
                                    </Flex>
                                </Link>
                            ))}
                        </Flex>
                    )}
                </Card>
            </Grid>
        </Container>
    );
}
