'use client';

import { Container, Heading, Card, Button, Flex, Box, Text, TextField, Grid, Table, TextArea, Select as RadixSelect } from "@radix-ui/themes";
import { PlusIcon, TrashIcon, SaveIcon } from "lucide-react";
import { useState, useActionState } from 'react';
import { createInvoiceAction } from '@/app/actions'; // We need this action
import { DocumentData, LineItem, Customer } from "@/lib/types";

// Note: Radix Select is a bit complex in forms without a wrapper or controlled state.
// Simplifying for initial implementation.

export default function NewDocumentForm({ nextNumber, type }: { nextNumber: number, type: 'invoice' | 'estimate' | 'receipt' }) {
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: '1', description: 'Service', quantity: 1, unitPrice: 0, total: 0 }
    ]);

    const addLineItem = () => {
        setLineItems([...lineItems, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    };

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
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

    // Note: For a real form, I'd use React Hook Form + Zod.
    // Implementing a basic form submission via Action for now.
    // We need to serialize line items into hidden input or handle submit manually.

    return (
        <form action={createInvoiceAction}>
            <input type="hidden" name="type" value={type} />
            <Flex direction="column" gap="5">
                <Flex justify="between" align="center">
                    <Heading>New {type.charAt(0).toUpperCase() + type.slice(1)} #{nextNumber}</Heading>
                    <input type="hidden" name="number" value={nextNumber} />
                    <Button type="submit"><SaveIcon size={16} /> Save {type.charAt(0).toUpperCase() + type.slice(1)}</Button>
                </Flex>

                <Grid columns={{ initial: '1', md: '2' }} gap="4">
                    <Card>
                        <Heading size="3" mb="3">Customer Information</Heading>
                        <Flex direction="column" gap="3">
                            <Box>
                                <Text as="label" size="2">Name</Text>
                                <TextField.Root name="customerName" placeholder="Client Name" required />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Email</Text>
                                <TextField.Root name="customerEmail" type="email" placeholder="client@example.com" />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Address</Text>
                                <TextArea name="customerAddress" placeholder="Street, City, Zip" />
                            </Box>
                        </Flex>
                    </Card>

                    <Card>
                        <Heading size="3" mb="3">Details</Heading>
                        <Flex direction="column" gap="3">
                            <Box>
                                <Text as="label" size="2">Date</Text>
                                <TextField.Root name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                            </Box>
                            <Box>
                                <Text as="label" size="2">Due Date</Text>
                                <TextField.Root name="dueDate" type="date" />
                            </Box>
                        </Flex>
                    </Card>
                </Grid>

                <Card>
                    <Heading size="3" mb="3">Items</Heading>
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeaderCell width="50%">Description</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Qty</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell>Price</Table.ColumnHeaderCell>
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
                                        {/* Hidden inputs to pass array data to Server Action */}
                                        <input type="hidden" name={`items[${index}][description]`} value={item.description} />
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
