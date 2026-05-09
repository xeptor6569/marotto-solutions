'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createJobAction } from '@/app/actions';
import { createJobAttachment, deleteJobAttachment } from '@/lib/job-attachments';

export async function createJobFromFormAction(formData: FormData) {
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
