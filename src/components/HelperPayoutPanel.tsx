'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    Card,
    Flex,
    Heading,
    Text,
    TextArea,
    TextField,
} from '@radix-ui/themes';
import Link from 'next/link';
import {
    createHelperPayoutAction,
    deleteHelperPayoutAction,
} from '@/app/admin/helpers/actions';
import {
    formatPayoutPaidAt,
    sumPayoutAmounts,
    type HelperPayoutRecord,
} from '@/lib/helper-payouts';
import type { HelperOption } from '@/lib/helpers';
import type { JobOption } from '@/lib/types';

const nativeSelectStyle = {
    width: '100%',
    marginTop: 6,
    borderRadius: 8,
    minHeight: 36,
    padding: '0 10px',
    fontSize: 16,
} as const;

export default function HelperPayoutPanel({
    mode,
    helperId,
    helperName,
    jobId,
    helpers = [],
    jobs = [],
    payouts,
}: {
    mode: 'helper' | 'job';
    helperId?: string;
    helperName?: string;
    jobId?: string;
    helpers?: HelperOption[];
    jobs?: JobOption[];
    payouts: HelperPayoutRecord[];
}) {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [paidAt, setPaidAt] = useState(() => new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedHelperId, setSelectedHelperId] = useState(helperId || '');
    const [selectedJobId, setSelectedJobId] = useState(jobId || '');
    const [error, setError] = useState('');
    const [pending, startTransition] = useTransition();

    const total = sumPayoutAmounts(payouts);

    const onRecord = () => {
        setError('');
        const resolvedHelperId = mode === 'helper' ? (helperId || '') : selectedHelperId;
        if (!resolvedHelperId) {
            setError('Select a helper.');
            return;
        }
        startTransition(async () => {
            const result = await createHelperPayoutAction({
                helperId: resolvedHelperId,
                amount: Number(amount),
                paidAt,
                method,
                notes,
                jobId: mode === 'job' ? jobId : (selectedJobId || undefined),
            });
            if (!result.success) {
                setError(result.error || 'Could not record payout.');
                return;
            }
            setAmount('');
            setNotes('');
            setMethod('');
            router.refresh();
        });
    };

    const onDelete = (payout: HelperPayoutRecord) => {
        setError('');
        startTransition(async () => {
            const result = await deleteHelperPayoutAction({
                id: payout.id,
                helperId: payout.helperId,
                jobId: payout.jobId || undefined,
            });
            if (!result.success) {
                setError(result.error || 'Could not delete payout.');
                return;
            }
            router.refresh();
        });
    };

    return (
        <Card>
            <Flex justify="between" align="center" gap="3" wrap="wrap" mb="3">
                <Heading size="4">
                    {mode === 'helper' ? `Payouts${helperName ? ` to ${helperName}` : ''}` : 'Helper payouts'}
                </Heading>
                <Text size="2" color="gray">Total paid: <Text weight="bold">${total.toFixed(2)}</Text></Text>
            </Flex>

            <Box
                mb="4"
                style={{
                    border: '1px solid var(--gray-a5)',
                    borderRadius: 12,
                    padding: 12,
                    background: 'var(--gray-a2)',
                }}
            >
                <Text as="div" size="2" weight="bold" mb="2">Record payout</Text>
                <Flex direction="column" gap="3">
                    {mode === 'job' ? (
                        <Box>
                            <Text as="label" size="2">Helper</Text>
                            <select
                                value={selectedHelperId}
                                onChange={(e) => setSelectedHelperId(e.target.value)}
                                style={nativeSelectStyle}
                            >
                                <option value="">Select helper…</option>
                                {helpers.map((helper) => (
                                    <option key={helper.id} value={helper.id}>
                                        {helper.name}{helper.active ? '' : ' (inactive)'}
                                    </option>
                                ))}
                            </select>
                        </Box>
                    ) : null}
                    <Flex gap="3" wrap="wrap">
                        <Box style={{ flex: '1 1 120px' }}>
                            <Text as="label" size="2">Amount</Text>
                            <TextField.Root
                                type="number"
                                inputMode="decimal"
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                mt="1"
                            />
                        </Box>
                        <Box style={{ flex: '1 1 140px' }}>
                            <Text as="label" size="2">Date</Text>
                            <TextField.Root
                                type="date"
                                value={paidAt}
                                onChange={(e) => setPaidAt(e.target.value)}
                                mt="1"
                            />
                        </Box>
                        <Box style={{ flex: '1 1 140px' }}>
                            <Text as="label" size="2">Method (optional)</Text>
                            <TextField.Root
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                placeholder="Cash, Zelle, check…"
                                mt="1"
                            />
                        </Box>
                    </Flex>
                    {mode === 'helper' && jobs.length > 0 ? (
                        <Box>
                            <Text as="label" size="2">Link to job (optional)</Text>
                            <select
                                value={selectedJobId}
                                onChange={(e) => setSelectedJobId(e.target.value)}
                                style={nativeSelectStyle}
                            >
                                <option value="">No linked job</option>
                                {jobs.map((job) => (
                                    <option key={job.id} value={job.id}>{job.name}</option>
                                ))}
                            </select>
                        </Box>
                    ) : null}
                    <Box>
                        <Text as="label" size="2">Notes (optional)</Text>
                        <TextArea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            mt="1"
                            placeholder="What the payout was for"
                        />
                    </Box>
                    {error ? <Text size="2" color="red" role="alert">{error}</Text> : null}
                    <Button type="button" onClick={onRecord} loading={pending} style={{ minHeight: 44, alignSelf: 'flex-start' }}>
                        Record payout
                    </Button>
                </Flex>
            </Box>

            {payouts.length === 0 ? (
                <Text size="2" color="gray">No payouts recorded yet.</Text>
            ) : (
                <Flex direction="column" gap="2">
                    {payouts.map((payout) => (
                        <Flex
                            key={payout.id}
                            justify="between"
                            align="start"
                            gap="3"
                            wrap="wrap"
                            style={{
                                borderBottom: '1px solid var(--gray-a4)',
                                paddingBottom: 10,
                            }}
                        >
                            <Box style={{ minWidth: 0, flex: 1 }}>
                                <Text as="div" weight="bold">${Number(payout.amount).toFixed(2)}</Text>
                                <Text as="div" size="1" color="gray">
                                    {formatPayoutPaidAt(payout.paidAt)}
                                    {payout.method ? ` · ${payout.method}` : ''}
                                </Text>
                                {mode === 'job' && payout.helper ? (
                                    <Text as="div" size="2">
                                        <Link href={`/admin/helpers/${payout.helper.id}`} style={{ color: 'var(--accent-11)' }}>
                                            {payout.helper.name}
                                        </Link>
                                    </Text>
                                ) : null}
                                {mode === 'helper' && payout.job ? (
                                    <Text as="div" size="2">
                                        Job:{' '}
                                        <Link href={`/admin/jobs/${payout.job.id}`} style={{ color: 'var(--accent-11)' }}>
                                            {payout.job.name}
                                        </Link>
                                    </Text>
                                ) : null}
                                {payout.notes ? (
                                    <Text as="div" size="2" color="gray" style={{ whiteSpace: 'pre-line' }}>
                                        {payout.notes}
                                    </Text>
                                ) : null}
                            </Box>
                            <Button
                                type="button"
                                size="1"
                                variant="soft"
                                color="red"
                                disabled={pending}
                                onClick={() => onDelete(payout)}
                            >
                                Delete
                            </Button>
                        </Flex>
                    ))}
                </Flex>
            )}
        </Card>
    );
}
