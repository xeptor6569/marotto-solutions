'use server';

import bcrypt from 'bcryptjs';
import { unstable_rethrow } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { signIn } from '@/lib/auth';
import { saveAppConfig } from '@/lib/config';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { getThemePreset } from '@/lib/theme-presets';

export type SetupActionState = { error?: string };

/**
 * One-time first-run setup: creates the initial admin account and the core
 * business profile, then signs the new admin in. Only permitted while the
 * install has no users at all, so it can never be used to add accounts later.
 */
export async function completeSetupAction(
    _prev: SetupActionState | undefined,
    formData: FormData,
): Promise<SetupActionState> {
    if (!isDatabaseConfigured()) {
        return { error: 'DATABASE_URL is not configured, so accounts cannot be created yet.' };
    }

    try {
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            return { error: 'Setup has already been completed. Sign in instead.' };
        }

        const name = ((formData.get('adminName') as string) || '').trim();
        const email = ((formData.get('adminEmail') as string) || '').trim().toLowerCase();
        const password = ((formData.get('adminPassword') as string) || '');
        const confirm = ((formData.get('adminPasswordConfirm') as string) || '');
        const businessName = ((formData.get('businessName') as string) || '').trim();
        const phoneDisplay = ((formData.get('phoneDisplay') as string) || '').trim();
        const businessEmail = ((formData.get('businessEmail') as string) || '').trim();
        const themePreset = ((formData.get('themePreset') as string) || '').trim();

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return { error: 'Enter a valid email address for the admin account.' };
        }
        if (password.length < 8) {
            return { error: 'The password must be at least 8 characters.' };
        }
        if (password !== confirm) {
            return { error: 'The passwords do not match.' };
        }
        if (!businessName) {
            return { error: 'Enter your business name.' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                password: hashedPassword,
                role: 'admin',
            },
        });

        await saveAppConfig({
            business: {
                name: businessName,
                phoneDisplay,
                email: businessEmail,
            },
            branding: {
                themePreset: getThemePreset(themePreset)?.id ?? 'classic-indigo',
                defaultAppearance: 'system',
            },
        });

        revalidatePath('/', 'layout');
    } catch (error) {
        console.error('completeSetupAction', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { error: `Setup failed: ${message}` };
    }

    // Sign the new admin straight in (throws a redirect on success).
    try {
        await signIn('credentials', {
            email: ((formData.get('adminEmail') as string) || '').trim().toLowerCase(),
            password: (formData.get('adminPassword') as string) || '',
            redirectTo: '/admin',
        });
    } catch (error) {
        // Rethrows the success redirect; anything else falls through.
        unstable_rethrow(error);
        // Account exists; if auto sign-in hiccups, the sign-in page works.
        return { error: 'Your account was created — please sign in.' };
    }
    return {};
}
