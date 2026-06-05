'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Callout, Card, Flex, Text, TextArea, TextField } from '@radix-ui/themes';
import { XCircle } from 'lucide-react';
import { createClient, type ClientFormData } from './actions';
import { formatPhoneInput } from '@/lib/phone-format';

export default function ClientPageForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<ClientFormData>({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await createClient(formData);

        if (result.success) {
            router.push('/admin/clients');
            router.refresh();
            return;
        }

        setLoading(false);
        setError(result.error || 'Failed to create client');
    };

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="3">
                    {error ? (
                        <Callout.Root color="red">
                            <Callout.Icon><XCircle size={16} /></Callout.Icon>
                            <Callout.Text>{error}</Callout.Text>
                        </Callout.Root>
                    ) : null}

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
                        <Text as="div" size="2" mb="1" weight="bold">Email</Text>
                        <TextField.Root
                            type="email"
                            placeholder="client@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </label>

                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">Phone</Text>
                        <TextField.Root
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={formData.phone}
                            onChange={(e) =>
                                setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })
                            }
                            inputMode="tel"
                            autoComplete="tel"
                        />
                    </label>

                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">Address</Text>
                        <TextArea
                            placeholder="Street address, city, state..."
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={3}
                        />
                    </label>

                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">Notes</Text>
                        <TextArea
                            placeholder="Additional notes..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </label>

                    <Flex gap="3" mt="2" justify="end">
                        <Button variant="soft" color="gray" type="button" onClick={() => router.push('/admin/clients')}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            Create client
                        </Button>
                    </Flex>
                </Flex>
            </form>
        </Card>
    );
}
