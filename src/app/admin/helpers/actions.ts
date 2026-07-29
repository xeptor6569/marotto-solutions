'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
    createHelper,
    deleteHelper,
    updateHelper,
    type HelperInput,
} from '@/lib/helpers';
import {
    createHelperPayout,
    deleteHelperPayout,
    type HelperPayoutInput,
} from '@/lib/helper-payouts';
import {
    requireAdminAction,
    requireAdminActionOrRedirect,
} from '@/lib/require-admin-session';

function parseHelperForm(formData: FormData): HelperInput {
    return {
        name: ((formData.get('name') as string) || '').trim(),
        email: ((formData.get('email') as string) || '').trim() || undefined,
        phone: ((formData.get('phone') as string) || '').trim() || undefined,
        notes: ((formData.get('notes') as string) || '').trim() || undefined,
        active: formData.get('active') !== 'false',
    };
}

export async function createHelperFormAction(formData: FormData) {
    await requireAdminActionOrRedirect('/admin/helpers/create');
    try {
        const helper = await createHelper(parseHelperForm(formData));
        revalidatePath('/admin/helpers');
        revalidatePath('/admin');
        redirect(`/admin/helpers/${helper.id}`);
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error) {
            const digest = String((error as { digest?: string }).digest ?? '');
            if (digest.startsWith('NEXT_REDIRECT')) throw error;
        }
        const message = error instanceof Error ? error.message : 'Could not create helper.';
        redirect(`/admin/helpers/create?error=${encodeURIComponent(message)}`);
    }
}

export async function updateHelperFormAction(formData: FormData) {
    await requireAdminActionOrRedirect('/admin/helpers');
    const id = ((formData.get('helperId') as string) || '').trim();
    if (!id) {
        redirect('/admin/helpers?error=' + encodeURIComponent('Helper id is required.'));
    }
    try {
        await updateHelper(id, parseHelperForm(formData));
        revalidatePath('/admin/helpers');
        revalidatePath(`/admin/helpers/${id}`);
        revalidatePath('/admin');
        redirect(`/admin/helpers/${id}?saved=1`);
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error) {
            const digest = String((error as { digest?: string }).digest ?? '');
            if (digest.startsWith('NEXT_REDIRECT')) throw error;
        }
        const message = error instanceof Error ? error.message : 'Could not update helper.';
        redirect(`/admin/helpers/${id}?error=${encodeURIComponent(message)}`);
    }
}

export async function deleteHelperAction(input: { id: string }): Promise<{ success: boolean; error?: string }> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };
    const id = input.id?.trim();
    if (!id) return { success: false, error: 'Helper id is required.' };
    try {
        await deleteHelper(id);
        revalidatePath('/admin/helpers');
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not delete helper.';
        return { success: false, error: message };
    }
}

export async function createHelperPayoutAction(input: HelperPayoutInput): Promise<
    { success: true } | { success: false; error: string }
> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };
    try {
        const payout = await createHelperPayout(input);
        revalidatePath('/admin/helpers');
        revalidatePath(`/admin/helpers/${payout.helperId}`);
        if (payout.jobId) {
            revalidatePath(`/admin/jobs/${payout.jobId}`);
        }
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not record payout.';
        return { success: false, error: message };
    }
}

export async function deleteHelperPayoutAction(input: {
    id: string;
    helperId?: string;
    jobId?: string;
}): Promise<{ success: boolean; error?: string }> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };
    const id = input.id?.trim();
    if (!id) return { success: false, error: 'Payout id is required.' };
    try {
        await deleteHelperPayout(id);
        revalidatePath('/admin/helpers');
        if (input.helperId) revalidatePath(`/admin/helpers/${input.helperId}`);
        if (input.jobId) revalidatePath(`/admin/jobs/${input.jobId}`);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not delete payout.';
        return { success: false, error: message };
    }
}
