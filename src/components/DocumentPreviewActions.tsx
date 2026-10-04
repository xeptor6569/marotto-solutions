'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Box, Button, Dialog, DropdownMenu, Flex, IconButton } from '@radix-ui/themes';
import { MoreHorizontal, Pencil } from 'lucide-react';
import DeleteDocumentButton from '@/components/DeleteDocumentButton';

/**
 * Document page toolbar: one primary action chosen for the document's state
 * (send a draft, chase an unpaid invoice, convert an approved quote, or save
 * a finished one as PDF), a couple of secondaries, and everything else under
 * More (a bottom sheet on phones).
 */
export default function DocumentPreviewActions({
    editHref,
    docTitle,
    documentId,
    deleteRedirectTo,
    canDelete,
    primary,
    secondary,
    overflow,
    overflowPrint,
}: {
    editHref?: string;
    docTitle: string;
    documentId: string;
    deleteRedirectTo?: string;
    canDelete: boolean;
    /** The one solid action for this state. */
    primary: ReactNode;
    /** Always-visible soft actions next to it (e.g. email, copy link). */
    secondary?: ReactNode;
    /** Less frequent actions: deposit, convert, save as preset. */
    overflow?: ReactNode[];
    overflowPrint?: ReactNode;
}) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const extra = (overflow ?? []).filter(Boolean);
    const hasOverflow = extra.length > 0 || Boolean(overflowPrint) || canDelete;

    return (
        <>
            <Flex gap="2" className="doc-toolbar-actions" wrap="wrap" align="center">
                {editHref ? (
                    <Button asChild variant="soft" color="gray" style={{ minHeight: 40 }}>
                        <Link href={editHref}><Pencil size={14} /> Edit</Link>
                    </Button>
                ) : null}
                <span className="doc-toolbar-secondary">{secondary}</span>
                {primary}

                {hasOverflow ? (
                    <Box className="doc-actions-desktop-overflow">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                <IconButton variant="soft" color="gray" style={{ minHeight: 40, minWidth: 40 }} aria-label="More actions">
                                    <MoreHorizontal size={16} />
                                </IconButton>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end" style={{ minWidth: 240 }}>
                                {extra.map((node, index) => (
                                    <DropdownMenu.Item key={index} asChild onSelect={(e) => e.preventDefault()}>
                                        <Box p="1" className="doc-overflow-item">{node}</Box>
                                    </DropdownMenu.Item>
                                ))}
                                {overflowPrint ? (
                                    <DropdownMenu.Item asChild onSelect={(e) => e.preventDefault()}>
                                        <Flex p="1" gap="2" className="doc-overflow-item">{overflowPrint}</Flex>
                                    </DropdownMenu.Item>
                                ) : null}
                                {canDelete ? (
                                    <>
                                        <DropdownMenu.Separator />
                                        <Box p="2">
                                            <DeleteDocumentButton
                                                documentId={documentId}
                                                documentLabel={docTitle}
                                                redirectTo={deleteRedirectTo}
                                                fullWidth
                                            />
                                        </Box>
                                    </>
                                ) : null}
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </Box>
                ) : null}

                {hasOverflow ? (
                    <Box className="doc-actions-mobile-more">
                        <IconButton
                            type="button"
                            variant="soft"
                            color="gray"
                            style={{ minHeight: 40, minWidth: 40 }}
                            onClick={() => setSheetOpen(true)}
                            aria-label="More actions"
                        >
                            <MoreHorizontal size={16} />
                        </IconButton>
                    </Box>
                ) : null}
            </Flex>

            <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
                <Dialog.Content className="bottom-sheet" aria-describedby={undefined}>
                    <div className="bottom-sheet-handle" aria-hidden />
                    <Dialog.Title size="3">{docTitle} {documentId}</Dialog.Title>
                    <Flex direction="column" gap="2" mt="3" className="bottom-sheet-actions">
                        {secondary}
                        {extra}
                        {overflowPrint ? <Flex gap="2" className="bottom-sheet-row">{overflowPrint}</Flex> : null}
                        {canDelete ? (
                            <DeleteDocumentButton
                                documentId={documentId}
                                documentLabel={docTitle}
                                redirectTo={deleteRedirectTo}
                                fullWidth
                            />
                        ) : null}
                        <Dialog.Close>
                            <Button variant="soft" color="gray" style={{ minHeight: 44 }}>
                                Close
                            </Button>
                        </Dialog.Close>
                    </Flex>
                </Dialog.Content>
            </Dialog.Root>
        </>
    );
}
