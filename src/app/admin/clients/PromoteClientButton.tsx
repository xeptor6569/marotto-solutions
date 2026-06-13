'use client';

import { Button } from '@radix-ui/themes';
import { UserCheck } from 'lucide-react';
import { useState } from 'react';
import { promoteClientToFull } from './actions';
import { useRouter } from 'next/navigation';

export default function PromoteClientButton({
    clientId,
    clientName,
    size = '2',
    fullWidth = false,
}: {
    clientId: string;
    clientName: string;
    size?: '1' | '2' | '3';
    fullWidth?: boolean;
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePromote = async () => {
        setLoading(true);
        const result = await promoteClientToFull(clientId);
        setLoading(false);
        if (result.success) {
            router.refresh();
        }
    };

    return (
        <Button
            size={size}
            variant="soft"
            color="green"
            onClick={handlePromote}
            loading={loading}
            disabled={loading}
            style={fullWidth ? { width: '100%' } : undefined}
            title={`Mark ${clientName} as a full client`}
        >
            <UserCheck size={14} /> Mark as client
        </Button>
    );
}
