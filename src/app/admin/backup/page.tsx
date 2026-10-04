'use client';

import { useState, useRef } from 'react';
import { Container, Heading, Card, Button, Flex, Text, Callout, Box, Separator, Badge } from '@radix-ui/themes';
import { Download, Upload, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { restoreBackupAction, type RestoreResult } from './actions';
import HelpLink from '@/components/HelpLink';
import HelpTip from '@/components/HelpTip';

export default function BackupPage() {
    const [restoring, setRestoring] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [result, setResult] = useState<RestoreResult | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleDownload = () => {
        window.location.href = '/api/backup';
    };

    const handleRestore = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!confirmOpen) {
            setConfirmOpen(true);
            return;
        }

        const formData = new FormData(e.currentTarget);
        setRestoring(true);
        setResult(null);
        setConfirmOpen(false);

        const res = await restoreBackupAction(formData);
        setResult(res);
        setRestoring(false);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleCancel = () => {
        setConfirmOpen(false);
    };

    return (
        <Container size="2" p="5">
            <Flex justify="between" align="center" mb="4" gap="2">
                <Heading>Backup & Restore</Heading>
                <Flex gap="2" align="center">
                    <HelpLink topic="storage-backups" />
                </Flex>
            </Flex>

            <Card mb="4">
                <Flex direction="column" gap="3">
                    <Heading size="4">Create Backup</Heading>
                    <Text as="p" size="2" color="gray">
                        Download a complete archive of all your business data, including clients, jobs, contracts,
                        documents, calendar events, attachments, and settings.
                    </Text>
                    <Flex gap="2" align="center">
                        <Text size="2" color="gray">Includes:</Text>
                        <Badge color="blue" variant="soft">Clients</Badge>
                        <Badge color="blue" variant="soft">Jobs</Badge>
                        <Badge color="blue" variant="soft">Contracts</Badge>
                        <Badge color="blue" variant="soft">Documents</Badge>
                        <Badge color="blue" variant="soft">Calendar</Badge>
                        <Badge color="blue" variant="soft">Settings</Badge>
                    </Flex>
                    <Callout.Root color="orange" mb="2">
                        <Callout.Icon><AlertTriangle size={16} /></Callout.Icon>
                        <Callout.Text>
                            Settings may contain sensitive values (WebDAV credentials, etc.). Store backup archives securely.
                        </Callout.Text>
                    </Callout.Root>
                    <Button onClick={handleDownload} size="3">
                        <Download size={16} /> Download Backup
                    </Button>
                </Flex>
            </Card>

            <Separator my="5" size="4" />

            <Card>
                <form onSubmit={handleRestore}>
                    <Flex direction="column" gap="4">
                        <Flex align="center" gap="1">
                            <Heading size="4">Restore from Backup</Heading>
                            <HelpTip title="What restore replaces" topic="storage-backups">
                                Everything in the archive overwrites what&apos;s here now: clients, jobs, contracts, calendar,
                                documents, attachments, settings, and logo. Sign-in accounts on this server are kept, so you
                                stay signed in. Download a fresh backup first if you might want the current data back.
                            </HelpTip>
                        </Flex>
                        <Text as="p" size="2" color="gray">
                            Upload a backup archive (the <code>.tar.gz</code> file downloaded above, e.g.{' '}
                            <code>app-backup-2026-….tar.gz</code>) to restore all data. This will replace ALL
                            existing data — clients, jobs, contracts, documents, calendar events, and settings.
                            Archives from earlier versions of the app restore too.
                        </Text>

                        <Box>
                            <Text as="label" size="2" weight="bold">Select backup archive (.tar.gz)</Text>
                            {/* Pickers key on the last extension (".gz") and iOS filters by MIME
                                type, so list all of them or the archive can appear greyed out. */}
                            <input
                                ref={fileRef}
                                type="file"
                                name="file"
                                accept=".tar.gz,.tgz,.gz,application/gzip,application/x-gzip,application/x-tar,application/x-compressed-tar"
                                required
                                style={{ display: 'block', marginTop: 5 }}
                            />
                        </Box>

                        {confirmOpen && (
                            <Callout.Root color="red">
                                <Callout.Icon><AlertTriangle size={16} /></Callout.Icon>
                                <Callout.Text>
                                    This will permanently replace ALL existing data with the contents of this backup.
                                    This cannot be undone. Are you sure?
                                </Callout.Text>
                                <Flex gap="2" mt="2">
                                    <Button type="submit" color="red" loading={restoring}>
                                        Yes, Restore Now
                                    </Button>
                                    <Button type="button" variant="soft" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                </Flex>
                            </Callout.Root>
                        )}

                        {!confirmOpen && (
                            <Button type="submit" disabled={restoring}>
                                <Upload size={16} /> Restore Backup
                            </Button>
                        )}

                        {result && (
                            <Callout.Root color={result.success ? 'green' : 'red'}>
                                <Callout.Icon>
                                    {result.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                </Callout.Icon>
                                {result.success && result.stats ? (
                                    <Callout.Text>
                                        Restore complete: {[
                                            `${result.stats.clients} clients`,
                                            result.stats.helpers ? `${result.stats.helpers} helpers` : '',
                                            `${result.stats.jobs} jobs`,
                                            `${result.stats.contracts} contracts`,
                                            `${result.stats.documents} documents`,
                                            `${result.stats.calendarEvents} events`,
                                            `${result.stats.attachmentsRestored} attachments`,
                                            result.stats.settingsRestored ? 'settings restored' : '',
                                            result.stats.brandingFilesRestored ? 'logo restored' : '',
                                            result.stats.presetsRestored ? `${result.stats.presetsRestored} presets` : '',
                                            result.stats.helperPayouts ? `${result.stats.helperPayouts} helper payouts` : '',
                                        ].filter(Boolean).join(', ')}.
                                        {result.stats.remoteStorageStripped
                                            ? ' The archive\u2019s WebDAV credentials were not applied because this is not a production instance — documents were restored to local storage so nothing here can touch the production document store.'
                                            : ''}
                                    </Callout.Text>
                                ) : (
                                    <Callout.Text>{result.error || 'Restore failed.'}</Callout.Text>
                                )}
                            </Callout.Root>
                        )}
                    </Flex>
                </form>
            </Card>

            <Separator my="5" size="4" />

            <Card>
                <Flex gap="3" align="start">
                    <Info size={20} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Box>
                        <Text as="p" size="2" weight="bold" mb="1">What is not included in backups</Text>
                        <Text as="p" size="2" color="gray">
                            Sign-in accounts, sessions, and tokens are not part of backups. Restoring keeps the
                            accounts that already exist on this server, so on a new server create an admin in the
                            setup wizard first, then restore. Documents stored on WebDAV are included in the archive;
                            on non-production instances they are restored to local storage.
                        </Text>
                    </Box>
                </Flex>
            </Card>
        </Container>
    );
}
