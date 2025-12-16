import { Container, Heading, Text, Flex, Button, Card, Grid, Link as RadixLink, Badge, Box } from "@radix-ui/themes";
import { PlusIcon, SettingsIcon } from "lucide-react";
import Link from 'next/link'; // Next.js Link
import { getDocuments } from "@/lib/data";

export default async function Home() {
  const invoices = await getDocuments('invoice');
  const estimates = await getDocuments('estimate');
  const receipts = await getDocuments('receipt');

  const recentInvoices = invoices.slice(0, 5);
  const activeEstimates = estimates.filter(e => e.status !== 'void').slice(0, 5);

  return (
    <Container size="4" p="5">
      <Flex justify="between" align="center" mb="5">
        <Heading size="8">Marotto Solutions</Heading>
        <Flex gap="3">
          <Button size="3" variant="soft" asChild>
            <Link href="/estimates/new"><PlusIcon size={16} /> New Estimate</Link>
          </Button>
          <Button size="3" asChild>
            <Link href="/invoices/new"><PlusIcon size={16} /> New Invoice</Link>
          </Button>
          <Button size="3" variant="outline" asChild>
            <Link href="/settings"><SettingsIcon size={16} /></Link>
          </Button>
        </Flex>
      </Flex>

      <Grid columns={{ initial: '1', md: '3' }} gap="4">

        {/* Recent Invoices */}
        <Card>
          <Heading size="4" mb="3">Recent Invoices</Heading>
          {recentInvoices.length === 0 ? (
            <Text size="2" color="gray">No recent invoices found.</Text>
          ) : (
            <Flex direction="column" gap="2">
              {recentInvoices.map(inv => (
                <Flex key={inv.id} justify="between" align="center">
                  <Box>
                    <Text size="2" weight="bold">#{inv.number} - {inv.customer.name}</Text>
                    <Box><Text size="1" color="gray">{new Date(inv.date).toLocaleDateString()}</Text></Box>
                  </Box>
                  <Badge color={inv.status === 'paid' ? 'green' : 'orange'}>{inv.status}</Badge>
                </Flex>
              ))}
            </Flex>
          )}
        </Card>

        {/* Active Estimates */}
        <Card>
          <Heading size="4" mb="3">Active Estimates</Heading>
          {activeEstimates.length === 0 ? (
            <Text size="2" color="gray">No active estimates.</Text>
          ) : (
            <Flex direction="column" gap="2">
              {activeEstimates.map(est => (
                <Flex key={est.id} justify="between" align="center">
                  <Box>
                    <Text size="2" weight="bold">#{est.number} - {est.customer.name}</Text>
                    <Box><Text size="1" color="gray">{new Date(est.date).toLocaleDateString()}</Text></Box>
                  </Box>
                  <Badge color="blue">{est.status}</Badge>
                </Flex>
              ))}
            </Flex>
          )}
        </Card>

        {/* Quick Stats */}
        <Card>
          <Heading size="4" mb="3">Quick Stats</Heading>
          <Flex direction="column" gap="2">
            <Text size="2">Total Invoices: <strong>{invoices.length}</strong></Text>
            <Text size="2">Total Estimates: <strong>{estimates.length}</strong></Text>
            <Text size="2">Total Receipts: <strong>{receipts.length}</strong></Text>
          </Flex>
        </Card>
      </Grid>
    </Container>
  );
}
