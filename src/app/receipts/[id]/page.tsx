import { Container, Flex, Heading, Text, Box, Table, Badge, Card, Button } from "@radix-ui/themes";
import { getDocumentById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import PrintButton from "@/components/PrintButton"; // We'll create this helper

export default async function ReceiptPage({ params }: { params: { id: string } }) {
    // Await params per Next.js 15+ changes / React usage
    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc || doc.type !== 'receipt') {
        notFound();
    }

    return (
        <Container size="3" p="5" className="print-container">
            {/* Action Bar - Hidden on Print */}
            <Flex justify="end" mb="4" className="no-print">
                <PrintButton />
            </Flex>

            <Card size="3" style={{ padding: '40px', background: 'white', color: 'black' }}>
                {/* Using generic style override for print fidelity since Dark mode might use dark bg */}
                <div className="receipt-content">
                    {/* Header */}
                    <Flex justify="between" align="start" mb="6">
                        <Box>
                            <Heading size="8" style={{ color: '#333', marginBottom: 4 }}>MAROTTO</Heading>
                            <Text size="3" weight="bold" style={{ color: '#666', letterSpacing: '2px' }}>SOLUTIONS</Text>
                            <Box mt="4">
                                <Text as="div" size="2">28 E Mountain Ridge MHP</Text>
                                <Text as="div" size="2">Wilkes Barre, PA 18702</Text>
                                <Text as="div" size="2">(570) 332-9262</Text>
                            </Box>
                        </Box>
                        <Box style={{ textAlign: 'right' }}>
                            <Heading size="8" style={{ color: '#e0e0e0', textTransform: 'uppercase' }}>Receipt</Heading>
                            <Flex direction="column" mt="2">
                                <Text size="2" weight="bold" style={{ color: '#888' }}>RECEIPT #</Text>
                                <Text size="4" weight="bold">{doc.id}</Text>
                            </Flex>
                            <Flex direction="column" mt="2">
                                <Text size="2" weight="bold" style={{ color: '#888' }}>DATE</Text>
                                <Text size="3">{new Date(doc.date).toLocaleDateString()}</Text>
                            </Flex>
                        </Box>
                    </Flex>

                    {/* Bill To */}
                    <Box mb="6" style={{ borderTop: '2px solid #f0f0f0', paddingTop: '20px' }}>
                        <Text size="2" weight="bold" style={{ color: '#888', textTransform: 'uppercase' }}>Received From</Text>
                        <Heading size="4" mt="1">{doc.customer.name}</Heading>
                        <Text as="div" size="2" style={{ whiteSpace: 'pre-line' }}>{doc.customer.address}</Text>
                    </Box>

                    {/* Line Items */}
                    <Table.Root variant="surface" style={{ width: '100%', marginBottom: '30px' }}>
                        <Table.Header>
                            <Table.Row style={{ background: '#f8f9fa' }}>
                                <Table.ColumnHeaderCell style={{ color: '#555' }}>Description</Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell align="right" style={{ color: '#555' }}>Amount</Table.ColumnHeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {doc.lineItems.map(item => (
                                <Table.Row key={item.id}>
                                    <Table.Cell>
                                        <Text weight="bold">{item.description}</Text>
                                    </Table.Cell>
                                    <Table.Cell align="right">
                                        <Text>${item.total.toFixed(2)}</Text>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>

                    {/* Footer / Totals */}
                    <Flex justify="between" align="end">
                        <Box>
                            <Text size="5" weight="bold" style={{ color: '#ccc', transform: 'rotate(-10deg)', display: 'block', border: '3px solid #ccc', padding: '10px 20px', borderRadius: 8 }}>PAID</Text>
                            <Text size="2" mt="4" style={{ color: '#888' }}>Thank you for your business!</Text>
                        </Box>

                        <Box style={{ width: '200px' }}>
                            <Flex justify="between" py="2" style={{ borderTop: '2px solid #333' }}>
                                <Text size="4" weight="bold">Total</Text>
                                <Text size="6" weight="bold" style={{ color: '#2ecc71' }}>${doc.total.toFixed(2)}</Text>
                            </Flex>
                        </Box>
                    </Flex>
                </div>
            </Card>

            {/* Print Styles */}
            <style>{`
          @media print {
            body { background: white; }
            .no-print { display: none !important; }
            .print-container { padding: 0 !important; max-width: none !important; width: 100% !important; margin: 0 !important; }
            /* Force light mode styles for print if dark mode is active on screen */
            .receipt-content { color: black !important; background: white !important; }
            /* Radix overrides */
            .rt-Card { border: none !important; box-shadow: none !important; background: transparent !important; }
          }
      `}</style>
        </Container>
    );
}
