'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@radix-ui/themes';
import { RefreshCw } from 'lucide-react';

export default function RefreshButton({ label = 'Refresh' }: { label?: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    return (
        <Button
            variant="soft"
            size="2"
            loading={isPending}
            onClick={() => startTransition(() => router.refresh())}
        >
            <RefreshCw size={14} /> {label}
        </Button>
    );
}
