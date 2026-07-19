'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createJobAction } from '@/app/actions';
import { createJobAttachment, deleteJobAttachment } from '@/lib/job-attachments';
import { createJobTimeLog, deleteJobTimeLog } from '@/lib/job-time-logs';
import { requireAdminAction, requireAdminActionOrRedirect } from '@/lib/require-admin-session';

export async function createJobFromFormAction(formData: FormData) {
    await requireAdminActionOrRedirect('/admin/jobs/create');
    const name = (formData.get('name') as string) || '';
    const description = (formData.get('description') as string) || '';
    const status = (formData.get('status') as string) || 'active';
    const clientId = (formData.get('clientId') as string) || undefined;
    const leadId = (formData.get('leadId') as string) || undefined;
    const result = await createJobAction({ name, description, status, clientId, leadId });
    if (!result.success) {
        const params = new URLSearchParams({
            error: result.error || 'Failed to create job',
            name,
            description,
            status,
            ...(clientId ? { clientId } : {}),
            ...(leadId ? { leadId } : {}),
        });
        redirect(`/admin/jobs/create?${params.toString()}`);
    }
    redirect(`/admin/jobs/${result.job.id}`);
}

export async function uploadJobAttachmentAction(formData: FormData) {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const jobId = (formData.get('jobId') as string) || '';
    const note = (formData.get('note') as string) || '';
    const file = formData.get('file');
    if (!jobId || !(file instanceof File)) {
        return { success: false, error: 'Missing job or file' as const };
    }
    try {
        const attachment = await createJobAttachment({ jobId, file, note });
        revalidatePath('/admin/jobs');
        revalidatePath(`/admin/jobs/${jobId}`);
        return { success: true, attachment };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload attachment',
        };
    }
}

export async function deleteJobAttachmentAction(formData: FormData) {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const attachmentId = (formData.get('attachmentId') as string) || '';
    const jobId = (formData.get('jobId') as string) || '';
    if (!attachmentId || !jobId) {
        return { success: false, error: 'Missing attachment reference' as const };
    }
    await deleteJobAttachment(attachmentId);
    revalidatePath('/admin/jobs');
    revalidatePath(`/admin/jobs/${jobId}`);
    return { success: true };
}

export async function createJobTimeLogAction(input: {
    jobId: string;
    hours: number;
    note?: string;
    loggedAt?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const jobId = input.jobId?.trim();
    if (!jobId) {
        return { success: false, error: 'Job is required.' };
    }
    if (!Number.isFinite(input.hours) || input.hours <= 0) {
        return { success: false, error: 'Enter hours greater than zero.' };
    }

    let loggedAt: Date | undefined;
    if (input.loggedAt?.trim()) {
        const parsed = new Date(`${input.loggedAt.trim()}T12:00:00`);
        if (Number.isNaN(parsed.getTime())) {
            return { success: false, error: 'Enter a valid date.' };
        }
        loggedAt = parsed;
    }

    try {
        await createJobTimeLog({
            jobId,
            hours: input.hours,
            note: input.note,
            loggedAt,
        });
        revalidatePath('/admin/jobs');
        revalidatePath(`/admin/jobs/${jobId}`);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to log time',
        };
    }
}

export async function deleteJobTimeLogAction(input: {
    jobId: string;
    timeLogId: string;
}): Promise<{ success: true } | { success: false; error: string }> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const jobId = input.jobId?.trim();
    const timeLogId = input.timeLogId?.trim();
    if (!jobId || !timeLogId) {
        return { success: false, error: 'Missing time log reference.' };
    }

    try {
        await deleteJobTimeLog(timeLogId);
        revalidatePath('/admin/jobs');
        revalidatePath(`/admin/jobs/${jobId}`);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete time log',
        };
    }
}
