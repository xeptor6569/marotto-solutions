'use client';

import { useState, useTransition } from 'react';
import { Button, Callout, Flex, Text } from '@radix-ui/themes';
import { Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { runContractSchedulerAction, type RunSchedulerResult } from '@/app/admin/contracts/actions';

export default function RunSchedulerButton() {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [result, setResult] = useState<RunSchedulerResult | null>(null);

    const handleRun = () => {
        setResult(null);
        startTransition(async () => {
            const r = await runContractSchedulerAction();
            setResult(r);
            if (r.success) {
                router.refresh();
            }
        });
    };

    return (
        <Flex direction="column" gap="2" style={{ minWidth: 220 }}>
            <Button onClick={handleRun} loading={pending} variant="soft">
                <Play size={14} /> Run scheduler now
            </Button>
            {result ? (
                <Callout.Root size="1" color={result.success ? (result.errors && result.errors.length ? 'amber' : 'green') : 'red'}>
                    <Callout.Icon>
                        {result.success
                            ? (result.errors && result.errors.length ? <AlertCircle size={14} /> : <CheckCircle size={14} />)
                            : <XCircle size={14} />}
                    </Callout.Icon>
                    <Callout.Text>
                        {result.success ? (
                            <>
                                <Text as="div">
                                    Issued {result.issuedCount ?? 0} invoice(s) from {result.contractsConsidered ?? 0} due contract(s).
                                </Text>
                                {result.skipped && result.skipped.length ? (
                                    <Text as="div" size="1" color="gray">
                                        {result.skipped.length} skipped — see contract pages for details.
                                    </Text>
                                ) : null}
                                {result.errors && result.errors.length ? (
                                    <Text as="div" size="1" color="red">
                                        {result.errors.length} error(s); see server logs.
                                    </Text>
                                ) : null}
                            </>
                        ) : (
                            <Text>{result.error || 'Scheduler run failed.'}</Text>
                        )}
                    </Callout.Text>
                </Callout.Root>
            ) : null}
        </Flex>
    );
}
