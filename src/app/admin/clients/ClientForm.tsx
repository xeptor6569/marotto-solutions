'use client';

import { Dialog, Flex, TextField, TextArea, Button, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { createClient, updateClient, type ClientFormData } from './actions';

interface ClientFormProps {
    client?: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        notes: string | null;
    };
    onSuccess?: () => void;
    trigger: React.ReactNode;
}

export default function ClientForm({ client, onSuccess, trigger }: ClientFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ClientFormData>({
        name: client?.name || '',
        email: client?.email || '',
        phone: client?.phone || '',
        address: client?.address || '',
        notes: client?.notes || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = client
            ? await updateClient(client.id, formData)
            : await createClient(formData);

        setLoading(false);

        if (result.success) {
            setOpen(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                notes: '',
            });
            onSuccess?.();
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger>{trigger}</Dialog.Trigger>

            <Dialog.Content style={{ maxWidth: 500 }}>
                <Dialog.Title>{client ? 'Edit Client' : 'Add New Client'}</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    {client ? 'Update client information' : 'Enter the new client details below'}
                </Dialog.Description>

                <form onSubmit={handleSubmit}>
                    <Flex direction="column" gap="3">
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Name <Text as="span" color="red">*</Text>
                            </Text>
                            <TextField.Root
                                placeholder="Client name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Email
                            </Text>
                            <TextField.Root
                                type="email"
                                placeholder="client@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Phone
                            </Text>
                            <TextField.Root
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Address
                            </Text>
                            <TextArea
                                placeholder="Street address, city, state..."
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                            />
                        </label>

                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Notes
                            </Text>
                            <TextArea
                                placeholder="Additional notes..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                            />
                        </label>

                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray" type="button">
                                    Cancel
                                </Button>
                            </Dialog.Close>
                            <Button type="submit" loading={loading}>
                                {client ? 'Update Client' : 'Add Client'}
                            </Button>
                        </Flex>
                    </Flex>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    );
}
