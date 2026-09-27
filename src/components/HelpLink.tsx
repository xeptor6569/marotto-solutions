import Link from 'next/link';
import { Button } from '@radix-ui/themes';
import { CircleHelp } from 'lucide-react';

/** Contextual deep link into the in-app manual. */
export default function HelpLink({ topic, label = 'Help' }: { topic: string; label?: string }) {
    return (
        <Button asChild variant="ghost" size="1" color="gray">
            <Link href={`/admin/help/${topic}`} aria-label={`Open help: ${label}`}>
                <CircleHelp size={14} /> {label}
            </Link>
        </Button>
    );
}
