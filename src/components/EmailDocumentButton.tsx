'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Dialog, Flex, Text, TextArea, TextField } from '@radix-ui/themes';
import { Mail, Send } from 'lucide-react';
import { sendDocumentEmailAction, type EmailDocumentState } from '@/app/email-document-action';
import { useToast } from '@/components/ui/Toaster';

const initialState: EmailDocumentState = { success: false };

function EmailSendFields({
    documentId,
    sharePath,
    docTitle,
    defaultTo,
    showServerSend,
    pendingApprovalSummary,
    businessName,
    onClose,
}: {
    documentId: string;
    sharePath: string;
    docTitle: string;
    defaultTo?: string;
    showServerSend: boolean;
    /** Mirrors server email: extra line when document has line items pending approval. */
    pendingApprovalSummary?: string;
    businessName?: string;
    onClose: () => void;
}) {
    const [state, formAction, isPending] = useActionState(sendDocumentEmailAction, initialState);
    const [to, setTo] = useState(defaultTo || '');
    const [message, setMessage] = useState('');
    const toast = useToast();

    // Reset fields when the target recipient changes (render-time adjustment
    // instead of a cascading setState-in-effect).
    const [lastDefaultTo, setLastDefaultTo] = useState(defaultTo);
    if (lastDefaultTo !== defaultTo) {
        setLastDefaultTo(defaultTo);
        setTo(defaultTo || '');
        setMessage('');
    }

    useEffect(() => {
        if (!state.success) return;
        toast({ title: `${docTitle} ${documentId} sent`, description: to.trim() ? `Emailed to ${to.trim()}` : undefined });
        onClose();
        // Only react to a new successful result, not to typing in the form.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    const viewUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        return new URL(sharePath, window.location.origin).href;
    }, [sharePath]);

    const mailtoHref = useMemo(() => {
        const subject = businessName
            ? `${businessName} — ${docTitle} ${documentId}`
            : `${docTitle} ${documentId}`;
        const body = [
            'Hi,',
            '',
            ...(pendingApprovalSummary ? [`${pendingApprovalSummary}`, ''] : []),
            `View your ${docTitle}: ${viewUrl || '(copy the link from the browser address bar)'}`,
            '',
            'Thank you,',
        ].join('\n');
        const params = new URLSearchParams({ subject, body });
        const addr = to.trim();
        return addr ? `mailto:${addr}?${params}` : `mailto:?${params}`;
    }, [businessName, docTitle, documentId, pendingApprovalSummary, to, viewUrl]);

    return (
        <>
            {state.error ? (
                <Text size="2" color="red" mb="3" as="p">
                    {state.error}
                </Text>
            ) : null}

            <Flex direction="column" gap="3">
                <BoxLabel label="To">
                    <TextField.Root
                        type="email"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="customer@example.com"
                    />
                </BoxLabel>
                <BoxLabel label="Message (optional)">
                    <TextArea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Short note to include above the link..."
                        rows={3}
                    />
                </BoxLabel>
                <Flex gap="2" wrap="wrap" mt="2" align="center">
                    {showServerSend ? (
                        <form action={formAction}>
                            <input type="hidden" name="documentId" value={documentId} />
                            <input type="hidden" name="to" value={to} />
                            <input type="hidden" name="message" value={message} />
                            <Button type="submit" loading={isPending} disabled={state.success || !to.trim()}>
                                <Send size={14} /> Send email
                            </Button>
                        </form>
                    ) : null}
                    <Button type="button" variant="soft" asChild>
                        <a href={mailtoHref}>Open in email app</a>
                    </Button>
                </Flex>
            </Flex>
        </>
    );
}

export default function EmailDocumentButton({
    documentId,
    sharePath,
    docTitle,
    defaultTo,
    canSendViaServer,
    serverEmailConfigured,
    pendingApprovalSummary,
    businessName,
}: {
    documentId: string;
    sharePath: string;
    docTitle: string;
    defaultTo?: string;
    canSendViaServer: boolean;
    serverEmailConfigured: boolean;
    pendingApprovalSummary?: string;
    businessName?: string;
}) {
    const [open, setOpen] = useState(false);
    const [panelKey, setPanelKey] = useState(0);
    const showServerSend = canSendViaServer && serverEmailConfigured;

    const handleOpenChange = (v: boolean) => {
        setOpen(v);
        if (v) setPanelKey((k) => k + 1);
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Trigger>
                <Button variant="soft" type="button">
                    <Mail size={16} /> Email {docTitle}
                </Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 480 }}>
                <Dialog.Title>Email {docTitle}</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    Send a link to this page so the customer can view or print the document.
                </Dialog.Description>

                <EmailSendFields
                    key={panelKey}
                    documentId={documentId}
                    sharePath={sharePath}
                    docTitle={docTitle}
                    defaultTo={defaultTo}
                    showServerSend={showServerSend}
                    pendingApprovalSummary={pendingApprovalSummary}
                    businessName={businessName}
                    onClose={() => setOpen(false)}
                />

                {!showServerSend ? (
                    <Text size="2" color="gray" mt="3" as="p">
                        {canSendViaServer
                            ? 'Set EMAIL_SERVER in the environment to send from the app.'
                            : 'Sign in to send from the app, or use “Open in email app” with your own mail program.'}
                    </Text>
                ) : null}
                <Flex justify="end" mt="4">
                    <Dialog.Close>
                        <Button variant="outline" type="button" color="gray">
                            Close
                        </Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}

function BoxLabel({ label, children }: { label: string; children: ReactNode }) {
    return (
        <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="bold">
                {label}
            </Text>
            {children}
        </Flex>
    );
}
