import type { WorkflowStatus } from './types';

export const WORKFLOW_STATUSES: WorkflowStatus[] = ['backlog', 'todo', 'in_progress', 'done'];

export const WORKFLOW_STATUS_ORDER: Record<WorkflowStatus, number> = {
    backlog: 0,
    todo: 1,
    in_progress: 2,
    done: 3,
};

export function workflowStatusLabel(status: WorkflowStatus): string {
    if (status === 'backlog') return 'Backlog';
    if (status === 'todo') return 'To Do';
    if (status === 'in_progress') return 'In Progress';
    return 'Done';
}

export function workflowStatusColor(status: WorkflowStatus): string {
    if (status === 'backlog') return 'gray';
    if (status === 'todo') return 'orange';
    if (status === 'in_progress') return 'blue';
    return 'green';
}
