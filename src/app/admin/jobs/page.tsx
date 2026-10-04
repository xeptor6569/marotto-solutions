import Link from 'next/link';
import { Button, Container } from '@radix-ui/themes';
import { Briefcase, Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import AdminJobsList, { type AdminJobsListItem } from '@/components/AdminJobsList';
import EmptyState from '@/components/EmptyState';
import { getJobDocumentCounts, getJobs } from '@/lib/jobs';
import { listJobAttachments } from '@/lib/job-attachments';

export default async function AdminJobsPage() {
    const jobs = await getJobs();
    const enriched: AdminJobsListItem[] = await Promise.all(
        jobs.map(async (job) => {
            const [counts, attachments] = await Promise.all([
                getJobDocumentCounts(job.id),
                listJobAttachments(job.id),
            ]);
            return {
                id: job.id,
                name: job.name,
                description: job.description,
                status: job.status,
                updatedAt: job.updatedAt.toISOString(),
                counts,
                attachmentCount: attachments.length,
            };
        }),
    );

    return (
        <Container size="4" p={{ initial: '3', sm: '5' }}>
            <PageHeader
                title="Jobs"
                actions={(
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/jobs/create"><Plus size={14} /> New job</Link>
                        </Button>
                    </>
                )}
            />

            {enriched.length === 0 ? (
                <EmptyState
                    icon={Briefcase}
                    title="No jobs yet"
                    description="Group related estimates, quotes, invoices, and receipts under a job to keep work organized."
                    action={(
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/jobs/create"><Plus size={14} /> Create first job</Link>
                        </Button>
                    )}
                />
            ) : (
                <AdminJobsList jobs={enriched} />
            )}
        </Container>
    );
}
