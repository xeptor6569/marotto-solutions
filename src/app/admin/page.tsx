import { Container, Heading, Text, Flex, Button, Card, Grid, Badge, Box } from "@radix-ui/themes";
import {
    AlertTriangle,
    BadgeCheck,
    Briefcase,
    CircleDollarSign,
    ClipboardList,
    FileText,
    ReceiptText,
    Repeat,
    TrendingUp,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from 'next/link';
import type { ReactNode } from "react";
import { getDocuments } from "@/lib/data";
import { getJobs } from "@/lib/jobs";
import { getBusinessTimezone, getUpcomingEvents } from "@/lib/calendar";
import { getContracts, getContractsNeedingReview } from "@/lib/contracts";
import { getClients } from "@/app/admin/clients/actions";
import { isDatabaseConfigured } from "@/lib/prisma";
import { formatInTimeZone } from "date-fns-tz";
import CreateMenu from "@/components/CreateMenu";
import { documentListLabel, documentListSubLabel } from "@/lib/document-labels";
import type { DocumentData } from "@/lib/types";

function formatMoney(amount: number): string {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function invoiceOutstanding(invoice: DocumentData): number {
    if (invoice.status === 'paid' || invoice.status === 'void') return 0;
    const balance = typeof invoice.balanceDue === 'number' ? invoice.balanceDue : invoice.total;
    return Math.max(0, balance);
}

/** Cash received this month: dated payment entries, plus paid invoices without payment records (approximated by update date). */
function collectedThisMonth(invoices: DocumentData[], now: Date): number {
    const year = now.getFullYear();
    const month = now.getMonth();
    const inMonth = (iso: string) => {
        const d = new Date(iso);
        return d.getFullYear() === year && d.getMonth() === month;
    };
    let total = 0;
    for (const invoice of invoices) {
        if (invoice.status === 'void') continue;
        const payments = invoice.payments ?? [];
        if (payments.length > 0) {
            for (const payment of payments) {
                if (payment.date && inMonth(payment.date)) total += payment.amount;
            }
        } else if (invoice.status === 'paid' && inMonth(invoice.updatedAt || invoice.date)) {
            total += invoice.total;
        }
    }
    return total;
}

function KpiCard({
    label,
    value,
    detail,
    icon: Icon,
    color,
}: {
    label: string;
    value: string;
    detail?: string;
    icon: LucideIcon;
    color: string;
}) {
    return (
        <Card size="2">
            <Flex align="start" gap="3">
                <Flex
                    align="center"
                    justify="center"
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: `var(--${color}-3)`,
                        color: `var(--${color}-9)`,
                        flexShrink: 0,
                    }}
                >
                    <Icon size={19} />
                </Flex>
                <Box style={{ minWidth: 0 }}>
                    <Text size="1" color="gray" as="div" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        {label}
                    </Text>
                    <Heading size="6" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</Heading>
                    {detail ? <Text size="1" color="gray" as="div">{detail}</Text> : null}
                </Box>
            </Flex>
        </Card>
    );
}

function StatCard({
    href,
    label,
    value,
    icon: Icon,
    color,
    footnote,
}: {
    href: string;
    label: string;
    value: number;
    icon: LucideIcon;
    color: string;
    footnote?: ReactNode;
}) {
    return (
        <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <Card style={{ height: "100%", cursor: "pointer" }} className="admin-stat-card">
                <Flex align="center" gap="3">
                    <Box style={{ color: `var(--${color}-9)` }}><Icon size={18} /></Box>
                    <Box>
                        <Text size="2" color="gray">{label}</Text>
                        <Heading size="6">{value}</Heading>
                        {footnote}
                    </Box>
                </Flex>
            </Card>
        </Link>
    );
}

interface ListRow {
    key: string;
    href: string;
    label: string;
    subLabels: string[];
    badge: ReactNode;
}

function ListCard({
    title,
    viewAllHref,
    viewAllLabel = "View all",
    emptyText,
    rows,
    intro,
}: {
    title: string;
    viewAllHref: string;
    viewAllLabel?: string;
    emptyText: string;
    rows: ListRow[];
    intro?: string;
}) {
    return (
        <Card>
            <Flex justify="between" align="center" mb="3">
                <Heading size="4">{title}</Heading>
                <Button asChild size="1" variant="soft">
                    <Link href={viewAllHref}>{viewAllLabel}</Link>
                </Button>
            </Flex>
            {intro ? <Text size="2" color="gray" as="p" mb="2">{intro}</Text> : null}
            {rows.length === 0 ? (
                <Text size="2" color="gray">{emptyText}</Text>
            ) : (
                <Flex direction="column">
                    {rows.map((row) => (
                        <Link
                            key={row.key}
                            href={row.href}
                            className="admin-list-row"
                            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                        >
                            <Flex justify="between" align="center" gap="2" py="2">
                                <Box style={{ minWidth: 0, flex: 1 }}>
                                    <Text size="2" weight="bold" style={{ wordBreak: "break-word" }}>{row.label}</Text>
                                    {row.subLabels.map((line, i) => (
                                        <Box key={i}><Text size="1" color="gray">{line}</Text></Box>
                                    ))}
                                </Box>
                                <Box style={{ flexShrink: 0 }}>{row.badge}</Box>
                            </Flex>
                        </Link>
                    ))}
                </Flex>
            )}
        </Card>
    );
}

const invoiceStatusColor = (status: DocumentData['status']) =>
    status === 'paid' ? 'green' : status === 'void' ? 'gray' : status === 'sent' ? 'blue' : 'orange';

export default async function AdminDashboard() {
    const invoices = await getDocuments('invoice');
    const estimates = await getDocuments('estimate');
    const quotes = await getDocuments('quote');
    const receipts = await getDocuments('receipt');
    const jobs = await getJobs();
    const contracts = await getContracts();
    const clientsResult = await getClients();
    const clients = (clientsResult.success && clientsResult.clients) ? clientsResult.clients : [];
    const activeContracts = contracts.filter((c) => c.status === 'active');
    const reviewQueue = await getContractsNeedingReview();
    const dbReady = isDatabaseConfigured();
    const upcomingEvents = dbReady ? await getUpcomingEvents(7) : [];
    const timezone = await getBusinessTimezone();

    const now = new Date();
    const openInvoices = invoices.filter((inv) => inv.status !== 'paid' && inv.status !== 'void');
    const outstandingTotal = openInvoices.reduce((sum, inv) => sum + invoiceOutstanding(inv), 0);
    const overdueInvoices = openInvoices.filter((inv) => inv.dueDate && new Date(inv.dueDate) < now);
    const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + invoiceOutstanding(inv), 0);
    const collected = collectedThisMonth(invoices, now);
    const monthLabel = now.toLocaleDateString('en-US', { month: 'long' });

    const recentInvoices = invoices.slice(0, 5);
    const activeEstimatesList = estimates.filter((e) => e.status !== "void");
    const activeQuotesList = quotes.filter((q) => q.status !== "void");

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            <Flex direction={{ initial: "column", md: "row" }} justify="between" align={{ initial: "start", md: "center" }} gap="4" mb="5">
                <Box>
                    <Heading size="8">Dashboard</Heading>
                    <Text size="3" color="gray">Money, work, and what needs attention.</Text>
                </Box>
                <CreateMenu size="3" />
            </Flex>

            {/* Money at a glance */}
            <Grid columns={{ initial: '1', sm: '3' }} gap="4" mb="4">
                <KpiCard
                    label="Outstanding"
                    value={formatMoney(outstandingTotal)}
                    detail={`${openInvoices.length} open invoice${openInvoices.length === 1 ? '' : 's'}`}
                    icon={CircleDollarSign}
                    color={outstandingTotal > 0 ? 'amber' : 'green'}
                />
                <KpiCard
                    label="Overdue"
                    value={formatMoney(overdueTotal)}
                    detail={overdueInvoices.length > 0
                        ? `${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? '' : 's'} past due`
                        : 'Nothing past due'}
                    icon={AlertTriangle}
                    color={overdueInvoices.length > 0 ? 'red' : 'green'}
                />
                <KpiCard
                    label={`Collected in ${monthLabel}`}
                    value={formatMoney(collected)}
                    icon={TrendingUp}
                    color="green"
                />
            </Grid>

            <Grid columns={{ initial: '2', sm: '3', lg: '4' }} gap="4" mb="5">
                <StatCard href="/admin/invoices" label="Invoices" value={invoices.length} icon={FileText} color="blue" />
                <StatCard href="/admin/estimates" label="Active Estimates" value={activeEstimatesList.length} icon={ClipboardList} color="amber" />
                <StatCard href="/admin/quotes" label="Active Quotes" value={activeQuotesList.length} icon={BadgeCheck} color="teal" />
                <StatCard href="/admin/receipts" label="Receipts" value={receipts.length} icon={ReceiptText} color="green" />
                <StatCard href="/admin/clients" label="Clients" value={clients.length} icon={Users} color="violet" />
                <StatCard href="/admin/jobs" label="Jobs" value={jobs.length} icon={Briefcase} color="indigo" />
                <StatCard
                    href="/admin/contracts"
                    label="Active Contracts"
                    value={activeContracts.length}
                    icon={Repeat}
                    color="cyan"
                    footnote={reviewQueue.length > 0 ? (
                        <Text size="1" color="amber">{reviewQueue.length} need review</Text>
                    ) : undefined}
                />
            </Grid>

            <style>{`
                .admin-stat-card {
                    transition: box-shadow 0.15s ease, border-color 0.15s ease;
                }
                a:focus-visible .admin-stat-card {
                    outline: 2px solid var(--accent-9);
                    outline-offset: 2px;
                }
                @media (hover: hover) {
                    a:hover .admin-stat-card {
                        box-shadow: 0 4px 16px var(--gray-a4);
                        border-color: var(--gray-8);
                    }
                }
                .admin-list-row {
                    border-radius: var(--radius-2);
                    margin: 0 -6px;
                    padding: 0 6px;
                }
                @media (hover: hover) {
                    .admin-list-row:hover {
                        background: var(--gray-a2);
                    }
                }
            `}</style>

            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
                {reviewQueue.length > 0 ? (
                    <ListCard
                        title="Cycles awaiting review"
                        viewAllHref="/admin/contracts"
                        viewAllLabel="All contracts"
                        emptyText=""
                        intro="These contracts have a draft cycle invoice with usage lines that need quantities filled in before sending."
                        rows={reviewQueue.slice(0, 5).map(({ contract, latestDraftInvoice }) => ({
                            key: contract.id,
                            href: latestDraftInvoice ? `/admin/invoices/${latestDraftInvoice.id}/edit` : `/admin/contracts/${contract.id}`,
                            label: `${contract.displayId} — ${contract.title}`,
                            subLabels: [
                                contract.customerName,
                                ...(latestDraftInvoice
                                    ? [`Draft ${latestDraftInvoice.id}${latestDraftInvoice.contractCycle ? ` · cycle ${latestDraftInvoice.contractCycle}` : ''}`]
                                    : []),
                            ],
                            badge: <Badge color="amber">review</Badge>,
                        }))}
                    />
                ) : null}

                <ListCard
                    title="Recent Invoices"
                    viewAllHref="/admin/invoices"
                    emptyText="No recent invoices found."
                    rows={recentInvoices.map((inv) => ({
                        key: inv.id,
                        href: `/admin/invoices/${inv.id}`,
                        label: documentListLabel(inv),
                        subLabels: [
                            ...(documentListSubLabel(inv) ? [documentListSubLabel(inv) as string] : []),
                            new Date(inv.date).toLocaleDateString(),
                        ],
                        badge: <Badge color={invoiceStatusColor(inv.status)}>{inv.status}</Badge>,
                    }))}
                />

                <ListCard
                    title="Upcoming This Week"
                    viewAllHref="/admin/calendar"
                    viewAllLabel="Calendar"
                    emptyText="No upcoming events this week."
                    rows={upcomingEvents.slice(0, 5).map((event) => ({
                        key: event.id,
                        href: `/admin/calendar/${event.id}`,
                        label: event.title,
                        subLabels: [
                            `${formatInTimeZone(new Date(event.start), timezone, event.allDay ? 'MMM d' : 'MMM d h:mm a')}${event.clientName ? ` — ${event.clientName}` : ''}`,
                        ],
                        badge: (
                            <Badge color={event.status === 'confirmed' ? 'blue' : event.status === 'completed' ? 'green' : 'orange'}>
                                {event.status}
                            </Badge>
                        ),
                    }))}
                />

                <ListCard
                    title="Active Estimates"
                    viewAllHref="/admin/estimates"
                    emptyText="No active estimates."
                    rows={activeEstimatesList.slice(0, 5).map((est) => ({
                        key: est.id,
                        href: `/admin/estimates/${est.id}`,
                        label: documentListLabel(est),
                        subLabels: [
                            ...(documentListSubLabel(est) ? [documentListSubLabel(est) as string] : []),
                            new Date(est.date).toLocaleDateString(),
                        ],
                        badge: <Badge color="blue">{est.status}</Badge>,
                    }))}
                />

                <ListCard
                    title="Active Quotes"
                    viewAllHref="/admin/quotes"
                    emptyText="No active quotes."
                    rows={activeQuotesList.slice(0, 5).map((q) => ({
                        key: q.id,
                        href: `/admin/quotes/${q.id}`,
                        label: documentListLabel(q),
                        subLabels: [
                            ...(documentListSubLabel(q) ? [documentListSubLabel(q) as string] : []),
                            new Date(q.date).toLocaleDateString(),
                        ],
                        badge: <Badge color="blue">{q.status}</Badge>,
                    }))}
                />

                <ListCard
                    title="Recent Receipts"
                    viewAllHref="/admin/receipts"
                    emptyText="No recent receipts."
                    rows={receipts.slice(0, 5).map((r) => ({
                        key: r.id,
                        href: `/admin/receipts/${r.id}`,
                        label: documentListLabel(r),
                        subLabels: [
                            ...(documentListSubLabel(r) ? [documentListSubLabel(r) as string] : []),
                            new Date(r.date).toLocaleDateString(),
                        ],
                        badge: <Badge color="green">${r.total.toFixed(2)}</Badge>,
                    }))}
                />

                <ListCard
                    title="Active Contracts"
                    viewAllHref="/admin/contracts"
                    emptyText="No active contracts."
                    rows={activeContracts.slice(0, 5).map((contract) => ({
                        key: contract.id,
                        href: `/admin/contracts/${contract.id}`,
                        label: `${contract.displayId} — ${contract.title}`,
                        subLabels: [
                            contract.customerName,
                            `Next due ${new Date(contract.nextDueDate).toLocaleDateString()}`,
                        ],
                        badge: (
                            <Badge color="cyan">
                                {contract.cyclesIssued}{contract.termCycles ? `/${contract.termCycles}` : ''}
                            </Badge>
                        ),
                    }))}
                />
            </Grid>
        </Container>
    );
}
