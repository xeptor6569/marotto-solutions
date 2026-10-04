'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, Code, Text } from '@radix-ui/themes';
import { Activity, RotateCcw, TriangleAlert } from 'lucide-react';
import StatusPage from '@/components/ui/StatusPage';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <StatusPage
            icon={<TriangleAlert size={26} />}
            eyebrow="Something went wrong"
            title="This page hit a snag"
            description="Nothing you entered was lost on our side. Try again, and if it keeps happening, the System page shows whether storage, the database, and email are reachable."
            actions={(
                <>
                    <Button size="3" onClick={reset}><RotateCcw size={16} /> Try again</Button>
                    <Button asChild size="3" variant="soft" color="gray">
                        <Link href="/admin/system"><Activity size={16} /> Check system status</Link>
                    </Button>
                </>
            )}
        >
            {error.message || error.digest ? (
                <Text size="1" color="gray" align="center" className="status-page-detail">
                    {error.message ? <>{error.message} </> : null}
                    {error.digest ? <Code variant="ghost" size="1">ref {error.digest}</Code> : null}
                </Text>
            ) : null}
        </StatusPage>
    );
}
