'use server';

import { revalidatePath } from 'next/cache';
import { getAppConfig, saveAppConfig } from '@/lib/config';
import { requireAdminAction } from '@/lib/require-admin-session';

export async function setOnboardingChecklistDismissedAction(dismissed: boolean): Promise<{ success: boolean; error?: string }> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };
    const current = await getAppConfig();
    await saveAppConfig({ onboarding: { ...current.onboarding, checklistDismissed: dismissed } });
    revalidatePath('/admin');
    return { success: true };
}
