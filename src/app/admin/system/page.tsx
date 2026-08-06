import Link from 'next/link';
import { Badge, Box, Button, Card, Container, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import {
    Activity,
    BookOpenText,
    Clock,
    CreditCard,
    Database,
    FileJson,
    Globe,
    Mail,
    Server,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import RefreshButton from '@/components/RefreshButton';
import { getDeepHealth } from '@/lib/health';

// Diagnostics must reflect this exact moment, never a cached render.
export const dynamic = 'force-dynamic';

type Status = 'ok' | 'warn' | 'error' | 'info';

const STATUS_COLOR: Record<Status, 'green' | 'amber' | 'red' | 'gray'> = {
    ok: 'green',
    warn: 'amber',
    error: 'red',
    info: 'gray',
};

function StatusCard({
    icon: Icon,
    title,
    status,
    statusLabel,
    rows,
    hint,
}: {
    icon: LucideIcon;
    title: string;
    status: Status;
    statusLabel: string;
    rows: { label: string; value: ReactNode }[];
    hint?: string;
}) {
    return (
        <Card size="2">
            <Flex direction="column" gap="3" height="100%">
                <Flex justify="between" align="center" gap="2">
                    <Flex align="center" gap="2">
                        <Box style={{ color: `var(--${STATUS_COLOR[status]}-9)` }}><Icon size={18} /></Box>
                        <Heading size="3">{title}</Heading>
                    </Flex>
                    <Badge color={STATUS_COLOR[status]} variant="soft">{statusLabel}</Badge>
                </Flex>
                <Flex direction="column" gap="1">
                    {rows.map((row) => (
                        <Flex key={row.label} justify="between" gap="3" align="baseline">
                            <Text size="1" color="gray" style={{ flexShrink: 0 }}>{row.label}</Text>
                            <Text size="2" style={{ textAlign: 'right', wordBreak: 'break-word', fontVariantNumeric: 'tabular-nums' }}>
                                {row.value}
                            </Text>
                        </Flex>
                    ))}
                </Flex>
                {hint ? (
                    <Text size="1" color="gray" style={{ marginTop: 'auto' }}>{hint}</Text>
                ) : null}
            </Flex>
        </Card>
    );
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

export default async function SystemPage() {
    const health = await getDeepHealth();

    const database = health.database;
    const databaseStatus: Status = !database.configured ? 'warn' : database.reachable ? 'ok' : 'error';

    const emailStatus: Status = !health.email.configured ? 'warn' : health.email.sink ? 'warn' : 'ok';

    const stripeStatus: Status =
        health.stripe.mode === 'live'
            ? (health.stripe.webhookConfigured ? 'ok' : 'warn')
            : health.stripe.mode === 'test'
                ? 'warn'
                : 'info';

    return (
        <Container size="4" p={{ initial: '3', sm: '5' }}>
            <Flex direction={{ initial: 'column', sm: 'row' }} justify="between" align={{ initial: 'start', sm: 'center' }} gap="3" mb="5">
                <Box>
                    <Heading size="7">System Health</Heading>
                    <Text size="2" color="gray">
                        Live diagnostics for this running instance — storage, database, email, payments, and scheduler.
                    </Text>
                </Box>
                <Flex gap="2" wrap="wrap">
                    <Button asChild variant="soft" size="2" color="gray">
                        <Link href="/admin/system/api"><BookOpenText size={14} /> API reference</Link>
                    </Button>
                    <RefreshButton />
                </Flex>
            </Flex>

            <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
                <StatusCard
                    icon={Server}
                    title="Instance"
                    status={health.env === 'production' ? 'ok' : 'warn'}
                    statusLabel={health.env}
                    rows={[
                        { label: 'Node', value: health.node },
                        { label: 'Uptime', value: formatUptime(health.uptimeSeconds) },
                        { label: 'Commit', value: health.commit ? health.commit.slice(0, 10) : '—' },
                        { label: 'Checked', value: new Date(health.time).toLocaleTimeString() },
                    ]}
                    hint={health.env !== 'production'
                        ? 'Non-production instance: robots are blocked, live Stripe keys are rejected, and the environment banner is shown.'
                        : undefined}
                />

                <StatusCard
                    icon={Database}
                    title="Database"
                    status={databaseStatus}
                    statusLabel={!database.configured ? 'not configured' : database.reachable ? 'connected' : 'unreachable'}
                    rows={[
                        { label: 'Configured', value: database.configured ? 'Yes' : 'No' },
                        { label: 'Reachable', value: database.reachable === null ? '—' : database.reachable ? 'Yes' : 'No' },
                        ...(database.error ? [{ label: 'Error', value: database.error }] : []),
                    ]}
                    hint={!database.configured
                        ? 'Set DATABASE_URL to enable clients, jobs, contracts, calendar, and atomic document numbering.'
                        : database.reachable === false
                            ? 'Postgres is configured but not answering. Check that the database container is running and DATABASE_URL is correct.'
                            : undefined}
                />

                <StatusCard
                    icon={FileJson}
                    title="Documents"
                    status="info"
                    statusLabel={health.documents.storage === 'webdav' ? 'WebDAV' : health.documents.storage === 'local-json' ? 'local files' : 'unknown'}
                    rows={[
                        { label: 'Storage', value: health.documents.storage === 'webdav' ? 'Remote WebDAV' : 'Local data/ volume' },
                        { label: 'Numbering', value: health.documents.numbering === 'atomic-document-counter' ? 'Atomic (database)' : 'Filesystem scan' },
                    ]}
                    hint={health.documents.storage === 'local-json'
                        ? 'Invoices and other documents live on this server\u2019s data volume. Take regular backups from Tools → Backup.'
                        : 'Documents are stored on your WebDAV server. The remote folder is set in Settings → Storage.'}
                />

                <StatusCard
                    icon={Mail}
                    title="Email"
                    status={emailStatus}
                    statusLabel={!health.email.configured ? 'not configured' : health.email.sink ? 'test sink' : 'configured'}
                    rows={[
                        { label: 'Server', value: health.email.target ?? '—' },
                        { label: 'From', value: health.email.from ?? '—' },
                    ]}
                    hint={!health.email.configured
                        ? 'Set EMAIL_SERVER to enable sign-in codes, quote notifications, and document sending.'
                        : health.email.sink
                            ? 'Mail is being captured by a local test sink and will not reach real recipients.'
                            : undefined}
                />

                <StatusCard
                    icon={CreditCard}
                    title="Stripe"
                    status={stripeStatus}
                    statusLabel={health.stripe.mode === 'not-configured' ? 'not configured' : `${health.stripe.mode} mode`}
                    rows={[
                        { label: 'Checkout', value: health.stripe.mode === 'not-configured' ? 'Disabled' : 'Enabled' },
                        { label: 'Webhook', value: health.stripe.webhookConfigured ? 'Configured' : 'Missing' },
                    ]}
                    hint={health.stripe.mode === 'not-configured'
                        ? 'Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to let clients pay invoices by card.'
                        : !health.stripe.webhookConfigured
                            ? 'Without STRIPE_WEBHOOK_SECRET, payments will not be recorded automatically on invoices.'
                            : health.stripe.mode === 'test'
                                ? 'Test mode: charges are simulated and no real money moves.'
                                : undefined}
                />

                <StatusCard
                    icon={Clock}
                    title="Scheduler"
                    status={health.cron.secretConfigured ? 'ok' : 'warn'}
                    statusLabel={health.cron.secretConfigured ? 'ready' : 'no secret'}
                    rows={[
                        { label: 'Cron secret', value: health.cron.secretConfigured ? 'Configured' : 'Missing' },
                    ]}
                    hint={health.cron.secretConfigured
                        ? 'Contract invoices and calendar reminders run via the cron endpoints — see the API reference.'
                        : 'Set CRON_SECRET so the contract scheduler and calendar reminder endpoints can authenticate.'}
                />

                <StatusCard
                    icon={Globe}
                    title="URLs"
                    status={health.urls.nextauth ? 'ok' : 'error'}
                    statusLabel={health.urls.nextauth ? 'configured' : 'missing'}
                    rows={[
                        { label: 'NEXTAUTH_URL', value: health.urls.nextauth ?? '—' },
                        { label: 'Public site URL', value: health.urls.site ?? '(falls back to NEXTAUTH_URL)' },
                    ]}
                    hint={!health.urls.nextauth
                        ? 'NEXTAUTH_URL must match the address you open the app on, or sign-in redirects will fail.'
                        : undefined}
                />

                <StatusCard
                    icon={Activity}
                    title="Monitoring"
                    status="info"
                    statusLabel="GET /api/health"
                    rows={[
                        { label: 'Anonymous', value: 'Liveness only' },
                        { label: 'Admin session', value: 'Full diagnostics' },
                    ]}
                    hint="Point uptime monitoring at /api/health — it responds without touching the database."
                />
            </Grid>
        </Container>
    );
}
