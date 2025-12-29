'use client';

import { Button, Card, Flex, Text, TextArea, TextField, Select } from "@radix-ui/themes";
import { submitQuoteRequest } from "../actions";
import { useFormStatus } from "react-dom";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="3" disabled={pending}>
            {pending ? 'Submitting...' : 'Request Quote'}
        </Button>
    );
}

export default function QuoteForm() {
    return (
        <Card size="3">
            <form action={submitQuoteRequest}>
                <Flex direction="column" gap="4">
                    <Text size="4" weight="bold">Request a Quote</Text>

                    <Flex direction="column" gap="2">
                        <Text as="label" size="2" weight="bold">Your Name</Text>
                        <TextField.Root name="name" placeholder="John Doe" required />
                    </Flex>

                    <Flex direction="column" gap="2">
                        <Text as="label" size="2" weight="bold">Email Address</Text>
                        <TextField.Root name="email" type="email" placeholder="john@example.com" required />
                    </Flex>

                    <Flex direction="column" gap="2">
                        <Text as="label" size="2" weight="bold">Service Needed</Text>
                        <Select.Root name="service" defaultValue="general">
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value="general">General Contracting</Select.Item>
                                <Select.Item value="it">IT / Networking</Select.Item>
                                <Select.Item value="pc">PC Building</Select.Item>
                                <Select.Item value="programming">Programming / Dev</Select.Item>
                                <Select.Item value="other">Other</Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Flex>

                    <Flex direction="column" gap="2">
                        <Text as="label" size="2" weight="bold">Preferred Schedule (Optional)</Text>
                        <TextField.Root name="date" placeholder="e.g. Next week, or specific date" />
                    </Flex>

                    <Flex direction="column" gap="2">
                        <Text as="label" size="2" weight="bold">Project Details</Text>
                        <TextArea name="details" placeholder="Describe your project..." required style={{ minHeight: 120 }} />
                    </Flex>

                    <SubmitButton />
                </Flex>
            </form>
        </Card>
    );
}
