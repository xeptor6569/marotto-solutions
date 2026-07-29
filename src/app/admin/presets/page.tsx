import Link from 'next/link';
import { Badge, Box, Button, Callout, Card, Container, Flex, Table, Text } from '@radix-ui/themes';
import { Plus, XCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';
import AdminListPageHeader from '@/components/AdminListPageHeader';
import EmptyState from '@/components/EmptyState';
import { DOC_LABEL } from '@/lib/document-labels';
import { listPresets } from '@/lib/presets';
import { requireAdminPage } from '@/lib/require-admin-session';

export default async function AdminPresetsPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string }>;
}) {
    await requireAdminPage('/admin/presets');
    const params = (await searchParams) || {};
    const presets = await listPresets();
    const error = params.error;

    return (
        <Container size="4" p={{ initial: '3', sm: '5' }}>
            <AdminListPageHeader
                title="Document presets"
                actions={(
                    <>
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/presets/create"><Plus size={14} /> New preset</Link>
                        </Button>
                        <BackButton href="/admin" />
                    </>
                )}
            />

            <Text size="2" color="gray" mb="3" as="p">
                Reusable line-item blueprints for new invoices, estimates, quotes, and receipts.
                Presets do not include a client — pick the customer when you create the document.
            </Text>

            {error ? (
                <Callout.Root color="red" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            ) : null}

            {presets.length === 0 ? (
                <EmptyState
                    title="No presets yet"
                    description="Save common jobs (like weekly lawn mowing) so you can fill new documents in one click."
                    action={(
                        <Button asChild size="2" variant="solid">
                            <Link href="/admin/presets/create"><Plus size={14} /> Create first preset</Link>
                        </Button>
                    )}
                />
            ) : (
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                    <Box style={{ overflowX: 'auto' }}>
                        <Table.Root style={{ minWidth: 720 }}>
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Types</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell>Lines</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell align="right">Subtotal</Table.ColumnHeaderCell>
                                    <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {presets.map((preset) => {
                                    const subtotal = preset.lineItems.reduce((acc, item) => acc + item.total, 0);
                                    return (
                                        <Table.Row key={preset.id}>
                                            <Table.Cell>
                                                <Text weight="medium">{preset.name}</Text>
                                                {preset.title ? (
                                                    <Text as="div" size="1" color="gray">{preset.title}</Text>
                                                ) : null}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Flex gap="1" wrap="wrap">
                                                    {preset.documentTypes.length === 0 ? (
                                                        <Badge color="gray">All types</Badge>
                                                    ) : (
                                                        preset.documentTypes.map((type) => (
                                                            <Badge key={type} color="blue">{DOC_LABEL[type]}</Badge>
                                                        ))
                                                    )}
                                                </Flex>
                                            </Table.Cell>
                                            <Table.Cell>{preset.lineItems.length}</Table.Cell>
                                            <Table.Cell align="right">${subtotal.toFixed(2)}</Table.Cell>
                                            <Table.Cell>
                                                <Button asChild size="1" variant="soft">
                                                    <Link href={`/admin/presets/${preset.id}/edit`}>Edit</Link>
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                </Card>
            )}
        </Container>
    );
}
