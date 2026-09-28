'use client';

import { useState } from 'react';
import { Box, Button, Card, Flex, Grid, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { Plus, X } from 'lucide-react';
import SearchSelect from '@/components/ui/SearchSelect';
import type { ClientOption } from '@/lib/clients';
import type { JobOption } from '@/lib/types';

export interface CustomerFields {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export default function CustomerSection({
    jobOptions,
    selectedJobId,
    onJobChange,
    jobLocked,
    onCreateJob,
    isCreatingJob,
    jobError,
    clients,
    selectedClientId,
    onClientChange,
    customer,
    onCustomerChange,
}: {
    jobOptions: JobOption[];
    selectedJobId: string;
    onJobChange: (jobId: string) => void;
    jobLocked: boolean;
    onCreateJob: (name: string, description: string) => Promise<boolean>;
    isCreatingJob: boolean;
    jobError: string;
    clients: ClientOption[];
    selectedClientId: string;
    onClientChange: (clientId: string) => void;
    customer: CustomerFields;
    onCustomerChange: (field: keyof CustomerFields, value: string) => void;
}) {
    const [creatingJob, setCreatingJob] = useState(false);
    const [newJobName, setNewJobName] = useState('');
    const [newJobDescription, setNewJobDescription] = useState('');

    const createJob = async () => {
        const created = await onCreateJob(newJobName, newJobDescription);
        if (created) {
            setNewJobName('');
            setNewJobDescription('');
            setCreatingJob(false);
        }
    };

    return (
        <Card size="3">
            <Heading size="4" mb="4">Client</Heading>
            <Flex direction="column" gap="4">
                <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                    {clients.length > 0 ? (
                        <Box>
                            <Text as="label" size="2" weight="medium" htmlFor="editor-client">Existing client</Text>
                            <Box mt="1">
                                <SearchSelect
                                    id="editor-client"
                                    value={selectedClientId}
                                    onChange={onClientChange}
                                    options={clients.map((client) => ({
                                        value: client.id,
                                        label: client.name,
                                        hint: client.email || client.phone || undefined,
                                    }))}
                                    placeholder="Pick a client or type details below"
                                    noneLabel="No client record"
                                    searchPlaceholder="Search clients…"
                                />
                            </Box>
                        </Box>
                    ) : null}
                    <Box>
                        <Text as="label" size="2" weight="medium" htmlFor="editor-job">Job</Text>
                        <Flex mt="1" gap="2" align="center">
                            <Box style={{ flex: 1, minWidth: 0 }}>
                                <SearchSelect
                                    id="editor-job"
                                    value={selectedJobId}
                                    onChange={onJobChange}
                                    options={jobOptions.map((job) => ({ value: job.id, label: job.name, hint: job.status }))}
                                    placeholder={jobOptions.length ? 'Link to a job (optional)' : 'No jobs yet'}
                                    noneLabel="Not linked to a job"
                                    searchPlaceholder="Search jobs…"
                                    disabled={jobLocked}
                                />
                            </Box>
                            {!jobLocked ? (
                                <Button
                                    type="button"
                                    variant="soft"
                                    color="gray"
                                    onClick={() => setCreatingJob((v) => !v)}
                                    aria-expanded={creatingJob}
                                >
                                    {creatingJob ? <X size={14} /> : <Plus size={14} />} {creatingJob ? 'Cancel' : 'New job'}
                                </Button>
                            ) : null}
                        </Flex>
                    </Box>
                </Grid>

                {creatingJob ? (
                    <Box className="editor-inline-panel">
                        <Flex gap="2" direction={{ initial: 'column', sm: 'row' }}>
                            <TextField.Root
                                placeholder="Job name, e.g. Kitchen remodel"
                                value={newJobName}
                                onChange={(e) => setNewJobName(e.target.value)}
                                style={{ flex: 1 }}
                                autoFocus
                            />
                            <Button type="button" onClick={createJob} loading={isCreatingJob}>
                                Create job
                            </Button>
                        </Flex>
                        <TextArea
                            mt="2"
                            placeholder="Optional description"
                            rows={2}
                            value={newJobDescription}
                            onChange={(e) => setNewJobDescription(e.target.value)}
                        />
                        {jobError ? <Text as="p" size="1" color="red" mt="1">{jobError}</Text> : null}
                    </Box>
                ) : null}

                <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                    <Box>
                        <Text as="label" size="2" weight="medium" htmlFor="editor-customer-name">Name</Text>
                        <TextField.Root
                            id="editor-customer-name"
                            mt="1"
                            name="customerName"
                            placeholder="Client name"
                            value={customer.name}
                            onChange={(e) => onCustomerChange('name', e.target.value)}
                            aria-required="true"
                            autoComplete="off"
                        />
                    </Box>
                    <Box>
                        <Text as="label" size="2" weight="medium" htmlFor="editor-customer-email">Email</Text>
                        <TextField.Root
                            id="editor-customer-email"
                            mt="1"
                            name="customerEmail"
                            type="email"
                            placeholder="client@example.com"
                            value={customer.email}
                            onChange={(e) => onCustomerChange('email', e.target.value)}
                            autoComplete="off"
                        />
                    </Box>
                    <Box>
                        <Text as="label" size="2" weight="medium" htmlFor="editor-customer-phone">Phone</Text>
                        <TextField.Root
                            id="editor-customer-phone"
                            mt="1"
                            name="customerPhone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={customer.phone}
                            onChange={(e) => onCustomerChange('phone', e.target.value)}
                            inputMode="tel"
                            autoComplete="off"
                        />
                    </Box>
                    <Box>
                        <Text as="label" size="2" weight="medium" htmlFor="editor-customer-address">Address</Text>
                        <TextArea
                            id="editor-customer-address"
                            mt="1"
                            name="customerAddress"
                            placeholder="Street, city, ZIP"
                            rows={2}
                            value={customer.address}
                            onChange={(e) => onCustomerChange('address', e.target.value)}
                        />
                    </Box>
                </Grid>
            </Flex>
        </Card>
    );
}
