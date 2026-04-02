'use client';

import { Flex, Button } from '@radix-ui/themes';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackButton({ href = '/admin' }: { href?: string }) {
    const router = useRouter();

    return (
        <Button
            variant="soft"
            size="2"
            onClick={() => href ? router.push(href) : router.back()}
        >
            <ArrowLeft size={16} /> Back
        </Button>
    );
}
