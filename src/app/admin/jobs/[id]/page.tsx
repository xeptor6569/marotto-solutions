import Link from 'next/link';
import { Badge, Box, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { notFound } from 'next/navigation';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import JobAttachmentsPanel from '@/components/JobAttachmentsPanel';
import { getDocumentsByJobId, getJobById } from '@/lib/jobs';
import { listJobAttachments } from '@/lib/job-attachments';

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [job, groupedDocs, attachments] = await Promise.all([
        getJobById(id),
        getDocumentsByJobId(id),
        listJobAttachments(id),
    ]);
    if (!job) {
        notFound();
    }

    const docSections = [
        { key: 'estimates', title: 'Estimates', docs: groupedDocs.estimates, hrefBase: '/admin/estimates' },
        { key: 'quotes', title: 'Quotes', docs: groupedDocs.quotes, hrefBase: '/admin/quotes' },
        { key: 'invoices', title: 'Invoices', docs: groupedDocs.invoices, hrefBase: '/admin/invoices' },
        { key: 'receipts', title: 'Receipts', docs: groupedDocs.receipts, hrefBase: '/admin/receipts' },
    ] as const;

    return (
        <Container size="4" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title={job.name}
                actions={(
                    <>
                        <Button asChild size="2" variant="soft">
                            <Link href="/admin/jobs/create">New job</Link>
                        </Button>
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
                            {job.description ? (
                                <Text as="div" size="2" mt="2" style={{ whiteSpace: 'pre-line' }}>
                                    {job.description}
                                </Text>
                            ) : null}
                        </Box>
                        <Badge size="2">{job.status}</Badge>
                    </Flex>
                </Card>

                <JobAttachmentsPanel jobId={job.id} attachments={attachments} />

                <Card>
                    <Heading size="4" mb="3">Linked documents</Heading>
                    <Flex direction="column" gap="4">
                        {docSections.map((section) => (
                            <Box key={section.key}>
                                <Text as="div" weight="bold">{section.title} ({section.docs.length})</Text>
                                {section.docs.length === 0 ? (
                                    <Text size="2" color="gray">None</Text>
                                ) : (
                                    <Flex direction="column" gap="2" mt="2">
                                        {section.docs.map((doc) => (
                                            <Flex key={doc.id} justify="between" align="center" gap="2" wrap="wrap">
                                                <Box>
                                                    <Text as="div" size="2" weight="bold">
                                                        {doc.id} - {doc.customer.name}
                                                    </Text>
                                                    <Text as="div" size="1" color="gray">
                                                        {new Date(doc.date).toLocaleDateString()} · ${doc.total.toFixed(2)}
                                                    </Text>
                                                </Box>
                                                <Button asChild size="2" variant="soft">
                                                    <Link href={`${section.hrefBase}/${doc.id}`}>Open</Link>
                                                </Button>
                                            </Flex>
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
