'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
    createPreset,
    deletePreset,
    updatePreset,
    isPresetDocumentType,
} from '@/lib/presets';
import { parseLineItemsFromFormData } from '@/lib/parse-line-items';
import {
    requireAdminAction,
    requireAdminActionOrRedirect,
} from '@/lib/require-admin-session';
import type { DocumentPresetInput, PresetDocumentType } from '@/lib/types';

function parsePresetForm(formData: FormData): DocumentPresetInput {
    const name = ((formData.get('name') as string) || '').trim();
    const title = ((formData.get('title') as string) || '').trim();
    const notes = ((formData.get('notes') as string) || '').trim();
    const documentTypes = formData
        .getAll('documentTypes')
        .map((value) => String(value))
        .filter(isPresetDocumentType) as PresetDocumentType[];
    const lineItems = parseLineItemsFromFormData(formData);

    return {
        name,
        title: title || undefined,
        notes: notes || undefined,
        documentTypes,
        lineItems,
    };
}

export async function createPresetFormAction(formData: FormData) {
    await requireAdminActionOrRedirect('/admin/presets/create');
    try {
        const input = parsePresetForm(formData);
        const preset = await createPreset(input);
        revalidatePath('/admin/presets');
        revalidatePath('/admin/presets/create');
        redirect(`/admin/presets/${preset.id}/edit?saved=1`);
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error) {
            const digest = String((error as { digest?: string }).digest ?? '');
            if (digest.startsWith('NEXT_REDIRECT')) throw error;
        }
        const message = error instanceof Error ? error.message : 'Could not save preset.';
        redirect(`/admin/presets/create?error=${encodeURIComponent(message)}`);
    }
}

export async function updatePresetFormAction(formData: FormData) {
    await requireAdminActionOrRedirect('/admin/presets');
    const id = ((formData.get('presetId') as string) || '').trim();
    if (!id) {
        redirect('/admin/presets?error=' + encodeURIComponent('Preset id is required.'));
    }
    try {
        const input = parsePresetForm(formData);
        await updatePreset(id, input);
        revalidatePath('/admin/presets');
        revalidatePath(`/admin/presets/${id}/edit`);
        redirect(`/admin/presets/${id}/edit?saved=1`);
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error) {
            const digest = String((error as { digest?: string }).digest ?? '');
            if (digest.startsWith('NEXT_REDIRECT')) throw error;
        }
        const message = error instanceof Error ? error.message : 'Could not update preset.';
        redirect(`/admin/presets/${id}/edit?error=${encodeURIComponent(message)}`);
    }
}

export async function deletePresetAction(input: { id: string }): Promise<{ success: boolean; error?: string }> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const id = input.id?.trim();
    if (!id) return { success: false, error: 'Preset id is required.' };

    try {
        await deletePreset(id);
        revalidatePath('/admin/presets');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not delete preset.';
        return { success: false, error: message };
    }
}

export async function createPresetFromDocumentAction(input: {
    documentId: string;
    name: string;
}): Promise<{ success: true; presetId: string } | { success: false; error: string }> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const documentId = input.documentId?.trim();
    const name = input.name?.trim();
    if (!documentId) return { success: false, error: 'Document is required.' };
    if (!name) return { success: false, error: 'Preset name is required.' };

    try {
        const { getDocumentById } = await import('@/lib/data');
        const { buildPresetFromDocument } = await import('@/lib/presets');
        const doc = await getDocumentById(documentId);
        if (!doc) return { success: false, error: 'Document not found.' };
        if (doc.type === 'lead') return { success: false, error: 'Leads cannot be saved as presets.' };

        const preset = await createPreset(buildPresetFromDocument(doc, name));
        revalidatePath('/admin/presets');
        return { success: true, presetId: preset.id };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not create preset.';
        return { success: false, error: message };
    }
}

export async function createPresetFromLinesAction(input: {
    name: string;
    documentType: PresetDocumentType;
    title?: string;
    notes?: string;
    lineItems: DocumentPresetInput['lineItems'];
}): Promise<{ success: true; presetId: string } | { success: false; error: string }> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const name = input.name?.trim();
    if (!name) return { success: false, error: 'Preset name is required.' };
    if (!isPresetDocumentType(input.documentType)) {
        return { success: false, error: 'Invalid document type.' };
    }
    if (!input.lineItems?.length) {
        return { success: false, error: 'Add at least one line item.' };
    }

    try {
        const preset = await createPreset({
            name,
            documentTypes: [input.documentType],
            title: input.title?.trim() || undefined,
            notes: input.notes || undefined,
            lineItems: input.lineItems,
        });
        revalidatePath('/admin/presets');
        return { success: true, presetId: preset.id };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not create preset.';
        return { success: false, error: message };
    }
}
