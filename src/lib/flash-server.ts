import { cookies } from 'next/headers';
import { FLASH_COOKIE, FLASH_MAX_AGE_SECONDS, serializeFlash, type FlashTone } from './flash';

/**
 * Queue a toast for the page a server action redirects to. Call right before
 * `redirect()`. The cookie is readable by client JS on purpose — it only
 * carries display text and is cleared as soon as it is shown.
 */
export async function setFlash(message: string, tone: FlashTone = 'success', description?: string) {
    const store = await cookies();
    store.set(FLASH_COOKIE, serializeFlash({ message, tone, description }), {
        path: '/',
        maxAge: FLASH_MAX_AGE_SECONDS,
        sameSite: 'lax',
        httpOnly: false,
    });
}
