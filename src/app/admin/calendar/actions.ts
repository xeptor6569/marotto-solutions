'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
    createEvent,
    updateEvent,
    cancelEvent,
    deleteEvent,
    validateEventInput,
} from '@/lib/calendar';
import type { CalendarEventInput } from '@/lib/types';

export interface CalendarActionResult {
    success: boolean;
    error?: string;
    eventId?: string;
    errors?: Array<{ field: string; message: string }>;
}

export async function createCalendarEventAction(input: CalendarEventInput): Promise<CalendarActionResult> {
    const session = await auth();
    if (!session) {
        return { success: false, error: 'You must be signed in.' };
    }

    const validationErrors = validateEventInput(input);
    if (validationErrors.length > 0) {
        return { success: false, errors: validationErrors, error: 'Validation failed.' };
    }

    try {
        const event = await createEvent(input);
        revalidatePath('/admin/calendar');
        revalidatePath('/admin');
        redirect(`/admin/calendar/${event.id}`);
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error) {
            const digest = String((error as { digest?: string }).digest ?? '');
            if (digest.startsWith('NEXT_REDIRECT')) {
                throw error;
            }
        }
        console.error('Failed to create calendar event', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}

export async function updateCalendarEventAction(
    id: string,
    input: Partial<CalendarEventInput>,
): Promise<CalendarActionResult> {
    const session = await auth();
    if (!session) {
        return { success: false, error: 'You must be signed in.' };
    }

    try {
        const event = await updateEvent(id, input);
        revalidatePath('/admin/calendar');
        revalidatePath(`/admin/calendar/${id}`);
        revalidatePath('/admin');
        return { success: true, eventId: event.id };
    } catch (error) {
        console.error('Failed to update calendar event', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}

export async function cancelCalendarEventAction(id: string): Promise<CalendarActionResult> {
    const session = await auth();
    if (!session) {
        return { success: false, error: 'You must be signed in.' };
    }

    try {
        await cancelEvent(id);
        revalidatePath('/admin/calendar');
        revalidatePath(`/admin/calendar/${id}`);
        revalidatePath('/admin');
        return { success: true, eventId: id };
    } catch (error) {
        console.error('Failed to cancel calendar event', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}

export async function deleteCalendarEventAction(id: string): Promise<CalendarActionResult> {
    const session = await auth();
    if (!session) {
        return { success: false, error: 'You must be signed in.' };
    }

    try {
        await deleteEvent(id);
        revalidatePath('/admin/calendar');
        revalidatePath(`/admin/calendar/${id}`);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete calendar event', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}
