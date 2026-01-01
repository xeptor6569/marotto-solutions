'use client';

import { Container, Heading, Card, Button, Flex, Text, Callout, Code, Box } from "@radix-ui/themes";
import { Upload, Info, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { importDocumentsAction } from "./actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportPage() {
    const [status, setStatus] = useState<{ success: boolean, message: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        const formData = new FormData(e.currentTarget);
        const result = await importDocumentsAction(formData);

        if (result.success) {
            setStatus({ success: true, message: `Successfully imported ${result.count} documents. ${result.errors ? `(${result.errors} skipped due to invalid format)` : ''}` });
        } else {
            setStatus({ success: false, message: result.error || 'Unknown error' });
        }
        setLoading(false);
    };

    const exampleJson = `[
  {
    "id": "INV-1001",
    "number": 1001,
    "type": "invoice",
    "date": "2024-01-01",
    "customer": { "name": "Client A" },
    "lineItems": [],
    "subtotal": 0,
    "total": 0,
    "status": "draft"
  }
]`;

    return (
        <Container size="2" p="5">
            <Flex justify="between" align="center" mb="4">
                <Heading>Import Data</Heading>
                <Button variant="soft" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </Button>
            </Flex>

            <Card mb="4">
                <Flex gap="3" align="start">
                    <Info size={20} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Box>
                        <Text as="p" size="2" mb="2">
                            Upload a JSON file containing an array of documents. Existing documents with the same ID will be overwritten.
                        </Text>
                        <Text as="p" size="2" weight="bold" mb="1">Expected Format:</Text>
                        <Code variant="ghost" style={{ display: 'block', padding: 10, whiteSpace: 'pre-wrap' }}>
                            {exampleJson}
                        </Code>
                    </Box>
                </Flex>
            </Card>

            <Card>
                <form onSubmit={handleSubmit}>
                    <Flex direction="column" gap="4">
                        <Box>
                            <Text as="label" size="2" weight="bold">Select JSON File</Text>
                            <input type="file" name="file" accept=".json" required style={{ display: 'block', marginTop: 5 }} />
                        </Box>

                        {status && (
                            <Callout.Root color={status.success ? 'green' : 'red'}>
                                <Callout.Icon>
                                    {status.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                </Callout.Icon>
                                <Callout.Text>{status.message}</Callout.Text>
                            </Callout.Root>
                        )}

                        <Flex gap="2">
                            <Button type="submit" loading={loading} disabled={loading}>
                                <Upload size={16} /> Import Documents
                            </Button>
                            {status?.success && (
                                <Button variant="soft" onClick={() => router.push('/dashboard')}>
                                    View Imported Documents
                                </Button>
                            )}
                        </Flex>
                    </Flex>
                </form>
            </Card>
        </Container>
    );
}
