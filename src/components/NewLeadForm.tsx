'use client';

import { Card, Flex, Heading, Text, TextField, TextArea, Button, Box } from "@radix-ui/themes";
import { createLeadAction } from "@/app/actions";

export default function NewLeadForm() {
    return (
        <form action={createLeadAction}>
            <Flex direction="column" gap="4">
                <Card>
                    <Heading size="4" mb="3">Client details</Heading>
                    <Flex direction="column" gap="3">
                        <Box>
                            <Text as="label" size="2" weight="medium">Client Stage</Text>
                            <select
                                name="clientStage"
                                defaultValue="lead"
                                style={{ width: "100%", marginTop: 6, borderRadius: 8, minHeight: 36, padding: "0 10px" }}
                            >
                                <option value="lead">Lead</option>
                                <option value="potential_client">Potential Client</option>
                            </select>
                        </Box>
                        <Box>
                            <Text as="label" size="2" weight="medium">Name</Text>
                            <TextField.Root name="name" placeholder="Contact name" required mt="1" />
                        </Box>
                        <Box>
                            <Text as="label" size="2" weight="medium">Email</Text>
                            <TextField.Root name="email" type="email" placeholder="email@example.com" mt="1" />
                        </Box>
                        <Box>
                            <Text as="label" size="2" weight="medium">Phone</Text>
                            <TextField.Root name="phone" type="tel" placeholder="(555) 123-4567" mt="1" />
                        </Box>
                        <Box>
                            <Text as="label" size="2" weight="medium">Address</Text>
                            <TextArea name="address" placeholder="Street, city, state…" rows={3} mt="1" />
                        </Box>
                        <Box>
                            <Text as="label" size="2" weight="medium">Notes</Text>
                            <TextArea
                                name="notes"
                                placeholder="How they found you, project interest, follow-up, etc."
                                rows={5}
                                mt="1"
                            />
                        </Box>
                    </Flex>
                </Card>
                <Flex gap="2" wrap="wrap">
                    <Button type="submit" size="2" variant="solid">
                        Save client
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
}
