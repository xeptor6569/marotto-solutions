import { Container, Heading, Text, Flex, Button, Card, Grid, Badge, Box, DropdownMenu } from "@radix-ui/themes";
import { SettingsIcon, ChevronDown, Upload, FileText, ReceiptText, ClipboardList, BadgeCheck, Repeat } from "lucide-react";
import Link from 'next/link';
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDocuments } from "@/lib/data";
import { getContracts } from "@/lib/contracts";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const invoices = await getDocuments('invoice');
  const estimates = await getDocuments('estimate');
  const quotes = await getDocuments('quote');
  const receipts = await getDocuments('receipt');
  const contracts = await getContracts();
  const activeContracts = contracts.filter((c) => c.status === 'active');

  const recentInvoices = invoices.slice(0, 5);
  const activeEstimates = estimates.filter(e => e.status !== 'void').slice(0, 5);
  const activeQuotes = quotes.filter(q => q.status !== 'void').slice(0, 5);

  return (
    <Container size="4" p="5">
      <Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'start', md: 'center' }} gap="4" mb="5">
        <Box>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Heading size="8">Marotto Solutions</Heading>
          </Link>
          <Text size="3" color="gray">Quick view of invoices, estimates, quotes, and receipts.</Text>
        </Box>
        <Flex gap="3" wrap="wrap">
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
                <Link href="/quotes/new">Quote</Link>
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
            <Link href="/settings"><SettingsIcon size={16} /> Settings</Link>
          </Button>
        </Flex>
      </Flex>

      <Grid columns={{ initial: '1', sm: '2', lg: '5' }} gap="4" mb="5">
        <Card>
          <Flex align="center" gap="3">
            <Box style={{ color: "var(--blue-9)" }}><FileText size={18} /></Box>
            <Box>
              <Text size="2" color="gray">Invoices</Text>
              <Heading size="6">{invoices.length}</Heading>
            </Box>
          </Flex>
        </Card>
        <Card>
          <Flex align="center" gap="3">
            <Box style={{ color: "var(--amber-9)" }}><ClipboardList size={18} /></Box>
            <Box>
              <Text size="2" color="gray">Active Estimates</Text>
              <Heading size="6">{activeEstimates.length}</Heading>
            </Box>
          </Flex>
        </Card>
        <Card>
          <Flex align="center" gap="3">
            <Box style={{ color: "var(--teal-9)" }}><BadgeCheck size={18} /></Box>
            <Box>
              <Text size="2" color="gray">Active Quotes</Text>
              <Heading size="6">{activeQuotes.length}</Heading>
            </Box>
          </Flex>
        </Card>
        <Card>
          <Flex align="center" gap="3">
            <Box style={{ color: "var(--green-9)" }}><ReceiptText size={18} /></Box>
            <Box>
              <Text size="2" color="gray">Receipts</Text>
              <Heading size="6">{receipts.length}</Heading>
            </Box>
          </Flex>
        </Card>
        <Card>
          <Flex align="center" gap="3">
            <Box style={{ color: "var(--cyan-9)" }}><Repeat size={18} /></Box>
            <Box>
              <Text size="2" color="gray">Active Contracts</Text>
              <Heading size="6">{activeContracts.length}</Heading>
            </Box>
          </Flex>
        </Card>
      </Grid>

      <Grid columns={{ initial: '1', md: '2', lg: '4' }} gap="4">

        {/* Recent Invoices */}
        <Card>
          <Heading size="4" mb="3">Recent Invoices</Heading>
          {recentInvoices.length === 0 ? (
            <Text size="2" color="gray">No recent invoices found.</Text>
          ) : (
            <Flex direction="column" gap="2">
              {recentInvoices.map(inv => (
                <Flex key={inv.id} justify="between" align="center" asChild>
                  <Link href={`/invoices/${inv.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                    <Box>
                      <Text size="2" weight="bold">#{inv.number} - {inv.customer.name}</Text>
                      {inv.title ? <Box><Text size="1">{inv.title}</Text></Box> : null}
                      <Box><Text size="1" color="gray">{new Date(inv.date).toLocaleDateString()}</Text></Box>
                    </Box>
                    <Badge color={inv.status === 'paid' ? 'green' : 'orange'}>{inv.status}</Badge>
                  </Link>
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
                <Flex key={est.id} justify="between" align="center" asChild>
                  <Link href={`/estimates/${est.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                    <Box>
                      <Text size="2" weight="bold">#{est.number} - {est.customer.name}</Text>
                      {est.title ? <Box><Text size="1">{est.title}</Text></Box> : null}
                      <Box><Text size="1" color="gray">{new Date(est.date).toLocaleDateString()}</Text></Box>
                    </Box>
                    <Badge color="blue">{est.status}</Badge>
                  </Link>
                </Flex>
              ))}
            </Flex>
          )}
        </Card>

        <Card>
          <Heading size="4" mb="3">Active Quotes</Heading>
          {activeQuotes.length === 0 ? (
            <Text size="2" color="gray">No active quotes.</Text>
          ) : (
            <Flex direction="column" gap="2">
              {activeQuotes.map((q) => (
                <Flex key={q.id} justify="between" align="center" asChild>
                  <Link href={`/quotes/${q.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                    <Box>
                      <Text size="2" weight="bold">#{q.number} - {q.customer.name}</Text>
                      {q.title ? <Box><Text size="1">{q.title}</Text></Box> : null}
                      <Box><Text size="1" color="gray">{new Date(q.date).toLocaleDateString()}</Text></Box>
                    </Box>
                    <Badge color="blue">{q.status}</Badge>
                  </Link>
                </Flex>
              ))}
            </Flex>
          )}
        </Card>

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
