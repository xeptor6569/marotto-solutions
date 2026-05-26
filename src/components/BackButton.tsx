'use client';

import Link from 'next/link';
import { Button } from '@radix-ui/themes';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackButton({
    href = '/admin',
    label = 'Back',
}: {
    href?: string;
    label?: string;
}) {
    const router = useRouter();

    if (href) {
        return (
            <Button asChild variant="soft" size="2">
                <Link href={href}>
                    <ArrowLeft size={16} /> {label}
                </Link>
            </Button>
        );
    }

    return (
        <Button
            variant="soft"
            size="2"
            onClick={() => router.back()}
        >
            <ArrowLeft size={16} /> {label}
        </Button>
    );
}
