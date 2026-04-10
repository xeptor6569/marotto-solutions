'use client';

import { Heading, Card, Button, Flex, Box, Text, TextField, Grid, Table, TextArea, Badge } from "@radix-ui/themes";
import { PlusIcon, TrashIcon, SaveIcon } from "lucide-react";
import { useState } from 'react';
import { createInvoiceAction } from '@/app/actions';
import { DocumentData, LineItem } from "@/lib/types";

export default function NewDocumentForm({
    nextNumber,
    type,
    initialData,
    redirectTo,
}: {
    nextNumber: number,
    type: 'invoice' | 'estimate' | 'quote' | 'receipt',
    initialData?: DocumentData,
    redirectTo?: string
}) {
    const [lineItems, setLineItems] = useState<LineItem[]>([
        ...(initialData?.lineItems?.length
            ? initialData.lineItems
            : [{ id: '1', description: 'Service', details: '', quantity: 1, unitPrice: 0, total: 0 }])
    ]);

    const currentStatus = initialData?.status || 'draft';
    const docLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const notesLabel =
        type === 'estimate' ? 'Project Description' :
        type === 'quote' ? 'Scope & terms' :
        'Notes';
    const actionButtons = type === 'invoice'
        ? [
            { intent: 'draft', label: 'Save Draft', variant: 'soft' as const },
            { intent: 'sent', label: 'Save as Sent', variant: 'solid' as const },
            { intent: 'paid', label: 'Save as Paid', variant: 'outline' as const },
        ]
        : type === 'estimate'
            ? [
                { intent: 'draft', label: 'Save Draft', variant: 'soft' as const },
                { intent: 'sent', label: 'Save & Finalize', variant: 'solid' as const },
            ]
        : type === 'quote'
            ? [
                { intent: 'draft', label: 'Save Draft', variant: 'soft' as const },
                { intent: 'sent', label: 'Issue quote', variant: 'solid' as const },
            ]
            : [
                { intent: currentStatus, label: `Save ${docLabel}`, variant: 'solid' as const },
            ];

    const addLineItem = () => {
        setLineItems([...lineItems, { id: crypto.randomUUID(), description: '', details: '', quantity: 1, unitPrice: 0, total: 0 }]);
    };

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
        setLineItems(lineItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    updated.total = Number(updated.quantity) * Number(updated.unitPrice);
                }
                return updated;
            }
            return item;
        }));
    };

    const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    return (
        <form action={createInvoiceAction}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="documentId" value={initialData?.id || ''} />
            <input type="hidden" name="createdAt" value={initialData?.createdAt || ''} />
            <input type="hidden" name="redirectTo" value={redirectTo || `/admin`} />
            <input type="hidden" name="currentStatus" value={currentStatus} />
            <Flex direction="column" gap="5">
                <Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'start', md: 'center' }} gap="3">
                    <Box>
                        <Heading>
                            {initialData ? 'Edit' : 'New'} {docLabel} #{initialData?.number || nextNumber}
                        </Heading>
                        {type === 'estimate' ? (
                            <Text size="2" color="gray" mt="2" style={{ maxWidth: 520 }}>
                                Flexible estimate — line items can include options; totals are indicative until scope is finalized.
                            </Text>
                        ) : null}
                        {type === 'quote' ? (
                            <Text size="2" color="gray" mt="2" style={{ maxWidth: 520 }}>
                                Firm quote — the total is the agreed price for the work you describe here and in the line items.
                            </Text>
                        ) : null}
                        <Flex mt="2" gap="2" wrap="wrap" align="center">
                            <Text size="2" color="gray">Current status</Text>
                            <Badge color={currentStatus === 'paid' ? 'green' : currentStatus === 'sent' ? 'blue' : currentStatus === 'void' ? 'red' : 'orange'}>
                                {currentStatus}
                            </Badge>
                        </Flex>
                    </Box>
                    <input type="hidden" name="number" value={initialData?.number || nextNumber} />
                    <Flex gap="2" wrap="wrap">
                        {actionButtons.map((button) => (
                            <Button key={button.label} type="submit" name="intent" value={button.intent} variant={button.variant}>
                                <SaveIcon size={16} /> {button.label}
                            </Button>
                        ))}
                    </Flex>
                </Flex>

                <Grid columns={{ initial: '1', md: '2' }} gap="4">
                    <Card>
                        <Heading size="3" mb="3">Customer Information</Heading>
                        <Flex direction="column" gap="3">
                            <Box>
                                <Text as="label" size="2">Name</Text>
                                <TextField.Root name="customerName" placeholder="Client Name" defaultValue={initialData?.customer?.name} required />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Email</Text>
                                <TextField.Root name="customerEmail" type="email" placeholder="client@example.com" defaultValue={initialData?.customer?.email} />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Address</Text>
                                <TextArea name="customerAddress" placeholder="Street, City, Zip" defaultValue={initialData?.customer?.address} />
                            </Box>
                        </Flex>
                    </Card>

                    <Card>
                        <Heading size="3" mb="3">Details</Heading>
                        <Flex direction="column" gap="3">
                            <Box>
                                <Text as="label" size="2">Date</Text>
                                <TextField.Root name="date" type="date" defaultValue={initialData?.date?.split('T')[0] || new Date().toISOString().split('T')[0]} required />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Due Date</Text>
                                <TextField.Root name="dueDate" type="date" defaultValue={initialData?.dueDate?.split('T')[0]} />
                            </Box>
                        </Flex>
                    </Card>
                </Grid>

                <Card>
                    <Heading size="3" mb="3">{notesLabel}</Heading>
                    <TextArea
                        name="notes"
                        placeholder={type === "estimate"
                            ? "Describe the project scope, material choices, and any assumptions."
                            : type === "quote"
                                ? "State what is included, timing, warranty, payment expectations, or other binding terms."
                                : "Optional notes to include on this document."}
                        rows={type === "estimate" || type === "quote" ? 7 : 4}
                        defaultValue={initialData?.notes}
                    />
                </Card>

                <Card>
                    <Heading size="3" mb="3">Items</Heading>
                    {type === 'quote' ? (
                        <Text size="2" color="gray" mb="3" as="p">
                            Enter the agreed quantities and unit prices — the document total is the decided price for the customer.
                        </Text>
                    ) : null}
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeaderCell width="50%">Description</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Qty</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>{type === 'quote' ? 'Unit price' : 'Price'}</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {lineItems.map((item, index) => (
                                <Table.Row key={item.id}>
                                    <Table.Cell>
                                        <TextField.Root
                                            value={item.description}
                                            onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                                            placeholder="Description"
                                        />
                                        {type === 'estimate' ? (
                                            <Box mt="2">
                                                <TextArea
                                                    value={item.details || ''}
                                                    onChange={e => updateLineItem(item.id, 'details', e.target.value)}
                                                    placeholder="Add scope, install approach, material option notes, or client-facing details."
                                                    rows={4}
                                                />
                                            </Box>
                                        ) : null}
                                        {/* Hidden inputs to pass array data to Server Action */}
                                        <input type="hidden" name={`items[${index}][description]`} value={item.description} />
                                        <input type="hidden" name={`items[${index}][details]`} value={item.details || ''} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <TextField.Root
                                            type="number"
                                            min="0"
                                            value={item.quantity}
                                            onChange={e => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                                        />
                                        <input type="hidden" name={`items[${index}][quantity]`} value={item.quantity} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <TextField.Root
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={e => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                                        />
                                        <input type="hidden" name={`items[${index}][unitPrice]`} value={item.unitPrice} />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Text>${item.total.toFixed(2)}</Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Button type="button" variant="ghost" color="red" onClick={() => removeLineItem(item.id)}>
                                            <TrashIcon size={16} />
                                        </Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                    <Flex justify="between" align="center" mt="4">
                        <Button type="button" variant="soft" onClick={addLineItem}><PlusIcon size={16} /> Add Item</Button>
                        <Heading size="4">Total: ${subtotal.toFixed(2)}</Heading>
                    </Flex>
                </Card>
            </Flex>
        </form>
    );
}
