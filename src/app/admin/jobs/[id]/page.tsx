import Link from 'next/link';
import { Badge, Box, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { notFound } from 'next/navigation';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import JobAttachmentsPanel from '@/components/JobAttachmentsPanel';
import JobTimePanel from '@/components/JobTimePanel';
import CreateMenu from '@/components/CreateMenu';
import DeleteDocumentButton from '@/components/DeleteDocumentButton';
import { getDocumentsByJobId, getJobById } from '@/lib/jobs';
import { listJobAttachments } from '@/lib/job-attachments';
import { listJobTimeLogs } from '@/lib/job-time-logs';
import { aggregateJobEstimatedHours, formatHours } from '@/lib/job-estimated-hours';
import { getClientOptions } from '@/lib/clients';

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [job, groupedDocs, attachments, timeLogs, clients] = await Promise.all([
        getJobById(id),
        getDocumentsByJobId(id),
        listJobAttachments(id),
        listJobTimeLogs(id),
        getClientOptions(),
    ]);
    if (!job) {
        notFound();
    }

    const client = job.clientId ? clients.find((c) => c.id === job.clientId) : undefined;
    const jobRedirect = `/admin/jobs/${job.id}`;
    const estimated = aggregateJobEstimatedHours(groupedDocs.estimates, groupedDocs.quotes);

    const docSections = [
        { key: 'estimates', title: 'Estimates', docs: groupedDocs.estimates, hrefBase: '/admin/estimates', label: 'Estimate' },
        { key: 'quotes', title: 'Quotes', docs: groupedDocs.quotes, hrefBase: '/admin/quotes', label: 'Quote' },
        { key: 'invoices', title: 'Invoices', docs: groupedDocs.invoices, hrefBase: '/admin/invoices', label: 'Invoice' },
        { key: 'receipts', title: 'Receipts', docs: groupedDocs.receipts, hrefBase: '/admin/receipts', label: 'Receipt' },
    ] as const;

    return (
        <Container size="4" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title={job.name}
                actions={(
                    <>
                        <CreateMenu
                            jobId={job.id}
                            clientId={job.clientId || undefined}
                            redirectTo={jobRedirect}
                            documentsOnly
                        />
                        <BackButton href="/admin/jobs" />
                    </>
                )}
            />
            <Flex direction="column" gap="4">
                <Card>
                    <Flex justify="between" align="start" gap="3" wrap="wrap">
                        <Box style={{ minWidth: 0 }}>
                            <Heading size="4">{job.name}</Heading>
                            <Text as="div" size="1" color="gray">{job.id}</Text>
                            {client ? (
                                <Text as="div" size="2" mt="2">
                                    Client:{' '}
                                    <Link href="/admin/clients" style={{ color: 'var(--accent-11)' }}>
                                        {client.name}
                                    </Link>
                                </Text>
                            ) : null}
                            {job.description ? (
                                <Text as="div" size="2" mt="2" style={{ whiteSpace: 'pre-line' }}>
                                    {job.description}
                                </Text>
                            ) : null}
                        </Box>
                        <Badge size="2">{job.status}</Badge>
                    </Flex>
                </Card>

                <JobTimePanel
                    jobId={job.id}
                    estimated={estimated}
                    timeLogs={timeLogs}
                />

                <JobAttachmentsPanel jobId={job.id} attachments={attachments} />

                <Card>
                    <Flex justify="between" align="center" gap="3" wrap="wrap" mb="3">
                        <Heading size="4">Linked documents</Heading>
                        <CreateMenu
                            size="2"
                            jobId={job.id}
                            clientId={job.clientId || undefined}
                            redirectTo={jobRedirect}
                            documentsOnly
                        />
                    </Flex>
                    <Flex direction="column" gap="4">
                        {docSections.map((section) => (
                            <Box key={section.key}>
                                <Text as="div" weight="bold">{section.title} ({section.docs.length})</Text>
                                {section.docs.length === 0 ? (
                                    <Text size="2" color="gray">None</Text>
                                ) : (
                                    <Flex direction="column" gap="2" mt="2">
                                        {section.docs.map((doc) => (
                                            <Box
                                                key={doc.id}
                                                style={{
                                                    border: '1px solid var(--gray-a5)',
                                                    borderRadius: 12,
                                                    padding: 12,
                                                    background: 'var(--gray-a2)',
                                                }}
                                            >
                                                <Flex justify="between" align="start" gap="2" wrap="wrap">
                                                    <Box style={{ minWidth: 0, flex: '1 1 180px' }}>
                                                        <Text as="div" size="2" weight="bold">
                                                            {doc.id}{doc.title ? ` — ${doc.title}` : ''}
                                                        </Text>
                                                        <Text as="div" size="1" color="gray">
                                                            {doc.customer.name} · {new Date(doc.date).toLocaleDateString()} · ${doc.total.toFixed(2)}
                                                            {(doc.type === 'estimate' || doc.type === 'quote')
                                                                && typeof doc.estimatedHours === 'number'
                                                                && doc.estimatedHours > 0
                                                                ? ` · ${formatHours(doc.estimatedHours)}`
                                                                : ''}
                                                        </Text>
                                                        <Badge mt="2" size="1" variant="soft">{doc.status}</Badge>
                                                    </Box>
                                                    <Flex gap="2" wrap="wrap">
                                                        <Button asChild size="2" variant="soft" style={{ minHeight: 44 }}>
                                                            <Link href={`${section.hrefBase}/${doc.id}?fromJob=${job.id}`}>
                                                                Open
                                                            </Link>
                                                        </Button>
                                                        <Button asChild size="2" variant="soft" style={{ minHeight: 44 }}>
                                                            <Link
                                                                href={`${section.hrefBase}/${doc.id}/edit?redirectTo=${encodeURIComponent(jobRedirect)}`}
                                                            >
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                        <DeleteDocumentButton
                                                            documentId={doc.id}
                                                            documentLabel={section.label}
                                                            redirectTo={jobRedirect}
                                                            size="2"
                                                        />
                                                    </Flex>
                                                </Flex>
                                            </Box>
                                        ))}
                                    </Flex>
                                )}
                            </Box>
                        ))}
                    </Flex>
                </Card>
            </Flex>
        </Container>
    );
}
