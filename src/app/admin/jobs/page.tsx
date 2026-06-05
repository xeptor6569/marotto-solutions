import Link from 'next/link';
import { Box, Button, Card, Container, Flex, Table, Text } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import EmptyState from '@/components/EmptyState';
import { getJobDocumentCounts, getJobs } from '@/lib/jobs';
import { listJobAttachments } from '@/lib/job-attachments';

export default async function AdminJobsPage() {
    const jobs = await getJobs();
    const enriched = await Promise.all(
        jobs.map(async (job) => {
            const [counts, attachments] = await Promise.all([
                getJobDocumentCounts(job.id),
                listJobAttachments(job.id),
            ]);
            return { job, counts, attachmentCount: attachments.length };
        }),
    );

    return (
        <Container size="4" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title="Jobs"
                actions={(
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/jobs/create"><Plus size={14} /> New job</Link>
                        </Button>
                        <BackButton href="/admin" />
                    </>
                )}
            />

            {enriched.length === 0 ? (
                <EmptyState
                    title="No jobs yet"
                    description="Group related estimates, quotes, invoices, and receipts under a job to keep work organized."
                    action={(
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/jobs/create"><Plus size={14} /> Create first job</Link>
                        </Button>
                    )}
                />
            ) : (
                <>
                    <Flex direction="column" gap="3" className="jobs-list-mobile">
                        {enriched.map(({ job, counts, attachmentCount }) => (
                            <Card key={job.id}>
                                <Flex direction="column" gap="3">
                                    <Flex justify="between" align="start" gap="2" wrap="wrap">
                                        <Box style={{ minWidth: 0, flex: "1 1 140px" }}>
                                            <Text as="div" weight="bold">{job.name}</Text>
                                            <Text as="div" size="1" color="gray">{job.id}</Text>
                                            {job.description ? <Text as="div" size="2">{job.description}</Text> : null}
                                        </Box>
                                        <Text size="2" color="gray">{job.status}</Text>
                                    </Flex>
                                    <Box>
                                        <Text size="1" color="gray">Docs</Text>
                                        <Text size="2">
                                            {counts.estimates} est · {counts.quotes} quote · {counts.invoices} inv · {counts.receipts} rct · {counts.leads} lead
                                        </Text>
                                    </Box>
                                    <Flex justify="between" align="center">
                                        <Text size="2" color="gray">Attachments: {attachmentCount}</Text>
                                        <Text size="2" color="gray">{new Date(job.updatedAt).toLocaleDateString()}</Text>
                                    </Flex>
                                    <Button asChild size="2" variant="soft">
                                        <Link href={`/admin/jobs/${job.id}`}>Open</Link>
                                    </Button>
                                </Flex>
                            </Card>
                        ))}
                    </Flex>

                    <Card className="jobs-list-desktop" style={{ padding: 0, overflow: 'hidden' }}>
                        <Box style={{ overflowX: 'auto' }}>
                            <Table.Root style={{ minWidth: 880 }}>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeaderCell>Job</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Docs</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Attachments</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Updated</Table.ColumnHeaderCell>
                                        <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {enriched.map(({ job, counts, attachmentCount }) => (
                                        <Table.Row key={job.id}>
                                            <Table.Cell>
                                                <Text as="div" weight="bold">{job.name}</Text>
                                                <Text as="div" size="1" color="gray">{job.id}</Text>
                                                {job.description ? <Text as="div" size="1">{job.description}</Text> : null}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size="2">{job.status}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size="2">
                                                    {counts.estimates} est · {counts.quotes} quote · {counts.invoices} inv · {counts.receipts} rct · {counts.leads} lead
                                                </Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size="2">{attachmentCount}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Text size="2">{new Date(job.updatedAt).toLocaleDateString()}</Text>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Button asChild size="2" variant="soft">
                                                    <Link href={`/admin/jobs/${job.id}`}>Open</Link>
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    </Card>
                </>
            )}
            <style>{`
                .jobs-list-mobile { display: flex; }
                .jobs-list-desktop { display: none; }
                @media (min-width: 768px) {
                    .jobs-list-mobile { display: none !important; }
                    .jobs-list-desktop { display: block !important; }
                }
            `}</style>
        </Container>
    );
}
