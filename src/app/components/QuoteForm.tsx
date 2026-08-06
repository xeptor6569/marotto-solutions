'use client';

import { Button, Card, Flex, Text, TextArea, TextField, Select } from "@radix-ui/themes";
import { submitQuoteRequest } from "../actions";
import { useFormStatus } from "react-dom";

export interface QuoteServiceOption {
    value: string;
    label: string;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="3" disabled={pending}>
            {pending ? 'Submitting...' : 'Request Quote'}
        </Button>
    );
}

export default function QuoteForm({
    defaultService,
    services = [],
}: {
    defaultService?: string;
    services?: QuoteServiceOption[];
}) {
    const options: QuoteServiceOption[] = [
        ...services.filter((s) => s.value && s.label),
        { value: 'other', label: 'Other' },
    ];
    const selectedService = options.some((s) => s.value === defaultService)
        ? (defaultService as string)
        : options[0].value;

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
                        <TextField.Root name="email" type="email" autoComplete="email" placeholder="john@example.com" required />
                    </Flex>

                    <Flex direction="column" gap="2">
                        <Text as="label" size="2" weight="bold">Phone Number</Text>
                        <TextField.Root
                            name="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="(555) 555-0123"
                            required
                        />
                    </Flex>

                    <Flex direction="column" gap="2">
                        <Text as="label" size="2" weight="bold">Service Needed</Text>
                        <Select.Root name="service" defaultValue={selectedService}>
                            <Select.Trigger />
                            <Select.Content>
                                {options.map((option) => (
                                    <Select.Item key={option.value} value={option.value}>
                                        {option.label}
                                    </Select.Item>
                                ))}
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
                    <Text size="1" color="gray">
                        We use your contact details only to respond to this request.
                    </Text>
                </Flex>
            </form>
        </Card>
    );
}
