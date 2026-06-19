'use client';

import { Badge, Box, Card, Flex, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { useTransition } from 'react';
import type { DocumentData } from '@/lib/types';
import type { WorkflowStatus } from '@/lib/types';
import { WORKFLOW_STATUSES, workflowStatusLabel, workflowStatusColor } from '@/lib/workflow-status';
import { updateWorkflowStatusAction } from '@/app/actions';
import WorkflowStatusSelect from '@/components/WorkflowStatusSelect';

interface WorkflowBoardProps {
    docs: DocumentData[];
    type: 'estimate' | 'quote';
}

function adminBase(type: 'estimate' | 'quote'): string {
    return type === 'estimate' ? '/admin/estimates' : '/admin/quotes';
}

function badgeColor(status: DocumentData['status']): string {
    if (status === 'paid') return 'green';
    if (status === 'void') return 'red';
    if (status === 'sent') return 'blue';
    return 'orange';
}

export default function WorkflowBoard({ docs, type }: WorkflowBoardProps) {
    const base = adminBase(type);
    const [isPending, startTransition] = useTransition();

    const columns: { status: WorkflowStatus | undefined; label: string; color: string }[] = [
        { status: undefined, label: 'No status', color: 'gray' },
        ...WORKFLOW_STATUSES.map((s) => ({
            status: s,
            label: workflowStatusLabel(s),
            color: workflowStatusColor(s),
        })),
    ];

    const handleWorkflowChange = (docId: string, value: WorkflowStatus | undefined) => {
        startTransition(async () => {
            await updateWorkflowStatusAction(docId, value);
        });
    };

    return (
        <Flex direction="row" gap="4" style={{ overflowX: 'auto', paddingBottom: 16 }}>
            {columns.map((col) => {
                const colDocs = docs.filter((doc) =>
                    col.status === undefined ? !doc.workflowStatus : doc.workflowStatus === col.status,
                );

                return (
                    <Box
                        key={col.status ?? '__none__'}
                        style={{
                            minWidth: 260,
                            maxWidth: 320,
                            flex: '1 0 260px',
                        }}
                    >
                        <Flex justify="between" align="center" mb="3">
                            <Flex gap="2" align="center">
                                <Badge
                                    size="2"
                                    variant="soft"
                                    color={col.color as 'gray' | 'orange' | 'blue' | 'green'}
                                >
                                    {col.label}
                                </Badge>
                                <Text size="1" color="gray">{colDocs.length}</Text>
                            </Flex>
                        </Flex>

                        <Flex direction="column" gap="2">
                            {colDocs.length === 0 ? (
                                <Card variant="ghost" style={{ opacity: 0.5 }}>
                                    <Text size="2" color="gray" align="center" as="p">No items</Text>
                                </Card>
                            ) : (
                                colDocs.map((doc) => (
                                    <Card key={doc.id} style={{ cursor: 'pointer' }}>
                                        <Flex direction="column" gap="2">
                                            <Flex justify="between" align="start" gap="2">
                                                <Box style={{ minWidth: 0 }}>
                                                    <Text weight="bold" size="2" as="div">
                                                        <Link
                                                            href={`${base}/${doc.id}`}
                                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                                        >
                                                            #{doc.number}
                                                        </Link>
                                                    </Text>
                                                    {doc.title ? (
                                                        <Text size="1" color="gray" as="div" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {doc.title}
                                                        </Text>
                                                    ) : null}
                                                </Box>
                                                <Badge color={badgeColor(doc.status) as 'gray' | 'orange' | 'blue' | 'green'} size="1" style={{ flexShrink: 0 }}>
                                                    {doc.status}
                                                </Badge>
                                            </Flex>
                                            <Text size="1" color="gray" as="div" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {doc.customer.name}
                                            </Text>
                                            <Flex justify="between" align="center" gap="2">
                                                <Text weight="bold" size="2">${doc.total.toFixed(2)}</Text>
                                                <Box onClick={(e) => e.stopPropagation()}>
                                                    <WorkflowStatusSelect
                                                        value={doc.workflowStatus}
                                                        onChange={(v) => handleWorkflowChange(doc.id, v)}
                                                        size="1"
                                                    />
                                                </Box>
                                            </Flex>
                                        </Flex>
                                    </Card>
                                ))
                            )}
                        </Flex>
                    </Box>
                );
            })}

            {isPending ? (
                <Box style={{ position: 'fixed', bottom: 100, right: 20, zIndex: 50 }}>
                    <Badge color="blue" size="2">Saving...</Badge>
                </Box>
            ) : null}
        </Flex>
    );
}
