import { Container, Heading, Text, Flex, Button, Card, Grid, Link as RadixLink, Badge, Box, DropdownMenu } from "@radix-ui/themes";
import { SettingsIcon, ChevronDown, Upload } from "lucide-react";
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
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Heading size="8">Marotto Solutions</Heading>
        </Link>
        <Flex gap="3">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="solid" size="3">
                Create New <ChevronDown size={16} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item asChild>
                <Link href="/estimates/new">Estimate</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/invoices/new">Invoice</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/receipts/new">Receipt</Link>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <Button size="3" variant="soft" asChild>
            <Link href="/import"><Upload size={16} /> Import</Link>
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

        {/* Recent Receipts (New Section or Replace Stats?) -> User asked for dashboard. 
           I'll add a "Recent Receipts" card or just let them find it via search later.
           For now, I'll add a Recent Receipts card if there's space or modify Invoices card to tabs?
           Let's just add a Link to the stats numbers? Or simply add a new Card.
           Actually, the user can use "Import" to see them? No.
           I'll add a "Recent Receipts" card column or row.
           Let's just change "Recent Invoices" to "Recent Documents" or add a third card for receipts.
           I'll Replace "Quick Stats" with "Recent Receipts" for now since stats are boring.
        */}
        <Card>
          <Heading size="4" mb="3">Recent Receipts</Heading>
          {receipts.length === 0 ? (
            <Text size="2" color="gray">No recent receipts.</Text>
          ) : (
            <Flex direction="column" gap="2">
              {receipts.slice(0, 5).map(r => (
                <Flex key={r.id} justify="between" align="center" asChild>
                  <Link href={`/receipts/${r.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                    <Box>
                      <Text size="2" weight="bold">#{r.id}</Text>
                      <Box><Text size="1" color="gray">{new Date(r.date).toLocaleDateString()}</Text></Box>
                    </Box>
                    <Badge color="green">${r.total}</Badge>
                  </Link>
                </Flex>
              ))}
            </Flex>
          )}
        </Card>
      </Grid>
    </Container>
  );
}
