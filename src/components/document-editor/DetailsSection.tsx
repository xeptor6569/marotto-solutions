'use client';

import { Box, Card, Grid, Heading, Text, TextField } from '@radix-ui/themes';
import MarkdownEditor from '@/components/MarkdownEditor';
import { LabelWithHelp } from '@/components/HelpTip';
import { DOCUMENT_STATUSES, statusLabel } from '@/lib/document-save';
import type { DocumentData, WorkflowStatus } from '@/lib/types';

type EditorDocType = 'invoice' | 'estimate' | 'quote' | 'receipt';

export default function DetailsSection({
    type,
    title,
    onTitleChange,
    date,
    onDateChange,
    dueDate,
    onDueDateChange,
    status,
    onStatusChange,
    workflowStatus,
    onWorkflowStatusChange,
    estimatedHours,
    onEstimatedHoursChange,
    notes,
    onNotesChange,
}: {
    type: EditorDocType;
    title: string;
    onTitleChange: (value: string) => void;
    date: string;
    onDateChange: (value: string) => void;
    dueDate: string;
    onDueDateChange: (value: string) => void;
    status: DocumentData['status'];
    onStatusChange: (value: DocumentData['status']) => void;
    workflowStatus: WorkflowStatus | undefined;
    onWorkflowStatusChange: (value: WorkflowStatus | undefined) => void;
    estimatedHours: string;
    onEstimatedHoursChange: (value: string) => void;
    notes: string;
    onNotesChange: (value: string) => void;
}) {
    const isProposal = type === 'estimate' || type === 'quote';
    const notesLabel = type === 'estimate' ? 'Project description' : type === 'quote' ? 'Scope & terms' : 'Notes';

    return (
        <Card size="3">
            <Heading size="4" mb="4">Details</Heading>
            <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                <Box style={{ gridColumn: '1 / -1' }}>
                    <Text as="label" size="2" weight="medium" htmlFor="editor-title">Title</Text>
                    <TextField.Root
                        id="editor-title"
                        mt="1"
                        name="title"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder="e.g. Kitchen remodel — phase 1"
                    />
                    <Text as="div" size="1" color="gray" mt="1">
                        Shown in lists and on the document. Left blank, the first line item is used.
                    </Text>
                </Box>
                <Box>
                    <Text as="label" size="2" weight="medium" htmlFor="editor-date">Date</Text>
                    <TextField.Root
                        id="editor-date"
                        mt="1"
                        name="date"
                        type="date"
                        value={date}
                        onChange={(e) => onDateChange(e.target.value)}
                        aria-required="true"
                    />
                </Box>
                <Box>
                    <Text as="label" size="2" weight="medium" htmlFor="editor-due">
                        <LabelWithHelp help={type === 'invoice'
                            ? 'Unpaid invoices past this date count as overdue on the dashboard. Leave empty for no due date.'
                            : 'Optional. For estimates and quotes, use it as a "valid until" date.'}
                        >
                            {type === 'invoice' ? 'Due date' : 'Valid until'}
                        </LabelWithHelp>
                    </Text>
                    <TextField.Root
                        id="editor-due"
                        mt="1"
                        name="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => onDueDateChange(e.target.value)}
                    />
                </Box>
                <Box>
                    <Text as="label" size="2" weight="medium" htmlFor="editor-status">
                        <LabelWithHelp help="Where the document stands with the client. For invoices, payments update this automatically — record them from the invoice page instead of setting Paid here." topic="documents">
                            Status
                        </LabelWithHelp>
                    </Text>
                    <select
                        id="editor-status"
                        value={status}
                        onChange={(e) => onStatusChange(e.target.value as DocumentData['status'])}
                        className="editor-select"
                    >
                        {DOCUMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>{statusLabel(s)}</option>
                        ))}
                    </select>
                </Box>
                {isProposal ? (
                    <Box>
                        <Text as="label" size="2" weight="medium" htmlFor="editor-workflow">
                            <LabelWithHelp help="Your own progress tracking, separate from the client-facing status. It sets which column the document appears in on the board view." topic="documents">
                                Workflow
                            </LabelWithHelp>
                        </Text>
                        <select
                            id="editor-workflow"
                            value={workflowStatus || ''}
                            onChange={(e) => onWorkflowStatusChange((e.target.value as WorkflowStatus) || undefined)}
                            className="editor-select"
                        >
                            <option value="">None</option>
                            <option value="backlog">Backlog</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                        <input type="hidden" name="workflowStatus" value={workflowStatus || ''} />
                    </Box>
                ) : null}
                {isProposal ? (
                    <Box>
                        <Text as="label" size="2" weight="medium" htmlFor="editor-hours">Estimated hours</Text>
                        <TextField.Root
                            id="editor-hours"
                            mt="1"
                            name="estimatedHours"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.25"
                            placeholder="e.g. 8"
                            value={estimatedHours}
                            onChange={(e) => onEstimatedHoursChange(e.target.value)}
                        />
                        <Text as="div" size="1" color="gray" mt="1">Labor time; rolls up on the linked job.</Text>
                    </Box>
                ) : null}
                <Box style={{ gridColumn: '1 / -1' }}>
                    <Text as="div" size="2" weight="medium" mb="1">{notesLabel}</Text>
                    <MarkdownEditor
                        value={notes}
                        onChange={onNotesChange}
                        rows={isProposal ? 7 : 4}
                        placeholder={
                            type === 'estimate'
                                ? 'Describe the project scope, material choices, and any assumptions.'
                                : type === 'quote'
                                    ? 'State what is included, timing, warranty, payment expectations, or other binding terms.'
                                    : 'Optional notes to include on this document.'
                        }
                    />
                </Box>
            </Grid>
        </Card>
    );
}
