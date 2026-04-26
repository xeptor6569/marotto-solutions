'use client';

import { useRef, useState, useTransition } from 'react';
import { Box, Button, Card, Flex, Heading, Text, TextArea } from '@radix-ui/themes';
import { uploadJobAttachmentAction, deleteJobAttachmentAction } from '@/app/admin/jobs/actions';
import type { JobAttachment } from '@prisma/client';
import { useRouter } from 'next/navigation';

function formatBytes(value: number) {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function JobAttachmentsPanel({
    jobId,
    attachments,
}: {
    jobId: string;
    attachments: JobAttachment[];
}) {
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();
    const fileRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const onUpload = () => {
        const file = fileRef.current?.files?.[0];
        if (!file) {
            setError('Select a file first.');
            return;
        }
        startTransition(async () => {
            const formData = new FormData();
            formData.set('jobId', jobId);
            formData.set('note', note);
            formData.set('file', file);
            const result = await uploadJobAttachmentAction(formData);
            if (!result.success) {
                setError(result.error || 'Upload failed');
                return;
            }
            setError('');
            setNote('');
            if (fileRef.current) fileRef.current.value = '';
            router.refresh();
        });
    };

    const onDelete = (attachmentId: string) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set('attachmentId', attachmentId);
            formData.set('jobId', jobId);
            const result = await deleteJobAttachmentAction(formData);
            if (!result.success) {
                setError(result.error || 'Delete failed');
                return;
            }
            setError('');
            router.refresh();
        });
    };

    return (
        <Card>
            <Heading size="4" mb="3">Attachments</Heading>
            <Flex direction="column" gap="3">
                <input ref={fileRef} type="file" />
                <TextArea
                    placeholder="Optional note (e.g., Home Depot receipt)"
                    rows={2}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                />
                <Button type="button" onClick={onUpload} disabled={isPending}>
                    {isPending ? 'Working...' : 'Upload attachment'}
                </Button>
                {error ? <Text color="red" size="2">{error}</Text> : null}
            </Flex>
            <Box mt="4">
                {attachments.length === 0 ? (
                    <Text size="2" color="gray">No attachments yet.</Text>
                ) : (
                    <Flex direction="column" gap="3">
                        {attachments.map((attachment) => (
                            <Flex key={attachment.id} justify="between" gap="3" align="start">
                                <Box style={{ minWidth: 0, flex: 1 }}>
                                    <Text as="div" weight="bold" style={{ wordBreak: 'break-word' }}>
                                        {attachment.filename}
                                    </Text>
                                    <Text as="div" size="1" color="gray">
                                        {attachment.mimeType} · {formatBytes(attachment.sizeBytes)} · {new Date(attachment.uploadedAt).toLocaleString()}
                                    </Text>
                                    {attachment.note ? (
                                        <Text as="div" size="2" mt="1" style={{ whiteSpace: 'pre-line' }}>
                                            {attachment.note}
                                        </Text>
                                    ) : null}
                                </Box>
                                <Flex direction="column" gap="2">
                                    <Button size="1" variant="soft" asChild>
                                        <a href={`/api/jobs/attachments/${attachment.id}`} target="_blank" rel="noreferrer">
                                            Open
                                        </a>
                                    </Button>
                                    <Button size="1" color="red" variant="soft" onClick={() => onDelete(attachment.id)} disabled={isPending}>
                                        Delete
                                    </Button>
                                </Flex>
                            </Flex>
                        ))}
                    </Flex>
                )}
            </Box>
        </Card>
    );
}
