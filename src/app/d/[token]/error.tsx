'use client';

import { Button } from '@radix-ui/themes';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import StatusPage from '@/components/ui/StatusPage';

export default function SharedDocumentError({ reset }: { error: Error; reset: () => void }) {
    return (
        <div className="look-canvas" style={{ minHeight: '100dvh' }}>
            <StatusPage
                icon={<TriangleAlert size={26} />}
                title="We couldn't load this document"
                description="This is usually temporary. Please try again in a moment."
                actions={<Button size="3" onClick={reset}><RotateCcw size={16} /> Try again</Button>}
            />
        </div>
    );
}
