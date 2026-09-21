import Link from 'next/link';
import { Badge, Box, Button, Card, Container, Flex, Heading, Table, Text } from '@radix-ui/themes';
import { Activity, ArrowLeft } from 'lucide-react';
import { getSiteUrl } from '@/lib/branding';

type AuthKind = 'none' | 'cron-secret' | 'admin-session' | 'stripe-signature' | 'share-token';

interface EndpointDoc {
    method: 'GET' | 'POST';
    path: string;
    title: string;
    auth: AuthKind;
    description: string[];
    request?: { name: string; description: string }[];
    responses?: { code: string; description: string }[];
    curl?: (siteUrl: string) => string;
    notes?: string[];
}

const AUTH_LABEL: Record<AuthKind, { label: string; color: 'green' | 'amber' | 'blue' | 'violet' | 'gray' }> = {
    'none': { label: 'Public', color: 'green' },
    'cron-secret': { label: 'X-Cron-Secret header', color: 'amber' },
    'admin-session': { label: 'Admin session', color: 'blue' },
    'stripe-signature': { label: 'Stripe signature', color: 'violet' },
    'share-token': { label: 'Share token', color: 'gray' },
};

const ENDPOINTS: EndpointDoc[] = [
    {
        method: 'GET',
        path: '/api/health',
        title: 'Health & diagnostics',
        auth: 'none',
        description: [
            'Liveness probe for uptime monitoring and container healthchecks. Anonymous callers get a shallow payload with no database access; requests carrying an admin session cookie additionally receive full diagnostics (database reachability, document storage mode, email/Stripe/cron configuration).',
        ],
        responses: [
            { code: '200', description: 'Anonymous: { ok, env, commit, time }. Admin: full diagnostics object.' },
        ],
        curl: (siteUrl) => `curl ${siteUrl}/api/health`,
        notes: ['The admin System Health page renders the same diagnostics in the UI.'],
    },
    {
        method: 'POST',
        path: '/api/cron/contracts',
        title: 'Contract invoice scheduler',
        auth: 'cron-secret',
        description: [
            'Generates the next cycle invoice for every active recurring contract that is due, and emails it to the customer when auto-send is enabled and the invoice has no usage lines awaiting quantities.',
            'The bundled docker compose stack triggers this on a schedule (CONTRACTS_CRON_SCHEDULE, default 08:15 daily). If you run the app without the cron sidecar, call it from any external scheduler.',
        ],
        request: [
            { name: 'X-Cron-Secret', description: 'Header that must match the CRON_SECRET environment variable. "Authorization: Bearer <secret>" is also accepted.' },
        ],
        responses: [
            { code: '200', description: 'Summary of contracts processed and invoices created.' },
            { code: '401', description: 'Missing or wrong secret.' },
            { code: '503', description: 'CRON_SECRET is not set on the server.' },
        ],
        curl: (siteUrl) => `curl -X POST ${siteUrl}/api/cron/contracts \\\n  -H "X-Cron-Secret: $CRON_SECRET"`,
    },
    {
        method: 'POST',
        path: '/api/cron/calendar',
        title: 'Calendar reminder emails',
        auth: 'cron-secret',
        description: [
            'Sends reminder emails for upcoming calendar events whose reminder window has arrived. Safe to call frequently — reminders are only sent once per event.',
            'The compose stack triggers this hourly by default (CALENDAR_CRON_SCHEDULE).',
        ],
        request: [
            { name: 'X-Cron-Secret', description: 'Header that must match the CRON_SECRET environment variable.' },
        ],
        responses: [
            { code: '200', description: 'Count of reminders sent.' },
            { code: '401', description: 'Missing or wrong secret.' },
            { code: '503', description: 'CRON_SECRET is not set on the server.' },
        ],
        curl: (siteUrl) => `curl -X POST ${siteUrl}/api/cron/calendar \\\n  -H "X-Cron-Secret: $CRON_SECRET"`,
    },
    {
        method: 'POST',
        path: '/api/stripe/checkout',
        title: 'Create Stripe Checkout session',
        auth: 'share-token',
        description: [
            'Creates a Stripe Checkout Session for a shared invoice. Used by the payment buttons on the public invoice view; callers authenticate by knowing the invoice\u2019s unguessable share token.',
            'Requires STRIPE_SECRET_KEY on the server and Stripe enabled as a payment method.',
        ],
        request: [
            { name: 'shareToken', description: 'The invoice share token from its /d/{token} link (JSON body).' },
            { name: 'mode', description: '"full" (default, remaining balance), "amount", "percent", or "split".' },
            { name: 'amount / percent / splitCount', description: 'Value for the chosen mode.' },
        ],
        responses: [
            { code: '200', description: '{ url } — redirect the payer to this Stripe-hosted page.' },
            { code: '400/404', description: 'Invalid token, voided invoice, or Stripe not allowed on this invoice.' },
            { code: '503', description: 'Stripe is not configured on this server.' },
        ],
        curl: (siteUrl) => `curl -X POST ${siteUrl}/api/stripe/checkout \\\n  -H "Content-Type: application/json" \\\n  -d '{"shareToken":"<token>","mode":"full"}'`,
    },
    {
        method: 'POST',
        path: '/api/stripe/webhook',
        title: 'Stripe webhook receiver',
        auth: 'stripe-signature',
        description: [
            'Receives checkout.session.completed events from Stripe, records the payment on the invoice, marks it paid when the balance reaches zero, and creates a receipt automatically.',
            'Configure the endpoint in the Stripe dashboard (Developers → Webhooks) pointing at this URL, subscribe to checkout.session.completed, and set the signing secret as STRIPE_WEBHOOK_SECRET.',
        ],
        request: [
            { name: 'Stripe-Signature', description: 'Signature header validated against STRIPE_WEBHOOK_SECRET.' },
        ],
        responses: [
            { code: '200', description: 'Event processed (idempotent per Checkout session).' },
            { code: '400', description: 'Invalid signature or payload.' },
        ],
        notes: ['Do not record the same Stripe payment manually — the webhook already applies it.'],
    },
    {
        method: 'GET',
        path: '/api/backup',
        title: 'Download full backup',
        auth: 'admin-session',
        description: [
            'Streams a .tar.gz archive containing the database tables, all document JSON files, job attachments, and settings. The same download offered on the Backup page.',
        ],
        responses: [
            { code: '200', description: 'application/gzip attachment.' },
            { code: '401', description: 'No admin session.' },
        ],
        notes: ['For scripted backups, authenticate with a session cookie or run backups from the admin UI.'],
    },
    {
        method: 'GET',
        path: '/d/{token}',
        title: 'Public document share link',
        auth: 'share-token',
        description: [
            'Client-facing view of an invoice, estimate, quote, receipt, or contract. Tokens are unguessable and minted per document; anyone with the link can view and print, and pay invoices when Stripe is enabled.',
        ],
        notes: ['Legacy /invoices/{id}-style links redirect anonymous visitors to the tokenized URL automatically.'],
    },
];

export default async function ApiReferencePage() {
    const siteUrl = getSiteUrl();

    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <Flex direction="column" gap="2" mb="5">
                <Button asChild variant="ghost" size="1" color="gray" style={{ alignSelf: 'flex-start' }}>
                    <Link href="/admin/system"><ArrowLeft size={14} /> System Health</Link>
                </Button>
                <Heading size="7">API Reference</Heading>
                <Text size="2" color="gray">
                    Every HTTP endpoint you might integrate with when self-hosting — monitoring, scheduling, payments, and backups.
                    Examples use this instance&apos;s address: <code>{siteUrl}</code>.
                </Text>
            </Flex>

            <Flex direction="column" gap="4">
                {ENDPOINTS.map((endpoint) => {
                    const auth = AUTH_LABEL[endpoint.auth];
                    return (
                        <Card key={`${endpoint.method} ${endpoint.path}`} size="2" id={endpoint.path.replace(/[^a-z0-9]+/gi, '-')}>
                            <Flex direction="column" gap="3">
                                <Flex justify="between" align="center" gap="2" wrap="wrap">
                                    <Flex align="center" gap="2" wrap="wrap">
                                        <Badge color={endpoint.method === 'GET' ? 'green' : 'blue'} variant="solid" radius="medium">
                                            {endpoint.method}
                                        </Badge>
                                        <Text size="3" weight="bold" style={{ fontFamily: 'var(--font-geist-mono), monospace', wordBreak: 'break-all' }}>
                                            {endpoint.path}
                                        </Text>
                                    </Flex>
                                    <Badge color={auth.color} variant="soft">{auth.label}</Badge>
                                </Flex>

                                <Box>
                                    <Text size="2" weight="bold" as="div" mb="1">{endpoint.title}</Text>
                                    {endpoint.description.map((paragraph, i) => (
                                        <Text key={i} size="2" color="gray" as="p" mb="1" style={{ lineHeight: 1.55 }}>
                                            {paragraph}
                                        </Text>
                                    ))}
                                </Box>

                                {endpoint.request?.length ? (
                                    <Box>
                                        <Text size="1" color="gray" weight="bold" as="div" mb="1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Request
                                        </Text>
                                        <Table.Root size="1" variant="ghost">
                                            <Table.Body>
                                                {endpoint.request.map((param) => (
                                                    <Table.Row key={param.name}>
                                                        <Table.Cell style={{ whiteSpace: 'nowrap' }}>
                                                            <code style={{ fontSize: 12 }}>{param.name}</code>
                                                        </Table.Cell>
                                                        <Table.Cell><Text size="1" color="gray">{param.description}</Text></Table.Cell>
                                                    </Table.Row>
                                                ))}
                                            </Table.Body>
                                        </Table.Root>
                                    </Box>
                                ) : null}

                                {endpoint.responses?.length ? (
                                    <Box>
                                        <Text size="1" color="gray" weight="bold" as="div" mb="1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Responses
                                        </Text>
                                        <Table.Root size="1" variant="ghost">
                                            <Table.Body>
                                                {endpoint.responses.map((response) => (
                                                    <Table.Row key={response.code}>
                                                        <Table.Cell style={{ whiteSpace: 'nowrap' }}>
                                                            <code style={{ fontSize: 12 }}>{response.code}</code>
                                                        </Table.Cell>
                                                        <Table.Cell><Text size="1" color="gray">{response.description}</Text></Table.Cell>
                                                    </Table.Row>
                                                ))}
                                            </Table.Body>
                                        </Table.Root>
                                    </Box>
                                ) : null}

                                {endpoint.curl ? (
                                    <Box>
                                        <Text size="1" color="gray" weight="bold" as="div" mb="1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Example
                                        </Text>
                                        <pre
                                            style={{
                                                margin: 0,
                                                padding: '10px 12px',
                                                borderRadius: 8,
                                                background: 'var(--gray-a3)',
                                                fontFamily: 'var(--font-geist-mono), monospace',
                                                fontSize: 12,
                                                lineHeight: 1.5,
                                                overflowX: 'auto',
                                                WebkitOverflowScrolling: 'touch',
                                            }}
                                        >
                                            {endpoint.curl(siteUrl)}
                                        </pre>
                                    </Box>
                                ) : null}

                                {endpoint.notes?.map((note, i) => (
                                    <Flex key={i} gap="2" align="start">
                                        <Activity size={14} style={{ color: 'var(--accent-9)', flexShrink: 0, marginTop: 2 }} />
                                        <Text size="1" color="gray">{note}</Text>
                                    </Flex>
                                ))}
                            </Flex>
                        </Card>
                    );
                })}
            </Flex>
        </Container>
    );
}
