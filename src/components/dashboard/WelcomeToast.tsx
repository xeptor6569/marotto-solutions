'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toaster';

/** One-time greeting after the setup wizard; strips ?welcome=1 so a refresh doesn't repeat it. */
export default function WelcomeToast() {
    const toast = useToast();
    const router = useRouter();
    const shown = useRef(false);

    useEffect(() => {
        if (shown.current) return;
        shown.current = true;
        toast({
            title: 'Welcome aboard',
            description: 'Your workspace is ready. The checklist below walks you through the rest of setup.',
            tone: 'info',
            duration: 8000,
        });
        router.replace('/admin', { scroll: false });
    }, [toast, router]);

    return null;
}
