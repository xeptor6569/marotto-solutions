'use client';

import { Dialog, Flex, TextField, TextArea, Button, Text, Callout } from '@radix-ui/themes';
import { XCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadAction } from '@/app/actions';
import { formatPhoneInput } from '@/lib/phone-format';
import type { DocumentData } from '@/lib/types';

interface LeadEditDialogProps {
    lead: DocumentData;
    trigger: React.ReactNode;
    onSuccess?: () => void;
}

export default function LeadEditDialog({ lead, trigger, onSuccess }: LeadEditDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState(lead.customer.name || '');
    const [email, setEmail] = useState(lead.customer.email || '');
    const [phone, setPhone] = useState(formatPhoneInput(lead.customer.phone || ''));
    const [address, setAddress] = useState(lead.customer.address || '');
    const [notes, setNotes] = useState(lead.notes || '');
    const [clientStage, setClientStage] = useState<'lead' | 'potential_client'>(
        lead.customer.clientStage === 'potential_client' ? 'potential_client' : 'lead',
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await updateLeadAction({
            id: lead.id,
            name,
            email,
            phone,
            address,
            notes,
            clientStage,
        });

        setLoading(false);

        if (result.success) {
            setOpen(false);
            onSuccess?.();
            router.refresh();
        } else {
            setError(result.error || 'Failed to update client');
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger>{trigger}</Dialog.Trigger>

            <Dialog.Content style={{ maxWidth: 500 }}>
                <Dialog.Title>Edit Client</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    Update {lead.id} details.
                </Dialog.Description>

                <form onSubmit={handleSubmit}>
                    <Flex direction="column" gap="3">
                        {error ? (
                            <Callout.Root color="red">
                                <Callout.Icon><XCircle size={16} /></Callout.Icon>
                                <Callout.Text>{error}</Callout.Text>
                            </Callout.Root>
                        ) : null}

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Client Stage</Text>
                            <select
                                value={clientStage}
                                onChange={(e) => setClientStage(e.target.value === 'potential_client' ? 'potential_client' : 'lead')}
                                style={{ width: '100%', minHeight: 36, borderRadius: 8, padding: '0 10px' }}
                            >
                                <option value="lead">Lead</option>
                                <option value="potential_client">Potential Client</option>
                            </select>
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Name <Text as="span" color="red">*</Text>
                            </Text>
                            <TextField.Root
                                placeholder="Contact name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Email</Text>
                            <TextField.Root
                                type="email"
                                placeholder="client@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Phone</Text>
                            <TextField.Root
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={phone}
                                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                                inputMode="tel"
                                autoComplete="tel"
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Address</Text>
                            <TextArea
                                placeholder="Street, city, state..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">Notes</Text>
                            <TextArea
                                placeholder="Project interest, follow-up, etc."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                            />
                        </label>

                        <Flex gap="3" mt="2" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray" type="button">
                                    Cancel
                                </Button>
                            </Dialog.Close>
                            <Button type="submit" loading={loading}>
                                Save changes
                            </Button>
                        </Flex>
                    </Flex>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    );
}
