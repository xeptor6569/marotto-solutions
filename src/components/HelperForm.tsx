'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    Callout,
    Card,
    Flex,
    Heading,
    Text,
    TextArea,
    TextField,
} from '@radix-ui/themes';
import { SaveIcon, XCircle } from 'lucide-react';
import {
    createHelperFormAction,
    updateHelperFormAction,
} from '@/app/admin/helpers/actions';
import type { HelperRecord } from '@/lib/helpers';
import { formatPhoneInput } from '@/lib/phone-format';

export default function HelperForm({
    initialData,
    error,
}: {
    initialData?: HelperRecord;
    error?: string;
}) {
    const isEdit = !!initialData;
    const [name, setName] = useState(initialData?.name || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [phone, setPhone] = useState(() => formatPhoneInput(initialData?.phone || ''));
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [active, setActive] = useState(initialData?.active ?? true);

    const action = isEdit ? updateHelperFormAction : createHelperFormAction;

    return (
        <form action={action}>
            {isEdit ? <input type="hidden" name="helperId" value={initialData.id} /> : null}
            <input type="hidden" name="active" value={active ? 'true' : 'false'} />

            {error ? (
                <Callout.Root color="red" mb="3">
                    <Callout.Icon><XCircle size={16} /></Callout.Icon>
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            ) : null}

            <Card>
                <Heading size="3" mb="3">{isEdit ? 'Helper details' : 'New helper'}</Heading>
                <Flex direction="column" gap="3">
                    <Box>
                        <Text as="label" size="2" weight="medium">Name</Text>
                        <TextField.Root
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Helper name"
                            required
                            mt="1"
                        />
                    </Box>
                    <Box>
                        <Text as="label" size="2" weight="medium">Email (optional)</Text>
                        <TextField.Root
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="helper@example.com"
                            mt="1"
                        />
                    </Box>
                    <Box>
                        <Text as="label" size="2" weight="medium">Phone (optional)</Text>
                        <TextField.Root
                            name="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                            placeholder="(555) 123-4567"
                            mt="1"
                        />
                    </Box>
                    <Box>
                        <Text as="label" size="2" weight="medium">Notes (optional)</Text>
                        <TextArea
                            name="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            mt="1"
                            placeholder="Pay rate, availability, etc."
                        />
                    </Box>
                    {isEdit ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
                            <input
                                type="checkbox"
                                checked={active}
                                onChange={(e) => setActive(e.target.checked)}
                            />
                            <Text size="2">Active helper</Text>
                        </label>
                    ) : null}
                    <Flex justify="end">
                        <Button type="submit" size="3" style={{ minHeight: 44 }}>
                            <SaveIcon size={16} />
                            {isEdit ? 'Save helper' : 'Add helper'}
                        </Button>
                    </Flex>
                </Flex>
            </Card>
        </form>
    );
}
