import Link from "next/link";
import { Button, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";
import {
    AlarmClock,
    CalendarDays,
    CalendarPlus,
    CircleDollarSign,
    Hourglass,
    MapPin,
    TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { getDocuments } from "@/lib/data";
import { getJobs } from "@/lib/jobs";
import { getBusinessTimezone, getUpcomingEvents } from "@/lib/calendar";
import { getContractsDue, getContractsNeedingReview } from "@/lib/contracts";
import { getClients } from "@/app/admin/clients/actions";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getAppConfig } from "@/lib/config";
import { getMoneyFormatter, resolveBrandingFromConfig } from "@/lib/branding";
import { isStripeConfigured } from "@/lib/stripe";
import { DEFAULT_THEME_PRESET_ID } from "@/lib/theme-presets";
import { DEFAULT_LOOK_ID } from "@/lib/theme-looks";
import {
    buildAttentionItems,
    greetingFor,
    groupAttentionItems,
    groupScheduleByDay,
    recentDocuments,
    summarizeMoney,
} from "@/lib/dashboard";
import { buildOnboardingChecklist } from "@/lib/onboarding";
import { DOC_LABEL } from "@/lib/document-labels";
import HelpTip from "@/components/HelpTip";
import IconTile from "@/components/ui/IconTile";
import StatusBadge from "@/components/ui/StatusBadge";
import AttentionList from "@/components/dashboard/AttentionList";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import WelcomeToast from "@/components/dashboard/WelcomeToast";

function KpiTile({
    href,
    label,
    value,
    caption,
    icon,
    color,
    tone,
    help,
}: {
    href: string;
    label: string;
    value: string;
    caption: string;
    icon: LucideIcon;
    color: string;
    tone?: "alert";
    help?: string;
}) {
    return (
        <Link href={href} className="kpi-tile" data-tone={tone}>
            <Flex justify="between" align="start" gap="2">
                <Flex align="center" gap="1">
                    <span className="ui-eyebrow">{label}</span>
                    {help ? <HelpTip title={label} topic="payments">{help}</HelpTip> : null}
                </Flex>
                <IconTile icon={icon} color={color} size={30} />
            </Flex>
            <Text as="div" size="7" className="ui-display kpi-value">{value}</Text>
            <Text as="div" size="1" color="gray">{caption}</Text>
        </Link>
    );
}

function plural(n: number, word: string): string {
    return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export default async function AdminDashboard({
    searchParams,
}: {
    searchParams: Promise<{ welcome?: string }>;
}) {
    const { welcome } = await searchParams;
    const dbReady = isDatabaseConfigured();
    const now = new Date();

    const [
        money,
        config,
        timezone,
        invoices,
        estimates,
        quotes,
        receipts,
        jobs,
        clientsResult,
        contractsDue,
        reviewQueue,
        upcomingEvents,
    ] = await Promise.all([
        getMoneyFormatter(),
        getAppConfig(),
        getBusinessTimezone(),
        getDocuments("invoice"),
        getDocuments("estimate"),
        getDocuments("quote"),
        getDocuments("receipt"),
        getJobs(),
        getClients(),
        getContractsDue(now),
        getContractsNeedingReview(),
        dbReady ? getUpcomingEvents(2, ["scheduled", "confirmed"]) : Promise.resolve([]),
    ]);

    const clients = clientsResult.success && clientsResult.clients ? clientsResult.clients : [];
    const { branding } = resolveBrandingFromConfig(config);
    const summary = summarizeMoney(invoices, [...estimates, ...quotes], now);
    const attention = buildAttentionItems({
        invoices,
        estimates,
        quotes,
        contractsDue,
        reviewQueue,
        prospects: clients.filter((client) => client.isProspect),
        now,
    });
    const sections = groupAttentionItems(attention);
    const schedule = groupScheduleByDay(upcomingEvents, timezone, now);
    const recent = recentDocuments([...invoices, ...estimates, ...quotes, ...receipts], 5);

    const billing = config.billing;
    const checklist = buildOnboardingChecklist({
        businessName: config.business?.name ?? "",
        hasContactDetails: Boolean(config.business?.phoneDisplay || config.business?.phoneE164 || config.business?.email),
        hasAddress: Boolean(config.business?.addressLine1?.trim()),
        hasLogo: Boolean(branding.logoUrl),
        customizedTheme: (config.branding?.look ?? DEFAULT_LOOK_ID) !== DEFAULT_LOOK_ID
            || (config.branding?.themePreset ?? DEFAULT_THEME_PRESET_ID) !== DEFAULT_THEME_PRESET_ID,
        emailConfigured: Boolean(process.env.EMAIL_SERVER?.trim()),
        paymentsConfigured: isStripeConfigured()
            || Boolean(billing?.checkPayableTo?.trim())
            || Object.values(billing?.paymentMethods ?? {}).some((method) => method?.enabled && method.value?.trim()),
        clientCount: clients.length,
        jobCount: jobs.length,
        issuedDocumentCount: [...invoices, ...estimates, ...quotes].filter((doc) => doc.status !== "draft").length,
    });
    const showChecklist = !config.onboarding?.checklistDismissed;

    const overdueSection = sections.find((s) => s.group === "collect")?.items.filter((i) => i.kind === "overdue").length ?? 0;
    const draftCount = attention.filter((i) => i.kind === "draft").length;
    const headline = [
        overdueSection ? plural(overdueSection, "invoice") + " overdue" : null,
        draftCount ? plural(draftCount, "draft") + " ready to send" : null,
    ].filter(Boolean).join(" · ") || (attention.length ? `${plural(attention.length, "thing")} to look at` : "Everything is on track.");
    const monthLabel = formatInTimeZone(now, timezone, "MMMM");
    const pipelineHref = quotes.filter((q) => q.status === "sent").length >= estimates.filter((e) => e.status === "sent").length
        ? "/admin/quotes?status=sent"
        : "/admin/estimates?status=sent";

    return (
        <Container size="4" p={{ initial: "3", sm: "5" }}>
            {welcome === "1" ? <WelcomeToast /> : null}

            <header className="dashboard-header">
                <span className="ui-eyebrow">{formatInTimeZone(now, timezone, "EEEE, MMMM d")}</span>
                <Heading size="8" as="h1" className="dashboard-greeting">{greetingFor(now, timezone)}</Heading>
                <Text as="p" size="3" color="gray">{headline}</Text>
            </header>

            {showChecklist ? (
                <div className="dashboard-block">
                    <OnboardingChecklist checklist={checklist} defaultExpanded={welcome === "1"} />
                </div>
            ) : null}

            <div className="kpi-grid dashboard-block">
                <KpiTile
                    href="/admin/invoices?status=open"
                    label="Outstanding"
                    value={money(summary.outstanding)}
                    caption={summary.openCount ? `${plural(summary.openCount, "open invoice")}` : "Nothing waiting on payment"}
                    icon={CircleDollarSign}
                    color="amber"
                    help="What clients still owe: the unpaid balance of every issued invoice that isn't paid or void. Partial payments are already subtracted."
                />
                <KpiTile
                    href="/admin/invoices?status=overdue"
                    label="Overdue"
                    value={money(summary.overdue)}
                    caption={summary.overdueCount ? `${plural(summary.overdueCount, "invoice")} past due` : "Nothing past due"}
                    icon={AlarmClock}
                    color={summary.overdueCount ? "red" : "green"}
                    tone={summary.overdueCount ? "alert" : undefined}
                    help="The part of Outstanding on invoices whose due date has passed. Invoices without a due date never count as overdue."
                />
                <KpiTile
                    href="/admin/receipts"
                    label={`Collected in ${monthLabel}`}
                    value={money(summary.collected)}
                    caption="Payments recorded this month"
                    icon={TrendingUp}
                    color="green"
                    help="Payments recorded with a date in this calendar month, including Stripe card payments. Invoices marked paid without a recorded payment count on the day they were marked."
                />
                <KpiTile
                    href={pipelineHref}
                    label="In the pipeline"
                    value={money(summary.pipeline)}
                    caption={summary.pipelineCount ? `${summary.pipelineCount} sent, awaiting a reply` : "No estimates or quotes out"}
                    icon={Hourglass}
                    color="violet"
                />
            </div>

            <div className="dashboard-grid">
                <AttentionList sections={sections} total={attention.length} />

                <Flex direction="column" gap="4">
                    <Card size="3">
                        <Flex align="center" justify="between" gap="2" mb="3">
                            <Heading size="4" as="h2">Schedule</Heading>
                            <Button asChild size="1" variant="ghost">
                                <Link href="/admin/calendar"><CalendarDays size={13} /> Calendar</Link>
                            </Button>
                        </Flex>
                        {!dbReady ? (
                            <Text size="2" color="gray">The calendar needs the database to be configured.</Text>
                        ) : schedule.every((day) => day.events.length === 0) ? (
                            <Flex direction="column" align="start" gap="2">
                                <Text size="2" color="gray">Nothing on the calendar today or tomorrow.</Text>
                                <Button asChild size="2" variant="soft">
                                    <Link href="/admin/calendar/new"><CalendarPlus size={14} /> Schedule something</Link>
                                </Button>
                            </Flex>
                        ) : (
                            <Flex direction="column" gap="3">
                                {schedule.map((day) => (
                                    <div key={day.key}>
                                        <span className="ui-eyebrow">{day.label}</span>
                                        {day.events.length === 0 ? (
                                            <Text as="p" size="2" color="gray" mt="1">Nothing scheduled.</Text>
                                        ) : (
                                            <ul className="schedule-list">
                                                {day.events.map((event) => (
                                                    <li key={event.id}>
                                                        <Link href={`/admin/calendar/${event.id}`} className="schedule-item">
                                                            <span className="schedule-time ui-figure">
                                                                {event.allDay ? "All day" : formatInTimeZone(new Date(event.start), timezone, "h:mm a")}
                                                            </span>
                                                            <span className="schedule-body">
                                                                <Text as="span" size="2" weight="medium" truncate>{event.title}</Text>
                                                                <Text as="span" size="1" color="gray" truncate>
                                                                    {[event.clientName, event.location].filter(Boolean).join(" · ") || event.jobName || "\u00a0"}
                                                                </Text>
                                                            </span>
                                                            <StatusBadge kind="event" status={event.status} />
                                                        </Link>
                                                        {event.location ? (
                                                            <a
                                                                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                                                                className="schedule-map"
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                aria-label={`Directions to ${event.location}`}
                                                            >
                                                                <MapPin size={13} />
                                                            </a>
                                                        ) : null}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </Flex>
                        )}
                    </Card>

                    <Card size="3">
                        <Heading size="4" as="h2" mb="3">Recent activity</Heading>
                        {recent.length === 0 ? (
                            <Text size="2" color="gray">Documents you create or update will show up here.</Text>
                        ) : (
                            <ul className="recent-list">
                                {recent.map((doc) => (
                                    <li key={doc.id}>
                                        <Link href={`/admin/${doc.type}s/${doc.id}`} className="recent-item">
                                            <span className="recent-body">
                                                <Text as="span" size="2" weight="medium" truncate>{doc.title?.trim() || doc.customer.name}</Text>
                                                <Text as="span" size="1" color="gray" truncate>
                                                    {DOC_LABEL[doc.type]} <span className="ui-figure">{doc.id}</span> · {formatInTimeZone(new Date(doc.updatedAt || doc.date), timezone, "MMM d")}
                                                </Text>
                                            </span>
                                            <span className="recent-aside">
                                                <Text as="span" size="2" className="ui-figure">{money(doc.total)}</Text>
                                                <StatusBadge doc={doc} />
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </Flex>
            </div>
        </Container>
    );
}
