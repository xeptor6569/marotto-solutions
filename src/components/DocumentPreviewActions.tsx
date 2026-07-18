'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Box, Button, Dialog, DropdownMenu, Flex } from '@radix-ui/themes';
import { MoreHorizontal } from 'lucide-react';
import DeleteDocumentButton from '@/components/DeleteDocumentButton';

export default function DocumentPreviewActions({
    editHref,
    docTitle,
    documentId,
    deleteRedirectTo,
    canDelete,
    primaryEmail,
    primaryShare,
    overflowDeposit,
    overflowConvert,
    overflowPrint,
}: {
    editHref?: string;
    docTitle: string;
    documentId: string;
    deleteRedirectTo?: string;
    canDelete: boolean;
    primaryEmail: ReactNode;
    primaryShare: ReactNode;
    overflowDeposit?: ReactNode;
    overflowConvert?: ReactNode;
    overflowPrint: ReactNode;
}) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const hasOverflow = Boolean(overflowDeposit || overflowConvert || canDelete);

    return (
        <>
            <Flex gap="2" className="doc-toolbar-actions doc-toolbar-actions-primary" wrap="wrap">
                {editHref ? (
                    <Button asChild variant="soft" style={{ minHeight: 44 }}>
                        <Link href={editHref}>Edit {docTitle}</Link>
                    </Button>
                ) : null}
                {primaryEmail}
                {primaryShare}

                {/* Desktop overflow */}
                {hasOverflow ? (
                    <Box className="doc-actions-desktop-overflow">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                <Button variant="soft" style={{ minHeight: 44, minWidth: 44 }} aria-label="More actions">
                                    <MoreHorizontal size={16} />
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end">
                                {overflowDeposit ? (
                                    <DropdownMenu.Item asChild onSelect={(e) => e.preventDefault()}>
                                        <Box p="1">{overflowDeposit}</Box>
                                    </DropdownMenu.Item>
                                ) : null}
                                {overflowConvert ? (
                                    <DropdownMenu.Item asChild onSelect={(e) => e.preventDefault()}>
                                        <Box p="1">{overflowConvert}</Box>
                                    </DropdownMenu.Item>
                                ) : null}
                                <DropdownMenu.Item asChild onSelect={(e) => e.preventDefault()}>
                                    <Box p="1">{overflowPrint}</Box>
                                </DropdownMenu.Item>
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
                ) : (
                    <Box className="doc-actions-desktop-overflow">{overflowPrint}</Box>
                )}

                {/* Mobile: More opens bottom sheet */}
                <Box className="doc-actions-mobile-more">
                    <Button
                        type="button"
                        variant="soft"
                        style={{ minHeight: 44 }}
                        onClick={() => setSheetOpen(true)}
                    >
                        <MoreHorizontal size={16} /> More
                    </Button>
                </Box>
            </Flex>

            <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
                <Dialog.Content
                    className="doc-actions-sheet"
                    style={{
                        position: 'fixed',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        top: 'auto',
                        maxWidth: '100%',
                        margin: 0,
                        borderRadius: '16px 16px 0 0',
                        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                    }}
                >
                    <Box
                        mb="3"
                        style={{
                            width: 40,
                            height: 4,
                            borderRadius: 999,
                            background: 'var(--gray-7)',
                            margin: '0 auto 12px',
                        }}
                    />
                    <Dialog.Title size="3">Actions</Dialog.Title>
                    <Flex direction="column" gap="2" mt="3">
                        {overflowDeposit}
                        {overflowConvert}
                        {overflowPrint}
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

            <style>{`
                .doc-actions-mobile-more {
                    display: none;
                }
                .doc-actions-desktop-overflow {
                    display: inline-flex;
                }
                @media (max-width: 768px) {
                    .doc-actions-mobile-more {
                        display: inline-flex;
                        flex: 1 1 calc(50% - 8px);
                    }
                    .doc-actions-desktop-overflow {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    );
}
