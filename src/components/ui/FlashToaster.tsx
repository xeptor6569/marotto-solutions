'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { FLASH_COOKIE, readFlashFromCookieString } from '@/lib/flash';
import { useToast } from './Toaster';

/** Shows (then clears) a flash message queued by a server action before its redirect. */
export default function FlashToaster() {
    const toast = useToast();
    const pathname = usePathname();
    const search = useSearchParams().toString();

    useEffect(() => {
        const flash = readFlashFromCookieString(document.cookie);
        if (!flash) return;
        document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/; samesite=lax`;
        toast({ title: flash.message, description: flash.description, tone: flash.tone });
    }, [pathname, search, toast]);

    return null;
}
